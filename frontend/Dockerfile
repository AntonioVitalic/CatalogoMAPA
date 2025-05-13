# frontend/Dockerfile

FROM node:18-alpine

# 1) Carpeta de trabajo
WORKDIR /app

# 2) Copia solo los manifest para instalar deps
COPY package.json package-lock.json ./

# 3) Instala deps de manera limpia
RUN npm ci

# 4) Copia el resto del código (sin node_modules)
COPY . .

# 5) Expone el puerto donde correrá Vite
ENV PORT=8080
EXPOSE 8080

# 6) Arranca el dev-server de Vite escuchando en todas las interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]
