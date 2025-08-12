from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.conf import settings
from neomodel import db

from .models import (
    Pieza, Componente, Imagen, Autor, Pais,
    Localidad, Material, Tecnica, Coleccion
)
from .serializers import (
    PiezaOutSerializer)

class PiezaViewSet(viewsets.ViewSet):
    def list(self, request):
        nombre_coleccion = request.query_params.get('coleccion__nombre')

        if nombre_coleccion:
            q = """
            MATCH (p:Pieza)-[:PERTENECE_A]->(c:Coleccion)
            WHERE toLower(c.nombre) CONTAINS toLower($nombre)
            RETURN p
            ORDER BY p.numero_inventario_int
            """
            rows, _ = db.cypher_query(q, {"nombre": nombre_coleccion})
            piezas = [Pieza.inflate(r[0]) for r in rows]
        else:
            # listado normal, ordenado por numero_inventario_int
            piezas = sorted(Pieza.nodes.all(),
                            key=lambda p: (p.numero_inventario_int or 0))

        paginator = PageNumberPagination()
        paginator.page_size = settings.REST_FRAMEWORK['PAGE_SIZE']  # 10
        page = paginator.paginate_queryset(list(piezas), request)
        ser = PiezaOutSerializer(page, many=True)
        return paginator.get_paginated_response(ser.data)

    def retrieve(self, request, pk=None):
        # pk viene como “id” sqlite => numero_inventario
        pieza = Pieza.nodes.get(numero_inventario=str(int(pk)))
        return Response(PiezaOutSerializer(pieza).data)


class ComponenteViewSet(viewsets.ViewSet):
    def list(self, request):
        comps = Componente.nodes.all()
        serializer = ComponenteSerializer(comps, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        comp = Componente.nodes.get(uid=int(pk))
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
