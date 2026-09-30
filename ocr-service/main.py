# cv2 ต้อง import ก่อน paddleocr เสมอ (zlib ที่ bundle มาชนกัน → import pyclipper พัง)
import cv2
import numpy as np
import time
import base64
import re
import os
import queue
import contextlib
from collections import Counter
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR
import logging

# Confidence ต่ำกว่านี้ให้ flag ว่าควรรีวิวซ้ำ แทนที่จะเชื่อผลลัพธ์ทันที
# (conf ของ Paddle เป็นค่าเฉลี่ยทั้งข้อความ ผิดหลักเดียวก็ยังได้ ~0.8 จึงตั้งเกณฑ์สูงไว้)
MIN_CONFIDENCE = 0.85
# ถ้า pass แรกได้ confidence สูงพอ (และผ่านเงื่อนไขจำนวนหลัก/ค่าเดือนก่อน) ข้าม pass ที่เหลือเพื่อความเร็ว
EARLY_EXIT_CONFIDENCE = 0.9
# จำนวน PaddleOCR instance ที่รันพร้อมกันได้ (มีหลายสาขา/พนักงานสแกนพร้อมกันบ่อย)
# ปรับได้ผ่าน env var ตาม RAM ของเครื่อง แต่ละ instance กินราว 300-500MB
OCR_POOL_SIZE = int(os.getenv("OCR_POOL_SIZE", "3"))
# thread ต่อ instance — ค่า default ของ Paddle คือ 10 ซึ่งแย่ง CPU กันเองเมื่อมีหลาย instance
OCR_CPU_THREADS = int(os.getenv("OCR_CPU_THREADS", "2"))
# MKLDNN เร็วขึ้นบน CPU Intel แต่ Paddle 2.x มีประวัติ memory โตเมื่อ input ขนาดไม่คงที่
# จึงปิดไว้เป็นค่าเริ่มต้น เปิดได้ด้วย OCR_ENABLE_MKLDNN=1 แล้วเฝ้าดู RAM
OCR_ENABLE_MKLDNN = os.getenv("OCR_ENABLE_MKLDNN", "0") == "1"

# น้ำหนักคะแนนตอนเลือกผลลัพธ์ (บวกกับ confidence)
SCORE_LENGTH_MATCH = 0.3
SCORE_PLAUSIBLE = 0.3
SCORE_PER_EXTRA_VOTE = 0.1
SCORE_TALL_TEXT = 0.3
# ตัวอักษรสูง >= สัดส่วนนี้ของแถบตัวเลข ถือเป็นตัวเลขมิเตอร์จริง (ป้ายหลัก "10000/1000/..." ตัวเล็กกว่านี้มาก)
TALL_TEXT_RATIO = 0.4
# กล่องที่เตี้ยกว่าสัดส่วนนี้ของกล่องที่สูงที่สุดถูกตัดทิ้ง (ป้าย/ขีดสเกล/ขยะ)
MIN_BOX_HEIGHT_RATIO = 0.5
# คำตอบอันดับ 2 ที่ต่างกันแต่คะแนนห่างจากอันดับ 1 น้อยกว่านี้ = ระบบลังเล ต้องให้คนตรวจ
AMBIGUITY_MARGIN = 0.15

# ค่าตัวตรวจจับข้อความ (DB)
# ทดสอบกับรูปมิเตอร์จริงแล้ว ค่า default ของ Paddle (0.3 / 0.6 / 1.5) ดีที่สุด — unclip 2.0 ขยายกล่อง
# ขึ้นไปกินขีด/จุดเหนือตัวเลข ทำให้อ่าน "1" เป็น "6" ปัญหาตัวขาวบนพื้นดำแก้ด้วย detect_best_boxes แทน
# เปิดให้ปรับผ่าน env ไว้สำหรับทดลองกับมิเตอร์รุ่นอื่น
DET_DB_THRESH = float(os.getenv("OCR_DET_DB_THRESH", "0.3"))
DET_DB_BOX_THRESH = float(os.getenv("OCR_DET_DB_BOX_THRESH", "0.6"))
DET_DB_UNCLIP_RATIO = float(os.getenv("OCR_DET_DB_UNCLIP_RATIO", "1.5"))

# --- Setup & Config ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OCR_Service")

