FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for building frontend and any python extensions
RUN apt-get update && \
    apt-get install -y --no-install-recommends git curl ca-certificates nodejs npm && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend package files to install dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY . .

# Build the frontend
RUN cd frontend && npm run build

# Copy to static
RUN mkdir -p backend/static && cp -r frontend/dist/* backend/static/

EXPOSE 8000
CMD ["python", "backend/main.py"]
