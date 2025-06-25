# backend/api/views.py

import math
from urllib.parse import urlencode
from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.response import Response
from .neo4j import get_driver

def _clean_nan(obj):
    if isinstance(obj, float) and math.isnan(obj):
        return None
    if isinstance(obj, str) and obj.lower() == 'nan':
        return None
    if isinstance(obj, dict):
        return {k: _clean_nan(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_clean_nan(v) for v in obj]
    return obj


class PiezaViewSet(viewsets.ViewSet):
    """
    ViewSet que expone todas las piezas almacenadas en Neo4j.
    Sólo implementa el método list (GET /api/piezas/) y un endpoint de diagnóstico /labels/.
    """
    pagination_class = PageNumberPagination
    PAGE_SIZE = 10

    def list(self, request):
        """
        GET /api/piezas/
        """
        page = int(request.query_params.get("page", 1))
        skip = (page - 1) * self.PAGE_SIZE

        query = """
        MATCH (p:Pieza)
        OPTIONAL MATCH (p)-[:PERTENECE_A]->(col:Coleccion)
        OPTIONAL MATCH (p)-[:FUE_CREADA_POR]->(aut:Autor)
        OPTIONAL MATCH (p)-[:PROCEDENTE_DE]->(pa:Pais)
        OPTIONAL MATCH (p)-[:UBICADO_EN]->(loc:Localidad)
        OPTIONAL MATCH (p)-[:TIENE_FILIACION]->(cul:Cultura)
        OPTIONAL MATCH (p)-[:EN_EXPOSICION]->(exp:Exposicion)
        OPTIONAL MATCH (p)-[:HECHO_DE]->(ma:Material)
        OPTIONAL MATCH (p)-[:USO_TECNICA]->(tec:Tecnica)
        OPTIONAL MATCH (p)-[:ES_IMAGEN_DE]->(img:Imagen)
        OPTIONAL MATCH (p)-[:TIENE_COMPONENTE]->(c:Componente)
        WITH p,
             head(collect(DISTINCT col.nombre))        AS coleccion,
             head(collect(DISTINCT aut.nombre))        AS autor,
             head(collect(DISTINCT pa.nombre))         AS pais,
             head(collect(DISTINCT loc.nombre))        AS localidad,
             head(collect(DISTINCT cul.nombre))        AS filiacion_cultural,
             collect(DISTINCT exp.titulo)              AS exposiciones,
             collect(DISTINCT ma.nombre)               AS materiales,
             collect(DISTINCT tec.nombre)              AS tecnica,
             collect(DISTINCT coalesce(img.ruta, ''))  AS imagenes,
             collect(DISTINCT c{.*})                   AS componentes
        RETURN
          p.row_id   AS id,
          p.numero_inventario             AS numero_inventario,
          p.numero_registro_anterior      AS numero_registro_anterior,
          p.codigo_surdoc                 AS codigo_surdoc,
          p.ubicacion                     AS ubicacion,
          p.deposito                      AS deposito,
          p.estante                       AS estante,
          p.caja_actual                   AS caja_actual,
          p.tipologia                     AS tipologia,
          coleccion,
          p.clasificacion                 AS clasificacion,
          p.conjunto                      AS conjunto,
          p.nombre_comun                  AS nombre_comun,
          p.nombre_especifico             AS nombre_especifico,
          autor,
          filiacion_cultural,
          pais,
          localidad,
          p.fecha_creacion                AS fecha_creacion,
          p.descripcion                   AS descripcion_col,
          p.marcas_inscripciones          AS marcas_inscripciones,
          p.contexto_historico            AS contexto_historico,
          p.bibliografia                  AS bibliografia,
          p.iconografia                   AS iconografia,
          p.notas_investigacion           AS notas_investigacion,
          tecnica,
          materiales,
          p.estado_conservacion           AS estado_conservacion,
          p.descripcion_conservacion      AS descripcion_conservacion,
          p.responsable_conservacion      AS responsable_conservacion,
          p.fecha_actualizacion_conservacion AS fecha_actualizacion_conservacion,
          p.comentarios_conservacion      AS comentarios_conservacion,
          exposiciones,
          p.avaluo                        AS avaluo,
          p.procedencia                   AS procedencia,
          p.donante                       AS donante,
          p.fecha_ingreso                 AS fecha_ingreso,
          p.responsable_coleccion         AS responsable_coleccion,
          p.fecha_ultima_modificacion     AS fecha_ultima_modificacion,
          componentes,
          imagenes
        ORDER BY p.row_id
        SKIP $skip
        LIMIT $limit
        """

        count_query = "MATCH (p:Pieza) RETURN count(p) AS total"

        driver = get_driver()
        with driver.session() as session:
            # 1) Ejecutar query de piezas
            result = session.run(query, skip=skip, limit=self.PAGE_SIZE)
            piezas = [ dict(record) for record in result ]

            # 2) Obtener total de piezas
            total = session.run(count_query).single()["total"]

            # 3) Limpiar NaNs e "nan" strings
            piezas = [ _clean_nan(p) for p in piezas ]
            for pieza in piezas:
                for k, v in pieza.items():
                    if isinstance(v, str) and v.lower() == 'nan':
                        pieza[k] = None

            # 4) Construir URLs de next/previous
            base = request.build_absolute_uri(request.path)
            def page_url(n):
                params = request.query_params.copy()
                params['page'] = n
                return f"{base}?{params.urlencode()}"

            next_url = page_url(page+1) if skip + self.PAGE_SIZE < total else None
            prev_url = page_url(page-1) if page > 1 else None

        # 5) Devolver la Response fuera del with
        return Response({
            "count": total,
            "next": next_url,
            "previous": prev_url,
            "results": piezas
        })

    @action(detail=False)
    def labels(self, request):
        """
        GET /api/piezas/labels/
        Endpoint de diagnóstico: devuelve las 10 etiquetas (labels) más comunes.
        """
        query = """
        CALL db.labels() YIELD label
        CALL {
          WITH label
          CALL apoc.cypher.run(
            'MATCH (n:' + label + ') RETURN count(n) AS count',
            {}
          ) YIELD value
          RETURN value.count AS count
        }
        RETURN label, count
        ORDER BY count DESC
        LIMIT 10
        """
        driver = get_driver()
        with driver.session() as session:
            result = session.run(query)
            labels = [
                {"label": record["label"], "count": record["count"]}
                for record in result
            ]
        return Response(labels)
