# api/serializers.py
from django.conf import settings
from rest_framework import serializers
from .models import (
    Pieza, Componente, Imagen, Autor, Pais, Localidad, Cultura,
    Coleccion, Material, Tecnica
)

def _first_name(qs):
    for n in qs:
        if hasattr(n, 'nombre') and n.nombre:
            return n.nombre
        if hasattr(n, 'titulo') and n.titulo:
            return n.titulo
    return None

def _none_if_zeroish(val):
    if val is None:
        return None
    s = str(val).strip()
    return None if s in ("", "0", "0.0") else val

def _fmt_fecha_con_hora_or_nat(val):
    if val is None or str(val).strip() in ("", "0", "0.0"):
        return "NaT"
    s = str(val).strip()
    if " " in s:
        return s
    return f"{s} 00:00:00"


# -----------------------------
#  Imágenes (compat sqlite)
# -----------------------------
class ImagenOutSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    imagen = serializers.SerializerMethodField()
    descripcion = serializers.CharField(allow_blank=True, allow_null=True, required=False)

    def get_id(self, obj):
        return None

    def get_imagen(self, obj):
        request = self.context.get('request')
        rel = f"{settings.MEDIA_URL}{obj.file_name}"
        return request.build_absolute_uri(rel) if request else rel


# -----------------------------
#  Componentes (compat sqlite)
# -----------------------------
class ComponenteOutSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    pieza = serializers.IntegerField(read_only=True)
    letra = serializers.CharField(allow_blank=True)
    nombre_comun = serializers.CharField(allow_blank=True, required=False)
    nombre_atribuido = serializers.CharField(allow_blank=True, required=False)
    descripcion = serializers.CharField(allow_blank=True, required=False)
    funcion = serializers.CharField(allow_blank=True, required=False)
    forma = serializers.CharField(allow_blank=True, required=False)
    materiales = serializers.ListField(child=serializers.CharField(), read_only=True)
    tecnica = serializers.ListField(child=serializers.CharField(), read_only=True)
    marcas_inscripciones = serializers.CharField(allow_blank=True, required=False)
    peso_kg = serializers.FloatField(required=False)
    alto_cm = serializers.FloatField(required=False)
    ancho_cm = serializers.FloatField(required=False)
    profundidad_cm = serializers.FloatField(required=False)
    diametro_cm = serializers.FloatField(required=False)
    espesor_mm = serializers.FloatField(required=False)
    estado_conservacion = serializers.CharField(allow_blank=True, required=False)
    imagenes = serializers.ListField(child=serializers.DictField(), read_only=True)

    def get_id(self, c):
        return self.context.get('next_comp_id')()

    def to_representation(self, c):
        base = super().to_representation(c)
        base['pieza'] = int(c.pieza_numero_inventario)
        base['materiales'] = [m.nombre for m in c.materiales.all()]
        base['tecnica']    = [t.nombre for t in c.tecnica.all()]
        request = self.context.get('request')
        imgs, img_id = [], 0
        for i in c.imagenes.all():
            img_id += 1
            rel = f"{settings.MEDIA_URL}{i.file_name}"
            imgs.append({
                'id': img_id,
                'imagen': request.build_absolute_uri(rel) if request else rel,
                'descripcion': i.descripcion if (i.descripcion or None) else None
            })
        base['imagenes'] = imgs
        return base


