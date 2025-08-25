# api/serializers.py
from django.conf import settings
from rest_framework import serializers
from .models import (
    Pieza, Componente, Imagen, Autor, Pais, Localidad, Cultura,
    Coleccion, Material, Tecnica
)

# Tenemos en cuenta que en import_mapa se usa el siguiente diccionario, que contiene las columnas del excel de inventario:
# inventario_cols = dict(
#     numero_inventario='numero_de_inventario',
#     letra='letra',
#     revision='Revisión',

#     numero_registro_anterior='numero_de registro_anterior',
#     codigo_surdoc='SURDOC',

#     ubicacion='ubicacion',
#     deposito='deposito',
#     estante='estante',
#     caja_actual='caja_actual',

#     tipologia='tipologia',

#     coleccion='coleccion',
#     clasificacion='clasificacion',
#     conjunto='conjunto',
#     nombre_comun='nombre_comun',
#     nombre_especifico='nombre_especifico',
#     autor='autor',
#     filiacion_cultural='filiacion_cultural',
#     pais='pais',
#     localidad='localidad',
#     fecha_creacion='fecha_de_creacion',
#     descripcion='descripcion_col',

#     marcas_inscripciones='marcas_o_inscripciones',
#     tecnica='tecnica',
#     materialidad='materialidad',
#     descripcion_conservacion='descripcion_cr',
#     alto_cm='alto_o_largo_(cm)',
#     ancho_cm='ancho_cm',
#     profundidad_cm='profundidad_(cm)',
#     diametro_cm='diametro_(cm)',
#     espesor_mm='espesor_(mm)',
#     peso_gr='peso_(gr)',

#     funcion='funcion',
#     contexto_historico='contexto_historico',
#     bibliografia='bibliografia',
#     iconografia='iconografia',
#     notas_investigacion='notas_investigacion',

#     estado_conservacion='estado_genral_de_conservacion',
#     responsable_conservacion='responsable_conservacion',
#     fecha_actualizacion_conservacion='fecha_actualizacion_cr',
#     comentarios_conservacion='comentarios_cr',

#     exposiciones='exposiciones',
#     avaluo='avaluo',
#     procedencia='procedencia',
#     donante='donante',
#     fecha_ingreso='fecha_ingreso',
    
