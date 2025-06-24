# backend/api/management/commands/import_mapa.py

import os
import re
import time
from api.models import (
    Pieza, Componente, Imagen, Autor, Pais,
    Localidad, Material, Tecnica, Coleccion
)
import pandas as pd
from django.core.management.base import BaseCommand
from neomodel import db, install_labels

class Command(BaseCommand):
    help = 'Importa datos masivos de Excel a Neo4j (DROP existente + LOAD CSV)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--excel',
            type=str,
            required=True,
            help='Ruta al archivo Excel de inventario'
        )
        parser.add_argument(
            '--images_dir',
            type=str,
            required=True,
            help='Directorio con imágenes (montado)'
        )

    def handle(self, *args, **options):
        start_time = time.monotonic()

        excel_path = options['excel']
        images_dir = options['images_dir']
        import_dir = os.path.join(os.getcwd(), 'neo4j', 'import')
        os.makedirs(import_dir, exist_ok=True)

        # 1) Limpiar todo en Neo4j
        db.cypher_query("MATCH (n) DETACH DELETE n")

        # 2) Leer el Excel (cabeceras en la segunda fila)
        df = pd.read_excel(excel_path, sheet_name=0, header=1)

        # 3) Generar CSV intermedios

        # Piezas
        piezas_df = df[[
            'numero_de_inventario',
            'nombre_comun',
            'descripcion_col'
        ]].drop_duplicates()
        piezas_df.columns = ['id', 'nombre', 'descripcion']
        piezas_df.to_csv(os.path.join(import_dir, 'piezas.csv'), index=False)

        # Componentes: filas donde 'letra' no esté vacío
        comp_rows = df[df['letra'].fillna('').astype(str).str.strip() != '']
        componentes_df = comp_rows[[
            'numero_de_inventario',
            'letra',
            'nombre_comun'
        ]].drop_duplicates()
        componentes_df.columns = ['pieza_id', 'letra', 'nombre']
        componentes_df.to_csv(os.path.join(import_dir, 'componentes.csv'), index=False)

        # Autores
        autores_df = df[['autor']].dropna().drop_duplicates()
        autores_df.columns = ['nombre']
        autores_df.to_csv(os.path.join(import_dir, 'autores.csv'), index=False)

        # Países
        paises_df = df[['pais']].dropna().drop_duplicates()
        paises_df.columns = ['nombre']
        paises_df.to_csv(os.path.join(import_dir, 'paises.csv'), index=False)

        # Localidades
        localidades_df = df[['localidad', 'pais']].dropna().drop_duplicates()
        localidades_df.columns = ['nombre', 'pais']
        localidades_df.to_csv(os.path.join(import_dir, 'localidades.csv'), index=False)

        # Materiales (desplegar valores separados por ';')
        all_materials = set()
        for raw in df['materialidad'].fillna('').astype(str):
            for mat in raw.split(';'):
                mat = mat.strip()
                if mat:
                    all_materials.add(mat)
        materiales_df = pd.DataFrame({'nombre': list(all_materials)})
        materiales_df.to_csv(os.path.join(import_dir, 'materiales.csv'), index=False)

        # Técnicas (desplegar valores separados por ';')
        all_tecnicas = set()
        for raw in df['tecnica'].fillna('').astype(str):
            for tec in raw.split(';'):
                tec = tec.strip()
                if tec:
                    all_tecnicas.add(tec)
        tecnicas_df = pd.DataFrame({'nombre': list(all_tecnicas)})
        tecnicas_df.to_csv(os.path.join(import_dir, 'tecnicas.csv'), index=False)

        # Colecciones
        colecciones_df = df[['coleccion']].dropna().drop_duplicates()
        colecciones_df.columns = ['nombre']
        colecciones_df.to_csv(os.path.join(import_dir, 'colecciones.csv'), index=False)

        # 4) Cargar nodos en Neo4j vía APOC

        carga_queries = [
            ('piezas.csv',
             "CREATE (p:Pieza {id:toInteger(row.id), nombre:row.nombre, descripcion:row.descripcion})"),
            ('componentes.csv',
             "CREATE (c:Componente {pieza_id:toInteger(row.pieza_id), letra:row.letra, nombre:row.nombre})"),
            ('autores.csv',
             "CREATE (a:Autor {nombre:row.nombre})"),
            ('paises.csv',
             "CREATE (pa:Pais {nombre:row.nombre})"),
            ('localidades.csv',
             "MATCH (pa:Pais {nombre:row.pais}) "
             "CREATE (l:Localidad {nombre:row.nombre})-[:PERTENECE_A]->(pa)"),
            ('materiales.csv',
             "CREATE (m:Material {nombre:row.nombre})"),
            ('tecnicas.csv',
             "CREATE (t:Tecnica {nombre:row.nombre})"),
            ('colecciones.csv',
             "CREATE (co:Coleccion {nombre:row.nombre})"),
        ]

        for csv_file, cypher in carga_queries:
            db.cypher_query(f"""
                CALL apoc.periodic.iterate(
                  "LOAD CSV WITH HEADERS FROM 'file:///{csv_file}' AS row RETURN row",
                  "{cypher}",
                  {{batchSize:1000, iterateList:true}}
                )
            """)

        # 5) Relacionar Piezas → Componentes en batches
        db.cypher_query("""
        CALL apoc.periodic.iterate(
        'LOAD CSV WITH HEADERS FROM "file:///componentes.csv" AS row RETURN row',
        'MATCH (p:Pieza {id: toInteger(row.pieza_id)}), 
                (c:Componente {pieza_id: toInteger(row.pieza_id), letra: row.letra})
        CREATE (p)-[:TIENE_COMPONENTE]->(c)',
        {batchSize: 1000, iterateList: true}
        )
        """)


        # 6) Crear nodos Imagen y relaciones
        imagenes = []
        for fname in os.listdir(images_dir):
            if os.path.isfile(os.path.join(images_dir, fname)):
                imagenes.append({'file_name': fname})
        img_df = pd.DataFrame(imagenes)
        img_df.to_csv(os.path.join(import_dir, 'imagenes.csv'), index=False)

        db.cypher_query(f"""
            CALL apoc.periodic.iterate(
              "LOAD CSV WITH HEADERS FROM 'file:///imagenes.csv' AS row RETURN row",
              "CREATE (i:Imagen {{file_name:row.file_name}})",
              {{batchSize:1000, iterateList:true}}
            )
        """)

        procesadas = 0
        for fname in os.listdir(images_dir):
            path = os.path.join(images_dir, fname)
            if not os.path.isfile(path):
                continue
            name, ext = os.path.splitext(fname)
            if ext.lower().lstrip('.') not in ('jpg','jpeg','png','tif','tiff'):
                continue
            m = re.match(r'^0*(\d+)([A-Za-z]?)(?:.*)$', name)
            if not m:
                continue
            pieza_id = int(m.group(1))
            letra = m.group(2) or ''
            # Imagen → Pieza
            db.cypher_query(
                "MATCH (p:Pieza {id:$pieza_id}), (i:Imagen {file_name:$file}) "
                "CREATE (p)-[:TIENE_IMAGEN]->(i)",
                {'pieza_id': pieza_id, 'file': fname}
            )
            # Imagen → Componente si corresponde
            if letra:
                db.cypher_query(
                    "MATCH (cmp:Componente {pieza_id:$pieza_id, letra:$letra}), (i:Imagen {file_name:$file}) "
                    "CREATE (cmp)-[:TIENE_IMAGEN]->(i)",
                    {'pieza_id': pieza_id, 'letra': letra, 'file': fname}
                )
            procesadas += 1

        # 7) Aplicar constraints e índices definidos en los modelos
        for cls in (Pieza, Componente, Imagen, Autor, Pais,
            Localidad, Material, Tecnica, Coleccion):
            install_labels(cls)


        elapsed = time.monotonic() - start_time
        self.stdout.write(self.style.SUCCESS(
            f"✅ Importación finalizada: {len(piezas_df)} piezas importadas, "
            f"{procesadas} imágenes asociadas en {elapsed:.2f} segundos."
        ))
