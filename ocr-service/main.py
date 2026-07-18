import cv2
import numpy as np
import time
import base64
import re
import os
import queue
import contextlib
from collections import Counter
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR
import logging

# Confidence ต่ำกว่านี้ให้ flag ว่าควรรีวิวซ้ำ แทนที่จะเชื่อผลลัพธ์ทันที
MIN_CONFIDENCE = 0.7
# ถ้า pass แรกได้ confidence สูงพอแล้ว ข้าม pass ที่เหลือเพื่อความเร็ว
EARLY_EXIT_CONFIDENCE = 0.9
# จำนวน PaddleOCR instance ที่รันพร้อมกันได้ (มีหลายสาขา/พนักงานสแกนพร้อมกันบ่อย)
# ปรับได้ผ่าน env var ตาม RAM ของเครื่อง แต่ละ instance กินราว 300-500MB
OCR_POOL_SIZE = int(os.getenv("OCR_POOL_SIZE", "3"))

# --- Setup & Config ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OCR_Service")

app = FastAPI(title="Meter OCR Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.mount("/static", StaticFiles(directory="static", html=True), name="static")


def _new_ocr_model():
    # lang='en' ใช้ default mobile-sized det/rec models อยู่แล้ว (เร็วบน CPU)
    # หน้าบ้าน crop กรอบตัวเลขมาให้แล้ว จึงไม่ต้องพึ่ง detector แยกแบบ YOLO
    return PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False)


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
def process_and_read(img_bytes, is_debug=False):
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
    # เติมขอบสีดำรอบรูป 15 พิกเซล ช่วยให้ OCR มองเห็นขอบตัวเลขได้ชัดเจนขึ้น
    cropped = cv2.copyMakeBorder(img, 15, 15, 15, 15, cv2.BORDER_CONSTANT, value=[50, 50, 50])
    debug_res['Final_OCR_Region'] = cropped

    # 2. Preprocessing Multi-Pass Generation
    # เรียงจาก pass ที่มักให้ผลดีสุดไปหาน้อยสุด เพื่อให้ early-exit (ข้อ 3) ทำงานคุ้มค่าที่สุด
    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
    denoised = ImageProcessor.denoise(gray)

    passes = {}
    # 2.1 CLAHE (ดึงคอนทราสต์ให้ชัดขึ้น เหมาะกับมิเตอร์ที่แสงตกกระทบไม่เท่ากัน)
    passes['clahe'] = ImageProcessor.clahe(cropped)
    # 2.2 Original
    passes['original'] = cropped
    # 2.3 Gamma / Auto-brightness (แก้ภาพมืดเกินไป/สว่างเกินไปจากแสงสะท้อนจอมิเตอร์)
    v_mean = np.mean(cv2.cvtColor(cropped, cv2.COLOR_BGR2HSV)[:, :, 2])
    passes['gamma'] = ImageProcessor.gamma(cropped, gamma=1.8 if v_mean < 100 else 0.6)
    # 2.4 Grayscale พื้นฐาน
    passes['gray'] = gray
    # 2.5 Adaptive Threshold (แปลงเป็นขาวดำแบบแข็ง เหมาะกับมิเตอร์ที่มีเงาดำพาดผ่าน)
    passes['adaptive'] = ImageProcessor.adaptive_threshold(denoised)

    for name, p_img in passes.items():
        debug_res[name] = p_img

    # 3. Multi-Pass OCR with early-exit
    # หยุดทันทีที่เจอผลความมั่นใจสูงพอ เพื่อความเร็ว (ยกเว้นโหมด debug ที่ต้องการเห็นทุก pass)
    candidates = []
    with ocr_pool.borrow() as ocr_model:
        for name, p_img in passes.items():
            if len(p_img.shape) == 2:
                p_img = cv2.cvtColor(p_img, cv2.COLOR_GRAY2BGR)

            res = ocr_model.ocr(p_img, cls=False)
            if not res or not res[0]: continue

            pass_best_conf = 0.0
            for line in res[0]:
                text, conf = line[1]
                # Apply digit correction
                for char, num in char_map.items():
                    text = text.replace(char, num)

                # Filter only digits
                clean_text = re.sub(r'\D', '', text)

                # Validation: 3 to 8 digits
                if 3 <= len(clean_text) <= 8:
                    candidates.append({"text": clean_text, "conf": conf, "pass": name})
                    pass_best_conf = max(pass_best_conf, conf)

            if not is_debug and pass_best_conf >= EARLY_EXIT_CONFIDENCE:
                break

    # 4. Voting Logic
    if not candidates:
        raise ValueError("No valid meter digits found")

    # Count occurrences
    texts = [c['text'] for c in candidates]
    counter = Counter(texts)

    # Group by text to find max conf per text
    grouped = {}
    for c in candidates:
        t = c['text']
        if t not in grouped or c['conf'] > grouped[t]['conf']:
            grouped[t] = c

    # Sort by: 1. Frequency (desc), 2. Confidence (desc) — ความยาว digit ไม่ใช้เป็นตัวตัดสินหลักอีกต่อไป
    # เพราะ noise บาง pass อาจสร้างเลขยาวผิดที่ conf/frequency ต่ำกว่าตัวจริง
    best_candidate = max(grouped.values(), key=lambda x: (counter[x['text']], x['conf']))

    proc_time_ms = int((time.time() - start_time) * 1000)
    confidence = round(float(best_candidate['conf']), 4)

    result = {
        "success": True,
        "needs_review": confidence < MIN_CONFIDENCE,
        "meter_number": best_candidate['text'],
        "confidence": confidence,
        "blur_score": round(float(blur_score), 1),
        "processing_time_ms": proc_time_ms
    }

    if is_debug:
        result['debug_images'] = {k: ImageProcessor.img_to_base64(v) for k, v in debug_res.items() if v is not None}
        result['all_candidates'] = candidates

    return result
# --- API Endpoints ---
@app.get("/")
def read_root():
    return JSONResponse({"status": "UI is at /static/index.html. Use GET /static/index.html"})

@app.post("/scan")
async def scan_meter(image: UploadFile = File(...)):
    try:
        if not image.filename:
             return JSONResponse({"success": False, "error_code": "EMPTY_UPLOAD", "message": "Empty file"}, status_code=400)
        
        contents = await image.read()
        res = process_and_read(contents, is_debug=False)
        return res
    except ValueError as e:
        return JSONResponse({"success": False, "error_code": "OCR_FAILED", "message": str(e)}, status_code=400)
    except Exception as e:
        logger.error(f"Error: {e}")
        return JSONResponse({"success": False, "error_code": "INTERNAL_ERROR", "message": "Server error"}, status_code=500)

@app.post("/debug")
async def debug_meter(image: UploadFile = File(...)):
    try:
        contents = await image.read()
        res = process_and_read(contents, is_debug=True)
        return res
    except ValueError as e:
        return JSONResponse({"success": False, "error_code": "OCR_FAILED", "message": str(e)}, status_code=400)
    except Exception as e:
        logger.error(f"Error: {e}")
        return JSONResponse({"success": False, "error_code": "INTERNAL_ERROR", "message": str(e)}, status_code=500)