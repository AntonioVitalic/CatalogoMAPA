# api/models.py (Neo4j / neomodel)
from neomodel import (
    StructuredNode, StringProperty, IntegerProperty, FloatProperty,
    UniqueIdProperty, RelationshipTo, BooleanProperty, ArrayProperty,
    DateTimeProperty,
)

class Pais(StructuredNode):
    nombre = StringProperty(index=True)

class Localidad(StructuredNode):
    nombre = StringProperty(index=True)
    # relación Localidad -> Pais (para mirrors)
    pais = RelationshipTo(Pais, 'PERTENECE_A')

class Cultura(StructuredNode):
    nombre = StringProperty(index=True)

class Coleccion(StructuredNode):
    nombre = StringProperty(index=True)

class Autor(StructuredNode):
    nombre = StringProperty(index=True)

class Tipologia(StructuredNode):
    nombre = StringProperty(index=True)

class Exposicion(StructuredNode):
    titulo = StringProperty(index=True)
    fecha_inicio = StringProperty()  # texto libre como en sqlite
    fecha_fin = StringProperty()

class Material(StructuredNode):
    nombre = StringProperty(index=True)

class Tecnica(StructuredNode):
    nombre = StringProperty(index=True)

class Imagen(StructuredNode):
    file_name  = StringProperty()      # p. ej. "00027a.jpg"
    descripcion = StringProperty()     # opcional

class Componente(StructuredNode):
    uid = UniqueIdProperty()
    pieza_numero_inventario = StringProperty(index=True)
    letra = StringProperty(index=True)
    unidad_relacionada = StringProperty()

    numero_registro_anterior = StringProperty()
    codigo_surdoc = StringProperty()

    ubicacion = StringProperty()
    deposito = IntegerProperty(required=False)
    estante_o_fullspace = StringProperty()
    cajas_o_nivel = StringProperty()

    tipologia = StringProperty()
    coleccion = StringProperty()
    clasificacion = StringProperty()
    conjunto = StringProperty()
    nombre_comun = StringProperty()
    nombre_especifico = StringProperty()
    autor = StringProperty()
    filiacion_cultural = StringProperty()
    pais = StringProperty()
    localidad = StringProperty()
    fecha_creacion = StringProperty()
    descripcion_col = StringProperty()

    marcas_inscripciones = StringProperty()
    tecnica = StringProperty()
    materialidad = StringProperty()
    descripcion_cr = StringProperty()
    alto_cm = FloatProperty()
    ancho_cm = FloatProperty()
    profundidad_cm = FloatProperty()
    diametro_cm = FloatProperty()
    espesor_mm = FloatProperty()
    peso_gr = FloatProperty()

    funcion = StringProperty()
    contexto_historico = StringProperty()
    bibliografia = StringProperty()
    iconografia = StringProperty()
    notas_investigacion = StringProperty()

    estado_conservacion = StringProperty()
    responsable_conservacion = StringProperty()
    fecha_actualizacion_conservacion = StringProperty()
    comentarios_conservacion = StringProperty()

    # exposiciones = StringProperty()
    exposiciones = ArrayProperty(StringProperty(), default=[])
    avaluo = StringProperty()
    procedencia = StringProperty()
    donante = StringProperty()
    fecha_ingreso = StringProperty()
    responsable_coleccion = StringProperty()
    fecha_ultima_modificacion = StringProperty()
    # relaciones
    # materiales = RelationshipTo(Material, 'USO_MATERIAL')
    # tecnica    = RelationshipTo(Tecnica,  'USO_TECNICA')
    imagenes   = RelationshipTo(Imagen,   'TIENE_IMAGEN')
    autor_rel = RelationshipTo(Autor, 'CREADO_POR')
    coleccion_rel = RelationshipTo(Coleccion, 'PERTENECE_A')
    pais_rel = RelationshipTo(Pais, 'PROCEDENTE_DE')
    localidad_rel = RelationshipTo(Localidad, 'LOCALIZADO_EN')
    filiacion_cultural_rel = RelationshipTo(Cultura, 'FILIACION')
    tipologias = RelationshipTo(Tipologia, 'TIENE_TIPOLOGIA')
    exposiciones_rel = RelationshipTo(Exposicion, 'EXHIBIDO_EN')

