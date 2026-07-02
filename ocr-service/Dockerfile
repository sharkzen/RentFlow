FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies (CPU version of PyTorch first)
COPY requirements.txt .
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

# Create necessary directories
RUN mkdir -p /app/static /app/uploads

# Copy project files
COPY . .

# Expose port for FastAPI
EXPOSE 8899

# Run Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8899"]