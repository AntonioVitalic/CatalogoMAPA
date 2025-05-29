# backend/api/management/commands/import_mapa.py

import os
import re
import pandas as pd
from pathlib import Path
from django.core.files import File
from django.core.management.base import BaseCommand
from api.models import (
    Pieza, Componente, Imagen,
    Pais, Localidad, Cultura,
    Coleccion, Autor, Exposicion,
    Material, Tecnica
)

class Command(BaseCommand):
    help = "Importa datos de piezas y componentes desde Excel y asocia imágenes locales"

    def add_arguments(self, parser):
        parser.add_argument(
            '--excel', type=str,
            help='Ruta al archivo Excel de inventario'
        )
        parser.add_argument(
            '--images_dir', type=str,
            help='Directorio donde se encuentran las imágenes'
        )

    def handle(self, *args, **options):
        # Calcular base del proyecto (carpeta que contiene 'backend/', 'frontend/', 'imagenes/', ...)
        BASE = Path(__file__).resolve().parents[3]

        # Rutas por defecto si no pasas argumentos
        excel_path = Path(options.get('excel')) if options.get('excel') \
            else BASE / '2025 Inventario Colecciones MAPA-PCMAPA.xlsx'
        images_dir = Path(options.get('images_dir')) if options.get('images_dir') \
            else BASE / 'imagenes'

        # Validaciones
        if not excel_path.exists():
            self.stdout.write(self.style.ERROR(f"❌ Excel no encontrado: {excel_path}"))
            return
        if not images_dir.is_dir():
            self.stdout.write(self.style.ERROR(f"❌ Carpeta de imágenes no existe: {images_dir}"))
            return

        # Carga el Excel (suponemos que la cabecera está en la fila 1)
        df = pd.read_excel(excel_path, header=1)
        df.fillna("", inplace=True)  # NaNs ➔ ""

        # Caches para entidades auxiliares
        pais_cache = {}
        localidad_cache = {}
        cultura_cache = {}
        coleccion_cache = {}
        autor_cache = {}
        expos_cache = {}
        material_cache = {}
        tecnica_cache = {}

        def get_or_create(model, cache, nombre, **extra):
            if not nombre:
                return None
            clave = str(nombre).strip()
            if clave in cache:
                return cache[clave]
            obj, _ = model.objects.get_or_create(nombre=clave, defaults=extra)
            cache[clave] = obj
            return obj

        piezas_creadas = {}

        for _, row in df.iterrows():
            num = str(row.get('numero_de_inventario', '')).strip()
            if not num or num.lower() == 'nan':
                continue

            letra = str(row.get('letra', '')).strip()
            pieza = piezas_creadas.get(num)
            if pieza is None:
                pieza, created = Pieza.objects.get_or_create(
                    numero_inventario=num,
                    defaults={
                        'numero_registro_anterior': str(row.get('numero_de registro_anterior', '')).strip() or None,
                        'codigo_surdoc': str(row.get('SURDOC', '')).strip() or None,
                        'ubicacion': row.get('ubicacion', '') or None,
                        'deposito': row.get('deposito', '') or None,
                        'estante': row.get('estante', '') or None,
                        'caja_actual': row.get('caja_actual', '') or None,
                        'tipologia': row.get('tipologia', '') or None,
                        'coleccion': get_or_create(Coleccion, coleccion_cache, row.get('coleccion', '')) or Coleccion.objects.first(),
                        'clasificacion': row.get('clasificacion', '') or None,
                        'conjunto': row.get('conjunto', '') or None,
                        'nombre_especifico': row.get('nombre_especifico', '') or None,
                        'autor': get_or_create(Autor, autor_cache, row.get('autor', '')),
                        'filiacion_cultural': get_or_create(Cultura, cultura_cache, row.get('filiacion_cultural', '')),
                        'pais': get_or_create(Pais, pais_cache, row.get('pais', '')),
                        'localidad': get_or_create(Localidad, localidad_cache, row.get('localidad', ''), pais=None),
                        'fecha_creacion': row.get('fecha_de_creacion', '') or None,
                        'descripcion': row.get('descripcion_col', '') or None,
                        'marcas_inscripciones': row.get('marcas_o_inscripciones', '') or None,
                        'contexto_historico': row.get('contexto_historico', '') or None,
                        'bibliografia': row.get('bibliografia', '') or None,
                        'iconografia': row.get('iconografia', '') or None,
                        'notas_investigacion': row.get('notas_investigacion', '') or None,
                        'estado_conservacion': row.get('estado_genral_de_conservacion', '') or None,
                        'descripcion_conservacion': row.get('descripcion_cr', '') or None,
                        'responsable_conservacion': row.get('responsable_conservacion', '') or None,
                        'fecha_actualizacion_conservacion': row.get('fecha_actualizacion_cr', '') or None,
                        'comentarios_conservacion': row.get('comentarios_cr', '') or None,
                        'avaluo': row.get('avaluo', '') or None,
                        'procedencia': row.get('procedencia', '') or None,
                        'donante': row.get('donante', '') or None,
                        'fecha_ingreso': row.get('fecha_ingreso', '') or None,
                        'responsable_coleccion': row.get('responsable_coleccion', '') or None,
                        'fecha_ultima_modificacion': row.get('fecha_ultima_modificacion', '') or None,
                    }
                )
            piezas_creadas[num] = pieza

            # Cada fila con “letra” → componente
            if letra:
                comp = Componente.objects.create(
                    pieza=pieza,
                    letra=letra,
                    nombre_comun=row.get('nombre_comun', '') or pieza.tipologia or '',
                    nombre_atribuido=row.get('nombre_especifico', '') or None,
                    descripcion=row.get('descripcion_col', '') or None,
                    funcion=row.get('funcion', '') or None,
                    forma=row.get('forma', '') or None,
                )
                # M2M materiales/técnicas
                for mat in str(row.get('materialidad', '')).split(';'):
                    if mat.strip():
                        comp.materiales.add(get_or_create(Material, material_cache, mat))
                for tec in str(row.get('tecnica', '')).split(';'):
                    if tec.strip():
                        comp.tecnica.add(get_or_create(Tecnica, tecnica_cache, tec))
                # dimensiones/peso
                try:
                    comp.peso_kg = float(row.get('peso_(gr)', 0)) / 1000
                except:
                    pass
                for csv_col, attr in [
                    ("alto_o_largo_(cm)", "alto_cm"),
                    ("ancho_(cm)", "ancho_cm"),
                    ("profundidad_(cm)", "profundidad_cm"),
                    ("diametro_(cm)", "diametro_cm"),
                    ("espesor_(mm)", "espesor_mm"),
                ]:
                    val = row.get(csv_col, '')
                    try:
                        setattr(comp, attr, float(val))
                    except:
                        pass
                comp.save()

        # Ahora asociar imágenes a piezas/componentes
        image_files = [f for f in os.listdir(images_dir) if os.path.isfile(images_dir / f)]
        patrón = re.compile(r'^(\d+)([A-Za-z])?\.(jpg|png|jpeg|tif|tiff)$', re.IGNORECASE)
        procesadas = 0
        for fn in image_files:
            m = patrón.match(fn)
            if not m:
                continue
            num_str, letra, _ = m.groups()
            num_str = num_str.lstrip('0') or "0"
            filepath = images_dir / fn
            try:
                pieza = Pieza.objects.get(numero_inventario=num_str)
            except Pieza.DoesNotExist:
                continue
            if letra:
                try:
                    comp = Componente.objects.get(pieza=pieza, letra=letra)
                except Componente.DoesNotExist:
                    comp = None
                img = Imagen(pieza=None, componente=comp)
            else:
                img = Imagen(pieza=pieza, componente=None)
            with open(filepath, 'rb') as f:
                img.imagen.save(fn, File(f), save=True)
            procesadas += 1

        self.stdout.write(self.style.SUCCESS(
            f"✅ Import finalizado: {len(piezas_creadas)} piezas y {procesadas} imágenes procesadas."
        ))
