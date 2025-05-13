# frontend/Dockerfile
FROM node:18

WORKDIR /app

# (1) Copia package*.json que están en frontend/
COPY package.json package-lock.json ./

# (2) Instala
RUN npm install

# (3) Copia el resto del código de frontend
COPY . .

EXPOSE 3000

# (4) Arranca el dev-server
CMD ["npm", "start"]
