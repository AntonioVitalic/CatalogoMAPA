"""
Crea indices y constraints UNIQUE en Neo4j para el schema neomodel.
Idempotente: si ya existen, no hace nada.

Uso:
    python manage.py install_neo4j_labels
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Crea indices y CONSTRAINT UNIQUE en Neo4j para el schema neomodel."

    def handle(self, *args, **options):
        # Importar después de que Django cargó settings (que ya configuró
        # neomodel con la URL bolt + credenciales).
        from neomodel import install_all_labels

        self.stdout.write("Instalando labels y constraints en Neo4j...")
        try:
            install_all_labels()
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f"Falló: {exc}"))
            raise
        self.stdout.write(self.style.SUCCESS("Labels y constraints OK."))
