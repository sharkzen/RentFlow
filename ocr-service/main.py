import cv2
import numpy as np
import time
import base64
import re
import threading
from collections import Counter
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from paddleocr import PaddleOCR
import logging

# --- Setup & Config ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OCR_Service")

app = FastAPI(title="Meter OCR Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.mount("/static", StaticFiles(directory="static", html=True), name="static")

# --- Thread-Safe Singletons ---
class OCRSystem:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(OCRSystem, cls).__new__(cls)
                cls._instance._init_models()
            return cls._instance

    def _init_models(self):
        logger.info("Initializing YOLO11n...")
        try:
            self.detector = YOLO('yolo11n.pt') # Will download automatically if not found
        except Exception as e:
            logger.warning(f"YOLO load failed, will rely on OpenCV fallback: {e}")
            self.detector = None

        logger.info("Initializing PaddleOCR (CPU)...")
        self.ocr_model = PaddleOCR(use_angle_cls=True, lang='en')
        
        self.char_map = {
            'O': '0', 'o': '0', 'D': '0', 'Q': '0',
            'I': '1', 'l': '1', '|': '1',
            'S': '5', 'B': '8', 'G': '6', 'Z': '2'
        }

ocr_sys = OCRSystem()
cv_lock = threading.Lock()

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
def extract_meter_region(img):
    debug_imgs = {}
    crop_img = img.copy()

    # 1. YOLO Attempt
    if ocr_sys.detector:
        results = ocr_sys.detector(img, verbose=False)
        if len(results[0].boxes) > 0:
            box = results[0].boxes[0].xyxy[0].cpu().numpy()
            x1, y1, x2, y2 = map(int, box)
            crop_img = img[y1:y2, x1:x2]
            debug_imgs['Crop_YOLO'] = crop_img
            return crop_img, debug_imgs

    # 2. OpenCV Fallback
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 50, 200, 255)
    debug_imgs['Edges'] = edged
    
    cnts, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)[:5]
    
    for c in cnts:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            crop_img = ImageProcessor.perspective_transform(img, approx.reshape(4, 2))
            debug_imgs['Crop_Perspective'] = crop_img
            return crop_img, debug_imgs

    # Bounding Box Fallback
    if cnts:
        x, y, w, h = cv2.boundingRect(cnts[0])
        crop_img = img[y:y+h, x:x+w]
        debug_imgs['Crop_BBox'] = crop_img
        
    return crop_img, debug_imgs

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

    # 1. Bypass Auto Crop & Add Padding
    # ข้ามขั้นตอน Auto Crop เพราะรูปหน้าบ้านตัดมาให้แล้ว
    # เติมขอบสีดำรอบรูป 15 พิกเซล ช่วยให้ OCR มองเห็นขอบตัวเลขได้ชัดเจนขึ้น
    cropped = cv2.copyMakeBorder(img, 15, 15, 15, 15, cv2.BORDER_CONSTANT, value=[50, 50, 50])
    crop_debug = {} # สร้าง dict ว่างไว้เพื่อไม่ให้ตัวแปรด้านล่างพัง
    
    debug_res.update(crop_debug)
    debug_res['Final_OCR_Region'] = cropped
    
    # 2. Preprocessing Multi-Pass Generation
    passes = {}
    
    # 2.1 Original
    passes['original'] = cropped
    
    # 2.2 Grayscale (แปลงขาวดำพื้นฐาน ช่วยลดสัญญาณรบกวนจากสี)
    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
    passes['gray'] = gray
    debug_res['Gray'] = gray
    
    # 2.3 CLAHE (ดึงคอนทราสต์ให้ชัดขึ้น เหมาะกับมิเตอร์ที่แสงตกกระทบไม่เท่ากัน)
    passes['clahe'] = ImageProcessor.clahe(cropped)
    debug_res['CLAHE'] = passes['clahe']
    
    # 2.4 Adaptive Threshold (แปลงเป็นขาวดำแบบแข็ง เหมาะกับมิเตอร์ที่มีเงาดำพาดผ่าน)
    denoised = ImageProcessor.denoise(gray) # ลบนอยส์ออกนิดหน่อยก่อนทำ Threshold
    passes['adaptive'] = ImageProcessor.adaptive_threshold(denoised)
    debug_res['Adaptive'] = passes['adaptive']
    
    # 3. Multi-Pass OCR
    candidates = []
    with cv_lock:
        for name, p_img in passes.items():
            if len(p_img.shape) == 2:
                p_img = cv2.cvtColor(p_img, cv2.COLOR_GRAY2BGR)
            
            res = ocr_sys.ocr_model.ocr(p_img, cls=False)
            if not res or not res[0]: continue
            
            for line in res[0]:
                text, conf = line[1]
                # Apply digit correction
                for char, num in ocr_sys.char_map.items():
                    text = text.replace(char, num)
                
                # Filter only digits
                clean_text = re.sub(r'\D', '', text)
                
                # Validation: 3 to 8 digits
                if 3 <= len(clean_text) <= 8:
                    candidates.append({"text": clean_text, "conf": conf, "pass": name})

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

    # Sort by: 1. Frequency (desc), 2. Length (desc), 3. Confidence (desc)
    best_candidate = max(grouped.values(), key=lambda x: (counter[x['text']], len(x['text']), x['conf']))
    
    proc_time_ms = int((time.time() - start_time) * 1000)

    result = {
        "success": True,
        "meter_number": best_candidate['text'],
        "confidence": round(float(best_candidate['conf']), 4),
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