#     responsable_coleccion='responsable_coleccion',
#     fecha_ultima_modificacion='fecha_ultima_modificacion',
# )

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
    pieza_numero_inventario = serializers.CharField()
    letra = serializers.CharField()
    revision = serializers.CharField(allow_blank=True, required=False)
    numero_registro_anterior = serializers.CharField(allow_blank=True, required=False)
    codigo_surdoc = serializers.CharField(allow_blank=True, required=False)
    ubicacion = serializers.CharField(allow_blank=True, required=False)
    deposito = serializers.CharField(allow_blank=True, required=False)
    estante = serializers.CharField(allow_blank=True, required=False)
    caja_actual = serializers.CharField(allow_blank=True, required=False)
    tipologia = serializers.CharField(allow_blank=True, required=False)
    coleccion = serializers.CharField(allow_blank=True, required=False)
    clasificacion = serializers.CharField(allow_blank=True, required=False)
    conjunto = serializers.CharField(allow_blank=True, required=False)
    nombre_comun = serializers.CharField(allow_blank=True, required=False)
    nombre_especifico = serializers.CharField(allow_blank=True, required=False)
    autor = serializers.CharField(allow_blank=True, required=False)
    filiacion_cultural = serializers.CharField(allow_blank=True, required=False)
    pais = serializers.CharField(allow_blank=True, required=False)
    localidad = serializers.CharField(allow_blank=True, required=False)
    fecha_creacion = serializers.CharField(allow_blank=True, required=False)
    descripcion_col = serializers.CharField(allow_blank=True, required=False)
    marcas_inscripciones = serializers.CharField(allow_blank=True, required=False)
    tecnica = serializers.CharField(allow_blank=True, required=False)
    materialidad = serializers.CharField(allow_blank=True, required=False)
    descripcion_cr = serializers.CharField(allow_blank=True, required=False)
    alto_cm = serializers.FloatField(allow_null=True, required=False)
    ancho_cm = serializers.FloatField(allow_null=True, required=False)
    profundidad_cm = serializers.FloatField(allow_null=True, required=False)
    diametro_cm = serializers.FloatField(allow_null=True, required=False)
    espesor_mm = serializers.FloatField(allow_null=True, required=False)
    peso_gr = serializers.FloatField(allow_null=True, required=False)
    funcion = serializers.CharField(allow_blank=True, required=False)
    contexto_historico = serializers.CharField(allow_blank=True, required=False)
    bibliografia = serializers.CharField(allow_blank=True, required=False)
    iconografia = serializers.CharField(allow_blank=True, required=False)
    notas_investigacion = serializers.CharField(allow_blank=True, required=False)
    estado_conservacion = serializers.CharField(allow_blank=True, required=False)
    responsable_conservacion = serializers.CharField(allow_blank=True, required=False)
    fecha_actualizacion_conservacion = serializers.CharField(allow_blank=True, required=False)
    comentarios_conservacion = serializers.CharField(allow_blank=True, required=False)
    exposiciones = serializers.CharField(allow_blank=True, required=False)
    avaluo = serializers.CharField(allow_blank=True, required=False)
    procedencia = serializers.CharField(allow_blank=True, required=False)
    donante = serializers.CharField(allow_blank=True, required=False)
    fecha_ingreso = serializers.CharField(allow_blank=True, required=False)
    responsable_coleccion = serializers.CharField(allow_blank=True, required=False)
    fecha_ultima_modificacion = serializers.CharField(allow_blank=True, required=False)
    imagenes = ImagenOutSerializer(many=True, required=False)

    def get_id(self, c):
        # Ejemplo: "27-b"
        return f"{c.pieza_numero_inventario}-{c.letra}"

    def to_representation(self, c):
        base = super().to_representation(c)
        base['pieza'] = int(c.pieza_numero_inventario)
        # base['materiales'] = [m.nombre for m in c.materiales.all()]
        # base['tecnica']    = [t.nombre for t in c.tecnica.all()]
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
    letra = serializers.CharField(allow_blank=True, required=False)
    revision = serializers.CharField(allow_blank=True, required=False)
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
    tecnica = serializers.ListField(child=serializers.CharField(), read_only=True)
    materialidad = serializers.CharField(allow_blank=True, required=False)
    descripcion_cr = serializers.CharField(allow_blank=True, required=False)
    alto_cm = serializers.FloatField(allow_null=True, required=False)
    ancho_cm = serializers.FloatField(allow_null=True, required=False)
    profundidad_cm = serializers.FloatField(allow_null=True, required=False)
    diametro_cm = serializers.FloatField(allow_null=True, required=False)
    espesor_mm = serializers.FloatField(allow_null=True, required=False)
    peso_gr = serializers.FloatField(allow_null=True, required=False)
    funcion = serializers.CharField(allow_blank=True, required=False)
    contexto_historico = serializers.CharField(allow_blank=True, required=False)
    bibliografia = serializers.CharField(allow_blank=True, required=False)
    iconografia = serializers.CharField(allow_blank=True, required=False)
    notas_investigacion = serializers.CharField(allow_blank=True, required=False)
    estado_conservacion = serializers.CharField(allow_blank=True, required=False)
    descripcion_conservacion = serializers.SerializerMethodField()
    responsable_conservacion = serializers.CharField(allow_blank=True, required=False)
    fecha_actualizacion_conservacion = serializers.SerializerMethodField()
    comentarios_conservacion = serializers.SerializerMethodField()
    exposiciones = serializers.CharField(allow_blank=True, required=False)
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
        ctx = {'request': self.context.get('request'), 'next_comp_id': next_comp_id}
        comps = sorted(p.componentes.all(), key=lambda c: c.letra or '')
        componentes = [ComponenteOutSerializer(c, context=ctx).data for c in comps]

        # Reordenar el dict para que 'letra' esté después de 'fecha_ultima_modificacion'
        ordered = {}
        for k in data:
            ordered[k] = data[k]
            if k == 'fecha_ultima_modificacion':
                # Usa el valor real, no sobreescribir con ''
                ordered['letra'] = data.get('letra', getattr(p, 'letra', ''))
        ordered['componentes'] = componentes

        # Imágenes
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
        ordered['imagenes'] = imgs
        return ordered


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