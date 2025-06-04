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
        # ───────────────────────────────────────────────────────────
        # 1) Determinar carpeta raíz del proyecto (donde están backend/, frontend/, imágenes/, Excel…)
        BASE = Path(__file__).resolve().parents[3]

        # 2) Rutas por defecto si no vienen args
        excel_path = Path(options.get('excel')) if options.get('excel') \
            else BASE / '2025 Inventario Colecciones MAPA-PCMAPA.xlsx'
        images_dir = Path(options.get('images_dir')) if options.get('images_dir') \
            else BASE / 'imagenes'

        # 3) Validaciones
        if not excel_path.exists():
            self.stdout.write(self.style.ERROR(f"❌ Excel no encontrado: {excel_path}"))
            return
        if not images_dir.is_dir():
            self.stdout.write(self.style.ERROR(f"❌ Carpeta de imágenes no existe: {images_dir}"))
            return

        # 4) Leer Excel (suponemos cabecera en fila 1) y remplazar NaN por ""
        df = pd.read_excel(excel_path, header=1)
        df.fillna("", inplace=True)  # ⚠ FutureWarning: mezcla texto en columnas float

        # 5) Caches para get_or_create
        pais_cache      = {}
        localidad_cache = {}
        cultura_cache   = {}
        coleccion_cache = {}
        autor_cache     = {}
        expos_cache     = {}
        material_cache  = {}
        tecnica_cache   = {}

        def get_or_create(model, cache, nombre, **extra):
            """
            Si 'nombre' no está vacío, busca en cache o hace get_or_create(model, nombre).
            Devuelve instancia o None si nombre vacío.
            """
            if not nombre:
                return None
            clave = str(nombre).strip()
            if not clave:
                return None
            if clave in cache:
                return cache[clave]
            obj, _ = model.objects.get_or_create(nombre=clave, defaults=extra)
            cache[clave] = obj
            return obj

        piezas_creadas = {}

        # ───────────────────────────────────────────────────────────
        # 6) Recorrer filas del DataFrame para crear Pieza y Componente
        for _, row in df.iterrows():
            num = str(row.get('numero_de_inventario', '')).strip()
            if not num or num.lower() == 'nan':
                continue  # si no hay número válido, saltar

            letra = str(row.get('letra', '')).strip()
            pieza = piezas_creadas.get(num)

            # 6.1) Preparar Pais y Localidad
            pais_nombre = str(row.get('pais', '')).strip()
            pais_obj = get_or_create(Pais, pais_cache, pais_nombre) if pais_nombre else None

            localidad_nombre = str(row.get('localidad', '')).strip()
            if localidad_nombre and pais_obj:
                localidad_obj = get_or_create(
                    Localidad,
                    localidad_cache,
                    localidad_nombre,
                    pais=pais_obj
                )
            else:
                localidad_obj = None

            # 6.2) Crear o recuperar Pieza (por numero_inventario)
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
                        'pais': pais_obj,
                        'localidad': localidad_obj,
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

            # 6.3) Si existe 'letra', buscar o crear Componente 
            if letra:
                # 6.3.1) Intentamos primero ver si ya existe alguno con (pieza, letra)
                qs = Componente.objects.filter(pieza=pieza, letra=letra)
                if qs.exists():
                    comp = qs.first()
                else:
                    comp = Componente.objects.create(
                        pieza=pieza,
                        letra=letra,
                        nombre_comun=row.get('nombre_comun', '') or pieza.tipologia or '',
                        nombre_atribuido=row.get('nombre_especifico', '') or None,
                        descripcion=row.get('descripcion_col', '') or None,
                        funcion=row.get('funcion', '') or None,
                        forma=row.get('forma', '') or None,
                    )
                    # 6.3.2) Asociar M2M: materiales y técnicas
                    for mat in str(row.get('materialidad', '')).split(';'):
                        if mat.strip():
                            comp.materiales.add(get_or_create(Material, material_cache, mat))
                    for tec in str(row.get('tecnica', '')).split(';'):
                        if tec.strip():
                            comp.tecnica.add(get_or_create(Tecnica, tecnica_cache, tec))
                    # 6.3.3) Dimensiones y peso (try/except para valores vacíos)
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

        # ───────────────────────────────────────────────────────────
        # 7) Asociar imágenes a las piezas/componentes sin duplicar archivos
        procesadas = 0
        for fn in os.listdir(images_dir):
            if not os.path.isfile(images_dir / fn):
                continue

            name, ext = os.path.splitext(fn)
            ext = ext.lower().strip('.')
            if ext not in ('jpg', 'jpeg', 'png', 'tif', 'tiff'):
                continue

            partes = name.split('.')
            base = partes[0]
            m = re.match(r'^0*(\d+)([A-Za-z]?)(?:.*)$', base)
            if not m:
                continue

            num_str = m.group(1)
            letra   = m.group(2) or ''

            try:
                pieza = Pieza.objects.get(numero_inventario=num_str)
            except Pieza.DoesNotExist:
                continue

            comp = None
            if letra:
                comp = Componente.objects.filter(pieza=pieza, letra=letra).first()

            img = Imagen(pieza=pieza, componente=comp)
            # — en vez de hacer img.imagen.save(), solo asignamos el nombre:
            img.imagen.name = fn
            img.save()
            procesadas += 1

        self.stdout.write(self.style.SUCCESS(
            f"✅ Import finalizado: {len(piezas_creadas)} piezas y {procesadas} imágenes procesadas."
        ))
