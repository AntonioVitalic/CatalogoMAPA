# backend/api/management/commands/import_mapa.py

import os
import re
import time
import pandas as pd
from pathlib import Path
from django.core.management.base import BaseCommand
from api.neo4j import get_driver

class Command(BaseCommand):
    help = "Importa piezas y componentes desde un Excel, creando nodos/relaciones en Neo4j."

    def add_arguments(self, parser):
        parser.add_argument('--excel',   type=str, help='Ruta al archivo Excel de inventario')
        parser.add_argument('--images_dir', type=str, help='Directorio con imágenes')
    
    def handle(self, *args, **options):
        start_time = time.monotonic()
        # Determinar rutas de Excel e imágenes
        BASE = Path(__file__).resolve().parents[3]
        excel_path = Path(options.get('excel')) if options.get('excel') else BASE / 'inventario.xlsx'
        images_dir = Path(options.get('images_dir')) if options.get('images_dir') else BASE / 'imagenes'

        if not excel_path.exists():
            self.stdout.write(self.style.ERROR(f"❌ Excel no encontrado: {excel_path}"))
            return
        if not images_dir.is_dir():
            self.stdout.write(self.style.ERROR(f"❌ Carpeta de imágenes no existe: {images_dir}"))
            return

        # Conectar a Neo4j y limpiar la base de datos actual
        driver = get_driver()
        with driver.session() as session:
            session.execute_write(lambda tx: tx.run("MATCH (n) DETACH DELETE n"))
        
            # Leer y limpiar el Excel
            df = pd.read_excel(excel_path, header=1)
            # Eliminar columnas vacías o innecesarias
            to_drop = [df.columns[10], 'Unnamed: 46']
            df.drop(columns=to_drop, inplace=True, errors='ignore')
            # Rellenar NaN: numéricos con 0, objetos con cadena vacía
            num_cols = df.select_dtypes(include=['int64','float64']).columns
            obj_cols = df.select_dtypes(include=['object']).columns
            df[num_cols] = df[num_cols].fillna(0)
            df[obj_cols] = df[obj_cols].fillna("")
            # Ordenar por número de inventario
            df['__num'] = pd.to_numeric(df['numero_de_inventario'], errors='coerce')
            df = df[df['__num'].notnull()]
            df.sort_values(by='__num', inplace=True)
            df['numero_de_inventario'] = df['__num'].astype(int).astype(str)
            df.drop(columns='__num', inplace=True)

            # Iterar filas e insertar datos en Neo4j
            for _, row in df.iterrows():
                num = str(row['numero_de_inventario']).strip()
                if not num:
                    continue

                # Datos de ejemplo extraídos de la fila
                pais = row.get('pais', '').strip()
                localidad = row.get('localidad', '').strip()
                autor = row.get('autor', '').strip()
                coleccion = row.get('coleccion', '').strip()

                # 1) Crear (o MERGE) nodos de Pais, Localidad, Autor, Coleccion si existen
                if pais:
                    session.execute_write(lambda tx: tx.run(
                        "MERGE (a:Pais {nombre: $pais})", pais=pais))
                if localidad and pais:
                    session.execute_write(lambda tx: tx.run(
                        "MERGE (l:Localidad {nombre: $localidad})-[:PERTENECE_A]->(a:Pais {nombre: $pais})",
                        localidad=localidad, pais=pais))
                if autor:
                    session.execute_write(lambda tx: tx.run(
                        "MERGE (au:Autor {nombre: $autor})", autor=autor))
                if coleccion:
                    session.execute_write(lambda tx: tx.run(
                        "MERGE (c:Coleccion {nombre: $coleccion})", coleccion=coleccion))

                # 2) Crear/actualizar el nodo Pieza con todos los campos
                session.execute_write(lambda tx: tx.run(
                    """
                    MERGE (p:Pieza {numero_inventario: $num})
                    SET
                    p.revision                           = $revision,
                    p.numero_registro_anterior           = $nrAnterior,
                    p.codigo_surdoc                      = $codigoSurdoc,
                    p.ubicacion                          = $ubicacion,
                    p.deposito                           = $deposito,
                    p.estante                            = $estante,
                    p.caja_actual                        = $cajaActual,
                    p.tipologia                          = $tipologia,
                    p.coleccion                          = $coleccion,
                    p.clasificacion                      = $clasificacion,
                    p.conjunto                           = $conjunto,
                    p.nombre_comun                       = $nombreComun,
                    p.nombre_especifico                  = $nombreEspecifico,
                    p.fecha_creacion                     = $fechaCreacion,
                    p.descripcion                        = $descripcion,
                    p.marcas_inscripciones               = $marcas,
                    p.contexto_historico                 = $contextoHistorico,
                    p.bibliografia                       = $bibliografia,
                    p.iconografia                        = $iconografia,
                    p.notas_investigacion                = $notasInvestigacion,
                    p.estado_conservacion                = $estadoConservacion,
                    p.descripcion_conservacion           = $descConservacion,
                    p.responsable_conservacion           = $respConservacion,
                    p.fecha_actualizacion_conservacion   = $fechaActConservacion,
                    p.comentarios_conservacion           = $comentariosConservacion,
                    p.avaluo                             = $avaluo,
                    p.procedencia                        = $procedencia,
                    p.donante                            = $donante,
                    p.fecha_ingreso                      = $fechaIngreso,
                    p.responsable_coleccion              = $respColeccion,
                    p.fecha_ultima_modificacion          = $fechaUltMod
                    """,
                    num                         = num,
                    revision                    = row.get('Revisión'),
                    nrAnterior                  = row.get('numero_de registro_anterior'),
                    codigoSurdoc                = row.get('SURDOC'),
                    ubicacion                   = row.get('ubicacion'),
                    deposito                    = row.get('deposito'),
                    estante                     = row.get('estante'),
                    cajaActual                  = row.get('caja_actual'),
                    tipologia                   = row.get('tipologia'),
                    coleccion                   = row.get('coleccion'),
                    clasificacion               = row.get('clasificacion'),
                    conjunto                    = row.get('conjunto'),
                    nombreComun                 = row.get('nombre_comun'),
                    nombreEspecifico            = row.get('nombre_especifico'),
                    fechaCreacion               = row.get('fecha_de_creacion'),
                    descripcion                 = row.get('descripcion_col'),
                    marcas                      = row.get('marcas_o_inscripciones'),
                    contextoHistorico           = row.get('contexto_historico'),
                    bibliografia                = row.get('bibliografia'),
                    iconografia                 = row.get('iconografia'),
                    notasInvestigacion          = row.get('notas_investigacion'),
                    estadoConservacion          = row.get('estado_genral_de_conservacion'),
                    descConservacion            = row.get('descripcion_cr'),
                    respConservacion            = row.get('responsable_conservacion'),
                    fechaActConservacion        = row.get('fecha_actualizacion_cr'),
                    comentariosConservacion      = row.get('comentarios_cr'),
                    avaluo                      = row.get('avaluo'),
                    procedencia                 = row.get('procedencia'),
                    donante                     = row.get('donante'),
                    fechaIngreso                = row.get('fecha_ingreso'),
                    respColeccion               = row.get('responsable_coleccion'),
                    fechaUltMod                 = row.get('fecha_ultima_modificacion'),
                ))


                # 3) Crear relaciones de la Pieza con País, Autor, Colección
                if pais:
                    session.execute_write(lambda tx: tx.run(
                        "MATCH (p:Pieza {numero_inventario: $num}), (a:Pais {nombre: $pais}) "
                        "CREATE (p)-[:PROCEDENTE_DE]->(a)",
                        num=num, pais=pais))
                if autor:
                    session.execute_write(lambda tx: tx.run(
                        "MATCH (p:Pieza {numero_inventario: $num}), (au:Autor {nombre: $autor}) "
                        "CREATE (p)-[:FUE_CREADA_POR]->(au)",
                        num=num, autor=autor))
                if coleccion:
                    session.execute_write(lambda tx: tx.run(
                        "MATCH (p:Pieza {numero_inventario: $num}), (c:Coleccion {nombre: $coleccion}) "
                        "CREATE (p)-[:PERTENECE_A]->(c)",
                        num=num, coleccion=coleccion))

                # 4) Componentes: si hay 'letra' en la fila, crear nodo Componente y relaciones
                letra = str(row.get('letra', '')).strip()
                if letra:
                    # Crear nodo Componente asociado a esta Pieza
                    session.execute_write(lambda tx: tx.run(
                        "CREATE (cmp:Componente {pieza_numero: $num, letra: $letra, nombre_comun: $nom, peso_kg: $peso})",
                        num=num, letra=letra,
                        nom=row.get('nombre_comun', None),
                        peso=(float(row.get('peso_(gr)', 0)) / 1000.0) if row.get('peso_(gr)') not in (None, "", 0) else None
                    ))
                    # Relación Pieza->Componente
                    session.execute_write(lambda tx: tx.run(
                        "MATCH (p:Pieza {numero_inventario: $num}), (cmp:Componente {pieza_numero: $num, letra: $letra}) "
                        "CREATE (p)-[:TIENE_COMPONENTE]->(cmp)",
                        num=num, letra=letra))
                    # Materiales del componente (campo separado por ';')
                    materiales = str(row.get('materialidad', '')).split(';')
                    for mat in materiales:
                        mat = mat.strip()
                        if mat:
                            session.execute_write(lambda tx, m=mat: tx.run(
                                "MERGE (m:Material {nombre: $nombre})", nombre=m))
                            session.execute_write(lambda tx, m=mat: tx.run(
                                "MATCH (cmp:Componente {pieza_numero: $num, letra: $letra}), (m:Material {nombre: $nombre}) "
                                "CREATE (cmp)-[:HECHO_DE]->(m)",
                                num=num, letra=letra, nombre=m))
                    # Técnicas del componente (campo separado por ';')
                    tecnicas = str(row.get('tecnica', '')).split(';')
                    for tec in tecnicas:
                        tec = tec.strip()
                        if tec:
                            session.execute_write(lambda tx, t=tec: tx.run(
                                "MERGE (t:Tecnica {nombre: $nombre})", nombre=t))
                            session.execute_write(lambda tx, t=tec: tx.run(
                                "MATCH (cmp:Componente {pieza_numero: $num, letra: $letra}), (t:Tecnica {nombre: $nombre}) "
                                "CREATE (cmp)-[:USO_TECNICA]->(t)",
                                num=num, letra=letra, nombre=t))

            # 5) Asociar imágenes recorriendo la carpeta
            procesadas = 0
            for fn in os.listdir(images_dir):
                full_path = images_dir / fn
                if not full_path.is_file():
                    continue
                name, ext = os.path.splitext(fn)
                if ext.lower().strip('.') not in ('jpg','jpeg','png','tif','tiff'):
                    continue
                m = re.match(r'^0*(\d+)([A-Za-z]?)(?:.*)$', name)
                if not m:
                    continue
                num_str, letra = m.group(1), (m.group(2) or '')
                # Crear nodo Imagen con su ruta (o nombre de archivo)
                session.execute_write(lambda tx: tx.run(
                    "CREATE (img:Imagen {ruta: $ruta})", ruta=str(full_path)))
                # Relacionar Imagen a Pieza
                session.execute_write(lambda tx: tx.run(
                    "MATCH (p:Pieza {numero_inventario: $num}), (img:Imagen {ruta: $ruta}) "
                    "CREATE (img)-[:ES_IMAGEN_DE]->(p)",
                    num=num_str, ruta=str(full_path)))
                # Si tiene letra, relacionar a Componente
                if letra:
                    session.execute_write(lambda tx: tx.run(
                        "MATCH (cmp:Componente {pieza_numero: $num, letra: $letra}), (img:Imagen {ruta: $ruta}) "
                        "CREATE (img)-[:ES_IMAGEN_DE_COMPONENTE]->(cmp)",
                        num=num_str, letra=letra, ruta=str(full_path)))
                procesadas += 1

        driver.close()
        elapsed = time.monotonic() - start_time
        self.stdout.write(self.style.SUCCESS(
            f"✅ Importación finalizada: {len(df)} piezas procesadas, "
            f"{procesadas} imágenes asociadas en {elapsed:.2f} segundos."
        ))
