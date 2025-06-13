from rest_framework import viewsets, filters, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Pieza, Componente, Imagen, Pais, Localidad, Coleccion, Autor, Material
from .serializers import (
    PiezaSerializer, ComponenteSerializer, ImagenSerializer,
    PaisSerializer, LocalidadSerializer, ColeccionSerializer, AutorSerializer, MaterialSerializer
)

class PiezaViewSet(viewsets.ModelViewSet):
    queryset = Pieza.objects.prefetch_related(
        'componentes__imagenes', 'imagenes', 'pais', 'localidad',
        'filiacion_cultural', 'coleccion', 'autor',
        'exposiciones', 'materiales', 'tecnica'
    ).all()
    serializer_class = PiezaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  # Auth: editores vs visitantes
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    # Permitir filtrar por campos relacionados:
    filterset_fields = {
        'pais__nombre': ['exact'],
        'coleccion__nombre': ['exact'],
        'autor__nombre': ['exact'],
        'localidad__nombre': ['exact'],
        'filiacion_cultural__nombre': ['exact'],
        'materiales__nombre': ['exact'],
        'exposiciones__titulo': ['exact'],
        'estado_conservacion': ['exact'],
    }
    search_fields = ['numero_inventario', 'nombre_especifico', 'componentes__nombre_comun', 'componentes__nombre_atribuido', 'descripcion']
    ordering_fields = ['id', 'numero_inventario']
    ordering = ['id']  # o ['numero_inventario']

    def perform_create(self, serializer):
        # Asigna el usuario que crea la pieza
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

class ComponenteViewSet(viewsets.ModelViewSet):
    queryset = Componente.objects.prefetch_related('imagenes', 'materiales', 'tecnica').select_related('pieza').all()
    serializer_class = ComponenteSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'pieza__numero_inventario': ['exact'],
        'nombre_comun': ['icontains'],
        'funcion': ['icontains'],
        'materiales__nombre': ['exact'],
        'estado_conservacion': ['exact'],
    }
    search_fields = ['nombre_comun', 'nombre_atribuido', 'descripcion']
    ordering_fields = ['pieza__numero_inventario', 'nombre_comun']
    ordering = ['pieza__numero_inventario', 'letra']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

class ImagenViewSet(viewsets.ModelViewSet):
    queryset = Imagen.objects.select_related('pieza', 'componente').all()
    serializer_class = ImagenSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = {
        'pieza__numero_inventario': ['exact'],
        'componente__pieza__numero_inventario': ['exact'],
        'componente__letra': ['exact'],
    }
    ordering = ['pieza__numero_inventario', 'componente__letra']

# ViewSets de solo lectura para filtros dinámicos
class PaisViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Pais.objects.all().order_by('nombre')
    serializer_class = PaisSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None  # devolver todos los valores

class ColeccionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Coleccion.objects.all().order_by('nombre')
    serializer_class = ColeccionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None

class AutorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Autor.objects.all().order_by('nombre')
    serializer_class = AutorSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None

class LocalidadViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Localidad.objects.all().order_by('nombre')
    serializer_class = LocalidadSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None

class MaterialViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Material.objects.all().order_by('nombre')
    serializer_class = MaterialSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = None
