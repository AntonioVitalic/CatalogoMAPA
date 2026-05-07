"""
Crea un superusuario admin si no existe.
Lee credenciales desde variables de entorno ADMIN_EMAIL y ADMIN_PASSWORD.
Se ejecuta en cada deploy de Railway para compensar la pérdida de SQLite.
"""
import os
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Crea el superusuario admin si no existe (usa ADMIN_EMAIL y ADMIN_PASSWORD)"

    def handle(self, *args, **options):
        from accounts.models import Usuario

        email = os.environ.get("ADMIN_EMAIL", "admin@mapa.cl")
        password = os.environ.get("ADMIN_PASSWORD", "")

        if not password:
            self.stdout.write(self.style.WARNING(
                "ADMIN_PASSWORD no configurado — omitiendo creación de admin."
            ))
            return

        user, created = Usuario.objects.get_or_create(
            email=email,
            defaults={
                "first_name": "Admin",
                "last_name": "MAPA",
                "role": "admin",
                "is_active": True,
                "is_staff": True,
                "is_superuser": True,
            },
        )

        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Admin creado: {email}"))
        else:
            self.stdout.write(f"Admin ya existe: {email}")
