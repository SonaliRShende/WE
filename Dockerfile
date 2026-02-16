# Multi-stage build for AI-Driven Job Recommendation System

# Stage 1: Build Frontend
FROM node:20-alpine as frontend-builder

WORKDIR /app/frontend

# Copy frontend files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ .

# Build the frontend
RUN npm run build

# Stage 2: Build Backend with Frontend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend files and requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./

# Copy built frontend from Stage 1 to backend static folder
RUN mkdir -p static
COPY --from=frontend-builder /app/frontend/dist/ ./static/

# Expose port
EXPOSE 5000

# Set environment variables (can be overridden by docker-compose or docker run)
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/').read()" || exit 1

# Run the Flask application
CMD ["python", "-u", "app.py"]
