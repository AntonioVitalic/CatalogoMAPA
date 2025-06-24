# api/serializers.py
from rest_framework import serializers
from .models import Pieza, Componente, Imagen, Autor, Pais, Localidad, Material, Tecnica, Coleccion

class AutorSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='id')
    nombre = serializers.CharField()

class PaisSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='id')
    nombre = serializers.CharField()

class LocalidadSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='id')
    nombre = serializers.CharField()
    pais = serializers.PrimaryKeyRelatedField(read_only=True)

class MaterialSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='id')
    nombre = serializers.CharField()

class TecnicaSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='id')
    nombre = serializers.CharField()

class ColeccionSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='id')
    nombre = serializers.CharField()

class ImagenSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='id')
    file_name = serializers.CharField()
    descripcion = serializers.CharField(allow_blank=True)

class ComponenteSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='id')
    nombre = serializers.CharField()
    descripcion = serializers.CharField(allow_blank=True)

class PiezaSerializer(serializers.Serializer):
    id = serializers.ReadOnlyField(source='id')
    nombre = serializers.CharField()
    descripcion = serializers.CharField(allow_blank=True)
    componentes = serializers.ListField(child=serializers.IntegerField(), read_only=True)
    imagenes = serializers.ListField(child=serializers.IntegerField(), read_only=True)
    autores = serializers.ListField(child=serializers.IntegerField(), read_only=True)
    pais = serializers.ListField(child=serializers.IntegerField(), read_only=True)
    localidad = serializers.ListField(child=serializers.IntegerField(), read_only=True)
    materiales = serializers.ListField(child=serializers.IntegerField(), read_only=True)
    tecnicas = serializers.ListField(child=serializers.IntegerField(), read_only=True)
    colecciones = serializers.ListField(child=serializers.IntegerField(), read_only=True)

    def to_representation(self, instance):
        """Convertir relaciones de nodos a listas de IDs relacionados."""
        data = super().to_representation(instance)
        # Extraemos IDs de los nodos relacionados
        data['componentes'] = [c.id for c in instance.componentes.all()]
        data['imagenes'] = [i.id for i in instance.imagenes.all()]
        data['autores'] = [a.id for a in instance.autores.all()]
        data['pais'] = [p.id for p in instance.pais.all()]
        data['localidad'] = [l.id for l in instance.localidad.all()]
        data['materiales'] = [m.id for m in instance.materiales.all()]
        data['tecnicas'] = [t.id for t in instance.tecnicas.all()]
        data['colecciones'] = [c.id for c in instance.colecciones.all()]
        return data