app = FastAPI(title="Meter OCR Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.mount("/static", StaticFiles(directory="static", html=True), name="static")


def _new_ocr_model():
    # lang='en' ใช้ default mobile-sized det/rec models อยู่แล้ว (เร็วบน CPU)
    # หน้าบ้าน crop กรอบตัวเลขมาให้แล้ว จึงไม่ต้องพึ่ง detector แยกแบบ YOLO
    # ไม่โหลดโมเดลหมุนภาพ (angle cls) เพราะภาพจากกรอบแดงตั้งตรงเสมอ
    return PaddleOCR(
        use_angle_cls=False,
        lang='en',
        use_gpu=False,
        cpu_threads=OCR_CPU_THREADS,
        enable_mkldnn=OCR_ENABLE_MKLDNN,
        show_log=False,
        det_db_thresh=DET_DB_THRESH,
        det_db_box_thresh=DET_DB_BOX_THRESH,
        det_db_unclip_ratio=DET_DB_UNCLIP_RATIO,
    )


class OCRPool:
    """Pool ของ PaddleOCR instance หลายตัว เพื่อให้หลายคนสแกนพร้อมกันได้จริง
    แทนที่จะรอคิว instance เดียว (แต่ละ instance ใช้งานได้ทีละ thread เท่านั้น)"""

    def __init__(self, size):
        logger.info(f"Initializing PaddleOCR pool (size={size}, CPU)...")
        self._pool = queue.Queue()
        for _ in range(size):
            self._pool.put(_new_ocr_model())

    @contextlib.contextmanager
    def borrow(self):
        model = self._pool.get()
        try:
            yield model
        finally:
            self._pool.put(model)


ocr_pool = OCRPool(OCR_POOL_SIZE)

char_map = {
    'O': '0', 'o': '0', 'D': '0', 'Q': '0',
    'I': '1', 'l': '1', '|': '1',
    'S': '5', 'B': '8', 'G': '6', 'Z': '2'
}

# --- Image Processing Core ---
class ImageProcessor:
    @staticmethod
    def resize_keep_ratio(img, max_width=800):
        h, w = img.shape[:2]
        if w > max_width:
            ratio = max_width / w
            return cv2.resize(img, (max_width, int(h * ratio)), interpolation=cv2.INTER_AREA)
        return img

    @staticmethod
    def calculate_blur(img):
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
        return cv2.Laplacian(gray, cv2.CV_64F).var()

    @staticmethod
    def auto_brightness(img):
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        v_mean = np.mean(v)
        if v_mean < 100:
            v = cv2.add(v, int(128 - v_mean))
        elif v_mean > 200:
            v = cv2.subtract(v, int(v_mean - 128))
        final_hsv = cv2.merge((h, s, v))
        return cv2.cvtColor(final_hsv, cv2.HSV2BGR)

    @staticmethod
    def clahe(img):
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        return clahe.apply(gray)

    @staticmethod
    def gamma(img, gamma=1.5):
        invGamma = 1.0 / gamma
        table = np.array([((i / 255.0) ** invGamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
        return cv2.LUT(img, table)

    @staticmethod
    def denoise(img):
        return cv2.fastNlMeansDenoising(img, None, 10, 7, 21)

    @staticmethod
    def sharpen(img):
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        return cv2.filter2D(img, -1, kernel)

    @staticmethod
    def adaptive_threshold(gray):
        return cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)

    @staticmethod
    def otsu_threshold(gray):
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return thresh

    @staticmethod
    def inverse(img):
        return cv2.bitwise_not(img)

    @staticmethod
    def morphology(img):
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        return cv2.morphologyEx(img, cv2.MORPH_CLOSE, kernel)

    @staticmethod
    def deskew(img):
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
        coords = np.column_stack(np.where(gray > 0))
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        (h, w) = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        
    @staticmethod
    def perspective_transform(img, pts):
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        
        (tl, tr, br, bl) = rect
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(widthA), int(widthB))
        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(heightA), int(heightB))
        
        dst = np.array([[0, 0], [maxWidth - 1, 0], [maxWidth - 1, maxHeight - 1], [0, maxHeight - 1]], dtype="float32")
        M = cv2.getPerspectiveTransform(rect, dst)
        return cv2.warpPerspective(img, M, (maxWidth, maxHeight))

    @staticmethod
    def img_to_base64(img):
        if img is None: return ""
        _, buffer = cv2.imencode('.jpg', img)
        return base64.b64encode(buffer).decode('utf-8')

# --- Processing Logic ---
def clean_digits(text):
    for char, num in char_map.items():
        text = text.replace(char, num)
    return re.sub(r'\D', '', text)


def detect_digit_boxes(ocr_model, img):
    """หากล่องข้อความครั้งเดียวบนภาพหลัก แล้วคืนเป็นกรอบสี่เหลี่ยมตรง (x1, y1, x2, y2)
    เรียงซ้าย→ขวา เฉพาะกล่องที่อยู่แถวเดียวกับกล่องที่สูงที่สุด (ตัวเลขมิเตอร์มักตัวใหญ่สุดในกรอบ)"""
    res = ocr_model.ocr(img, det=True, rec=False, cls=False)
    if not res or not res[0]:
        return []

    h, w = img.shape[:2]
    rects = []
    for poly in res[0]:
        pts = np.array(poly, dtype=np.float32)
        x1, y1 = pts.min(axis=0)
        x2, y2 = pts.max(axis=0)
        # ขยายขอบเล็กน้อยเพื่อไม่ให้ตัดปลายตัวเลข
        pad = max(2, int((y2 - y1) * 0.1))
        x1, y1 = max(0, int(x1) - pad), max(0, int(y1) - pad)
        x2, y2 = min(w, int(x2) + pad), min(h, int(y2) + pad)
        if x2 - x1 >= 4 and y2 - y1 >= 4:
            rects.append((x1, y1, x2, y2))

    if not rects:
        return []

    main = max(rects, key=lambda r: r[3] - r[1])
    main_h = main[3] - main[1]
    same_row = [
        r for r in rects
        if main[1] <= (r[1] + r[3]) / 2 <= main[3] and (r[3] - r[1]) >= main_h * MIN_BOX_HEIGHT_RATIO
    ]
    return merge_overlapping(sorted(same_row, key=lambda r: r[0]))


def merge_overlapping(rects):
    """รวมกล่องที่ซ้อนกันแนวนอนเกินครึ่งของกล่องที่แคบกว่า (unclip กว้างขึ้นทำให้กล่องซ้อนกันได้)
    ไม่งั้นตัวเลขเดียวกันจะถูกอ่านซ้ำตอนต่อกล่อง เช่น "1209" + "92" → "120992" """
    merged = []
    for r in rects:
        if merged:
            p = merged[-1]
            overlap = min(p[2], r[2]) - max(p[0], r[0])
            if overlap > 0.5 * min(p[2] - p[0], r[2] - r[0]):
                merged[-1] = (min(p[0], r[0]), min(p[1], r[1]), max(p[2], r[2]), max(p[3], r[3]))
                continue
        merged.append(r)
    return merged


def detect_best_boxes(ocr_model, img):
    """ตรวจจับทั้งภาพปกติและภาพกลับสี (ตัวขาวบนพื้นดำ → ตัวดำบนพื้นขาว ซึ่ง detector ถนัดกว่า)
    แล้วเลือกชุดที่ครอบคลุมความกว้างรวมมากกว่า = เจอตัวเลขครบกว่า"""
    normal = detect_digit_boxes(ocr_model, img)
    inverted = detect_digit_boxes(ocr_model, cv2.bitwise_not(img))

    def coverage(rects):
        return sum(r[2] - r[0] for r in rects)

    if coverage(inverted) > coverage(normal):
        return inverted, "inverted"
    return normal, "normal"


def recognize(ocr_model, crops):
    """อ่านอย่างเดียว (ไม่ตรวจจับซ้ำ) คืน [(text, conf), ...] ตามลำดับ crops"""
    res = ocr_model.ocr(crops, det=False, cls=False)
    if not res or not res[0]:
        return []
    return [(str(text), float(conf)) for text, conf in res[0]]


def normalize_reading(digits, expected_digits):
    """มิเตอร์มักมีหลักทศนิยม/สีแดงต่อท้าย จึงตัดให้เหลือจำนวนหลักที่ใช้คิดเงินจากซ้าย"""
    if expected_digits and len(digits) > expected_digits:
        return digits[:expected_digits]
    return digits


# --- Rolling digit (ลูกกลิ้งกำลังหมุนค้างระหว่างสองเลข) ---
# หลักที่หมุนค้าง หน้าต่างจะเห็น "ครึ่งล่างของเลขที่กำลังออก" อยู่บน และ "ครึ่งบนของเลขถัดไป" อยู่ล่าง
# จึงเหลือแต่ชิ้นส่วนเตี้ยๆ ไม่มีชิ้นไหนสูงเต็มตัวเลข — ใช้ความสูงนี้ตรวจจับ
ROLLING_MAX_HEIGHT_RATIO = 0.75   # ชิ้นที่สูงที่สุดในคอลัมน์ < 75% ของความสูงตัวเลขปกติ = กำลังหมุน
ROLLING_MIN_SPAN_RATIO = 0.9      # แต่ต้องกินพื้นที่แนวตั้งเกือบเต็มช่อง (กันขีดสเกล/ขยะเล็กๆ)
# ครึ่งล่างของเลขที่ recognizer มักอ่านออกมาเป็นตัวอักษร
HALF_GLYPH_MAP = {'U': '0', 'u': '0', 'V': '0', 'v': '0'}
# อ่านแยกทีละหลักได้เลขอื่นด้วยความมั่นใจเกินนี้ = ขัดแย้งกับการอ่านทั้งแถว
CROSS_CHECK_MIN_CONF = 0.6


def _glyph_components(roi_gray):
    """แยกชิ้นส่วนตัวอักษรสว่าง (หรือมืด ถ้ามิเตอร์เป็นตัวดำพื้นขาว) ออกจากพื้นหลัง"""
    _, mask = cv2.threshold(roi_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    # ตัวเลขเป็นส่วนน้อยของภาพเสมอ ถ้าสีขาวเกินครึ่งแปลว่าขั้วกลับ
    if (mask > 0).mean() > 0.5:
        mask = cv2.bitwise_not(mask)
    _, _, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    return [tuple(int(v) for v in s) for s in stats[1:] if s[4] >= 15]


def find_digit_columns(roi_gray):
    """หาคอลัมน์ตัวเลขทีละหลักจากภาพแถบตัวเลข คืน (columns, digit_height)
    แต่ละคอลัมน์มี x1, x2, comps และ rolling=True ถ้าลูกกลิ้งหลักนั้นหมุนค้าง"""
    H, W = roi_gray.shape[:2]
    comps = _glyph_components(roi_gray)
    # ตัดกรอบหน้าต่าง/เส้นยาวที่ไม่ใช่ตัวเลข
    comps = [c for c in comps if c[2] < 0.3 * W and c[3] < 0.95 * H]
    if len(comps) < 2:
        return [], 0.0

    biggest = sorted(comps, key=lambda c: -c[4])[:max(3, len(comps) // 2)]
    med_h = float(np.median([c[3] for c in biggest]))
    med_w = float(np.median([c[2] for c in biggest]))
    # ตัดชิ้นที่สูงเกินตัวเลข (ขอบ/สเกล) เส้นยาวแนวนอน (ขอบหน้าต่าง ซึ่งจะดึงคอลัมน์ติดกันให้รวมกัน)
    # และจุดเล็กมาก — แต่เก็บชิ้นเตี้ยไว้ เพราะเศษตัวเลขของลูกกลิ้งที่หมุนค้างอาจเหลือแค่ 1/4 ของความสูง
    comps = [
        c for c in comps
        if c[3] <= 1.3 * med_h and c[3] >= 0.2 * med_h and c[2] <= 1.8 * med_w
    ]
    comps.sort(key=lambda c: c[0])

    cols = []
    for c in comps:
        if cols:
            g = cols[-1]
            overlap = min(g["x2"], c[0] + c[2]) - max(g["x1"], c[0])
            if overlap > 0.3 * min(g["x2"] - g["x1"], c[2]):
                g["comps"].append(c)
                g["x1"], g["x2"] = min(g["x1"], c[0]), max(g["x2"], c[0] + c[2])
                continue
        cols.append({"x1": c[0], "x2": c[0] + c[2], "comps": [c]})

    if not cols:
        return [], 0.0

    for g in cols:
        g["max_h"] = max(c[3] for c in g["comps"])
        g["span"] = max(c[1] + c[3] for c in g["comps"]) - min(c[1] for c in g["comps"])
        g["area"] = sum(c[4] for c in g["comps"])

    full = [g["max_h"] for g in cols if g["max_h"] >= ROLLING_MAX_HEIGHT_RATIO * med_h]
    digit_h = float(np.median(full)) if full else med_h
    med_area = float(np.median([g["area"] for g in cols]))

    result = []
    for g in cols:
        is_full = g["max_h"] >= ROLLING_MAX_HEIGHT_RATIO * digit_h
        is_rolling = not is_full and g["span"] >= ROLLING_MIN_SPAN_RATIO * digit_h
        # คอลัมน์ที่ไม่ใช่ตัวเต็มและไม่ใช่ลูกกลิ้งหมุน = ขีดสเกล/ขยะ ทิ้งไป
        # (เลข 1 ผอมพื้นที่น้อยได้ จึงกรองพื้นที่แค่หลวมๆ)
        if (is_full or is_rolling) and g["area"] >= 0.2 * med_area:
            g["rolling"] = is_rolling
            result.append(g)
    return result, digit_h


def _read_piece(ocr_model, roi_gray, comp, pad=4):
    x, y, w, h, _ = comp
    piece = roi_gray[max(0, y - pad):y + h + pad, max(0, x - pad):x + w + pad]
    if piece.size == 0:
        return "", 0.0
    big = cv2.resize(piece, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
    big = cv2.copyMakeBorder(big, 10, 10, 10, 10, cv2.BORDER_REPLICATE)
    reads = recognize(ocr_model, [cv2.cvtColor(cv2.bitwise_not(big), cv2.COLOR_GRAY2BGR)])
    if not reads:
        return "", 0.0
    text, conf = reads[0]
    text = "".join(HALF_GLYPH_MAP.get(ch, ch) for ch in text.strip())
    digits = clean_digits(text)
    return (digits[0], conf) if len(digits) == 1 else ("", conf)


def estimate_rolling_digit(ocr_model, roi_gray, col, digit_h):
    """ประมาณค่าหลักที่หมุนค้าง ตามหลักการจดมิเตอร์จริง: ค้างระหว่าง d กับ d+1 ให้จดเป็น d+1
    (เลขที่กำลังจะขึ้น ไม่ใช่เลขที่กำลังจะหมด)
    - ชิ้นล่าง = ครึ่งบนของเลขถัดไป (d+1) อ่านได้แม่นกว่า → ใช้ตรงๆ เป็นคำตอบ
    - ชิ้นบน = ครึ่งล่างของเลขที่กำลังออก (d) ใช้ยืนยัน / สำรอง (d+1 = ปัจจุบัน + 1)"""
    comps = sorted(col["comps"], key=lambda c: c[1])
    mid = min(c[1] for c in comps) + col["span"] / 2
    upper = [c for c in comps if c[1] + c[3] / 2 < mid]
    lower = [c for c in comps if c[1] + c[3] / 2 >= mid]

    next_digit, next_conf = ("", 0.0)
    cur_digit, cur_conf = ("", 0.0)
    if lower:
        next_digit, next_conf = _read_piece(ocr_model, roi_gray, max(lower, key=lambda c: c[4]))
    if upper:
        cur_digit, cur_conf = _read_piece(ocr_model, roi_gray, max(upper, key=lambda c: c[4]))

    from_cur = str((int(cur_digit) + 1) % 10) if cur_digit else None
    if next_digit and from_cur == next_digit:
        return next_digit, "consistent"
    if next_digit and next_conf >= 0.6:
        return next_digit, "from_next"
    if from_cur is not None and cur_conf >= 0.6:
        return from_cur, "from_current"
    return None, "unknown"


def analyze_rolling(ocr_model, cropped, boxes, raw_digits):
    """ตรวจหลักที่หมุนค้าง แล้วแทน/เติมค่าที่ประมาณได้ลงใน raw_digits
    คืน (digits ใหม่, รายการหลักที่หมุนค้าง) — ถ้าวิเคราะห์ไม่ได้คืนค่าเดิม"""
    if boxes:
        x1 = min(b[0] for b in boxes); y1 = min(b[1] for b in boxes)
        x2 = max(b[2] for b in boxes); y2 = max(b[3] for b in boxes)
        roi = cropped[y1:y2, x1:x2]
    else:
        roi = cropped
    roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    cols, digit_h = find_digit_columns(roi_gray)
    rolling_idx = [i for i, g in enumerate(cols) if g["rolling"]]
    if not rolling_idx:
        return raw_digits, [], cross_check_columns(ocr_model, roi_gray, cols, raw_digits)

    digits = list(raw_digits)
    # OCR มักอ่านหลักที่หมุนค้างผิดหรือทิ้งไปเลย: ถ้าหายไปหลักเดียวและเป็นหลักขวาสุด ให้เติมท้าย
    appended = len(digits) == len(cols) - 1 and rolling_idx == [len(cols) - 1]
    aligned = len(digits) == len(cols)
    if appended:
        digits.append("?")

    info = []
    last = len(cols) - 1
    for i in rolling_idx:
        value, method = estimate_rolling_digit(ocr_model, roi_gray, cols[i], digit_h)
        replaced = False
        # แทนค่าให้เฉพาะหลักขวาสุด (หลักหน่วยคือหลักที่หมุนค้างบ่อยที่สุด) — หลักอื่นที่ตรวจพบว่าหมุน
        # อาจเป็นการตรวจผิดจากแสง/เงา ถ้าไปแก้ตัวเลขที่ OCR อ่านถูกจะกลายเป็นผิด จึงแค่ขึ้นเตือน
        if i == last and (aligned or appended) and value is not None:
            digits[i] = value
            replaced = True
        info.append({"index": i, "estimate": value, "method": method, "applied": replaced, "columns": len(cols)})

    if appended and digits[-1] == "?":
        digits.pop()
    return "".join(digits), info, cross_check_columns(ocr_model, roi_gray, cols, "".join(digits), skip=set(rolling_idx))


def cross_check_columns(ocr_model, roi_gray, cols, digits, skip=()):
    """อ่านทีละหลัก (ตัดตามคอลัมน์) แล้วเทียบกับที่อ่านทั้งแถว — ตาข่ายนิรภัยชั้นสุดท้าย
    ถ้าหลักไหนอ่านแยกแล้วได้ค่าอื่นอย่างมั่นใจ แปลว่าระบบไม่แน่ใจหลักนั้น (เช่นลูกกลิ้งหมุนที่ตรวจไม่เจอ)
    คืน index ของหลักที่ไม่ตรงกัน (ตรวจเฉพาะเมื่อจำนวนคอลัมน์ = จำนวนหลักที่อ่านได้ จึงจับคู่ได้แน่นอน)"""
    if not cols or len(cols) != len(digits):
        return []
    H = roi_gray.shape[0]
    idx = [i for i in range(len(cols)) if i not in skip]
    crops = []
    for i in idx:
        g = cols[i]
        pad = max(3, (g["x2"] - g["x1"]) // 3)
        piece = roi_gray[0:H, max(0, g["x1"] - pad):g["x2"] + pad]
        big = cv2.resize(piece, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        big = cv2.copyMakeBorder(big, 8, 8, 8, 8, cv2.BORDER_REPLICATE)
        crops.append(cv2.cvtColor(cv2.bitwise_not(big), cv2.COLOR_GRAY2BGR))
    if not crops:
        return []
    mismatches = []
    for i, (text, conf) in zip(idx, recognize(ocr_model, crops)):
        d = clean_digits(text)
        if len(d) == 1 and d != digits[i] and conf >= CROSS_CHECK_MIN_CONF:
            mismatches.append({"index": i, "line": digits[i], "single": d, "conf": round(conf, 3)})
    return mismatches


def is_plausible(value, prev_value, max_usage):
    if prev_value is None:
        return None
    if value < prev_value:
        return False
    if max_usage is not None and value - prev_value > max_usage:
        return False
    return True


def process_and_read(img_bytes, is_debug=False, expected_digits=None, prev_value=None, max_usage=None):
    start_time = time.time()
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Invalid image")

    debug_res = {}
    img = ImageProcessor.resize_keep_ratio(img)
    debug_res['Original'] = img

    blur_score = ImageProcessor.calculate_blur(img)
    if blur_score < 30:
        raise ValueError(f"Image too blurry (Score: {blur_score:.1f})")

    # 1. Add Padding (หน้าบ้าน crop กรอบตัวเลขมาให้แล้ว จึงไม่ทำ auto-crop ซ้ำ)
    # เติมขอบสีเทาเข้มรอบรูป 15 พิกเซล ช่วยให้ detector มองเห็นขอบตัวเลขได้ชัดเจนขึ้น
    cropped = cv2.copyMakeBorder(img, 15, 15, 15, 15, cv2.BORDER_CONSTANT, value=[50, 50, 50])
    debug_res['Final_OCR_Region'] = cropped

    # 2. Preprocessing passes — สร้างแบบ lazy เรียงจาก pass ที่มักให้ผลดีสุด เพื่อให้ early-exit คุ้มที่สุด
    # ทุก pass มีขนาดเท่าภาพหลัก จึงใช้กล่องจากการตรวจจับครั้งเดียวร่วมกันได้
    def gray():
        return cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)

    def gamma_pass():
        v_mean = np.mean(cv2.cvtColor(cropped, cv2.COLOR_BGR2HSV)[:, :, 2])
        return ImageProcessor.gamma(cropped, gamma=1.8 if v_mean < 100 else 0.6)

    pass_builders = [
        # CLAHE (ดึงคอนทราสต์ให้ชัดขึ้น เหมาะกับมิเตอร์ที่แสงตกกระทบไม่เท่ากัน)
        ('clahe', lambda: ImageProcessor.clahe(cropped)),
        ('original', lambda: cropped),
        # กลับสี (ตัวขาวบนพื้นดำ → ตัวดำบนพื้นขาว แบบที่ recognizer ถูกฝึกมาเยอะสุด ช่วยเรื่องเลข 1 บางๆ)
        ('inverted', lambda: cv2.bitwise_not(ImageProcessor.clahe(cropped))),
        # Gamma (แก้ภาพมืดเกินไป/สว่างเกินไปจากแสงสะท้อนจอมิเตอร์)
        ('gamma', gamma_pass),
        ('gray', gray),
        # Adaptive Threshold (เหมาะกับมิเตอร์ที่มีเงาดำพาดผ่าน) — denoise แพง จึงทำเฉพาะเมื่อมาถึง pass นี้
        ('adaptive', lambda: ImageProcessor.adaptive_threshold(ImageProcessor.denoise(gray()))),
    ]

    candidates = []
    # ข้อความดิบที่ recognizer อ่านได้ทุกครั้ง (รวมที่ถูกกรองทิ้ง) ไว้ดูในโหมด debug
    raw_reads = []
    # ความสูงของแถบตัวเลขจริง (ไม่รวม padding) ใช้เทียบว่าตัวอักษรที่อ่านได้ตัวใหญ่แค่ไหน
    strip_height = img.shape[0]

    def add_candidate(digits, conf, name, source, height_ratio=None):
        if not 3 <= len(digits) <= 8:
            return None
        reading = normalize_reading(digits, expected_digits)
        cand = {
            "text": reading,
            "raw": digits,
            "conf": conf,
            "pass": name,
            "source": source,
            "height_ratio": None if height_ratio is None else round(height_ratio, 3),
            "length_ok": None if not expected_digits else len(digits) >= expected_digits,
            "plausible": is_plausible(int(reading), prev_value, max_usage),
        }
        candidates.append(cand)
        return cand

    def is_confident(cand):
        return (
            cand["conf"] >= EARLY_EXIT_CONFIDENCE
            and cand["length_ok"] is not False
            and cand["plausible"] is not False
            and cand["height_ratio"] is not None
            and cand["height_ratio"] >= TALL_TEXT_RATIO
        )

    # 3. Multi-Pass OCR — ตรวจจับกล่องครั้งเดียว แล้วแต่ละ pass อ่านอย่างเดียว
    with ocr_pool.borrow() as ocr_model:
        boxes, box_source = detect_best_boxes(ocr_model, cropped)

        for name, build in pass_builders:
            p_img = build()
            debug_res[name] = p_img
            if len(p_img.shape) == 2:
                p_img = cv2.cvtColor(p_img, cv2.COLOR_GRAY2BGR)

            # อ่านทุกกล่อง + ทั้งแถบในครั้งเดียว (ทั้งแถบคือคำตอบสำรองเมื่อ detector หาตัวเลขไม่ครบ)
            crops = [p_img[y1:y2, x1:x2] for x1, y1, x2, y2 in boxes] + [p_img]
            reads = recognize(ocr_model, crops)
            box_reads, full_reads = reads[:len(boxes)], reads[len(boxes):]
            raw_reads.append({"pass": name, "boxes": [t for t, _ in box_reads], "full": [t for t, _ in full_reads]})

            confident = False
            parts = []
            for (x1, y1, x2, y2), (t, c) in zip(boxes, box_reads):
                d = clean_digits(t)
                if d:
                    parts.append((d, c, (y2 - y1) / strip_height))

            # ต่อทุกกล่องในแถวเดียวกันเป็นเลขชุดเดียว (detector อาจแยก "012" กับ "34")
            if parts:
                joined = "".join(d for d, _, _ in parts)
                joined_conf = sum(c * len(d) for d, c, _ in parts) / len(joined)
                cand = add_candidate(joined, joined_conf, name, "joined", min(h for _, _, h in parts))
                confident = confident or bool(cand and is_confident(cand))

            # เผื่อกรณีมีกล่องขยะติดมา ให้กล่องเดี่ยวที่ยาวพอเป็นตัวเลือกด้วย
            if len(parts) > 1:
                for d, c, h in parts:
                    cand = add_candidate(d, c, name, "box", h)
                    confident = confident or bool(cand and is_confident(cand))

            # ทั้งแถบ: ไม่รู้ความสูงตัวอักษร จึงไม่ได้โบนัสตัวใหญ่ และไม่ใช้ early-exit
            for t, c in full_reads:
                add_candidate(clean_digits(t), c, name, "full")

            if not is_debug and confident:
                break

    proc_time_ms = int((time.time() - start_time) * 1000)

    def debug_payload():
        # วาดกล่องที่ detector เจอ (หลังกรองแล้ว) ลงบนภาพ พร้อมเลขลำดับซ้าย→ขวา
        boxed = cropped.copy()
        for i, (x1, y1, x2, y2) in enumerate(boxes):
            cv2.rectangle(boxed, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(boxed, str(i + 1), (x1 + 2, max(12, y1 - 3)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        debug_res['Detected_Boxes'] = boxed
        return {
            "debug_images": {k: ImageProcessor.img_to_base64(v) for k, v in debug_res.items() if v is not None},
            "boxes": boxes,
            "box_source": box_source,
            "raw_reads": raw_reads,
        }

    # 4. Voting / Scoring
    if not candidates:
        if is_debug:
            # โหมด debug ส่งภาพ/กล่อง/ข้อความดิบกลับไปด้วย จะได้เห็นว่าทำไมอ่านไม่ได้
            return {
                "success": False,
                "message": "No valid meter digits found",
                "processing_time_ms": proc_time_ms,
                "all_candidates": [],
                **debug_payload(),
            }
        raise ValueError("No valid meter digits found")

    counter = Counter(c['text'] for c in candidates)

    grouped = {}
    for c in candidates:
        t = c['text']
        if t not in grouped or c['conf'] > grouped[t]['conf']:
            grouped[t] = c

    # คะแนน = confidence + โบนัสเมื่อจำนวนหลักตรง / ค่าสมเหตุสมผลเทียบเดือนก่อน
    # / ตัวอักษรตัวใหญ่ (ไม่ใช่ป้ายหลักตัวเล็ก) / หลาย pass อ่านได้ตรงกัน
    def score(c):
        s = c['conf'] + SCORE_PER_EXTRA_VOTE * (counter[c['text']] - 1)
        if c['length_ok']:
            s += SCORE_LENGTH_MATCH
        if c['plausible']:
            s += SCORE_PLAUSIBLE
        if c['height_ratio'] is not None and c['height_ratio'] >= TALL_TEXT_RATIO:
            s += SCORE_TALL_TEXT
        return s

    ranked = sorted(grouped.values(), key=score, reverse=True)
    best = ranked[0]
    confidence = round(float(best['conf']), 4)

    # 5. ลูกกลิ้งหมุนค้าง — ตรวจทุกครั้ง (OpenCV ล้วน เร็วมาก) ใช้ recognizer เพิ่มเฉพาะเมื่อเจอ
    # ถ้าวิเคราะห์พังด้วยเหตุใดก็ตาม ให้ถือว่าไม่แน่ใจ ดีกว่าปล่อยผ่านหรือทำให้ทั้ง request ล่ม
    raw_digits = best['raw']
    rolling = []
    mismatches = []
    rolling_failed = False
    try:
        with ocr_pool.borrow() as ocr_model:
            raw_digits, rolling, mismatches = analyze_rolling(ocr_model, cropped, boxes, best['raw'])
    except Exception:
        logger.exception("Rolling digit analysis failed")
        rolling_failed = True

    reading = normalize_reading(raw_digits, expected_digits)
    length_ok = None if not expected_digits else len(raw_digits) >= expected_digits
    plausible = is_plausible(int(reading), prev_value, max_usage) if reading else None

    review_reasons = []
    if confidence < MIN_CONFIDENCE:
        review_reasons.append("LOW_CONFIDENCE")
    if length_ok is False:
        review_reasons.append("DIGIT_COUNT_MISMATCH")
    if plausible is False:
        review_reasons.append("IMPLAUSIBLE_VALUE")
    if rolling or rolling_failed:
        review_reasons.append("ROLLING_DIGIT")
    if mismatches:
        review_reasons.append("DIGIT_UNCERTAIN")
    # อีกคำตอบที่ต่างกันแต่คะแนนสูสี (จากกล่องตัวเลขจริง ไม่นับอ่านทั้งแถบซึ่งมีขยะปนบ่อย) = ระบบลังเล
    runner_up = next(
        (c for c in ranked[1:] if c['source'] != "full" and c['length_ok'] is not False),
        None,
    )
    if runner_up and score(best) - score(runner_up) < AMBIGUITY_MARGIN:
        review_reasons.append("AMBIGUOUS")

    proc_time_ms = int((time.time() - start_time) * 1000)

    result = {
        "success": True,
        "needs_review": bool(review_reasons),
        "review_reasons": review_reasons,
        "meter_number": reading,
        "raw_digits": raw_digits,
        "ocr_digits": best['raw'],
        "rolling_digits": rolling,
        "uncertain_digits": mismatches,
        "alternative": runner_up['text'] if runner_up and "AMBIGUOUS" in review_reasons else None,
        "confidence": confidence,
        "blur_score": round(float(blur_score), 1),
        "processing_time_ms": proc_time_ms
    }

    if is_debug:
        result.update(debug_payload())
        result['all_candidates'] = sorted(
            ({**c, "score": round(score(c), 4)} for c in candidates),
            key=lambda c: c["score"],
            reverse=True,
        )

    return result


def _parse_optional_int(value):
    if value is None or str(value).strip() == "":
        return None
    try:
        return int(float(value))
    except ValueError:
        return None


# --- API Endpoints ---
# ใช้ def ธรรมดา (ไม่ใช่ async) เพื่อให้ FastAPI รันใน threadpool — ถ้าเป็น async งาน OCR ที่กิน CPU
# จะบล็อก event loop ทำให้ OCR pool ใช้พร้อมกันไม่ได้ และ /health ค้างระหว่างสแกน
@app.get("/")
def read_root():
    return JSONResponse({"status": "UI is at /static/index.html. Use GET /static/index.html"})

@app.get("/health")
def health_check():
    # pool ว่างหมด = กำลังสแกนเต็มกำลัง ไม่ใช่ล่ม จึงตอบ ok เสมอเมื่อ pool ถูกสร้างแล้ว
    return JSONResponse({"status": "ok", "ocr_pool_available": ocr_pool._pool.qsize()})

def _run_scan(image, is_debug, expected_digits, prev_value, max_usage):
    try:
        if not image.filename:
            return JSONResponse({"success": False, "error_code": "EMPTY_UPLOAD", "message": "Empty file"}, status_code=400)

        contents = image.file.read()
        return process_and_read(
            contents,
            is_debug=is_debug,
            expected_digits=_parse_optional_int(expected_digits),
            prev_value=_parse_optional_int(prev_value),
            max_usage=_parse_optional_int(max_usage),
        )
    except ValueError as e:
        return JSONResponse({"success": False, "error_code": "OCR_FAILED", "message": str(e)}, status_code=400)
    except Exception as e:
        logger.exception(f"Error: {e}")
        message = str(e) if is_debug else "Server error"
        return JSONResponse({"success": False, "error_code": "INTERNAL_ERROR", "message": message}, status_code=500)

@app.post("/scan")
def scan_meter(
    image: UploadFile = File(...),
    expected_digits: Optional[str] = Form(None),
    prev_value: Optional[str] = Form(None),
    max_usage: Optional[str] = Form(None),
):
    return _run_scan(image, False, expected_digits, prev_value, max_usage)

@app.post("/debug")
def debug_meter(
    image: UploadFile = File(...),
    expected_digits: Optional[str] = Form(None),
    prev_value: Optional[str] = Form(None),
    max_usage: Optional[str] = Form(None),
):
    return _run_scan(image, True, expected_digits, prev_value, max_usage)
