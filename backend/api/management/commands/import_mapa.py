# backend/api/management/commands/import_mapa.py

import os
import time
import pandas as pd
from uuid import uuid4
from neo4j import GraphDatabase
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

class Command(BaseCommand):
    help = "Importa las piezas y componentes desde un Excel y las imágenes desde un directorio hacia Neo4j, refrescando primero toda la base."

    def add_arguments(self, parser):
        parser.add_argument(
            '--excel',
            required=True,
            help='Ruta al archivo Excel de inventario (p. ej. /app/inventario.xlsx)'
        )
        parser.add_argument(
            '--images_dir',
            required=True,
            help='Ruta al directorio que contiene las imágenes (p. ej. /imagenes)'
        )

    def handle(self, *args, **options):
        excel_path  = options['excel']
        images_dir  = options['images_dir']

        if not os.path.isfile(excel_path):
            raise CommandError(f"El archivo Excel no existe: {excel_path}")
        if not os.path.isdir(images_dir):
            raise CommandError(f"El directorio de imágenes no existe: {images_dir}")

        # Creamos driver Neo4j
        uri  = settings.NEO4J_URI
        user = settings.NEO4J_USER
        pwd  = settings.NEO4J_PASSWORD
        driver = GraphDatabase.driver(uri, auth=(user, pwd))

        start = time.time()

        # 1) Borro todo el grafo
        with driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")
            self.stdout.write(self.style.WARNING("🗑  Grafo previo eliminado."))

        # 2) Cargo el Excel
        df = pd.read_excel(excel_path, header=1)

        piezas_procesadas  = 0
        imagenes_asociadas = 0

        # 3) Itero piezas y componentes
        with driver.session() as session:
            for _, row in df.iterrows():
                # fila de Excel: header en 2 → fila 3 tiene índice 3, le restamos 2 → row_id = 1,2,3…
                excel_row = row.name
                row_id     = excel_row + 1

                num = str(row.get('numero_de_inventario')).strip()
                if not num:
                    continue
                piezas_procesadas += 1

                # sólo _crear_pieza necesita row_id
                session.execute_write(self._crear_pieza, row, row_id)
                # el resto mantienen su firma original
                session.execute_write(self._relaciones_pieza, row)
                session.execute_write(self._componentes, row)

            # 4) Importo imágenes
            for root, _, files in os.walk(images_dir):
                for fn in files:
                    fn_low = fn.lower()
                    if not fn_low.endswith(('.jpg','.jpeg','.png','.tif','.tiff','bmp')):
                        continue
                    fullpath = os.path.join(root, fn).replace("\\", "/")
                    imagenes_asociadas += 1
                    session.execute_write(self._importar_imagen, fn, fullpath)

        elapsed = time.time() - start
        self.stdout.write(self.style.SUCCESS(
            f"✅ Importación finalizada: {piezas_procesadas} filas procesadas, "
            f"{imagenes_asociadas} imágenes asociadas en {elapsed:.2f} segundos"
        ))

    @staticmethod
    def _crear_pieza(tx, row, row_id):
        num = str(row.get('numero_de_inventario')).strip()
        tx.run(
            """
            MERGE (p:Pieza {numero_inventario: $num})
            SET
              p.row_id                         = $row_id,
              p.numero_registro_anterior       = $nrAnterior,
              p.codigo_surdoc                  = $codSurdoc,
              p.ubicacion                      = $ubicacion,
              p.deposito                       = $deposito,
              p.estante                        = $estante,
              p.caja_actual                    = $caja,
              p.tipologia                      = $tipologia,
              p.conjunto                       = $conjunto,
              p.nombre_comun                   = $nombre_comun,
              p.nombre_especifico              = $nombre_especifico,
              p.descripcion                    = $descripcion,
              p.marcas_inscripciones           = $marcas_insc,
              p.contexto_historico             = $ctxHistorico,
              p.bibliografia                   = $bibliografia,
              p.iconografia                    = $iconografia,
              p.notas_investigacion            = $notas,
              p.fecha_creacion                 = $fCreacion,
              p.estado_conservacion            = $estCons,
              p.descripcion_conservacion       = $descCons,
              p.responsable_conservacion       = $respCons,
              p.fecha_actualizacion_conservacion = $fActCons,
              p.comentarios_conservacion       = $comCons,
              p.avaluo                         = $avaluo,
              p.procedencia                    = $procedencia,
              p.donante                        = $donante,
              p.fecha_ingreso                  = $fIngreso,
              p.responsable_coleccion          = $respColeccion,
              p.fecha_ultima_modificacion      = $fUltMod
            """,
            num=num,
            row_id=row_id,
            nrAnterior=str(row.get('numero_de_registro_anterior') or "").strip(),
            codSurdoc=str(row.get('codigo_surdoc') or "").strip(),
            ubicacion=str(row.get('ubicacion') or "").strip(),
            deposito=str(row.get('deposito') or "").strip(),
            estante=str(row.get('estante') or "").strip(),
            caja=str(row.get('caja_actual') or "").strip(),
            tipologia=str(row.get('tipologia') or "").strip(),
            conjunto=str(row.get('conjunto') or "").strip(),
            nombre_comun=str(row.get('nombre_comun') or "").strip(),
            nombre_especifico=str(row.get('nombre_especifico') or "").strip(),
            descripcion=str(row.get('descripcion_col') or "").strip(),
            marcas_insc=str(row.get('marcas_inscripciones') or "").strip(),
            ctxHistorico=str(row.get('contexto_historico') or "").strip(),
            bibliografia=str(row.get('bibliografia') or "").strip(),
            iconografia=str(row.get('iconografia') or "").strip(),
            notas=str(row.get('notas_investigacion') or "").strip(),
            fCreacion=str(row.get('fecha_creacion') or "").strip(),
            estCons=str(row.get('estado_conservacion') or "").strip(),
            descCons=str(row.get('descripcion_conservacion') or "").strip(),
            respCons=str(row.get('responsable_conservacion') or "").strip(),
            fActCons=str(row.get('fecha_actualizacion_conservacion') or "").strip(),
            comCons=str(row.get('comentarios_conservacion') or "").strip(),
            avaluo=row.get('avaluo'),
            procedencia=str(row.get('procedencia') or "").strip(),
            donante=str(row.get('donante') or "").strip(),
            fIngreso=str(row.get('fecha_ingreso') or "").strip(),
            respColeccion=str(row.get('responsable_coleccion') or "").strip(),
            fUltMod=str(row.get('fecha_ultima_modificacion') or "").strip(),
        )

    @staticmethod
    def _relaciones_pieza(tx, row):
        num   = str(row.get('numero_de_inventario')).strip()
        pais  = str(row.get('pais') or "").strip()
        au    = str(row.get('autor') or "").strip()
        col   = str(row.get('coleccion') or "").strip()
        cul   = str(row.get('filiacion_cultural') or "").strip()
        loc   = str(row.get('localidad') or "").strip()
        expos = [e.strip() for e in str(row.get('exposiciones') or "").split(';') if e.strip()]

        if pais:
            tx.run(
                "MERGE (pa:Pais {nombre:$pais}) "
                "WITH pa "
                "MATCH (p:Pieza {numero_inventario:$num}) "
                "MERGE (p)-[:PROCEDENTE_DE]->(pa)",
                num=num, pais=pais
            )
        if au:
            tx.run(
                "MERGE (a:Autor {nombre:$autor}) "
                "WITH a "
                "MATCH (p:Pieza {numero_inventario:$num}) "
                "MERGE (p)-[:FUE_CREADA_POR]->(a)",
                num=num, autor=au
            )
        if col:
            tx.run(
                "MERGE (c:Coleccion {nombre:$coleccion}) "
                "WITH c "
                "MATCH (p:Pieza {numero_inventario:$num}) "
                "MERGE (p)-[:PERTENECE_A]->(c)",
                num=num, coleccion=col
            )
        if cul:
            tx.run(
                "MERGE (cu:Cultura {nombre:$cultura}) "
                "WITH cu "
                "MATCH (p:Pieza {numero_inventario:$num}) "
                "MERGE (p)-[:TIENE_FILIACION]->(cu)",
                num=num, cultura=cul
            )
        if loc:
            tx.run(
                "MERGE (l:Localidad {nombre:$loc}) "
                "WITH l "
                "MATCH (p:Pieza {numero_inventario:$num}) "
                "MERGE (p)-[:UBICADO_EN]->(l)",
                num=num, loc=loc
            )
        for expo in expos:
            tx.run(
                "MERGE (e:Exposicion {titulo:$titulo}) "
                "WITH e "
                "MATCH (p:Pieza {numero_inventario:$num}) "
                "MERGE (p)-[:EN_EXPOSICION]->(e)",
                num=num, titulo=expo
            )

    @staticmethod
    def _componentes(tx, row):
        num   = str(row.get('numero_de_inventario')).strip()
        letra = str(row.get('letra') or "").strip()
        if not letra:
            # Pieza sin componentes: técnicas y materiales a nivel pieza
            for mat in [m.strip() for m in str(row.get('materialidad') or "").split(';') if m.strip()]:
                tx.run(
                    "MERGE (m:Material {nombre:$mat}) "
                    "WITH m "
                    "MATCH (p:Pieza {numero_inventario:$num}) "
                    "MERGE (p)-[:HECHO_DE]->(m)",
                    num=num, mat=mat
                )
            for tec in [t.strip() for t in str(row.get('tecnica') or "").split(';') if t.strip()]:
                tx.run(
                    "MERGE (t:Tecnica {nombre:$tec}) "
                    "WITH t "
                    "MATCH (p:Pieza {numero_inventario:$num}) "
                    "MERGE (p)-[:USO_TECNICA]->(t)",
                    num=num, tec=tec
                )
            return

        # Creamos nodo Componente
        tx.run(
            """
            CREATE (c:Componente {
              pieza_numero: $num,
              letra: $letra,
              nombre_comun: $nc,
              nombre_atribuido: $na,
              descripcion:   $desc,
              funcion:       $func,
              forma:         $forma,
              marcas_inscripciones: $marcas,
              estado_conservacion:  $estc,
              peso_kg: $peso,
              alto_cm: $alto, ancho_cm: $ancho,
              profundidad_cm: $profundidad,
              diametro_cm:    $diametro,
              espesor_mm:     $espesor
            })
            """,
            num=num,
            letra=letra,
            nc=str(row.get('nombre_comun') or "").strip(),
            na=str(row.get('nombre_especifico') or "").strip(),
            desc=str(row.get('descripcion_col') or "").strip(),
            func=str(row.get('funcion') or "").strip(),
            forma=str(row.get('forma') or "").strip(),
            marcas=str(row.get('marcas_inscripciones') or "").strip(),
            estc=str(row.get('estado_individual_conservacion') or "").strip(),
            peso=(float(row.get('peso_(gr)',0)) / 1000.0) if row.get('peso_(gr)') else None,
            alto=float(row.get('alto_o_largo_(cm)',0)) or None,
            ancho=float(row.get('ancho_(cm)',0)) or None,
            profundidad=float(row.get('profundidad_(cm)',0)) or None,
            diametro=float(row.get('diametro_(cm)',0)) or None,
            espesor=float(row.get('espesor_(mm)',0)) or None
        )

        # Relación Pieza -> Componente
        tx.run(
            """
            MATCH (p:Pieza {numero_inventario:$num}), (c:Componente {pieza_numero:$num, letra:$letra})
            MERGE (p)-[:TIENE_COMPONENTE]->(c)
            """,
            num=num, letra=letra
        )

        # Materiales del componente
        for mat in [m.strip() for m in str(row.get('materialidad') or "").split(';') if m.strip()]:
            tx.run(
                "MERGE (m:Material {nombre:$m}) "
                "WITH m "
                "MATCH (c:Componente {pieza_numero:$num, letra:$letra}) "
                "MERGE (c)-[:HECHO_DE]->(m)",
                num=num, letra=letra, m=mat
            )

        # Técnicas del componente
        for tec in [t.strip() for t in str(row.get('tecnica') or "").split(';') if t.strip()]:
            tx.run(
                "MERGE (t:Tecnica {nombre:$t}) "
                "WITH t "
                "MATCH (c:Componente {pieza_numero:$num, letra:$letra}) "
                "MERGE (c)-[:USO_TECNICA]->(t)",
                num=num, letra=letra, t=tec
            )

    @staticmethod
    def _importar_imagen(tx, filename, fullpath):
        """
        filename: '123_A.jpg' o '456.jpg'
        fullpath: '/imagenes/123_A.jpg'
        """
        nombre, _ = os.path.splitext(filename)
        parts = nombre.split('_')
        num   = parts[0]
        letra = parts[1] if len(parts) > 1 else None

        # Crear nodo Imagen
        tx.run(
            """
            CREATE (i:Imagen {
              id: $uuid,
              ruta: $ruta,
              descripcion: $desc
            })
            """,
            uuid=str(uuid4()),
            ruta=fullpath.replace("\\", "/"),
            desc=""
        )

        # Relacionar
        if letra:
            tx.run(
                """
                MATCH (i:Imagen {ruta:$ruta})
                MATCH (c:Componente {pieza_numero:$num, letra:$letra})
                MERGE (i)-[:ES_IMAGEN_DE_COMPONENTE]->(c)
                """,
                ruta=fullpath.replace("\\", "/"),
                num=num, letra=letra
            )
        else:
            tx.run(
                """
                MATCH (i:Imagen {ruta:$ruta})
                MATCH (p:Pieza {numero_inventario:$num})
                MERGE (i)-[:ES_IMAGEN_DE]->(p)
                """,
                ruta=fullpath.replace("\\", "/"),
                num=num
            )
