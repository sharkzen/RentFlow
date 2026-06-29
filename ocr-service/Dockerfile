# ใช้ Python 3.10 รุ่น slim
FROM python:3.10-slim

WORKDIR /app

# เปลี่ยนจาก libgl1-mesa-glx เป็น libgl1
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8899

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8899"]