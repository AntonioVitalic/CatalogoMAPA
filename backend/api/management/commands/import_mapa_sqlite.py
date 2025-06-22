# backend/api/management/commands/import_mapa.py

import os
import re
import time
import pandas as pd
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import connection
from django.core.management.color import no_style
from api.models import (
    Pieza, Componente, Imagen,
    Pais, Localidad, Cultura,
    Coleccion, Autor, Exposicion,
    Material, Tecnica
)

class Command(BaseCommand):
    help = "Importa desde cero las piezas y componentes desde el Excel y asocia imágenes locales, reiniciando secuencias"

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
        # ─── Determinar rutas ──────────────────────────────────────────
         # ─── Iniciar cronómetro ───────────────────────────────────────
        start_time = time.monotonic()
        BASE = Path(__file__).resolve().parents[3]
        excel_path = Path(options.get('excel')) if options.get('excel') \
            else BASE / '2025 Inventario Colecciones MAPA-PCMAPA.xlsx'
        images_dir = Path(options.get('images_dir')) if options.get('images_dir') \
            else BASE / 'imagenes'

        if not excel_path.exists():
            self.stdout.write(self.style.ERROR(f"❌ Excel no encontrado: {excel_path}"))
            return
        if not images_dir.is_dir():
            self.stdout.write(self.style.ERROR(f"❌ Carpeta de imágenes no existe: {images_dir}"))
            return

        # ─── 1) Borrar datos anteriores ───────────────────────────────
        Imagen.objects.all().delete()
        Componente.objects.all().delete()
        Pieza.objects.all().delete()

        # ─── 2) Reiniciar secuencias de PK (PostgreSQL, etc.) ────────
        with connection.cursor() as cursor:
            seq_sql = connection.ops.sequence_reset_sql(
                no_style(),
                [Pieza, Componente, Imagen]
            )
            for sql in seq_sql:
                cursor.execute(sql)

        # ─── 3) Leer y limpiar Excel ─────────────────────────────────
        df = pd.read_excel(excel_path, header=1)
        # print("=== Tipos antes de fillna ===")
        # print(df.dtypes)
        # print(df.info())
        # df.fillna("", inplace=True)
        # 3.1) Eliminar las dos columnas vacías que sobran, la que está entre "tipologia" y "coleccion", y la que se llama 'Unnamed: 46' (entre "fecha_ingreso" y "responsable_coleccion").
        #    - columna sin nombre (índice 10 en el df.dtypes)
        #    - 'Unnamed: 46' (índice 46)
        to_drop = [df.columns[10], 'Unnamed: 46']
        df.drop(columns=to_drop, inplace=True, errors='ignore')

        # 3.2) Rellenar NaN solo en función del tipo de dato
        num_cols = df.select_dtypes(include=['int64','float64']).columns
        obj_cols = df.select_dtypes(include=['object']).columns
        df[num_cols] = df[num_cols].fillna(0)
        df[obj_cols] = df[obj_cols].fillna("")

        # ─── 4) Ordenar numéricamente por numero_de_inventario ───────
        df['__num'] = pd.to_numeric(df['numero_de_inventario'], errors='coerce')
        df = df[df['__num'].notnull()]
        df.sort_values(by='__num', inplace=True)
        df['numero_de_inventario'] = df['__num'].astype(int).astype(str)
        df.drop(columns='__num', inplace=True)

        # ─── 5) Preparar caches para get_or_create ────────────────────
        pais_cache      = {}
        localidad_cache = {}
        cultura_cache   = {}
        coleccion_cache = {}
        autor_cache     = {}
        expos_cache     = {}
        material_cache  = {}
        tecnica_cache   = {}

        def get_or_create(model, cache, nombre, **extra):
            if not nombre or not str(nombre).strip():
                return None
            clave = str(nombre).strip()
            if clave in cache:
                return cache[clave]
            obj, _ = model.objects.get_or_create(nombre=clave, defaults=extra)
            cache[clave] = obj
            return obj

        piezas_creadas = {}

        # ─── 6) Importar piezas y componentes ────────────────────────
        for _, row in df.iterrows():
            num = str(row.get('numero_de_inventario', '')).strip()
            if not num or num.lower() == 'nan':
                continue

            # 6.1 Pais y Localidad
            pais_obj = get_or_create(Pais, pais_cache, row.get('pais', ''))
            localidad_obj = None
            if pais_obj:
                localidad_obj = get_or_create(
                    Localidad, localidad_cache,
                    row.get('localidad', ''), pais=pais_obj
                )

            # 6.2 Crear Pieza
            pieza = piezas_creadas.get(num)
            if pieza is None:
                pieza, created = Pieza.objects.get_or_create(
                    numero_inventario=num,
                    defaults={
                        'revision': str(row.get('Revisión', '')).strip() or None,
                        'numero_registro_anterior': str(row.get('numero_de registro_anterior', '')).strip() or None,
                        'codigo_surdoc':        str(row.get('SURDOC', '')).strip() or None,
                        'ubicacion':            row.get('ubicacion') or None,
                        'deposito':             row.get('deposito') or None,
                        'estante':              row.get('estante') or None,
                        'caja_actual':          row.get('caja_actual') or None,
                        'tipologia':            row.get('tipologia') or None,
                        'coleccion':            get_or_create(Coleccion, coleccion_cache, row.get('coleccion', '')) or Coleccion.objects.first(),
                        'clasificacion':        row.get('clasificacion') or None,
                        'conjunto':             row.get('conjunto') or None,
                        'nombre_comun': row.get('nombre_comun') or None,
                        'nombre_especifico':    row.get('nombre_especifico') or None,
                        'autor':                get_or_create(Autor, autor_cache, row.get('autor', '')),
                        'filiacion_cultural':   get_or_create(Cultura, cultura_cache, row.get('filiacion_cultural', '')),
                        'pais':                 pais_obj,
                        'localidad':            localidad_obj,
                        'fecha_creacion':       row.get('fecha_de_creacion') or None,
                        'descripcion':          row.get('descripcion_col') or None,
                        'marcas_inscripciones': row.get('marcas_o_inscripciones') or None,
                        'contexto_historico':   row.get('contexto_historico') or None,
                        'bibliografia':         row.get('bibliografia') or None,
                        'iconografia':          row.get('iconografia') or None,
                        'notas_investigacion':  row.get('notas_investigacion') or None,
                        'estado_conservacion':  row.get('estado_genral_de_conservacion') or None,
                        'descripcion_conservacion': row.get('descripcion_cr') or None,
                        'responsable_conservacion': row.get('responsable_conservacion') or None,
                        'fecha_actualizacion_conservacion': row.get('fecha_actualizacion_cr') or None,
                        'comentarios_conservacion': row.get('comentarios_cr') or None,
                        'avaluo':               row.get('avaluo') or None,
                        'procedencia':          row.get('procedencia') or None,
                        'donante':              row.get('donante') or None,
                        'fecha_ingreso':        row.get('fecha_ingreso') or None,
                        'responsable_coleccion': row.get('responsable_coleccion') or None,
                        'fecha_ultima_modificacion': row.get('fecha_ultima_modificacion') or None,
                    }
                )
            piezas_creadas[num] = pieza

            # 6.3 Componentes
            letra = str(row.get('letra', '')).strip()
            if letra:
                qs = Componente.objects.filter(pieza=pieza, letra=letra)
                if qs.exists():
                    comp = qs.first()
                else:
                    comp = Componente.objects.create(
                        pieza=pieza,
                        letra=letra,
                        nombre_comun= row.get('nombre_comun') or pieza.tipologia or '',
                        nombre_atribuido= row.get('nombre_especifico') or None,
                        descripcion=     row.get('descripcion_col') or None,
                        funcion=         row.get('funcion') or None,
                        forma=           row.get('forma') or None,
                    )
                    # M2M de materiales y técnicas
                    for mat in str(row.get('materialidad', '')).split(';'):
                        if mat.strip():
                            comp.materiales.add(get_or_create(Material, material_cache, mat))
                    for tec in str(row.get('tecnica', '')).split(';'):
                        if tec.strip():
                            comp.tecnica.add(get_or_create(Tecnica, tecnica_cache, tec))
                    # Dimensiones y peso
                    try:
                        comp.peso_kg = float(row.get('peso_(gr)', 0)) / 1000
                    except:
                        pass
                    for col, attr in [
                        ("alto_o_largo_(cm)", "alto_cm"),
                        ("ancho_(cm)",       "ancho_cm"),
                        ("profundidad_(cm)", "profundidad_cm"),
                        ("diametro_(cm)",    "diametro_cm"),
                        ("espesor_(mm)",     "espesor_mm"),
                    ]:
                        val = row.get(col, '')
                        try:
                            setattr(comp, attr, float(val))
                        except:
                            pass
                    comp.save()

        # ─── 7) Asociar imágenes ─────────────────────────────────────
        procesadas = 0
        for fn in os.listdir(images_dir):
            full = images_dir / fn
            if not full.is_file():
                continue
            name, ext = os.path.splitext(fn)
            ext = ext.lower().strip('.')
            if ext not in ('jpg','jpeg','png','tif','tiff'):
                continue
            m = re.match(r'^0*(\d+)([A-Za-z]?)(?:.*)$', name)
            if not m:
                continue
            num_str, letra = m.group(1), m.group(2) or ''
            try:
                pieza = Pieza.objects.get(numero_inventario=num_str)
            except Pieza.DoesNotExist:
                continue
            comp = None
            if letra:
                comp = Componente.objects.filter(pieza=pieza, letra=letra).first()
            img = Imagen(pieza=pieza, componente=comp)
            img.imagen.name = fn
            img.save()
            procesadas += 1

        elapsed = time.monotonic() - start_time
        self.stdout.write(self.style.SUCCESS(
            f"✅ Import finalizado: {len(piezas_creadas)} piezas y {procesadas} imágenes procesadas "
            f"en {elapsed:.2f} segundos."
        ))
