FROM python:3.11-slim

# Install system dependencies
# libgomp1 คือ OpenMP runtime ที่ paddlepaddle ต้องใช้ตอน import (ไม่มีแล้วจะ ImportError: libgomp.so.1)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash appuser

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

RUN chown -R appuser:appuser /app /home/appuser

USER appuser
ENV HOME=/home/appuser

# ดาวน์โหลดโมเดล det/rec ตอน build แทนตอน container start
# ถ้าโหลดตอน start แล้วเน็ตหลุด ไฟล์ .tar ที่โหลดไม่ครบจะค้างอยู่ใน container
# และ Paddle จะข้ามการโหลดใหม่ ("already exists. Skipping") ทำให้ restart วนไม่จบ
# ที่นี่ถ้าโหลดพัง build จะ fail ทันที และ layer นี้ถูก cache ไว้ไม่ต้องโหลดซ้ำทุก build
# ต้อง import cv2 ก่อน paddle เสมอ ไม่งั้น zlib ที่ bundle มากับแต่ละแพ็กเกจชนกัน
# → "zlib.error: Error -2 while decompressing data" ตอน import pyclipper (main.py ก็ import cv2 เป็นบรรทัดแรก)
RUN python -c "import cv2; from paddleocr import PaddleOCR; PaddleOCR(use_angle_cls=False, lang='en', use_gpu=False, show_log=False)"

# Copy project files
COPY --chown=appuser:appuser . .

# Expose port for FastAPI
EXPOSE 8899

# Run Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8899"]
