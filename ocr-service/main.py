
import re
import base64
import logging
import threading
from typing import Optional, List, Tuple, Dict, Any
from contextlib import asynccontextmanager

import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool

import easyocr

# ============================================================
# Logging
# ============================================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("meter_ocr")

# ============================================================
# ตรวจสอบ GPU (fallback เป็น CPU อัตโนมัติถ้าไม่มี torch/CUDA)
# ============================================================
try:
    import torch
    USE_GPU = torch.cuda.is_available()
except ImportError:
    USE_GPU = False

# ============================================================
# การตั้งค่า (ปรับค่าพวกนี้ตามชุดภาพจริงของหน้างาน)
# ============================================================
MIN_DIGITS = 4                 # จำนวนหลักขั้นต่ำที่ยอมรับ
MAX_DIGITS = 8                 # จำนวนหลักสูงสุด (มิเตอร์น้ำ/ไฟทั่วไปมี 4-8 หลัก) — เกินนี้ถือว่าน่าจะมีเลขอื่นปนมา
MIN_AVG_CONFIDENCE = 0.40      # ความมั่นใจเฉลี่ยขั้นต่ำของทั้งชุดตัวเลข
MIN_SINGLE_CONFIDENCE = 0.20   # ความมั่นใจขั้นต่ำของ "หลักที่แย่ที่สุด" กันเฉลี่ยกลบหลักที่เดามั่ว
TARGET_WIDTH = 1000            # ความกว้างมาตรฐานหลัง normalize ภาพรอบแรก
PASS2_MAX_WIDTH = 2000         # เพดานความกว้างของภาพ crop รอบสอง (กัน compute หนักเกินไป)
ENABLE_REFINE_PASS = True      # เปิด/ปิดรอบสอง (ปิดได้ถ้าต้องการ latency ต่ำกว่าความแม่นยำสูงสุด)
CROP_PAD_X_RATIO = 0.15        # ขยายกรอบ crop รอบสอง แนวนอน (กันตัดขอบหลักแรก/หลักสุดท้าย)
CROP_PAD_Y_RATIO = 0.6         # ขยายกรอบ crop รอบสอง แนวตั้ง (เผื่อมากกว่าแนวนอนเพราะกล่อง OCR มักไม่ครอบเต็มหน้าต่างตัวเลข)
MAX_PLAUSIBLE_SKEW_DEG = 25.0  # ถ้าประมาณมุมเอียงได้เกินนี้ ถือว่าน่าจะประมาณผิด ไม่หมุน (กันหมุนพังเข้าไปอีก)
MIN_BLUR_SCORE = 15.0          # ค่า Laplacian variance ขั้นต่ำ ต่ำกว่านี้ถือว่าเบลอเกินจะอ่าน (ควร calibrate กับกล้องจริงที่ใช้)

# ============================================================
# EasyOCR Reader แบบ lazy-load + thread-safe singleton
# โหลดทีเดียวตอน startup (ผ่าน lifespan ด้านล่าง) ไม่ใช่ตอน import โมดูล
# เพื่อไม่ให้การ import ค้างหรือ fail ถ้ายังโหลดโมเดลไม่เสร็จ และทดสอบโมดูลได้ง่ายขึ้น
# ============================================================
_reader: Optional["easyocr.Reader"] = None
_reader_init_lock = threading.Lock()
_inference_lock = threading.Lock()  # กัน race condition เวลามีหลาย request ยิง readtext() พร้อมกันในคนละ thread


def get_reader() -> "easyocr.Reader":
    global _reader
    if _reader is None:
        with _reader_init_lock:
            if _reader is None:  # double-checked locking กันโหลดซ้ำเวลามีหลาย thread มาถึงพร้อมกัน
                logger.info(f"กำลังโหลดโมเดล EasyOCR (gpu={USE_GPU}) ...")
                _reader = easyocr.Reader(["en"], gpu=USE_GPU)
                logger.info("โหลดโมเดล EasyOCR เสร็จแล้ว")
    return _reader


@asynccontextmanager
async def lifespan(app: FastAPI):
    # โหลดโมเดลตอน startup ใน threadpool เพื่อไม่ให้ request แรกของผู้ใช้จริงต้องรอโหลดโมเดล
    await run_in_threadpool(get_reader)
    yield


app = FastAPI(title="Meter OCR API", lifespan=lifespan)


