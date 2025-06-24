# api/models.py
from neomodel import StructuredNode, StringProperty, IntegerProperty, UniqueIdProperty, RelationshipTo

class Autor(StructuredNode):
    nombre = StringProperty()

class Pais(StructuredNode):
    nombre = StringProperty()

class Localidad(StructuredNode):
    nombre = StringProperty()
    pais = RelationshipTo(Pais, 'PERTENECE_A')

class Material(StructuredNode):
    nombre = StringProperty()

class Tecnica(StructuredNode):
    nombre = StringProperty()

class Coleccion(StructuredNode):
    nombre = StringProperty()

class Imagen(StructuredNode):
    file_name = StringProperty()
    descripcion = StringProperty()

class Componente(StructuredNode):
    uid = UniqueIdProperty()
    pieza_id = IntegerProperty(index=True)  # número de inventario de la pieza
    letra     = StringProperty(index=True)
    nombre    = StringProperty(index=True)

class Pieza(StructuredNode):
    # Identificador interno único (UUID)
    uid = UniqueIdProperty()
    numero_de_inventario = IntegerProperty(index=True)
    nombre = StringProperty(index=True)
    descripcion = StringProperty()
    componentes = RelationshipTo(Componente, 'TIENE_COMPONENTE')
    imagenes = RelationshipTo(Imagen, 'TIENE_IMAGEN')
    autores = RelationshipTo(Autor, 'CREADO_POR')
    pais = RelationshipTo(Pais, 'PROCEDENTE_DE')
    localidad = RelationshipTo(Localidad, 'LOCALIZADO_EN')
    materiales = RelationshipTo(Material, 'HECHO_DE')
    tecnicas = RelationshipTo(Tecnica, 'HECHO_CON')
    colecciones = RelationshipTo(Coleccion, 'PERTENECE_A')
