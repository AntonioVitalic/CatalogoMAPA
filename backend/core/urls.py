"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# backend/urls.py
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    PiezaViewSet, ComponenteViewSet, ImagenViewSet, 
    AutorViewSet, PaisViewSet, LocalidadViewSet, UbicacionViewSet,
    TipologiaViewSet, ColeccionViewSet, ExposicionViewSet,
    importacion_masiva, exportar_excel_con_imagenes
)

router = DefaultRouter()
router.register(r'piezas', PiezaViewSet, basename='pieza')
router.register(r'componentes', ComponenteViewSet, basename='componente')
router.register(r'imagenes', ImagenViewSet, basename='imagen')
router.register(r'paises', PaisViewSet, basename='pais')
router.register(r'colecciones', ColeccionViewSet, basename='coleccion')
router.register(r'autores', AutorViewSet, basename='autor')
router.register(r'localidades', LocalidadViewSet, basename='localidad')
router.register(r'ubicacion', UbicacionViewSet, basename='ubicacion')
router.register(r'tipologias', TipologiaViewSet, basename='tipologia')
router.register(r'exposiciones', ExposicionViewSet, basename='exposicion')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)), # los endpoints de Neo4j
    path('accounts/', include('accounts.urls')), # los endpoints de auth + usuarios + registro cambios
    path('api/importacion-masiva/', importacion_masiva), # endpoint para ejecutar importacion masiva
    path('api/exportar-excel-con-imagenes/', exportar_excel_con_imagenes), # endpoint para exportar a Excel
]


# En DEBUG, servir archivos de MEDIA_ROOT en MEDIA_URL
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