# ============================================================
# ขั้นตอนที่ 1: ถอดรหัสภาพ + เช็คคุณภาพเบื้องต้น
# ============================================================
def decode_image(img_content: bytes) -> np.ndarray:
    """ถอดรหัสไฟล์ภาพเป็นภาพสี (BGR) ความละเอียดเต็มตามต้นฉบับ"""
    nparr = np.frombuffer(img_content, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "INVALID_IMAGE", "message": "ไม่สามารถอ่านไฟล์รูปภาพได้ โปรดตรวจสอบไฟล์ที่อัปโหลด"},
        )
    return img


def check_blur_score(gray: np.ndarray) -> float:
    """
    คำนวณความเบลอด้วย variance ของ Laplacian (ยิ่งค่าต่ำยิ่งเบลอ)
    คำนวณเร็วมาก ใช้กรองภาพที่เบลอจนไม่มีทางอ่านได้ออกไปก่อนเสียเวลาเรียก OCR จริง
    """
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


# ============================================================
# ขั้นตอนที่ 2: เตรียมภาพสำหรับ OCR (ใช้ได้ทั้งรอบ 1 และรอบ 2)
# ============================================================
def _remove_glare(gray: np.ndarray) -> np.ndarray:
    """
    💡 ตรวจจับจุดแสงสะท้อน (specular highlight) ที่ขาวจัดเป็นหย่อมเล็กๆ บนกระจกมิเตอร์
    แล้ว inpaint ซ่อมแซมโดยใช้พิกเซลรอบข้าง
    หมายเหตุ: ถ้าจุดสว่างกินทับตัวเลขทั้งหมด ข้อมูลส่วนนั้นกู้คืนไม่ได้จริงๆ —
    วิธีนี้ช่วยได้เฉพาะแสงสะท้อนจุดเล็ก-กลางที่ไม่ได้บังตัวเลขมิดทั้งหลัก
    """
    _, glare_mask = cv2.threshold(gray, 235, 255, cv2.THRESH_BINARY)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    glare_mask = cv2.dilate(glare_mask, kernel, iterations=1)

    glare_ratio = np.count_nonzero(glare_mask) / glare_mask.size
    # ถ้าพื้นที่ "ขาวจัด" เยอะเกินไป (>15%) น่าจะเป็นพื้นหลังสว่างปกติของมิเตอร์ ไม่ใช่แสงสะท้อน ข้ามไปกันแก้ผิดจุด
    if glare_ratio == 0 or glare_ratio > 0.15:
        return gray

    return cv2.inpaint(gray, glare_mask, 3, cv2.INPAINT_TELEA)


def _adaptive_clahe(gray: np.ndarray) -> np.ndarray:
    """
    ปรับ clipLimit ของ CLAHE ตามค่า std ของภาพจริง แทนการ fix ค่าตายตัวแบบเดิม
    ภาพคอนทราสต์ต่ำ (มืด/หม่น) ได้ clipLimit สูงขึ้นเพื่อดันตัวเลขให้เด่น
    ภาพคอนทราสต์สูงอยู่แล้วใช้ clipLimit ต่ำ กัน noise/halo เกินจำเป็น
    """
    std = float(np.std(gray))
    if std < 30:
        clip = 4.0
    elif std < 50:
        clip = 3.0
    else:
        clip = 2.0
    clahe = cv2.createCLAHE(clipLimit=clip, tileGridSize=(8, 8))
    return clahe.apply(gray)


def enhance_for_ocr(gray: np.ndarray, target_width: int = TARGET_WIDTH) -> Tuple[np.ndarray, float]:
    h, w = gray.shape[:2]
    scale = target_width / w
    interp = cv2.INTER_CUBIC if scale > 1 else cv2.INTER_AREA
    resized = cv2.resize(gray, (target_width, max(1, int(h * scale))), interpolation=interp)

    de_glared = _remove_glare(resized)

    # ============================================================
    # [เพิ่มโค้ดส่วนนี้] ละลายเส้นคั่นและเงาขอบหน้าต่างแนวตั้งทิ้ง
    # ============================================================
    # ใช้กรอบ 3x5 (เน้นแนวตั้ง) กัดสิ่งที่มีความกว้างน้อยๆ ทิ้ง
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 5))
    opened = cv2.morphologyEx(de_glared, cv2.MORPH_OPEN, kernel)

    # ส่ง opened ไปทำ Bilateral Filter ต่อ
    denoised = cv2.bilateralFilter(opened, 9, 75, 75)

    contrasted = _adaptive_clahe(denoised)

    gaussian = cv2.GaussianBlur(contrasted, (0, 0), 2.0)
    sharpened = cv2.addWeighted(contrasted, 1.5, gaussian, -0.5, 0)

    return sharpened, scale


