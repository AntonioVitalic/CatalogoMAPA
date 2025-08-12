# api/models.py (Neo4j / neomodel)
from neomodel import (
    StructuredNode, StringProperty, IntegerProperty, FloatProperty,
    UniqueIdProperty, RelationshipTo
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
    # vínculo “lógico” con la pieza por su número
    pieza_numero_inventario = StringProperty(index=True)  # "27"
    letra = StringProperty(index=True)
    nombre_comun = StringProperty()
    nombre_atribuido = StringProperty()
    descripcion = StringProperty()
    funcion = StringProperty()
    forma = StringProperty()

    # dimensiones / peso
    peso_kg = FloatProperty()
    alto_cm = FloatProperty()
    ancho_cm = FloatProperty()
    profundidad_cm = FloatProperty()
    diametro_cm = FloatProperty()
    espesor_mm = FloatProperty()

    estado_conservacion = StringProperty()

    # relaciones
    materiales = RelationshipTo(Material, 'USO_MATERIAL')
    tecnica    = RelationshipTo(Tecnica,  'USO_TECNICA')
    imagenes   = RelationshipTo(Imagen,   'TIENE_IMAGEN')

class Pieza(StructuredNode):
    uid = UniqueIdProperty()

    # Clave pública que usaremos como “id” para el API (entero)
    numero_inventario = StringProperty(index=True)
    numero_inventario_int = IntegerProperty(index=True)  # para ordenar rápido

    # Campos 1:1 con tu modelo sqlite
    revision = StringProperty()
    numero_registro_anterior = StringProperty()
    codigo_surdoc = StringProperty()
    ubicacion = StringProperty()
    deposito = StringProperty()
    estante = StringProperty()
    caja_actual = StringProperty()
    tipologia = StringProperty()
    clasificacion = StringProperty()
    conjunto = StringProperty()
    nombre_comun = StringProperty()
    nombre_especifico = StringProperty()
    fecha_creacion = StringProperty()
    descripcion = StringProperty()
    marcas_inscripciones = StringProperty()
    contexto_historico = StringProperty()
    bibliografia = StringProperty()
    iconografia = StringProperty()
    notas_investigacion = StringProperty()
    avaluo = StringProperty()
    procedencia = StringProperty()
    donante = StringProperty()
    fecha_ingreso = StringProperty()
    estado_conservacion = StringProperty()
    descripcion_conservacion = StringProperty()
    responsable_conservacion = StringProperty()
    fecha_actualizacion_conservacion = StringProperty()
    comentarios_conservacion = StringProperty()
    responsable_coleccion = StringProperty()
    fecha_ultima_modificacion = StringProperty()

    # relaciones
    pais       = RelationshipTo(Pais, 'PROCEDENTE_DE')
    localidad  = RelationshipTo(Localidad, 'LOCALIZADO_EN')
    filiacion_cultural = RelationshipTo(Cultura, 'FILIACION')
    coleccion  = RelationshipTo(Coleccion, 'PERTENECE_A')
    autor      = RelationshipTo(Autor, 'CREADO_POR')
    exposiciones = RelationshipTo(Exposicion, 'EXHIBIDO_EN')
    materiales = RelationshipTo(Material, 'HECHO_DE')
    tecnica    = RelationshipTo(Tecnica,  'HECHO_CON')
    componentes = RelationshipTo(Componente, 'TIENE_COMPONENTE')
    imagenes    = RelationshipTo(Imagen, 'TIENE_IMAGEN')
