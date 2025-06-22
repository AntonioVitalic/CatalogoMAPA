import os
from neo4j import GraphDatabase
from rest_framework import viewsets, filters, permissions, status
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from .models import Pieza, Componente, Imagen, Pais, Localidad, Coleccion, Autor, Material
from .serializers import (
    PiezaSerializer, ComponenteSerializer, ImagenSerializer,
    PaisSerializer, LocalidadSerializer, ColeccionSerializer, AutorSerializer, MaterialSerializer
)

# from .serializers import PiezaSerializer 

uri      = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
user     = os.getenv("NEO4J_USER", "neo4j")
password = os.getenv("NEO4J_PASSWORD", "")
driver = GraphDatabase.driver(uri, auth=(user, password))

class PiezaPagination(PageNumberPagination):
    page_size = 10
    page_query_param = 'page'
    page_size_query_param = None


class PiezaViewSet(viewsets.ViewSet):
    pagination_class = PiezaPagination

    def list(self, request):
        # 1) saco page y page_size
        paginator = self.pagination_class()
        page_number = int(paginator.get_page_number(request, self) or 1)
        page_size   = paginator.get_page_size(request)

        skip  = (page_number - 1) * page_size
        limit = page_size

        with driver.session() as session:
            # 2) cuento TOTAL
            total = session.run(
                "MATCH (p:Pieza) RETURN count(p) AS c"
            ).single()["c"]

            # 3) traigo sólo esta página con SKIP/LIMIT
            cypher = """
            MATCH (p:Pieza)
            OPTIONAL MATCH (p)-[:PROCEDENTE_DE]->(pa:Pais)
            RETURN {
              id:                    toInteger(p.numero_inventario),
              numero_inventario:     p.numero_inventario,
              numero_registro_anterior: p.numero_registro_anterior,
              codigo_surdoc:         p.codigo_surdoc,
              ubicacion:             p.ubicacion,
              deposito:              p.deposito,
              estante:               p.estante,
              caja_actual:           p.caja_actual,
              tipologia:             p.tipologia,
              coleccion:             p.coleccion,
              clasificacion:         p.clasificacion,
              conjunto:              p.conjunto,
              nombre_comun:          p.nombre_comun,
              nombre_especifico:     p.nombre_especifico,
              autor:                 coalesce(p.autor, null),
              filiacion_cultural:    coalesce(p.filiacion_cultural, null),
              pais:                  pa.nombre,
              localidad:             coalesce(p.localidad, null),
              fecha_creacion:        coalesce(p.fecha_creacion, null),
              descripcion_col:       p.descripcion,
              marcas_inscripciones:  coalesce(p.marcas_inscripciones, ""),
              contexto_historico:    coalesce(p.contexto_historico, ""),
              bibliografia:          coalesce(p.bibliografia, ""),
              iconografia:           coalesce(p.iconografia, ""),
              notas_investigacion:   coalesce(p.notas_investigacion, ""),
              tecnica:               [],
              materiales:            [],
              estado_conservacion:   coalesce(p.estado_conservacion, ""),
              descripcion_conservacion: coalesce(p.descripcion_conservacion, null),
              responsable_conservacion: coalesce(p.responsable_conservacion, ""),
              fecha_actualizacion_conservacion: toString(p.fecha_actualizacion_conservacion),
              comentarios_conservacion: coalesce(p.comentarios_conservacion, null),
              exposiciones:          [],
              avaluo:                coalesce(p.avaluo, null),
              procedencia:           coalesce(p.procedencia, null),
              donante:               coalesce(p.donante, null),
              fecha_ingreso:         toString(p.fecha_ingreso),
              responsable_coleccion: coalesce(p.responsable_coleccion, null),
              fecha_ultima_modificacion: toString(p.fecha_ultima_modificacion),
              componentes:           [],
              imagenes:              []
            } AS pieza
            ORDER BY toInteger(p.numero_inventario)
            SKIP $skip LIMIT $limit
            """
            result = session.run(cypher, skip=skip, limit=limit)
            piezas_page = [r["pieza"] for r in result]

        # 4) armo next/prev
        base = request.build_absolute_uri(request.path)
        total_pages = (total + page_size - 1) // page_size

        def page_url(n):
            return f"{base}?page={n}"

        next_url = page_url(page_number + 1) if page_number < total_pages else None
        prev_url = page_url(page_number - 1) if page_number > 1 else None

        return Response({
            "count":    total,
            "next":     next_url,
            "previous": prev_url,
            "results":  piezas_page
        })

    def retrieve(self, request, pk=None):
        with driver.session() as session:
            cypher = """
            MATCH (p:Pieza { numero_inventario: $id })
            OPTIONAL MATCH (p)-[:PROCEDENTE_DE]->(pa:Pais)
            RETURN {
              id:                    toInteger(p.numero_inventario),
              numero_inventario:     p.numero_inventario,
              numero_registro_anterior: p.numero_registro_anterior,
              codigo_surdoc:         p.codigo_surdoc,
              ubicacion:             p.ubicacion,
              deposito:              p.deposito,
              estante:               p.estante,
              caja_actual:           p.caja_actual,
              tipologia:             p.tipologia,
              coleccion:             p.coleccion,
              clasificacion:         p.clasificacion,
              conjunto:              p.conjunto,
              nombre_comun:          p.nombre_comun,
              nombre_especifico:     p.nombre_especifico,
              autor:                 coalesce(p.autor, null),
              filiacion_cultural:    coalesce(p.filiacion_cultural, null),
              pais:                  pa.nombre,
              localidad:             coalesce(p.localidad, null),
              fecha_creacion:        coalesce(p.fecha_creacion, null),
              descripcion_col:       p.descripcion,
              marcas_inscripciones:  coalesce(p.marcas_inscripciones, ""),
              contexto_historico:    coalesce(p.contexto_historico, ""),
              bibliografia:          coalesce(p.bibliografia, ""),
              iconografia:           coalesce(p.iconografia, ""),
              notas_investigacion:   coalesce(p.notas_investigacion, ""),
              tecnica:               [],
              materiales:            [],
              estado_conservacion:   coalesce(p.estado_conservacion, ""),
              descripcion_conservacion: coalesce(p.descripcion_conservacion, null),
              responsable_conservacion: coalesce(p.responsable_conservacion, ""),
              fecha_actualizacion_conservacion: toString(p.fecha_actualizacion_conservacion),
              comentarios_conservacion: coalesce(p.comentarios_conservacion, null),
              exposiciones:          [],
              avaluo:                coalesce(p.avaluo, null),
              procedencia:           coalesce(p.procedencia, null),
              donante:               coalesce(p.donante, null),
              fecha_ingreso:         toString(p.fecha_ingreso),
              responsable_coleccion: coalesce(p.responsable_coleccion, null),
              fecha_ultima_modificacion: toString(p.fecha_ultima_modificacion),
              componentes:           [],
              imagenes:              []
            } AS pieza
            """
            rec = session.run(cypher, id=pk).single()
            if not rec:
                return Response(status=status.HTTP_404_NOT_FOUND)
            return Response(rec["pieza"])

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
