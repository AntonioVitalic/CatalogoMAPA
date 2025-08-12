# backend/api/management/commands/import_mapa.py
import os
import re
import time
import pandas as pd
from django.core.management.base import BaseCommand
from neomodel import db
from api.models import (
    Pieza, Componente, Imagen, Autor, Pais, Localidad, Cultura,
    Material, Tecnica, Coleccion, Exposicion
)

class Command(BaseCommand):
    help = 'DROP + LOAD CSV de Excel e imágenes a Neo4j (espejo compat con dev-sqlite)'

    def add_arguments(self, parser):
        parser.add_argument('--excel', required=True, help='Ruta Excel inventario (dentro del contenedor)')
        parser.add_argument('--images_dir', required=True, help='Carpeta imágenes (dentro del contenedor)')

    def handle(self, *args, **opt):
        t0 = time.monotonic()
        excel_path = opt['excel']
        images_dir = opt['images_dir']

        # Carpeta donde Neo4j puede leer CSV (montada como neo4j/import)
        import_dir = os.path.join(os.getcwd(), 'neo4j', 'import')
        os.makedirs(import_dir, exist_ok=True)

        # 0) Wipe total
        db.cypher_query("MATCH (n) DETACH DELETE n")

        # 1) Excel
        df = pd.read_excel(excel_path, header=1)

        # El Excel suele traer dos columnas “fantasma”: la entre tipologia y coleccion (idx 10)
        # y 'Unnamed: 46' (entre fecha_ingreso y responsable_coleccion). Las quitamos si existen.
        to_drop = []
        if len(df.columns) > 46:
            to_drop = [df.columns[10], 'Unnamed: 46']
        df.drop(columns=[c for c in to_drop if c in df.columns], inplace=True, errors='ignore')

        # Rellenar NaN según tipo
        num_cols = df.select_dtypes(include=['int64','float64']).columns
        obj_cols = df.select_dtypes(include=['object']).columns
        df[num_cols] = df[num_cols].fillna(0)
        df[obj_cols] = df[obj_cols].fillna("")

        # Ordenar por número inventario (numérico)
        df['__num'] = pd.to_numeric(df['numero_de_inventario'], errors='coerce')
        df = df[df['__num'].notnull()]
        df.sort_values('__num', inplace=True)

        # 2) CSV base (SOLO piezas.csv + componentes.csv)
        piezas_cols = dict(
            numero_inventario='numero_de_inventario',
            revision='Revisión',
            numero_registro_anterior='numero_de registro_anterior',
            codigo_surdoc='SURDOC',
            ubicacion='ubicacion',
            deposito='deposito',
            estante='estante',
            caja_actual='caja_actual',
            tipologia='tipologia',
            clasificacion='clasificacion',
            conjunto='conjunto',
            nombre_comun='nombre_comun',
            nombre_especifico='nombre_especifico',
            fecha_creacion='fecha_de_creacion',
            descripcion='descripcion_col',
            marcas_inscripciones='marcas_o_inscripciones',
            contexto_historico='contexto_historico',
            bibliografia='bibliografia',
            iconografia='iconografia',
            notas_investigacion='notas_investigacion',
            avaluo='avaluo',
            procedencia='procedencia',
            donante='donante',
            fecha_ingreso='fecha_ingreso',
            estado_conservacion='estado_genral_de_conservacion',
            descripcion_conservacion='descripcion_cr',
            responsable_conservacion='responsable_conservacion',
            fecha_actualizacion_conservacion='fecha_actualizacion_cr',
            comentarios_conservacion='comentarios_cr',
            responsable_coleccion='responsable_coleccion',
            fecha_ultima_modificacion='fecha_ultima_modificacion',
            autor='autor',
            filiacion_cultural='filiacion_cultural',
            pais='pais',
            localidad='localidad',
            coleccion='coleccion',
            materialidad='materialidad',
            tecnica='tecnica',
        )

        piezas_df = df[[v for v in piezas_cols.values() if v in df.columns]].copy()
        piezas_df.rename(columns={v: k for k, v in piezas_cols.items() if v in df.columns}, inplace=True)
        piezas_df['numero_inventario'] = piezas_df['numero_inventario'].astype(int).astype(str)
        piezas_df['numero_inventario_int'] = piezas_df['numero_inventario'].astype(int)
        # Evitar duplicados por filas A/B del Excel: quedarse con la primera (la “pieza”)
        piezas_df = piezas_df.drop_duplicates(subset=['numero_inventario'], keep='first')
        piezas_csv = os.path.join(import_dir, 'piezas.csv')
        piezas_df.to_csv(piezas_csv, index=False)

        # Componentes (una fila por letra, con marcas_inscripciones)
        comp_df = df[df['letra'].astype(str).str.strip() != ''].copy()
        comp_df = comp_df.assign(
            pieza_numero_inventario=comp_df['numero_de_inventario'].astype(int).astype(str),
            letra=comp_df['letra'].astype(str).str.strip().str.lower(),  # forzar minúscula para alinear con imágenes
            nombre_comun=comp_df['nombre_comun'],
            nombre_atribuido=comp_df['nombre_especifico'],
            descripcion=comp_df['descripcion_col'],
            funcion=comp_df.get('funcion', ''),
            forma=comp_df.get('forma', ''),
            marcas_inscripciones=comp_df.get('marcas_o_inscripciones', ''),
            peso_kg=pd.to_numeric(comp_df.get('peso_(gr)', 0), errors='coerce').fillna(0) / 1000.0,
            alto_cm=pd.to_numeric(comp_df.get('alto_o_largo_(cm)', 0), errors='coerce'),
            ancho_cm=pd.to_numeric(comp_df.get('ancho_(cm)', 0), errors='coerce'),
            profundidad_cm=pd.to_numeric(comp_df.get('profundidad_(cm)', 0), errors='coerce'),
            diametro_cm=pd.to_numeric(comp_df.get('diametro_(cm)', 0), errors='coerce'),
            espesor_mm=pd.to_numeric(comp_df.get('espesor_(mm)', 0), errors='coerce'),
            estado_conservacion=comp_df.get('estado_genral_de_conservacion', '')
        )[[
            'pieza_numero_inventario', 'letra', 'nombre_comun', 'nombre_atribuido', 'descripcion',
            'funcion', 'forma', 'marcas_inscripciones', 'peso_kg', 'alto_cm', 'ancho_cm',
            'profundidad_cm', 'diametro_cm', 'espesor_mm', 'estado_conservacion', 'materialidad', 'tecnica'
        ]]
        comp_csv = os.path.join(import_dir, 'componentes.csv')
        comp_df.to_csv(comp_csv, index=False)

        # 3) Índices / constraints mínimos
        try:
            db.cypher_query("DROP INDEX index_Pieza_numero_inventario IF EXISTS")
        except Exception:
            pass

        db.cypher_query(
            "CREATE CONSTRAINT unique_pieza_num IF NOT EXISTS "
            "FOR (p:Pieza) REQUIRE p.numero_inventario IS UNIQUE"
        )
        for stmt in [
            "CREATE INDEX idx_pieza_numint IF NOT EXISTS FOR (p:Pieza) ON (p.numero_inventario_int)",
            "CREATE INDEX idx_comp_pieza_num IF NOT EXISTS FOR (c:Componente) ON (c.pieza_numero_inventario)",
            "CREATE INDEX idx_comp_letra IF NOT EXISTS FOR (c:Componente) ON (c.letra)",
            "CREATE INDEX idx_autor_nombre IF NOT EXISTS FOR (a:Autor) ON (a.nombre)",
            "CREATE INDEX idx_pais_nombre IF NOT EXISTS FOR (pa:Pais) ON (pa.nombre)",
            "CREATE INDEX idx_localidad_nombre IF NOT EXISTS FOR (l:Localidad) ON (l.nombre)",
            "CREATE INDEX idx_cultura_nombre IF NOT EXISTS FOR (cu:Cultura) ON (cu.nombre)",
            "CREATE INDEX idx_material_nombre IF NOT EXISTS FOR (m:Material) ON (m.nombre)",
            "CREATE INDEX idx_tecnica_nombre IF NOT EXISTS FOR (t:Tecnica) ON (t.nombre)",
            "CREATE INDEX idx_coleccion_nombre IF NOT EXISTS FOR (co:Coleccion) ON (co.nombre)",
            "CREATE INDEX idx_expo_titulo IF NOT EXISTS FOR (e:Exposicion) ON (e.titulo)"
        ]:
            db.cypher_query(stmt)

        # 4) Carga de PIEZAS (propiedades planas)
        db.cypher_query(f"""
        CALL apoc.periodic.iterate(
          "LOAD CSV WITH HEADERS FROM 'file:///piezas.csv' AS row RETURN row",
          "
           CREATE (p:Pieza {{
             numero_inventario: row.numero_inventario,
             numero_inventario_int: toInteger(row.numero_inventario_int),
             revision: row.revision,
             numero_registro_anterior: row.numero_registro_anterior,
             codigo_surdoc: row.codigo_surdoc,
             ubicacion: row.ubicacion,
             deposito: row.deposito,
             estante: row.estante,
             caja_actual: row.caja_actual,
             tipologia: row.tipologia,
             clasificacion: row.clasificacion,
             conjunto: row.conjunto,
             nombre_comun: row.nombre_comun,
             nombre_especifico: row.nombre_especifico,
             fecha_creacion: row.fecha_creacion,
             descripcion: row.descripcion,
             marcas_inscripciones: row.marcas_inscripciones,
             contexto_historico: row.contexto_historico,
             bibliografia: row.bibliografia,
             iconografia: row.iconografia,
             notas_investigacion: row.notas_investigacion,
             avaluo: row.avaluo,
             procedencia: row.procedencia,
             donante: row.donante,
             fecha_ingreso: row.fecha_ingreso,
             estado_conservacion: row.estado_conservacion,
             descripcion_conservacion: row.descripcion_conservacion,
             responsable_conservacion: row.responsable_conservacion,
             fecha_actualizacion_conservacion: row.fecha_actualizacion_conservacion,
             comentarios_conservacion: row.comentarios_conservacion,
             responsable_coleccion: row.responsable_coleccion,
             fecha_ultima_modificacion: row.fecha_ultima_modificacion
           }})
          ",
          {{batchSize:1000, iterateList:true}}
        )
        """)

        # 5) Relacionar dominios (Autor/Colección/Cultura/País/Localidad) directamente desde piezas.csv
        db.cypher_query("""
        CALL apoc.periodic.iterate(
          "LOAD CSV WITH HEADERS FROM 'file:///piezas.csv' AS row RETURN row",
          "
           MATCH (p:Pieza {numero_inventario:row.numero_inventario})

           // Autor / Colección / Cultura
           FOREACH (_ IN CASE WHEN row.autor<>'' THEN [1] ELSE [] END |
             MERGE (a:Autor {nombre:trim(row.autor)}) MERGE (p)-[:CREADO_POR]->(a))
           FOREACH (_ IN CASE WHEN row.coleccion<>'' THEN [1] ELSE [] END |
             MERGE (c:Coleccion {nombre:trim(row.coleccion)}) MERGE (p)-[:PERTENECE_A]->(c))
           FOREACH (_ IN CASE WHEN row.filiacion_cultural<>'' THEN [1] ELSE [] END |
             MERGE (cu:Cultura {nombre:trim(row.filiacion_cultural)}) MERGE (p)-[:FILIACION]->(cu))

           // País si existe
           FOREACH (_ IN CASE WHEN row.pais<>'' THEN [1] ELSE [] END |
             MERGE (pa:Pais {nombre:trim(row.pais)}) MERGE (p)-[:PROCEDENTE_DE]->(pa))

           // Localidad si existe; y vincular a País si vino
           FOREACH (_ IN CASE WHEN row.localidad<>'' THEN [1] ELSE [] END |
             MERGE (l:Localidad {nombre:trim(row.localidad)})
             MERGE (p)-[:LOCALIZADO_EN]->(l)
             FOREACH (__ IN CASE WHEN row.pais<>'' THEN [1] ELSE [] END |
               MERGE (pa:Pais {nombre:trim(row.pais)})
               MERGE (l)-[:PERTENECE_A]->(pa)
             )
           )
          ",
          {batchSize:1000, iterateList:true}
        )""")

        # 6) Relacionar materiales/técnicas de pieza desde strings ; separadas
        for rel_name, label in [('materialidad','Material'), ('tecnica','Tecnica')]:
            db.cypher_query(f"""
            CALL apoc.periodic.iterate(
              "LOAD CSV WITH HEADERS FROM 'file:///piezas.csv' AS row RETURN row",
              "
               MATCH (p:Pieza {{numero_inventario:row.numero_inventario}})
               WITH p, row
               CALL apoc.text.split(row.{rel_name}, ';') YIELD value
               WITH p, trim(value) AS v
               WHERE v <> ''
               MERGE (m:{label} {{nombre:v}})
               MERGE (p)-[:{'HECHO_DE' if label=='Material' else 'HECHO_CON'}]->(m)
              ",
              {{batchSize:1000, iterateList:true}}
            )
            """)

        # 7) Componentes: nodos básicos
        db.cypher_query("""
        CALL apoc.periodic.iterate(
          "LOAD CSV WITH HEADERS FROM 'file:///componentes.csv' AS row RETURN row",
          "
           CREATE (c:Componente {
             pieza_numero_inventario: row.pieza_numero_inventario,
             letra: row.letra,
             nombre_comun: row.nombre_comun,
             nombre_atribuido: row.nombre_atribuido,
             descripcion: row.descripcion,
             funcion: row.funcion,
             forma: row.forma,
             marcas_inscripciones: row.marcas_inscripciones,
             peso_kg: toFloat(row.peso_kg),
             alto_cm: toFloat(row.alto_cm),
             ancho_cm: toFloat(row.ancho_cm),
             profundidad_cm: toFloat(row.profundidad_cm),
             diametro_cm: toFloat(row.diametro_cm),
             espesor_mm: toFloat(row.espesor_mm),
             estado_conservacion: row.estado_conservacion
           })
          ",
          {batchSize:1000, iterateList:true}
        )""")

        # 8) Pieza -> Componente + M2M (materialidad/tecnica) del componente
        db.cypher_query("""
        CALL apoc.periodic.iterate(
          "LOAD CSV WITH HEADERS FROM 'file:///componentes.csv' AS row RETURN row",
          "
           MATCH (p:Pieza {numero_inventario:row.pieza_numero_inventario})
           MATCH (c:Componente {pieza_numero_inventario:row.pieza_numero_inventario, letra:row.letra})
           MERGE (p)-[:TIENE_COMPONENTE]->(c)

           // Materialidad del componente
           WITH c, row
           CALL apoc.text.split(row.materialidad, ';') YIELD value
           WITH c, trim(value) AS mv, row
           WHERE mv <> '' 
           MERGE (m:Material {nombre:mv})
           MERGE (c)-[:USO_MATERIAL]->(m)

           // Técnica del componente
           WITH c, row
           CALL apoc.text.split(row.tecnica, ';') YIELD value
           WITH c, trim(value) AS tv
           WHERE tv <> '' 
           MERGE (t:Tecnica {nombre:tv})
           MERGE (c)-[:USO_TECNICA]->(t)
          ",
          {batchSize:1000, iterateList:true}
        )""")

        # 9) Imágenes: escanear carpeta, normalizar letra a minúscula y vincular
        img_rows = []
        for fn in os.listdir(images_dir):
            full = os.path.join(images_dir, fn)
            if not os.path.isfile(full):
                continue
            name, ext = os.path.splitext(fn)
            ext = ext.lower().lstrip('.')
            if ext not in ('jpg', 'jpeg', 'png', 'tif', 'tiff'):
                continue
            m = re.match(r'^0*(\d+)([A-Za-z]?)(?:.*)$', name)
            if not m:
                continue
            num = str(int(m.group(1)))
            letra = (m.group(2) or '').lower()  # **clave**: letra a minúscula
            img_rows.append({'file_name': fn, 'num': num, 'letra': letra})

        pd.DataFrame(img_rows).to_csv(os.path.join(import_dir, 'imagenes.csv'), index=False)

        db.cypher_query("""
        CALL apoc.periodic.iterate(
          "LOAD CSV WITH HEADERS FROM 'file:///imagenes.csv' AS row RETURN row",
          "
           MERGE (i:Imagen {file_name:row.file_name})

           // Enlazar a la Pieza
           MATCH (p:Pieza {numero_inventario:row.num})
           MERGE (p)-[:TIENE_IMAGEN]->(i)

           // Enlazar a Componente si hay letra
           FOREACH(_ IN CASE WHEN row.letra<>'' THEN [1] ELSE [] END |
             MATCH (c:Componente {pieza_numero_inventario:row.num, letra:row.letra})
             MERGE (c)-[:TIENE_IMAGEN]->(i)
           )
          ",
          {batchSize:1000, iterateList:true}
        )""")

        self.stdout.write(self.style.SUCCESS(
            f"✅ Import finalizado: {len(piezas_df)} piezas, {len(img_rows)} imágenes, en {time.monotonic()-t0:.2f}s"
        ))
