# backend/api/neo4j.py

import time
from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def get_driver(max_retries=5, delay=2):
    uri      = settings.NEO4J_URI
    user     = settings.NEO4J_USER
    password = settings.NEO4J_PASSWORD

    for attempt in range(1, max_retries+1):
        try:
            driver = GraphDatabase.driver(uri, auth=(user, password))
            driver.verify_connectivity()
            logger.info(f"✅ Conectado a Neo4j ({uri}) en el intento {attempt}")
            return driver
        except ServiceUnavailable as e:
            logger.warning(f"❌ Intento {attempt} fallido: Neo4j aún no responde, reintentando en {delay}s…")
            time.sleep(delay)
    logger.error(f"🙅 No he logrado conectar a Neo4j después de {max_retries} intentos.")
    raise
