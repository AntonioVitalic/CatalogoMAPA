# backend/api/views.py

import math
from rest_framework import viewsets
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
        # Nota: reemplazamos 'img.url' por coalesce(img.url, '') para
        # que Neo4j no devuelva nulls que acaben como float('nan')
        query = """
        MATCH (p:Pieza)
        OPTIONAL MATCH (p)-[:TIENE_IMAGEN]->(img:Imagen)
        OPTIONAL MATCH (p)-[:TIENE_COMPONENTE]->(c:Componente)
        WITH p,
             collect(DISTINCT coalesce(img.url, '')) AS imagenes,
             collect(DISTINCT c{.*})                     AS componentes
        RETURN apoc.map.clean(
                 p {.*,
                    imagenes: imagenes,
                    componentes: componentes
                   },
                 [''],   // elimina propiedades con valor vacío
                 []
               ) AS pieza
        ORDER BY p.numero_inventario
        """

        driver = get_driver()
        with driver.session() as session:
            result = session.run(query)
            piezas = [_clean_nan(record["pieza"]) for record in result]

        return Response(piezas)

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
