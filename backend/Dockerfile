# Usa una imagen base ligera
FROM python:3.12-slim

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
