# backend/api/views.py

import math
from urllib.parse import urlencode
from rest_framework import viewsets, pagination
from rest_framework.decorators import action
from rest_framework.response import Response
from .neo4j import get_driver

def _clean_nan(obj):
    """
    Reemplaza float('nan') por None, recursivamente en dicts y listas.
    """
    if isinstance(obj, float) and math.isnan(obj):
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

    def list(self, request):
        """
        GET /api/piezas/
        """
        page = int(request.query_params.get("page", 1))
        PAGE_SIZE = 10
        skip = (page - 1) * PAGE_SIZE

        # Consulta Cypher: asegúrate de traer todos los campos relevantes
        query = """
        MATCH (p:Pieza)
        OPTIONAL MATCH (p)-[:TIENE_IMAGEN]->(img:Imagen)
        OPTIONAL MATCH (p)-[:TIENE_COMPONENTE]->(c:Componente)
        WITH p,
            collect(DISTINCT coalesce(img.url, '')) AS imagenes,
            collect(DISTINCT c{.*}) AS componentes
        RETURN
            id(p) AS id,
            p.numero_inventario AS numero_inventario,
            p.numero_registro_anterior AS numero_registro_anterior,
            p.codigo_surdoc AS codigo_surdoc,
            p.ubicacion AS ubicacion,
            p.deposito AS deposito,
            p.estante AS estante,
            p.caja_actual AS caja_actual,
            p.tipologia AS tipologia,
            p.coleccion AS coleccion,
            p.clasificacion AS clasificacion,
            p.conjunto AS conjunto,
            p.nombre_comun AS nombre_comun,
            p.nombre_especifico AS nombre_especifico,
            p.autor AS autor,
            p.filiacion_cultural AS filiacion_cultural,
            p.pais AS pais,
            p.localidad AS localidad,
            p.fecha_creacion AS fecha_creacion,
            p.descripcion AS descripcion_col,
            p.marcas_inscripciones AS marcas_inscripciones,
            p.contexto_historico AS contexto_historico,
            p.bibliografia AS bibliografia,
            p.iconografia AS iconografia,
            p.notas_investigacion AS notas_investigacion,
            p.tecnica AS tecnica,
            p.materiales AS materiales,
            p.estado_conservacion AS estado_conservacion,
            p.descripcion_conservacion AS descripcion_conservacion,
            p.responsable_conservacion AS responsable_conservacion,
            p.fecha_actualizacion_conservacion AS fecha_actualizacion_conservacion,
            p.comentarios_conservacion AS comentarios_conservacion,
            p.exposiciones AS exposiciones,
            p.avaluo AS avaluo,
            p.procedencia AS procedencia,
            p.donante AS donante,
            p.fecha_ingreso AS fecha_ingreso,
            p.responsable_coleccion AS responsable_coleccion,
            p.fecha_ultima_modificacion AS fecha_ultima_modificacion,
            componentes,
            imagenes
        ORDER BY p.numero_inventario
        SKIP $skip
        LIMIT $limit
        """

        count_query = """
        MATCH (p:Pieza)
        RETURN count(p) AS total
        """

        driver = get_driver()
        with driver.session() as session:
            result = session.run(query, skip=skip, limit=PAGE_SIZE)
            piezas = []
            for record in result:
                pieza = {k: record.get(k, None) for k in [
                    "id", "numero_inventario", "numero_registro_anterior", "codigo_surdoc",
                    "ubicacion", "deposito", "estante", "caja_actual", "tipologia", "coleccion",
                    "clasificacion", "conjunto", "nombre_comun", "nombre_especifico", "autor",
                    "filiacion_cultural", "pais", "localidad", "fecha_creacion", "descripcion_col",
                    "marcas_inscripciones", "contexto_historico", "bibliografia", "iconografia",
                    "notas_investigacion", "tecnica", "materiales", "estado_conservacion",
                    "descripcion_conservacion", "responsable_conservacion", "fecha_actualizacion_conservacion",
                    "comentarios_conservacion", "exposiciones", "avaluo", "procedencia", "donante",
                    "fecha_ingreso", "responsable_coleccion", "fecha_ultima_modificacion", "componentes", "imagenes"
                ]}
                # Normaliza listas/campos vacíos
                for key in ["tecnica", "materiales", "exposiciones", "componentes", "imagenes"]:
                    if pieza[key] is None:
                        pieza[key] = []
                piezas.append(pieza)
            total = session.run(count_query).single()["total"]

        base_url = request.build_absolute_uri(request.path)
        def page_url(p):
            if p < 1 or p > (total + PAGE_SIZE - 1) // PAGE_SIZE:
                return None
            return f"{base_url}?{urlencode({'page': p})}"

        next_url = page_url(page + 1) if skip + PAGE_SIZE < total else None
        prev_url = page_url(page - 1) if page > 1 else None

        return Response(_clean_nan({
            "count": total,
            "next": next_url,
            "previous": prev_url,
            "results": piezas,
        }))

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
