FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    git \
    libgomp1 \
    libssl3 \
    libgl1 \
    libglib2.0-0 \
    libjpeg-dev \
    libpng-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN pip install --no-cache-dir \
    numpy==1.24.3 \
    onnxruntime==1.16.3 \
    opencv-python-headless==4.8.1.78 \
    insightface \
    fastapi \
    uvicorn \
    python-multipart \
    pillow

COPY app.py /app/app.py
COPY known_faces /app/known_faces

EXPOSE 8080

CMD ["python", "app.py"]