# ============================================================
# ขั้นตอนที่ 3: จัดกลุ่มกล่องข้อความ + ประมาณมุมเอียง + คำนวณกรอบ crop
# ============================================================
def _bbox_center(bbox) -> Tuple[float, float]:
    xs = [p[0] for p in bbox]
    ys = [p[1] for p in bbox]
    return sum(xs) / len(xs), sum(ys) / len(ys)


def _bbox_height(bbox) -> float:
    ys = [p[1] for p in bbox]
    return max(ys) - min(ys)


def group_digit_cluster(ocr_results: List[Tuple]) -> List[Dict[str, Any]]:
    """
    💡 ภาพมิเตอร์จริงมักมีตัวเลข/ตัวอักษรอื่นปนอยู่ในเฟรมด้วย (เลขซีเรียล, รุ่น, ปีผลิต ฯลฯ)
    ฟังก์ชันนี้จัดกลุ่มกล่องข้อความตามตำแหน่งแนวตั้ง (center_y) เป็น "แถว" แล้วเลือกแถวที่
    น่าจะเป็นเลขมิเตอร์จริงที่สุด คือแถวที่มีจำนวนกล่องมากที่สุด (เรียงต่อกันเป็นชุดเดียว)
    และถ้าจำนวนกล่องเท่ากัน เลือกแถวที่ confidence รวมสูงกว่า
    แทนที่จะเอาทุกกล่องที่เจอในภาพมาเรียงต่อกันเหมือนเดิม ซึ่งเสี่ยงปนเปื้อนจากเลขอื่นที่ไม่ใช่เลขมิเตอร์
    """
    if not ocr_results:
        return []

    items = []
    for bbox, text, prob in ocr_results:
        cx, cy = _bbox_center(bbox)
        items.append({"bbox": bbox, "text": text, "prob": prob, "cx": cx, "cy": cy, "h": _bbox_height(bbox)})

    items.sort(key=lambda b: b["cy"])

    clusters: List[List[Dict[str, Any]]] = [[items[0]]]
    for it in items[1:]:
        ref = clusters[-1][-1]
        # ถือว่าอยู่แถวเดียวกัน ถ้า center_y ห่างกันไม่เกินครึ่งหนึ่งของความสูงตัวอักษร
        if abs(it["cy"] - ref["cy"]) <= max(ref["h"], it["h"], 1.0) * 0.6:
            clusters[-1].append(it)
        else:
            clusters.append([it])

    best = max(clusters, key=lambda c: (len(c), sum(x["prob"] for x in c)))
    best.sort(key=lambda b: b["cx"])  # เรียงซ้าย -> ขวาด้วยจุดศูนย์กลางกล่อง (กันปัญหาจากมุมซ้ายบนตอนกล่องเอียง)
    return best