class Pieza(StructuredNode):
    uid = UniqueIdProperty()

    # Clave pública que usaremos como "id" para el API (entero).
    # unique_index=True crea CONSTRAINT UNIQUE en Neo4j: dos POST simultáneos
    # con el mismo número fallan a nivel de DB en vez de crear duplicados
    # (que romperían retrieve/update/delete con MultipleNodesReturned).
    # Después de cambiar este campo: python manage.py install_labels
    numero_inventario = StringProperty(unique_index=True)
    numero_inventario_int = IntegerProperty(index=True)  # para ordenar rápido
    created_at = DateTimeProperty(default_now=True)

    letra = StringProperty(index=True)
    unidad_relacionada = StringProperty()

    numero_registro_anterior = StringProperty()
    codigo_surdoc = StringProperty()

    ubicacion = StringProperty()
    deposito = IntegerProperty(required=False)
    estante_o_fullspace = StringProperty()
    cajas_o_nivel = StringProperty()

    tipologia = StringProperty()
    coleccion = StringProperty()
    clasificacion = StringProperty()
    conjunto = StringProperty()
    nombre_comun = StringProperty()
    nombre_especifico = StringProperty()
    autor = StringProperty()
    filiacion_cultural = StringProperty()
    pais = StringProperty()
    localidad = StringProperty()
    fecha_creacion = StringProperty()
    descripcion_col = StringProperty()

    marcas_inscripciones = StringProperty()
    tecnica    = RelationshipTo(Tecnica,  'HECHO_CON')
    materiales = RelationshipTo(Material, 'HECHO_DE')
    descripcion_cr = StringProperty()
    alto_cm = FloatProperty()
    ancho_cm = FloatProperty()
    profundidad_cm = FloatProperty()
    diametro_cm = FloatProperty()
    espesor_mm = FloatProperty()
    peso_gr = FloatProperty()

    funcion = StringProperty()
    contexto_historico = StringProperty()
    bibliografia = StringProperty()
    iconografia = StringProperty()
    notas_investigacion = StringProperty()

    estado_conservacion = StringProperty()
    responsable_conservacion = StringProperty()
    fecha_actualizacion_conservacion = StringProperty()
    comentarios_conservacion = StringProperty()
    
    # exposiciones = RelationshipTo(Exposicion, 'EXHIBIDO_EN')
    exposiciones = ArrayProperty(StringProperty(), default=[])
    exposiciones_rel = RelationshipTo(Exposicion, 'EXHIBIDO_EN')

    avaluo = StringProperty()
    procedencia = StringProperty()
    donante = StringProperty()
    fecha_ingreso = StringProperty()
    responsable_coleccion = StringProperty()
    fecha_ultima_modificacion = StringProperty()

    etiqueta_eliminado = BooleanProperty(default=False)
    
    componentes = RelationshipTo(Componente, 'TIENE_COMPONENTE')
    imagenes = RelationshipTo(Imagen, 'TIENE_IMAGEN')
    tipologias = RelationshipTo(Tipologia, 'TIENE_TIPOLOGIA')
    autor_rel = RelationshipTo(Autor, 'CREADO_POR')
    coleccion_rel = RelationshipTo(Coleccion, 'PERTENECE_A')
    pais_rel = RelationshipTo(Pais, 'PROCEDENTE_DE')
    localidad_rel = RelationshipTo(Localidad, 'LOCALIZADO_EN')
    filiacion_cultural_rel = RelationshipTo(Cultura, 'FILIACION')
