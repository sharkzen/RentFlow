import io
import re
import base64
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse, JSONResponse
import easyocr
import cv2
import numpy as np

app = FastAPI(title="Meter OCR API")

# โหลดโมเดลสำหรับอ่านตัวเลขอารบิก
reader = easyocr.Reader(['en']) 

def preprocess_meter_image(img_content: bytes):
    nparr = np.frombuffer(img_content, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # 1. แปลงเป็นภาพขาว-ดำ (Grayscale)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 2. ขยายขนาดภาพ 2 เท่า เพื่อให้ AI แยกเส้นตัวเลขออกจากกันได้ง่ายขึ้น
    gray = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
    
    # 3. เบลอภาพนิดหน่อยเพื่อลบรอยถลอกบนลูกกลิ้ง
    blur = cv2.medianBlur(gray, 5)
    
    # 4. ปรับสมดุลแสงด้วย CLAHE
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced_img = clahe.apply(blur)
    
    # 5. ใช้ Threshold แบบ OTSU คำนวณหาจุดตัดขาว-ดำ อัตโนมัติ
    _, thresh_img = cv2.threshold(enhanced_img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # 6. ท่าไม้ตายลบจุดฝุ่น (Noise) สีขาว: 
    # อะไรที่เป็นจุดเล็กๆ จะถูกลบทิ้งหมด เหลือไว้แค่ก้อนสีขาวที่ใหญ่พอ (ตัวเลข)
    kernel = np.ones((3, 3), np.uint8)
    clean_img = cv2.morphologyEx(thresh_img, cv2.MORPH_OPEN, kernel)
    
    return clean_img


@app.post("/scan/", summary="สแกนตัวเลขมิเตอร์เพื่อใช้งานจริง")
async def scan_image(file: UploadFile = File(...)):
    contents = await file.read()
    
    # ทำการ Preprocess รูปภาพตามสเต็ปที่ตั้งไว้
    processed_img = preprocess_meter_image(contents)
    
    # ส่งให้ EasyOCR อ่านค่า
    result = reader.readtext(
        processed_img,
        detail=0, 
        allowlist='0123456789',
        mag_ratio=2.5,
        adjust_contrast=True,  
        decoder='beamsearch'   
    )
    
    joined_text = "".join(result)
    numbers_only = re.sub(r'\D', '', joined_text)
    
    return numbers_only


@app.post("/debug-image/", summary="ดูภาพหลังผ่านกระบวนการลบเงา พร้อมผลลัพธ์ตัวเลขที่ AI อ่านได้")
async def debug_image(file: UploadFile = File(...)):
    contents = await file.read()
    
    # 1. รันกระบวนการ Preprocess แปลงภาพ
    processed_img = preprocess_meter_image(contents)
    
    # 2. ให้ EasyOCR แกะลายเส้นของภาพขาวดำนี้
    result = reader.readtext(
        processed_img,
        detail=0, 
        allowlist='0123456789',
        mag_ratio=2.5,
        adjust_contrast=True,
        decoder='beamsearch'
    )
    joined_text = "".join(result)
    numbers_only = re.sub(r'\D', '', joined_text)
    
    # 3. เข้ารหัสรูปภาพขาวดำให้กลายเป็น Base64 String เพื่อใส่ใน JSON ได้
    _, buffer = cv2.imencode(".png", processed_img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    # 4. ส่งค่ากลับเป็น JSON ก้อนเดียวที่มีทั้งตัวเลขและข้อมูลรูปภาพ
    return JSONResponse(content={
        "extracted_number": numbers_only,
        "debug_image_preview": f"data:image/png;base64,{img_base64}"
    })