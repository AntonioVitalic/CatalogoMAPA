# api/serializers.py
from rest_framework import serializers
from .models import (
    Pieza, Componente, Imagen, Autor, Pais, Localidad,
    Material, Tecnica, Coleccion
)

class AutorSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='element_id')
    nombre = serializers.CharField()

class PaisSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='element_id')
    nombre = serializers.CharField()

class LocalidadSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='element_id')
    nombre = serializers.CharField()
    pais = serializers.ListField(child=serializers.CharField(), read_only=True)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['pais'] = [p.element_id for p in instance.pais.all()]
        return data

class MaterialSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='element_id')
    nombre = serializers.CharField()

class TecnicaSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='element_id')
    nombre = serializers.CharField()

class ColeccionSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='element_id')
    nombre = serializers.CharField()

class ImagenSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='element_id')
    file_name = serializers.CharField()
    descripcion = serializers.CharField(allow_blank=True)

class ComponenteSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='element_id')
    pieza_id = serializers.IntegerField(read_only=True)
    letra = serializers.CharField(allow_blank=True, read_only=True)
    nombre = serializers.CharField()

class PiezaSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='element_id')
    nombre = serializers.CharField()
    descripcion = serializers.CharField(allow_blank=True)

    componentes  = serializers.ListField(child=serializers.CharField(), read_only=True)
    imagenes     = serializers.ListField(child=serializers.CharField(), read_only=True)
    autores      = serializers.ListField(child=serializers.CharField(), read_only=True)
    pais         = serializers.ListField(child=serializers.CharField(), read_only=True)
    localidad    = serializers.ListField(child=serializers.CharField(), read_only=True)
    materiales   = serializers.ListField(child=serializers.CharField(), read_only=True)
    tecnicas     = serializers.ListField(child=serializers.CharField(), read_only=True)
    colecciones  = serializers.ListField(child=serializers.CharField(), read_only=True)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['componentes'] = [c.element_id for c in instance.componentes.all()]
        data['imagenes']    = [i.element_id for i in instance.imagenes.all()]
        data['autores']     = [a.element_id for a in instance.autores.all()]
        data['pais']        = [p.element_id for p in instance.pais.all()]
        data['localidad']   = [l.element_id for l in instance.localidad.all()]
        data['materiales']  = [m.element_id for m in instance.materiales.all()]
        data['tecnicas']    = [t.element_id for t in instance.tecnicas.all()]
        data['colecciones'] = [c.element_id for c in instance.colecciones.all()]
        return data
