# api/models.py (Neo4j / neomodel)
from neomodel import (
    StructuredNode, StringProperty, IntegerProperty, FloatProperty,
    UniqueIdProperty, RelationshipTo, BooleanProperty, ArrayProperty
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
    revision = StringProperty()

    numero_registro_anterior = StringProperty()
    codigo_surdoc = StringProperty()

    ubicacion = StringProperty()
    deposito = StringProperty()
    estante = StringProperty()
    caja_actual = StringProperty()

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

class Pieza(StructuredNode):
    uid = UniqueIdProperty()

    # Clave pública que usaremos como “id” para el API (entero)
    numero_inventario = StringProperty(index=True)
    numero_inventario_int = IntegerProperty(index=True)  # para ordenar rápido

    letra = StringProperty(index=True)
    revision = StringProperty()

    numero_registro_anterior = StringProperty()
    codigo_surdoc = StringProperty()

    ubicacion = StringProperty()
    deposito = StringProperty()
    estante = StringProperty()
    caja_actual = StringProperty()

    tipologia = StringProperty()
    coleccion  = RelationshipTo(Coleccion, 'PERTENECE_A')
    clasificacion = StringProperty()
    conjunto = StringProperty()
    nombre_comun = StringProperty()
    nombre_especifico = StringProperty()
    autor      = RelationshipTo(Autor, 'CREADO_POR')
    filiacion_cultural = RelationshipTo(Cultura, 'FILIACION')
    pais       = RelationshipTo(Pais, 'PROCEDENTE_DE')
    localidad  = RelationshipTo(Localidad, 'LOCALIZADO_EN')
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

    avaluo = StringProperty()
    procedencia = StringProperty()
    donante = StringProperty()
    fecha_ingreso = StringProperty()    
    responsable_coleccion = StringProperty()
    fecha_ultima_modificacion = StringProperty()

    etiqueta_eliminado = BooleanProperty(default=False)
    
    componentes = RelationshipTo(Componente, 'TIENE_COMPONENTE')
    imagenes    = RelationshipTo(Imagen, 'TIENE_IMAGEN')
