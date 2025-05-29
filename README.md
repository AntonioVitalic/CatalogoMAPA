# CatalogoMAPA

## Puertos localhost disponibles  
  
El proyecto CatalogoMAPA utiliza los siguientes puertos en el entorno de desarrollo:  
  
| Servicio | Puerto | Descripción |  
|----------|--------|-------------|  
| Frontend (Vite + React) | 8080 | Interfaz de usuario accesible en http://localhost:8080 |  
| Backend (Django) | 8002 | API REST accesible en http://localhost:8002 |  
| Neo4j Browser | 7475 | Interfaz de navegador Neo4j accesible en http://localhost:7475 |  
| Neo4j Bolt | 7688 | Puerto de conexión Bolt para Neo4j |  
  
Para iniciar todos los servicios, ejecuta:  
```bash  
docker-compose up --build
```
Y luego, abre el navegador y accede a http://localhost:8080 para ver la aplicación.