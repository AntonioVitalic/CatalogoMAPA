from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import (
    Pieza, Componente, Imagen, Autor, Pais,
    Localidad, Material, Tecnica, Coleccion
)
from .serializers import (
    PiezaSerializer, ComponenteSerializer, ImagenSerializer,
    AutorSerializer, PaisSerializer, LocalidadSerializer,
    MaterialSerializer, TecnicaSerializer, ColeccionSerializer
)

class PiezaViewSet(viewsets.ViewSet):
    def list(self, request):
        piezas = Pieza.nodes.all()
        paginator = PageNumberPagination()
        paginator.page_size = 10  # O usa settings.PAGE_SIZE
        result_page = paginator.paginate_queryset(list(piezas), request)
        serializer = PiezaSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def retrieve(self, request, pk=None):
        pieza = Pieza.nodes.get(id=int(pk))
        serializer = PiezaSerializer(pieza)
        return Response(serializer.data)

    def create(self, request):
        data = request.data
        pieza = Pieza(
            nombre=data.get('nombre'),
            descripcion=data.get('descripcion', '')
        ).save()

        # Conectar relaciones si vinieron en la petición
        for autor_id in data.get('autores', []):
            pieza.autores.connect(Autor.nodes.get(id=int(autor_id)))
        for comp_id in data.get('componentes', []):
            pieza.componentes.connect(Componente.nodes.get(id=int(comp_id)))
        for pais_id in data.get('pais', []):
            pieza.pais.connect(Pais.nodes.get(id=int(pais_id)))
        for loc_id in data.get('localidad', []):
            pieza.localidad.connect(Localidad.nodes.get(id=int(loc_id)))
        for mat_id in data.get('materiales', []):
            pieza.materiales.connect(Material.nodes.get(id=int(mat_id)))
        for tec_id in data.get('tecnicas', []):
            pieza.tecnicas.connect(Tecnica.nodes.get(id=int(tec_id)))
        for col_id in data.get('colecciones', []):
            pieza.colecciones.connect(Coleccion.nodes.get(id=int(col_id)))

        serializer = PiezaSerializer(pieza)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        pieza = Pieza.nodes.get(id=int(pk))
        data = request.data
        pieza.nombre = data.get('nombre', pieza.nombre)
        pieza.descripcion = data.get('descripcion', pieza.descripcion)
        pieza.save()
        # (Opcional: sincronizar relaciones aquí)
        serializer = PiezaSerializer(pieza)
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        pieza = Pieza.nodes.get(id=int(pk))
        pieza.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ComponenteViewSet(viewsets.ViewSet):
    def list(self, request):
        comps = Componente.nodes.all()
        serializer = ComponenteSerializer(comps, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        comp = Componente.nodes.get(id=int(pk))
        serializer = ComponenteSerializer(comp)
        return Response(serializer.data)

    def create(self, request):
        data = request.data
        comp = Componente(
            pieza_id=data.get('pieza_id'),
            letra=data.get('letra', ''),
            nombre=data.get('nombre')
        ).save()
        serializer = ComponenteSerializer(comp)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        comp = Componente.nodes.get(id=int(pk))
        data = request.data
        comp.nombre = data.get('nombre', comp.nombre)
        comp.save()
        return Response(ComponenteSerializer(comp).data)

    def destroy(self, request, pk=None):
        comp = Componente.nodes.get(id=int(pk))
        comp.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ImagenViewSet(viewsets.ViewSet):
    def list(self, request):
        imgs = Imagen.nodes.all()
        serializer = ImagenSerializer(imgs, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        img = Imagen.nodes.get(id=int(pk))
        serializer = ImagenSerializer(img)
        return Response(serializer.data)

    def create(self, request):
        data = request.data
        img = Imagen(
            file_name=data.get('file_name'),
            descripcion=data.get('descripcion', '')
        ).save()
        return Response(ImagenSerializer(img).data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        img = Imagen.nodes.get(id=int(pk))
        img.descripcion = request.data.get('descripcion', img.descripcion)
        img.save()
        return Response(ImagenSerializer(img).data)

    def destroy(self, request, pk=None):
        img = Imagen.nodes.get(id=int(pk))
        img.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AutorViewSet(viewsets.ViewSet):
    def list(self, request):
        qs = Autor.nodes.all()
        return Response(AutorSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        obj = Autor.nodes.get(id=int(pk))
        return Response(AutorSerializer(obj).data)
    # create/update/destroy si los necesitas…


class PaisViewSet(viewsets.ViewSet):
    def list(self, request):
        qs = Pais.nodes.all()
        return Response(PaisSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        obj = Pais.nodes.get(id=int(pk))
        return Response(PaisSerializer(obj).data)


class LocalidadViewSet(viewsets.ViewSet):
    def list(self, request):
        qs = Localidad.nodes.all()
        return Response(LocalidadSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        obj = Localidad.nodes.get(id=int(pk))
        return Response(LocalidadSerializer(obj).data)


class MaterialViewSet(viewsets.ViewSet):
    def list(self, request):
        qs = Material.nodes.all()
        return Response(MaterialSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        obj = Material.nodes.get(id=int(pk))
        return Response(MaterialSerializer(obj).data)


class TecnicaViewSet(viewsets.ViewSet):
    def list(self, request):
        qs = Tecnica.nodes.all()
        return Response(TecnicaSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        obj = Tecnica.nodes.get(id=int(pk))
        return Response(TecnicaSerializer(obj).data)


class ColeccionViewSet(viewsets.ViewSet):
    def list(self, request):
        qs = Coleccion.nodes.all()
        return Response(ColeccionSerializer(qs, many=True).data)

    def retrieve(self, request, pk=None):
        obj = Coleccion.nodes.get(id=int(pk))
        return Response(ColeccionSerializer(obj).data)
