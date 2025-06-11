# backend\api\serializers.py

from rest_framework import serializers
from .models import Pieza, Componente, Imagen, Pais, Localidad, Cultura, Coleccion, Autor, Exposicion, Material, Tecnica

class ImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Imagen
        fields = ['id', 'imagen', 'descripcion']  # 'imagen' field will return the URL if MEDIA_URL is configured in DRF

class ComponenteSerializer(serializers.ModelSerializer):
    # Nest images for this component
    imagenes = ImagenSerializer(many=True, read_only=True)
    class Meta:
        model = Componente
        fields = [
            'id', 'pieza', 'letra', 'nombre_comun', 'nombre_atribuido', 'descripcion',
            'funcion', 'forma', 'materiales', 'tecnica', 'marcas_inscripciones',
            'peso_kg', 'alto_cm', 'ancho_cm', 'profundidad_cm', 'diametro_cm', 'espesor_mm',
            'estado_conservacion', 'imagenes'
        ]

class PiezaSerializer(serializers.ModelSerializer):
    componentes = ComponenteSerializer(many=True, read_only=True)
    imagenes = ImagenSerializer(many=True, read_only=True)
    # Represent foreign keys by name in addition to ID (for easier reading):
    pais = serializers.SlugRelatedField(queryset=Pais.objects.all(), slug_field='nombre', allow_null=True)
    localidad = serializers.SlugRelatedField(queryset=Localidad.objects.all(), slug_field='nombre', allow_null=True)
    filiacion_cultural = serializers.SlugRelatedField(queryset=Cultura.objects.all(), slug_field='nombre', allow_null=True)
    coleccion = serializers.SlugRelatedField(queryset=Coleccion.objects.all(), slug_field='nombre', allow_null=False)
    autor = serializers.SlugRelatedField(queryset=Autor.objects.all(), slug_field='nombre', allow_null=True)
    exposiciones = serializers.SlugRelatedField(queryset=Exposicion.objects.all(), slug_field='titulo', many=True, allow_null=True, required=False)
    materiales = serializers.SlugRelatedField(queryset=Material.objects.all(), slug_field='nombre', many=True, allow_null=True, required=False)
    tecnica = serializers.SlugRelatedField(queryset=Tecnica.objects.all(), slug_field='nombre', many=True, allow_null=True, required=False)

    class Meta:
        model = Pieza
        fields = [
            'id', 'numero_inventario', 'numero_registro_anterior', 'codigo_surdoc',
            'ubicacion', 'deposito', 'estante', 'caja_actual',
            'tipologia', 'coleccion', 'clasificacion', 'conjunto',
            'nombre_especifico', 'autor', 'filiacion_cultural', 'pais', 'localidad',
            'fecha_creacion', 'descripcion', 'marcas_inscripciones',
            'contexto_historico', 'bibliografia', 'iconografia', 'notas_investigacion',
            'tecnica', 'materiales',
            'estado_conservacion', 'descripcion_conservacion', 'responsable_conservacion',
            'fecha_actualizacion_conservacion', 'comentarios_conservacion',
            'exposiciones', 'avaluo', 'procedencia', 'donante', 'fecha_ingreso',
            'responsable_coleccion', 'fecha_ultima_modificacion',
            'componentes', 'imagenes'
        ]