def filter_fractional_dial(cluster: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    ตัดหลักทศนิยม (ตัวเลขในช่องขวาสุด) ทิ้ง โดยเช็คจากระยะห่าง (Gap) 
    ระหว่างกล่องข้อความที่มักจะกว้างกว่าปกติ
    """
    if len(cluster) < 4:
        return cluster # ถ้ามีน้อยกว่า 4 กล่อง ไม่ควรตัด เผื่อเป็นหน้าปัดแบบอื่น

    # เรียงกล่องจากซ้ายไปขวา (X-axis)
    cluster.sort(key=lambda b: b["cx"])
    
    # คำนวณความกว้างเฉลี่ยของตัวเลข เพื่อใช้เป็นมาตรวัดระยะห่าง
    widths = [max(p[0] for p in c["bbox"]) - min(p[0] for p in c["bbox"]) for c in cluster]
    avg_width = sum(widths) / len(widths)

    filtered_cluster = [cluster[0]]
    
    for i in range(1, len(cluster)):
        prev_box = cluster[i-1]["bbox"]
        curr_box = cluster[i]["bbox"]
        
        # หาพิกัดขวาสุดของกล่องก่อนหน้า และซ้ายสุดของกล่องปัจจุบัน
        prev_right = max(p[0] for p in prev_box)
        curr_left = min(p[0] for p in curr_box)
        
        gap = curr_left - prev_right
        
        # ถ้าระยะห่างมากกว่า 60% ของความกว้างตัวเลข (ปรับค่า 0.6 นี้ได้ตามภาพหน้างานจริง)
        # ถือว่าเป็นช่องว่างคั่นหลักทศนิยม ให้หยุดเก็บกล่องทันที
        if gap > (avg_width * 0.6):
            break
            
        filtered_cluster.append(cluster[i])
        
    return filtered_cluster

def estimate_skew_angle(cluster: List[Dict[str, Any]]) -> float:
    """
    ประมาณมุมเอียงของแถวตัวเลขจากเส้นที่ fit ผ่านจุดศูนย์กลางของกล่องทุกกล่องในแถว (least squares)
    ใช้หมุนภาพให้ตัวเลขอยู่แนวนอนก่อน OCR รอบสอง
    มีเพดานกันค่าประมาณหลุด (ถ้ามุมที่ได้เกิน MAX_PLAUSIBLE_SKEW_DEG ถือว่าประมาณผิด ไม่หมุน)
    หมายเหตุ: แก้ได้แค่การ "หมุน" ไม่ใช่ perspective distortion เต็มรูปแบบ — ถ่ายตรงๆ ให้มากที่สุดยังจำเป็นอยู่
    """
    if len(cluster) < 2:
        return 0.0
    xs = np.array([c["cx"] for c in cluster])
    ys = np.array([c["cy"] for c in cluster])
    if np.ptp(xs) < 1e-3:
        return 0.0
    m, _ = np.polyfit(xs, ys, 1)
    angle = float(np.degrees(np.arctan(m)))
    if abs(angle) > MAX_PLAUSIBLE_SKEW_DEG:
        return 0.0
    return angle


def compute_crop_box(
    cluster: List[Dict[str, Any]],
    image_shape: Tuple[int, int],
    pad_x_ratio: float = CROP_PAD_X_RATIO,
    pad_y_ratio: float = CROP_PAD_Y_RATIO,
) -> Tuple[int, int, int, int]:
    """คำนวณกรอบสี่เหลี่ยม (x1, y1, x2, y2) ครอบกลุ่มตัวเลขที่เลือก พร้อมเผื่อขอบกันตัดตัวเลขขาด"""
    h, w = image_shape[:2]
    all_x = [p[0] for c in cluster for p in c["bbox"]]
    all_y = [p[1] for c in cluster for p in c["bbox"]]
    x1, x2 = min(all_x), max(all_x)
    y1, y2 = min(all_y), max(all_y)

    pad_x = (x2 - x1) * pad_x_ratio
    pad_y = (y2 - y1) * pad_y_ratio

    x1 = max(0, int(x1 - pad_x))
    y1 = max(0, int(y1 - pad_y))
    x2 = min(w, int(x2 + pad_x))
    y2 = min(h, int(y2 + pad_y))
    return x1, y1, x2, y2


def rotate_image(gray: np.ndarray, angle: float) -> np.ndarray:
    """หมุนภาพรอบจุดศูนย์กลางตามองศาที่กำหนด ใช้ BORDER_REPLICATE กันเกิดขอบดำหลอก OCR"""
    if abs(angle) < 0.5:  # มุมเล็กน้อยมากไม่คุ้มหมุน (interpolation จะเพิ่ม noise โดยไม่ได้อะไรคืน)
        return gray
    h, w = gray.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)


# ============================================================
# ขั้นตอนที่ 4: ดึงเลข + validate
# ============================================================
def validate_cluster_digits(cluster: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "NO_TEXT_FOUND", "message": "ไม่พบตัวเลขในภาพ กรุณาถ่ายให้เห็นตัวเลขชัดเจน"},
        )

    # จัดเรียงกล่องจากซ้ายไปขวาก่อนรวบคำ เพื่อป้องกันกรณี EasyOCR สลับลำดับกล่อง
    cluster.sort(key=lambda b: b["cx"])

    # รวบข้อความทุกกล่องเข้าด้วยกัน
    extracted_text = "".join(c["text"] for c in cluster)
    
    # กรองเอามาเฉพาะตัวเลขเท่านั้น
    numbers_only = re.sub(r"\D", "", extracted_text)

    # เช็คว่าอ่านได้ขั้นต่ำ 4 หลักหรือไม่
    if len(numbers_only) < 4:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "UNREADABLE_IMAGE",
                "message": f"อ่านตัวเลขได้ไม่ครบ (ได้ {len(numbers_only)} หลัก ต้องการอย่างน้อย 4 หลัก) ภาพอาจเบลอหรือมีแสงสะท้อน",
            },
        )

    # ============================================================
    # หั่นเอาเฉพาะ 4 ตัวแรกตามที่ต้องการ
    # ============================================================
    final_number = numbers_only[:4]

    avg_conf = sum(c["prob"] for c in cluster) / len(cluster)
    min_conf = min(c["prob"] for c in cluster)

    if avg_conf < MIN_AVG_CONFIDENCE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "LOW_CONFIDENCE", "message": "ภาพไม่ชัดเจน ระบบไม่มั่นใจในความถูกต้อง กรุณาถ่ายใหม่"},
        )

    if min_conf < MIN_SINGLE_CONFIDENCE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "LOW_CONFIDENCE_DIGIT",
                "message": "มีบางหลักที่ระบบไม่มั่นใจเป็นพิเศษ (อาจถูกบดบังหรือเลือนลาง) กรุณาถ่ายใหม่ให้เห็นทุกหลักชัดเจน",
            },
        )

    return {
        "value": final_number, 
        "avg_confidence": round(avg_conf, 4),
        "min_confidence": round(min_conf, 4),
        "box_count": len(cluster),
    }

# ============================================================
# ขั้นตอนที่ 5: เรียก EasyOCR จริง (sync, รันใน threadpool จากภายนอก)
# ============================================================
def _run_ocr(image: np.ndarray):
    
    reader = get_reader()
    with _inference_lock:
        return reader.readtext(
           image,
            detail=1,
            allowlist="0123456789",
            paragraph=False,
            mag_ratio=1.0,
            adjust_contrast=True,
            contrast_ths=0.25,
            text_threshold=0.6,
            low_text=0.45,       # <--- [ปรับแก้ตรงนี้] เปลี่ยนจาก 0.3 เป็น 0.45 หรือ 0.5 เพื่อเมินเงาจางๆ
            width_ths=0.1,       # (ตามที่เคยแก้ไว้เพื่อแยกกล่อง)
            link_threshold=0.1,  # (ตามที่เคยแก้ไว้เพื่อแยกกล่อง)
            decoder="beamsearch",
        )


# ============================================================
# ขั้นตอนที่ 6: orchestration แบบ 2 รอบ (coarse -> refine)
# ============================================================
async def run_meter_ocr_on_image(img: np.ndarray) -> Dict[str, Any]:
    """
    รอบ 1 (coarse): สแกนภาพเต็มเฟรมที่ผ่านการแต่งแบบมาตรฐาน หาตำแหน่ง "แถวตัวเลข" คร่าวๆ
    รอบ 2 (refine): crop เฉพาะหน้าต่างตัวเลขจาก "ภาพต้นฉบับความละเอียดเต็ม" (ไม่ใช่ภาพที่ resize ไปแล้วในรอบ 1)
                     แล้วหมุนแก้มุมเอียง + แต่งภาพใหม่อีกครั้งโดยซูมเข้าไปเฉพาะจุดนั้น — รอบนี้ตัวเลข
                     เต็มเฟรมมากขึ้น คมชัดขึ้นกว่ารอบแรกมาก เพราะไม่ต้องเสียพื้นที่ภาพไปกับพื้นหลัง
    ถ้ารอบ 2 อ่านไม่ผ่านเงื่อนไข (เช่น crop พลาดตำแหน่ง) จะ fallback ไปใช้ผลรอบ 1 แทนถ้ารอบ 1 ผ่าน
    """
    gray_full = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    blur_score = check_blur_score(gray_full)
    if blur_score < MIN_BLUR_SCORE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "IMAGE_TOO_BLURRY",
                "message": "ภาพเบลอเกินไป กรุณาถ่ายใหม่โดยถือกล้องนิ่งๆ และโฟกัสที่ตัวเลขมิเตอร์",
            },
        )

    # ----- รอบ 1: coarse pass บนภาพเต็มเฟรม -----
    pass1_img, scale1 = enhance_for_ocr(gray_full, TARGET_WIDTH)
    pass1_results = await run_in_threadpool(_run_ocr, pass1_img)
    pass1_cluster = group_digit_cluster(pass1_results)
    pass1_cluster = filter_fractional_dial(pass1_cluster)

    pass1_validated: Optional[Dict[str, Any]] = None
    pass1_error: Optional[Dict[str, Any]] = None
    if pass1_cluster:
        try:
            pass1_validated = validate_cluster_digits(pass1_cluster)
        except HTTPException as e:
            pass1_error = e.detail
    else:
        pass1_error = {"error_code": "NO_TEXT_FOUND", "message": "ไม่พบตัวเลขในภาพ กรุณาถ่ายให้เห็นตัวเลขชัดเจน"}

    if not ENABLE_REFINE_PASS or not pass1_cluster:
        if pass1_validated is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=pass1_error)
        return {**pass1_validated, "pass_used": "coarse", "blur_score": round(blur_score, 2)}

    # ----- รอบ 2: refine pass เฉพาะหน้าต่างตัวเลข -----
    try:
        angle = estimate_skew_angle(pass1_cluster)
        x1, y1, x2, y2 = compute_crop_box(pass1_cluster, pass1_img.shape)
        # แปลงพิกัด crop จากพื้นที่ภาพ pass1 (ที่ resize แล้ว) กลับไปยังพิกัดภาพต้นฉบับความละเอียดเต็ม
        ox1, oy1, ox2, oy2 = (int(v / scale1) for v in (x1, y1, x2, y2))
        crop = gray_full[oy1:oy2, ox1:ox2]

        if crop.size == 0 or crop.shape[0] < 5 or crop.shape[1] < 5:
            raise ValueError("crop ว่างเปล่าหรือเล็กเกินไป")

        rotated = rotate_image(crop, angle)
        zoom_width = min(PASS2_MAX_WIDTH, max(TARGET_WIDTH, rotated.shape[1] * 3))
        pass2_img, _ = enhance_for_ocr(rotated, target_width=int(zoom_width))
        pass2_results = await run_in_threadpool(_run_ocr, pass2_img)
        pass2_cluster = group_digit_cluster(pass2_results)
        pass2_cluster = filter_fractional_dial(pass2_cluster)
        pass2_validated = validate_cluster_digits(pass2_cluster)
        return {
            **pass2_validated,
            "pass_used": "refine",
            "skew_angle_deg": round(angle, 2),
            "blur_score": round(blur_score, 2),
        }

    except HTTPException:
        if pass1_validated is not None:
            return {**pass1_validated, "pass_used": "coarse_fallback", "blur_score": round(blur_score, 2)}
        raise
    except Exception as e:
        logger.warning(f"refine pass ล้มเหลวจากข้อผิดพลาดไม่คาดคิด: {e}")
        if pass1_validated is not None:
            return {**pass1_validated, "pass_used": "coarse_fallback", "blur_score": round(blur_score, 2)}
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=pass1_error or {"error_code": "UNREADABLE_IMAGE", "message": "ไม่สามารถอ่านตัวเลขได้ กรุณาถ่ายใหม่"},
        )


async def run_meter_ocr(img_content: bytes) -> Dict[str, Any]:
    img = decode_image(img_content)
    return await run_meter_ocr_on_image(img)


# ============================================================
# Endpoints
# ============================================================
@app.post("/scan", summary="สแกนตัวเลขมิเตอร์เพื่อใช้งานจริง")
async def scan_image(file: UploadFile = File(...)):
    contents = await file.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "EMPTY_FILE", "message": "ไม่พบข้อมูลไฟล์ที่อัปโหลด"},
        )

    result = await run_meter_ocr(contents)
    return {
        "status": "success",
        "meter_number": result["value"],
        "confidence": result["avg_confidence"],
        "pass_used": result["pass_used"],
    }


@app.post("/debug-image", summary="ดูภาพหลังผ่านกระบวนการแต่งรูป พร้อมผลลัพธ์ละเอียด (ไว้ debug/tune พารามิเตอร์)")
async def debug_image(file: UploadFile = File(...)):
    contents = await file.read()
    img = decode_image(contents)
    gray_full = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur_score = check_blur_score(gray_full)

    try:
        result = await run_meter_ocr_on_image(img)
        status_msg = "success"
        error_detail = None
        meter_number = result["value"]
        extra = {k: v for k, v in result.items() if k != "value"}
    except HTTPException as e:
        status_msg = "failed"
        error_detail = e.detail
        meter_number = None
        extra = {}

    preview_img, _ = enhance_for_ocr(gray_full, TARGET_WIDTH)
    _, buffer = cv2.imencode(".png", preview_img)
    img_base64 = base64.b64encode(buffer.tobytes()).decode("utf-8")

    return JSONResponse(
        content={
            "status": status_msg,
            "extracted_number": meter_number,
            "error_detail": error_detail,
            "blur_score": round(blur_score, 2),
            **extra,
            "debug_image_preview": f"data:image/png;base64,{img_base64}",
        }
    )