# -----------------------------
#  Piezas (compat sqlite)
# -----------------------------
class PiezaOutSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    numero_inventario = serializers.CharField()
    numero_registro_anterior = serializers.CharField(allow_blank=True, required=False)
    codigo_surdoc = serializers.CharField(allow_blank=True, required=False)
    ubicacion = serializers.CharField(allow_blank=True, required=False)
    deposito = serializers.SerializerMethodField()
    estante = serializers.CharField(allow_blank=True, required=False)
    caja_actual = serializers.CharField(allow_blank=True, required=False)
    tipologia = serializers.CharField(allow_blank=True, required=False)
    coleccion = serializers.SerializerMethodField()
    clasificacion = serializers.CharField(allow_blank=True, required=False)
    conjunto = serializers.CharField(allow_blank=True, required=False)
    nombre_comun = serializers.CharField(allow_blank=True, required=False)
    nombre_especifico = serializers.CharField(allow_blank=True, required=False)
    autor = serializers.SerializerMethodField()
    filiacion_cultural = serializers.SerializerMethodField()
    pais = serializers.SerializerMethodField()
    localidad = serializers.SerializerMethodField()
    fecha_creacion = serializers.CharField(allow_blank=True, required=False)
    descripcion_col = serializers.CharField(source='descripcion', allow_blank=True, required=False)
    marcas_inscripciones = serializers.CharField(allow_blank=True, required=False)
    contexto_historico = serializers.CharField(allow_blank=True, required=False)
    bibliografia = serializers.CharField(allow_blank=True, required=False)
    iconografia = serializers.CharField(allow_blank=True, required=False)
    notas_investigacion = serializers.CharField(allow_blank=True, required=False)
    tecnica = serializers.ListField(child=serializers.CharField(), read_only=True)
    materiales = serializers.ListField(child=serializers.CharField(), read_only=True)
    estado_conservacion = serializers.CharField(allow_blank=True, required=False)
    descripcion_conservacion = serializers.SerializerMethodField()
    responsable_conservacion = serializers.CharField(allow_blank=True, required=False)
    fecha_actualizacion_conservacion = serializers.SerializerMethodField()
    comentarios_conservacion = serializers.SerializerMethodField()
    avaluo = serializers.CharField(allow_blank=True, required=False)
    procedencia = serializers.CharField(allow_blank=True, required=False)
    donante = serializers.CharField(allow_blank=True, required=False)
    fecha_ingreso = serializers.CharField(allow_blank=True, required=False)
    responsable_coleccion = serializers.CharField(allow_blank=True, required=False)
    fecha_ultima_modificacion = serializers.CharField(allow_blank=True, required=False)
    componentes = ComponenteOutSerializer(many=True, read_only=True)
    imagenes = ImagenOutSerializer(many=True, read_only=True)

    def get_id(self, p: Pieza):
        return int(p.numero_inventario)

    def get_coleccion(self, p: Pieza):
        return _first_name(p.coleccion.all())

    def get_autor(self, p: Pieza):
        return _first_name(p.autor.all())

    def get_filiacion_cultural(self, p: Pieza):
        return _first_name(p.filiacion_cultural.all())

    def get_pais(self, p: Pieza):
        return _first_name(p.pais.all())

    def get_localidad(self, p: Pieza):
        return _first_name(p.localidad.all())

    def get_deposito(self, p: Pieza):
        return _none_if_zeroish(getattr(p, 'deposito', None))

    def get_descripcion_conservacion(self, p: Pieza):
        return _none_if_zeroish(getattr(p, 'descripcion_conservacion', None))

    def get_comentarios_conservacion(self, p: Pieza):
        return _none_if_zeroish(getattr(p, 'comentarios_conservacion', None))

    def get_fecha_actualizacion_conservacion(self, p: Pieza):
        return _fmt_fecha_con_hora_or_nat(getattr(p, 'fecha_actualizacion_conservacion', None))

    def to_representation(self, p: Pieza):
        comp_counter = [0]
        def next_comp_id():
            comp_counter[0] += 1
            return comp_counter[0]
        self.fields['componentes'].context['next_comp_id'] = next_comp_id

        data = super().to_representation(p)
        data['tecnica'] = [t.nombre for t in p.tecnica.all()]
        data['materiales'] = [m.nombre for m in p.materiales.all()]

        ctx = {'request': self.context.get('request'), 'next_comp_id': next_comp_id}

        comps = sorted(p.componentes.all(), key=lambda c: c.letra or '')
        data['componentes'] = [ComponenteOutSerializer(c, context=ctx).data for c in comps]

        request = self.context.get('request')
        imgs, img_id = [], 0
        for i in p.imagenes.all():
            img_id += 1
            rel = f"{settings.MEDIA_URL}{i.file_name}"
            imgs.append({
                'id': img_id,
                'imagen': request.build_absolute_uri(rel) if request else rel,
                'descripcion': i.descripcion if (i.descripcion or None) else None
            })
        data['imagenes'] = imgs
        return data


# -----------------------------
#  Piezas (serializer minimal para exportación masiva)
# -----------------------------
class PiezaExportSerializer(serializers.Serializer):
    # Sólo los campos necesarios para CSV/Excel en el front
    numero_inventario = serializers.CharField()
    nombre_especifico = serializers.CharField(allow_blank=True, required=False)
    autor = serializers.SerializerMethodField()
    coleccion = serializers.SerializerMethodField()
    pais = serializers.SerializerMethodField()
    localidad = serializers.SerializerMethodField()
    fecha_creacion = serializers.CharField(allow_blank=True, required=False)
    materiales = serializers.ListField(child=serializers.CharField(), read_only=True)
    estado_conservacion = serializers.CharField(allow_blank=True, required=False)
    descripcion_col = serializers.CharField(source='descripcion', allow_blank=True, required=False)
    numero_registro_anterior = serializers.CharField(allow_blank=True, required=False)
    codigo_surdoc = serializers.CharField(allow_blank=True, required=False)
    ubicacion = serializers.CharField(allow_blank=True, required=False)
    deposito = serializers.CharField(allow_blank=True, required=False)
    estante = serializers.CharField(allow_blank=True, required=False)

    def get_autor(self, p: Pieza):
        return _first_name(p.autor.all())

    def get_coleccion(self, p: Pieza):
        return _first_name(p.coleccion.all())

    def get_pais(self, p: Pieza):
        return _first_name(p.pais.all())

    def get_localidad(self, p: Pieza):
        return _first_name(p.localidad.all())

    def to_representation(self, p: Pieza):
        data = super().to_representation(p)
        data['materiales'] = [m.nombre for m in p.materiales.all()]
        return data

class ImagenListSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    imagen = serializers.SerializerMethodField()
    descripcion = serializers.CharField(allow_blank=True, allow_null=True, required=False)

    def get_id(self, obj):
        # Si tienes un contador en el contexto, úsalo
        next_img_id = self.context.get('next_img_id')
        return next_img_id() if next_img_id else None

    def get_imagen(self, obj):
        request = self.context.get('request')
        rel = f"{settings.MEDIA_URL}{obj.file_name}"
        return request.build_absolute_uri(rel) if request else rel