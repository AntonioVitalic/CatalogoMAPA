# api/views.py
from rest_framework import status, viewsets
from rest_framework.response import Response
from .models import Pieza, Componente, Imagen, Autor, Pais, Localidad, Material, Tecnica, Coleccion
from .serializers import (
    PiezaSerializer, ComponenteSerializer, ImagenSerializer, 
    AutorSerializer, PaisSerializer, LocalidadSerializer, 
    MaterialSerializer, TecnicaSerializer, ColeccionSerializer
)

class PiezaViewSet(viewsets.ViewSet):
    def list(self, request):
        piezas = Pieza.nodes.all()
        serializer = PiezaSerializer(piezas, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        pieza = Pieza.nodes.get(id=pk)
        serializer = PiezaSerializer(pieza)
        return Response(serializer.data)

    def create(self, request):
        data = request.data
        pieza = Pieza(nombre=data.get('nombre'), descripcion=data.get('descripcion','')).save()
        # Relaciones (si se proporcionan IDs en la petición)
        for autor_id in data.get('autores', []):
            pieza.autores.connect(Autor.nodes.get(id=autor_id))
        for comp_id in data.get('componentes', []):
            pieza.componentes.connect(Componente.nodes.get(id=comp_id))
        # ... análogamente para otras relaciones ...
        serializer = PiezaSerializer(pieza)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        pieza = Pieza.nodes.get(id=pk)
        data = request.data
        pieza.nombre = data.get('nombre', pieza.nombre)
        pieza.descripcion = data.get('descripcion', pieza.descripcion)
        pieza.save()
        # Relaciones: (opcional, según diseño)
        return Response(PiezaSerializer(pieza).data)

    def destroy(self, request, pk=None):
        pieza = Pieza.nodes.get(id=pk)
        pieza.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Vistas análogas para los demás modelos:
class ComponenteViewSet(viewsets.ViewSet):
    def list(self, request):
        comps = Componente.nodes.all()
        serializer = ComponenteSerializer(comps, many=True)
        return Response(serializer.data)
    # retrieve/create/update/destroy similar a PiezaViewSet ...

class ImagenViewSet(viewsets.ViewSet):
    def list(self, request):
        imgs = Imagen.nodes.all()
        serializer = ImagenSerializer(imgs, many=True)
        return Response(serializer.data)
    # retrieve/create/update/destroy ...

class AutorViewSet(viewsets.ViewSet):
    def list(self, request):
        autores = Autor.nodes.all()
        serializer = AutorSerializer(autores, many=True)
        return Response(serializer.data)
    # ...

class PaisViewSet(viewsets.ViewSet):
    def list(self, request):
        paises = Pais.nodes.all()
        serializer = PaisSerializer(paises, many=True)
        return Response(serializer.data)
    # ...

class LocalidadViewSet(viewsets.ViewSet):
    def list(self, request):
        locs = Localidad.nodes.all()
        serializer = LocalidadSerializer(locs, many=True)
        return Response(serializer.data)
    # ...

class MaterialViewSet(viewsets.ViewSet):
    def list(self, request):
        mats = Material.nodes.all()
        serializer = MaterialSerializer(mats, many=True)
        return Response(serializer.data)
    # ...

class TecnicaViewSet(viewsets.ViewSet):
    def list(self, request):
        tecs = Tecnica.nodes.all()
        serializer = TecnicaSerializer(tecs, many=True)
        return Response(serializer.data)
    # ...

class ColeccionViewSet(viewsets.ViewSet):
    def list(self, request):
        cols = Coleccion.nodes.all()
        serializer = ColeccionSerializer(cols, many=True)
        return Response(serializer.data)
    # ...
