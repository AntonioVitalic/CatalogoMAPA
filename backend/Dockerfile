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

# Script de inicio: migra y arranca con gunicorn
# Railway inyecta $PORT; si no existe, usa 8000
CMD sh -c "python manage.py migrate && gunicorn core.wsgi:application --bind 0.0.0.0:\${PORT:-8000} --workers 2 --timeout 120 --log-level info"
