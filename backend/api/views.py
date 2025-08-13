from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.conf import settings
from neomodel import db

from .models import (
    Pieza, Componente, Imagen, Autor, Pais,
    Localidad, Material, Coleccion
)

from .serializers import (
    PiezaOutSerializer, ComponenteOutSerializer,
    ImagenOutSerializer, ImagenSerializer, ImagenListSerializer,
    NombreSerializer
)


class PiezaViewSet(viewsets.ViewSet):
    def list(self, request):
        colecciones = request.query_params.getlist('coleccion__nombre') # getlist es para filtrar por 1 o más colecciones
        if colecciones:
            q = """
            MATCH (p:Pieza)-[:PERTENECE_A]->(c:Coleccion)
            WHERE any(nombre IN $nombres WHERE toLower(c.nombre) = toLower(nombre))
            RETURN p
            ORDER BY p.numero_inventario_int
            """
            rows, _ = db.cypher_query(q, {"nombres": colecciones})
            piezas = [Pieza.inflate(r[0]) for r in rows]
        else:
            piezas = sorted(Pieza.nodes.all(),
                            key=lambda p: (p.numero_inventario_int or 0))

        paginator = PageNumberPagination()
        paginator.page_size = settings.REST_FRAMEWORK['PAGE_SIZE']  # 10
        page = paginator.paginate_queryset(list(piezas), request)
        ser = PiezaOutSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(ser.data)

    def retrieve(self, request, pk=None):
        # pk viene como “id” sqlite => numero_inventario
        pieza = Pieza.nodes.get(numero_inventario=str(int(pk)))
        return Response(PiezaOutSerializer(pieza, context={'request': request}).data)


# ------- COMPONENTES (read-only como en dev-sqlite para catálogos) -------
class ComponenteViewSet(viewsets.ViewSet):
    def list(self, request):
        comps = Componente.nodes.all()
        # Usamos el serializer OUT (mismo formato que el anidado en pieza)
        ser = ComponenteOutSerializer(comps, many=True, context={'request': request})
        return Response(ser.data)

    def retrieve(self, request, pk=None):
        # En Neo4j el campo uid es string; DRF acepta pk string.
        comp = Componente.nodes.get(uid=pk)
        ser = ComponenteOutSerializer(comp, context={'request': request}) 
        return Response(ser.data)


class ImagenViewSet(viewsets.ViewSet):
    def list(self, request):
        # orden estable (similar al comportamiento anterior)
        imgs = sorted(Imagen.nodes.all(), key=lambda i: i.file_name.casefold())

        paginator = PageNumberPagination()
        paginator.page_size = settings.REST_FRAMEWORK['PAGE_SIZE']
        page = paginator.paginate_queryset(imgs, request)

        # id virtual global = start_index().., como en autoincrement
        start = paginator.page.start_index() - 1  # 0-based
        counter = {'n': start}
        def next_img_id():
            counter['n'] += 1
            return counter['n']

        ser = ImagenListSerializer(page, many=True, context={
            'request': request,
            'next_img_id': next_img_id
        })
        return paginator.get_paginated_response(ser.data)

    def retrieve(self, request, pk=None):
        # Si quieres mantener retrieve simple, puedes devolver el objeto "crudo"
        # o, si prefieres el mismo formato del listado:
        img = Imagen.nodes.get(id=int(pk))
        # Construir id determinista según el orden (opcional)
        # Si no te importa, puedes devolver sólo la URL y descripcion:
        rel = f"{settings.MEDIA_URL}{img.file_name}"
        url = request.build_absolute_uri(rel)
        data = {'id': int(pk), 'imagen': url, 'descripcion': img.descripcion or None}
        return Response(data)

    def create(self, request):
        data = request.data
        img = Imagen(file_name=data.get('file_name'), descripcion=data.get('descripcion', '')).save()
        rel = f"{settings.MEDIA_URL}{img.file_name}"
        url = request.build_absolute_uri(rel)
        # Asigna un id ficticio (no persistente) solo para respuesta inmediata
        return Response({'id': 0, 'imagen': url, 'descripcion': img.descripcion or None}, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        img = Imagen.nodes.get(id=int(pk))
        img.descripcion = request.data.get('descripcion', img.descripcion)
        img.save()
        rel = f"{settings.MEDIA_URL}{img.file_name}"
        url = request.build_absolute_uri(rel)
        return Response({'id': int(pk), 'imagen': url, 'descripcion': img.descripcion or None})

    def destroy(self, request, pk=None):
        img = Imagen.nodes.get(id=int(pk))
        img.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# helpers para catálogos (id virtual + orden alfa + sin vacíos)
def _catalog_json(names_iterable):
    # normaliza: strip, quita vacíos, únicos
    names = {(n or "").strip() for n in names_iterable}
    names.discard("")  # fuera vacíos
    # ordena alfabéticamente (case-insensitive)
    ordered = sorted(names, key=lambda s: s.casefold())
    # id virtual incremental (como en sqlite había un int)
    return [{"id": i + 1, "nombre": n} for i, n in enumerate(ordered)]

class PaisViewSet(viewsets.ViewSet):
    def list(self, request):
        data = _catalog_json(p.nombre for p in Pais.nodes.all())
        return Response(data)

class ColeccionViewSet(viewsets.ViewSet):
    def list(self, request):
        data = _catalog_json(c.nombre for c in Coleccion.nodes.all())
        return Response(data)

class AutorViewSet(viewsets.ViewSet):
    def list(self, request):
        data = _catalog_json(a.nombre for a in Autor.nodes.all())
        return Response(data)

class LocalidadViewSet(viewsets.ViewSet):
    def list(self, request):
        data = _catalog_json(l.nombre for l in Localidad.nodes.all())
        return Response(data)

class TipologiaViewSet(viewsets.ViewSet):
    def list(self, request):
        # Trae tipologías distintas, ignora vacíos
        q = """
        MATCH (p:Pieza)
        WITH trim(coalesce(p.tipologia,'')) AS nombre
        WHERE nombre <> ''
        RETURN DISTINCT nombre
        """
        rows, _ = db.cypher_query(q)
        nombres = [r[0] for r in rows]
        data = _catalog_json(nombres)
        return Response(data)