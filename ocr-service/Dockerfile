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

# Create necessary directories
RUN mkdir -p /app/static

# Copy project files
COPY . .

RUN chown -R appuser:appuser /app /home/appuser

USER appuser
ENV HOME=/home/appuser

# Expose port for FastAPI
EXPOSE 8899

# Run Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8899"]