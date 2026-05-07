# Usa una imagen base ligera
FROM python:3.12-slim

# Instalar dependencias del sistema necesarias para Pillow
RUN apt-get update && apt-get install -y \
    build-essential \
    zlib1g-dev \
    libjpeg-dev \
    libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo
WORKDIR /app

# Copia el requirements.txt que ya tienes en backend/
COPY requirements.txt .

# Instala tus dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto del código Django
COPY . .

# Recopilar archivos estáticos
RUN python manage.py collectstatic --noinput 2>/dev/null || true

# Expone el puerto que usa Django
EXPOSE 8000

# En producción usa Gunicorn; en desarrollo puedes sobreescribir con docker-compose
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
