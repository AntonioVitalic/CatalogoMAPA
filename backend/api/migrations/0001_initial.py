# Generated by Django 5.2.1 on 2025-05-28 03:57

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Autor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=200, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Coleccion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=200, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Cultura',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Exposicion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titulo', models.CharField(max_length=200, unique=True)),
                ('fecha_inicio', models.DateField(blank=True, null=True)),
                ('fecha_fin', models.DateField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Material',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Pais',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Tecnica',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Componente',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('letra', models.CharField(blank=True, max_length=10, null=True)),
                ('nombre_comun', models.CharField(max_length=200)),
                ('nombre_atribuido', models.CharField(blank=True, max_length=200, null=True)),
                ('descripcion', models.TextField(blank=True, null=True)),
                ('funcion', models.CharField(blank=True, max_length=200, null=True)),
                ('forma', models.CharField(blank=True, max_length=100, null=True)),
                ('marcas_inscripciones', models.TextField(blank=True, null=True)),
                ('peso_kg', models.FloatField(blank=True, null=True)),
                ('alto_cm', models.FloatField(blank=True, null=True)),
                ('ancho_cm', models.FloatField(blank=True, null=True)),
                ('profundidad_cm', models.FloatField(blank=True, null=True)),
                ('diametro_cm', models.FloatField(blank=True, null=True)),
                ('espesor_mm', models.FloatField(blank=True, null=True)),
                ('estado_conservacion', models.CharField(blank=True, max_length=50, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='componentes_creados', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='componentes_editados', to=settings.AUTH_USER_MODEL)),
                ('materiales', models.ManyToManyField(blank=True, related_name='componentes', to='api.material')),
            ],
        ),
        migrations.CreateModel(
            name='Localidad',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=100)),
                ('pais', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='localidades', to='api.pais')),
            ],
        ),
        migrations.CreateModel(
            name='Pieza',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('numero_inventario', models.CharField(max_length=50, unique=True)),
                ('numero_registro_anterior', models.CharField(blank=True, max_length=100, null=True)),
                ('codigo_surdoc', models.CharField(blank=True, max_length=100, null=True)),
                ('ubicacion', models.CharField(blank=True, max_length=200, null=True)),
                ('deposito', models.CharField(blank=True, max_length=100, null=True)),
                ('estante', models.CharField(blank=True, max_length=100, null=True)),
                ('caja_actual', models.CharField(blank=True, max_length=100, null=True)),
                ('tipologia', models.CharField(blank=True, max_length=100, null=True)),
                ('clasificacion', models.CharField(blank=True, max_length=100, null=True)),
                ('conjunto', models.CharField(blank=True, max_length=200, null=True)),
                ('nombre_especifico', models.CharField(blank=True, max_length=200, null=True)),
                ('fecha_creacion', models.CharField(blank=True, max_length=100, null=True)),
                ('descripcion', models.TextField(blank=True, null=True)),
                ('marcas_inscripciones', models.TextField(blank=True, null=True)),
                ('contexto_historico', models.TextField(blank=True, null=True)),
                ('bibliografia', models.TextField(blank=True, null=True)),
                ('iconografia', models.TextField(blank=True, null=True)),
                ('notas_investigacion', models.TextField(blank=True, null=True)),
                ('avaluo', models.CharField(blank=True, max_length=100, null=True)),
                ('procedencia', models.CharField(blank=True, max_length=200, null=True)),
                ('donante', models.CharField(blank=True, max_length=200, null=True)),
                ('fecha_ingreso', models.CharField(blank=True, max_length=100, null=True)),
                ('estado_conservacion', models.CharField(blank=True, max_length=50, null=True)),
                ('descripcion_conservacion', models.TextField(blank=True, null=True)),
                ('responsable_conservacion', models.CharField(blank=True, max_length=100, null=True)),
                ('fecha_actualizacion_conservacion', models.CharField(blank=True, max_length=100, null=True)),
                ('comentarios_conservacion', models.TextField(blank=True, null=True)),
                ('responsable_coleccion', models.CharField(blank=True, max_length=100, null=True)),
                ('fecha_ultima_modificacion', models.CharField(blank=True, max_length=100, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('autor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='piezas', to='api.autor')),
                ('coleccion', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='piezas', to='api.coleccion')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='piezas_creadas', to=settings.AUTH_USER_MODEL)),
                ('exposiciones', models.ManyToManyField(blank=True, related_name='piezas', to='api.exposicion')),
                ('filiacion_cultural', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='piezas', to='api.cultura')),
                ('localidad', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='piezas', to='api.localidad')),
                ('materiales', models.ManyToManyField(blank=True, related_name='piezas', to='api.material')),
                ('pais', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='piezas', to='api.pais')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='piezas_editadas', to=settings.AUTH_USER_MODEL)),
                ('tecnica', models.ManyToManyField(blank=True, related_name='piezas', to='api.tecnica')),
            ],
        ),
        migrations.CreateModel(
            name='Imagen',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('imagen', models.ImageField(upload_to='imagenes')),
                ('descripcion', models.CharField(blank=True, max_length=255, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('componente', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='imagenes', to='api.componente')),
                ('pieza', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='imagenes', to='api.pieza')),
            ],
        ),
        migrations.AddField(
            model_name='componente',
            name='pieza',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='componentes', to='api.pieza'),
        ),
        migrations.AddField(
            model_name='componente',
            name='tecnica',
            field=models.ManyToManyField(blank=True, related_name='componentes', to='api.tecnica'),
        ),
    ]
