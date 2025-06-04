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

# Expone el puerto que usa Django
EXPOSE 8000

# Este comando hará que el container arranque el servidor de Django y no salga
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
