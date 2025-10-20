# backend/api/management/commands/import_mapa.py
import os
import re
import time
import unicodedata
import pandas as pd
from django.core.management.base import BaseCommand
from neomodel import db

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
        num_cols = num_cols.difference(['deposito'])
        obj_cols = df.select_dtypes(include=['object']).columns
        df[num_cols] = df[num_cols].fillna(0)
        df[obj_cols] = df[obj_cols].fillna("")

        def _normalize_deposito(raw) -> str:
            if pd.isna(raw):
                return ""
            text = str(raw).strip()
            if not text:
                return ""
            try:
                fval = float(text)
            except (TypeError, ValueError):
                return ""
            if not fval.is_integer():
                return ""
            ival = int(fval)
            if ival == 0:
                return ""
            return str(ival)

        if 'deposito' in df.columns:
            df['deposito'] = df['deposito'].apply(_normalize_deposito)

        # Ordenar por número inventario (numérico)
        df['__num'] = pd.to_numeric(df['numero_de_inventario'], errors='coerce')
        df = df[df['__num'].notnull()]
        df.sort_values('__num', inplace=True)
        df['__num_int'] = df['__num'].astype(int)
        df['__num_str'] = df['__num_int'].astype(str)

        # 2) Creamos un diccionario con las columnas del excel
        inventario_cols = dict(
            numero_inventario='numero_de_inventario',
            letra='letra',
            revision='Revisión',

            numero_registro_anterior='numero_de registro_anterior',
            codigo_surdoc='SURDOC',

            ubicacion='ubicacion',
            deposito='deposito',
            estante='estante',
            caja_actual='caja_actual',

            tipologia='tipologia',

            coleccion='coleccion',
            clasificacion='clasificacion',
            conjunto='conjunto',
            nombre_comun='nombre_comun',
            nombre_especifico='nombre_especifico',
            autor='autor',
            filiacion_cultural='filiacion_cultural',
            pais='pais',
            localidad='localidad',
            fecha_creacion='fecha_de_creacion',
            descripcion_col='descripcion_col',

            marcas_inscripciones='marcas_o_inscripciones',
            tecnica='tecnica',
            materialidad='materialidad',
            descripcion_conservacion='descripcion_cr',
            alto_cm='alto_o_largo_(cm)',
            ancho_cm='ancho_cm',
            profundidad_cm='profundidad_(cm)',
            diametro_cm='diametro_(cm)',
            espesor_mm='espesor_(mm)',
            peso_gr='peso_(gr)',

            funcion='funcion',
            contexto_historico='contexto_historico',
            bibliografia='bibliografia',
            iconografia='iconografia',
            notas_investigacion='notas_investigacion',

            estado_conservacion='estado_genral_de_conservacion',
            responsable_conservacion='responsable_conservacion',
            fecha_actualizacion_conservacion='fecha_actualizacion_cr',
            comentarios_conservacion='comentarios_cr',

            exposiciones='exposiciones',
            avaluo='avaluo',
            procedencia='procedencia',
            donante='donante',
            fecha_ingreso='fecha_ingreso',
            
            responsable_coleccion='responsable_coleccion',
            fecha_ultima_modificacion='fecha_ultima_modificacion',
        )

        def _normalize_exposiciones(df_obj):
            if 'exposiciones' not in df_obj.columns:
                return df_obj
            df_obj = df_obj.copy()
            df_obj['exposiciones'] = (
                df_obj['exposiciones'].astype(str)
                .str.replace('"', '', regex=False)
                .str.replace('\r\n', ';', regex=False)
                .str.replace('\r', ';', regex=False)
                .str.replace('\n', ';', regex=False)
            )
            return df_obj

        df['__letra_norm'] = df['letra'].astype(str).str.strip().str.lower()
        df['__letra_rank'] = df['__letra_norm'].map({'': 0, 'a': 1}).fillna(2).astype(int)

        piezas_src = (
            df
            .sort_values(['__num_int', '__letra_rank', '__letra_norm'])
            .groupby('__num_str', as_index=False)
            .first()
        )
        piezas_src.loc[piezas_src['__letra_rank'] > 1, 'letra'] = 'a'

        cols_for_pieza = [v for v in inventario_cols.values() if v in piezas_src.columns]
        piezas_df = piezas_src[cols_for_pieza].copy()
        piezas_df.rename(columns={v: k for k, v in inventario_cols.items() if v in piezas_df.columns}, inplace=True)
        piezas_df['numero_inventario'] = piezas_src['__num_str']
        piezas_df['numero_inventario_int'] = piezas_src['__num_int'].astype(int)
        piezas_df = _normalize_exposiciones(piezas_df)

        expected_total = len(set(df['__num_str']))
        piezas_df['numero_inventario'] = piezas_df['numero_inventario'].astype(str)
        piezas_df.sort_values('numero_inventario_int', inplace=True)
        piezas_df = piezas_df.drop_duplicates(subset=['numero_inventario'], keep='first').reset_index(drop=True)

        missing_after = sorted(set(df['__num_str']) - set(piezas_df['numero_inventario']), key=int)
        if missing_after:
            preview = ', '.join(missing_after[:10])
            self.stdout.write(
                f"Advertencia: {len(missing_after)} números de inventario quedaron sin Pieza. Ej: {preview}"
            )

        if len(piezas_df) != expected_total:
            self.stdout.write(
                f"Advertencia: se esperaban {expected_total} piezas y se generaron {len(piezas_df)}."
            )
        piezas_csv = os.path.join(import_dir, 'piezas.csv')
        piezas_df.to_csv(piezas_csv, index=False)

        # COMPONENTES: todas las filas con letra no vacía y distinta de 'a'
        comp_df = df[
            (df['letra'].astype(str).str.strip() != '') &
            (df['letra'].astype(str).str.strip().str.lower() != 'a')
        ][[v for v in inventario_cols.values() if v in df.columns]].copy()
        comp_df = comp_df.assign(
            pieza_numero_inventario=comp_df['numero_de_inventario'].astype(int).astype(str),
            letra=comp_df['letra'].astype(str).str.strip().str.lower()
        )
        comp_df.rename(columns={v: k for k, v in inventario_cols.items() if v in df.columns}, inplace=True)
        comp_df = _normalize_exposiciones(comp_df)
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
            "CREATE INDEX idx_tipologia_nombre IF NOT EXISTS FOR (ti:Tipologia) ON (ti.nombre)",
            "CREATE INDEX idx_coleccion_nombre IF NOT EXISTS FOR (co:Coleccion) ON (co.nombre)",
            "CREATE INDEX idx_expo_titulo IF NOT EXISTS FOR (e:Exposicion) ON (e.titulo)"
        ]:
            db.cypher_query(stmt)

        # Unicidad por nombre de archivo de la imagen
        db.cypher_query(
            "CREATE CONSTRAINT uniq_imagen_file IF NOT EXISTS "
            "FOR (i:Imagen) REQUIRE i.file_name IS UNIQUE"
        )

        # 4) Carga de PIEZAS (propiedades planas)
        db.cypher_query(f"""
        CALL apoc.periodic.iterate(
          "LOAD CSV WITH HEADERS FROM 'file:///piezas.csv' AS row RETURN row",
          "
          CREATE (p:Pieza {{
            numero_inventario: row.numero_inventario,
            numero_inventario_int: toInteger(row.numero_inventario_int),
            letra: row.letra,
            revision: row.revision,
            numero_registro_anterior: row.numero_registro_anterior,
            codigo_surdoc: row.codigo_surdoc,
            ubicacion: row.ubicacion,
            deposito: CASE
              WHEN row.deposito IS NULL OR trim(row.deposito) = '' THEN null
              ELSE toInteger(row.deposito)
            END,
            estante: row.estante,
            caja_actual: row.caja_actual,
            tipologia: row.tipologia,
            coleccion: row.coleccion,
            clasificacion: row.clasificacion,
            conjunto: row.conjunto,
            nombre_comun: row.nombre_comun,
            nombre_especifico: row.nombre_especifico,
            autor: row.autor,
            filiacion_cultural: row.filiacion_cultural,
            pais: row.pais,
            localidad: row.localidad,
            fecha_creacion: row.fecha_creacion,
            descripcion_col: row.descripcion_col,
            marcas_inscripciones: row.marcas_inscripciones,
            tecnica: row.tecnica,
            materialidad: row.materialidad,
            descripcion_conservacion: row.descripcion_conservacion,
            alto_cm: toFloat(row.alto_cm),
            ancho_cm: toFloat(row.ancho_cm),
            profundidad_cm: toFloat(row.profundidad_cm),
            diametro_cm: toFloat(row.diametro_cm),
            espesor_mm: toFloat(row.espesor_mm),
            peso_gr: toFloat(row.peso_gr),
            funcion: row.funcion,
            contexto_historico: row.contexto_historico,
            bibliografia: row.bibliografia,
            iconografia: row.iconografia,
            notas_investigacion: row.notas_investigacion,
            estado_conservacion: row.estado_conservacion,
            responsable_conservacion: row.responsable_conservacion,
            fecha_actualizacion_conservacion: row.fecha_actualizacion_conservacion,
            comentarios_conservacion: row.comentarios_conservacion,
            exposiciones: CASE
              WHEN row.exposiciones IS NULL OR trim(row.exposiciones) = '' THEN []
              ELSE [x IN split(row.exposiciones, ';') WHERE trim(x) <> '' | trim(x)]
            END,
            avaluo: row.avaluo,
            procedencia: row.procedencia,
            donante: row.donante,
            fecha_ingreso: row.fecha_ingreso,
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
          // Tipología
           FOREACH (_ IN CASE WHEN row.tipologia<>'' THEN [1] ELSE [] END |
             MERGE (ti:Tipologia {nombre:trim(row.tipologia)}) MERGE (p)-[:TIENE_TIPOLOGIA]->(ti))

           WITH p, row,
                [expo IN split(coalesce(row.exposiciones, ''), ';') WHERE trim(expo) <> ''] AS expos_list
           FOREACH (expo IN expos_list |
             MERGE (e:Exposicion {titulo:trim(replace(expo, '\\"', ''))})
             MERGE (p)-[:EXHIBIDO_EN]->(e)
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
            revision: row.revision,
            numero_registro_anterior: row.numero_registro_anterior,
            codigo_surdoc: row.codigo_surdoc,
            ubicacion: row.ubicacion,
            deposito: CASE
              WHEN row.deposito IS NULL OR trim(row.deposito) = '' THEN null
              ELSE toInteger(row.deposito)
            END,
            estante: row.estante,
            caja_actual: row.caja_actual,
            tipologia: row.tipologia,
            coleccion: row.coleccion,
            clasificacion: row.clasificacion,
            conjunto: row.conjunto,
            nombre_comun: row.nombre_comun,
            nombre_especifico: row.nombre_especifico,
            autor: row.autor,
            filiacion_cultural: row.filiacion_cultural,
            pais: row.pais,
            localidad: row.localidad,
            fecha_creacion: row.fecha_creacion,
            descripcion_col: row.descripcion_col,
            marcas_inscripciones: row.marcas_inscripciones,
            tecnica: row.tecnica,
            materialidad: row.materialidad,
            descripcion_cr: row.descripcion_cr,
            alto_cm: toFloat(row.alto_cm),
            ancho_cm: toFloat(row.ancho_cm),
            profundidad_cm: toFloat(row.profundidad_cm),
            diametro_cm: toFloat(row.diametro_cm),
            espesor_mm: toFloat(row.espesor_mm),
            peso_gr: toFloat(row.peso_gr),
            funcion: row.funcion,
            contexto_historico: row.contexto_historico,
            bibliografia: row.bibliografia,
            iconografia: row.iconografia,
            notas_investigacion: row.notas_investigacion,
            estado_conservacion: row.estado_conservacion,
            responsable_conservacion: row.responsable_conservacion,
            fecha_actualizacion_conservacion: row.fecha_actualizacion_conservacion,
            comentarios_conservacion: row.comentarios_conservacion,
            exposiciones: CASE
              WHEN row.exposiciones IS NULL OR trim(row.exposiciones) = '' THEN []
              ELSE [x IN split(row.exposiciones, ';') WHERE trim(x) <> '' | trim(x)]
            END,
            avaluo: row.avaluo,
            procedencia: row.procedencia,
            donante: row.donante,
            fecha_ingreso: row.fecha_ingreso,
            responsable_coleccion: row.responsable_coleccion,
            fecha_ultima_modificacion: row.fecha_ultima_modificacion
          })
          ",
          {batchSize:1000, iterateList:true}
        )
        """)

        # 8) Pieza -> Componente + M2M (materialidad/tecnica) del componente
        db.cypher_query("""
        CALL apoc.periodic.iterate(
          "LOAD CSV WITH HEADERS FROM 'file:///componentes.csv' AS row RETURN row",
          "
           MATCH (p:Pieza {numero_inventario:row.pieza_numero_inventario})
           MATCH (c:Componente {pieza_numero_inventario:row.pieza_numero_inventario, letra:row.letra})
           MERGE (p)-[:TIENE_COMPONENTE]->(c)
          ",
          {batchSize:1000, iterateList:true}
        )""")

        # 8b) Relaciones de componentes con dominios (autor/coleccion/pais/etc.)
        db.cypher_query("""
        CALL apoc.periodic.iterate(
          "LOAD CSV WITH HEADERS FROM 'file:///componentes.csv' AS row RETURN row",
          "
           MATCH (c:Componente {pieza_numero_inventario:row.pieza_numero_inventario, letra:row.letra})

           FOREACH (_ IN CASE WHEN row.autor<>'' THEN [1] ELSE [] END |
             MERGE (a:Autor {nombre:trim(row.autor)}) MERGE (c)-[:CREADO_POR]->(a))
           FOREACH (_ IN CASE WHEN row.coleccion<>'' THEN [1] ELSE [] END |
             MERGE (co:Coleccion {nombre:trim(row.coleccion)}) MERGE (c)-[:PERTENECE_A]->(co))
           FOREACH (_ IN CASE WHEN row.filiacion_cultural<>'' THEN [1] ELSE [] END |
             MERGE (cu:Cultura {nombre:trim(row.filiacion_cultural)}) MERGE (c)-[:FILIACION]->(cu))
           FOREACH (_ IN CASE WHEN row.pais<>'' THEN [1] ELSE [] END |
             MERGE (pa:Pais {nombre:trim(row.pais)}) MERGE (c)-[:PROCEDENTE_DE]->(pa))
           FOREACH (_ IN CASE WHEN row.localidad<>'' THEN [1] ELSE [] END |
             MERGE (l:Localidad {nombre:trim(row.localidad)}) MERGE (c)-[:LOCALIZADO_EN]->(l))
           FOREACH (_ IN CASE WHEN row.tipologia<>'' THEN [1] ELSE [] END |
             MERGE (ti:Tipologia {nombre:trim(row.tipologia)}) MERGE (c)-[:TIENE_TIPOLOGIA]->(ti))

           WITH c, row,
                [expo IN split(coalesce(row.exposiciones, ''), ';') WHERE trim(expo) <> ''] AS expos_list
           FOREACH (expo IN expos_list |
             MERGE (e:Exposicion {titulo:trim(replace(expo, '\\"', ''))})
             MERGE (c)-[:EXHIBIDO_EN]->(e)
           )
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
            letra = (m.group(2) or '').lower()
            img_rows.append({'file_name': fn, 'num': num, 'letra': letra})

        pd.DataFrame(img_rows).to_csv(os.path.join(import_dir, 'imagenes.csv'), index=False)

        # Nodos Imagen
        db.cypher_query("""
        LOAD CSV WITH HEADERS FROM 'file:///imagenes.csv' AS row
        WITH row WHERE row.file_name IS NOT NULL AND trim(row.file_name) <> ''
        MERGE (:Imagen {file_name: trim(row.file_name)});
        """)

        # Pieza -> Imagen
        db.cypher_query("""
        LOAD CSV WITH HEADERS FROM 'file:///imagenes.csv' AS row
        WITH trim(row.num) AS num, trim(row.file_name) AS fn
        MATCH (p:Pieza {numero_inventario: num})
        MATCH (i:Imagen {file_name: fn})
        MERGE (p)-[:TIENE_IMAGEN]->(i);
        """)

        # Componente -> Imagen (si hay letra)
        db.cypher_query("""
        LOAD CSV WITH HEADERS FROM 'file:///imagenes.csv' AS row
        WITH trim(row.num) AS num, toLower(trim(coalesce(row.letra,''))) AS letra, trim(row.file_name) AS fn
        WHERE letra <> ''
        MATCH (c:Componente {pieza_numero_inventario: num, letra: letra})
        MATCH (i:Imagen {file_name: fn})
        MERGE (c)-[:TIENE_IMAGEN]->(i);
        """)


        # ===== CSV auxiliares para filtros del frontend =====
        aux_dir = import_dir  # los dejamos junto a los otros csv

        def _norm(s: str) -> str:
            # Normaliza: quita espacios, aplica NFC y casefold (mejor que lower para Unicode)
            s = (s or "").strip()
            if not s:
                return ""
            s = unicodedata.normalize("NFC", s)
            return s

        def _uniq_series(series: pd.Series) -> list[str]:
            """Valores únicos (case-insensitive), conservando la primera capitalización encontrada."""
            seen = set()
            out = []
            for raw in series.fillna("").astype(str):
                val = _norm(raw)
                if not val:
                    continue
                key = val.casefold()
                if key not in seen:
                    seen.add(key)
                    out.append(val)
            # ordenar de forma estable por casefold
            return sorted(out, key=lambda x: x.casefold())

        pd.DataFrame({"nombre": _uniq_series(piezas_df.get("coleccion", pd.Series(dtype=str)))}) \
          .to_csv(os.path.join(aux_dir, "colecciones.csv"), index=False)

        pd.DataFrame({"nombre": _uniq_series(piezas_df.get("autor", pd.Series(dtype=str)))}) \
          .to_csv(os.path.join(aux_dir, "autores.csv"), index=False)

        pd.DataFrame({"nombre": _uniq_series(piezas_df.get("pais", pd.Series(dtype=str)))}) \
          .to_csv(os.path.join(aux_dir, "paises.csv"), index=False)

        pd.DataFrame({"nombre": _uniq_series(piezas_df.get("localidad", pd.Series(dtype=str)))}) \
          .to_csv(os.path.join(aux_dir, "localidades.csv"), index=False)

        pd.DataFrame({"nombre": _uniq_series(piezas_df.get("tipologia", pd.Series(dtype=str)))}) \
          .to_csv(os.path.join(aux_dir, "tipologias.csv"), index=False)
        
        pd.DataFrame({"nombre": _uniq_series(piezas_df.get("exposiciones", pd.Series(dtype=str)))}) \
          .to_csv(os.path.join(aux_dir, "exposiciones.csv"), index=False)

        self.stdout.write(self.style.SUCCESS(
            f"✅ Import finalizado: {len(piezas_df)} piezas, {len(img_rows)} imágenes, en {time.monotonic()-t0:.2f}s"
        ))
