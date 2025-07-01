# CatalogoMAPA

## Puertos localhost disponibles  
  
El proyecto CatalogoMAPA utiliza los siguientes puertos en el entorno de desarrollo:  
  
| Servicio | Puerto | Descripción |  
|----------|--------|-------------|  
| Frontend (React + Vite) | 8080 | Interfaz de usuario accesible en http://localhost:8080 |  
| Backend (Django REST) | 8002 | API REST accesible en http://localhost:8002 |  
| Neo4j Browser | 7475 | Interfaz de navegador Neo4j accesible en http://localhost:7475 |  
| Neo4j Bolt | 7688 | Puerto de conexión Bolt para Neo4j |  


Para construir la aplicación, se debe ejecutar:
```bash  
docker-compose up --build
```

Para iniciar todos los servicios, hay que ejecutar (con modo debug):  
```bash  
docker-compose up -d
```

Este comando iniciará los contenedores de Docker necesarios para el proyecto, incluyendo el backend (Django REST), el frontend (React + Vite) y la base de datos Neo4j. Esto crea una imagen de Linux, que instala las librerías de python necesarias en backend\requirements.txt

## Carga masiva de datos

La carga masiva de datos se realiza a través de un script de Python llamado `import_mapa.py` que está en backend\api\management\commands\import_mapa.py. Este script permite importar datos desde un archivo Excel y asociar imágenes desde un directorio específico. Asegúrate de tener el archivo Excel y la carpeta de imágenes en la raíz del proyecto.

Primero, hay que hacer las migraciones de la base de datos para crear las tablas necesarias:

```bash	
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

Con las tablas ya creadas, puedes proceder a hacer la carga masiva de datos con el siguiente comando:

```bash
docker-compose exec backend python manage.py import_mapa --excel "/app/inventario.xlsx" --images_dir "/imagenes"                       
```


## Nota:

La importación de miles de piezas y centenas de imágenes puede tardar varios minutos. Asegúrate de usar un buen equipo con buenas especificaciones, pues este proyecto se está creando con un notebook Asus Vivobook 16X con Windows 11 de 64 bits, con una CPU AMD Ryzen 7 octacore, con 16 GB de RAM. Si fueran miles de imágenes (con una cantidad similar a las de piezas), la importación podría tardar horas.
