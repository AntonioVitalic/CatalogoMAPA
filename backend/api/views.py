from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission
from neomodel import db
import subprocess
import time
import json

from .models import (
    Pieza, Componente, Imagen, Autor, Pais,
    Localidad, Material, Tecnica, Coleccion, Cultura, Exposicion
)

from .serializers import (
    PiezaOutSerializer, ComponenteOutSerializer,
    ImagenOutSerializer, ImagenListSerializer, PiezaExportSerializer
)

from accounts.models import RegistroCambioPieza

def _get(field, data, *aliases, default=""):
    """
    Obtiene un campo desde request.data con soporte de alias.
    """
    if field in data and data.get(field) not in (None, ""):
        return data.get(field)
    for a in aliases:
        if a in data and data.get(a) not in (None, ""):
            return data.get(a)
    return default

def _split_list(value: str) -> list[str]:
    """
    Divide cadenas en elementos por ; o , y limpia espacios. Devuelve lista sin vacíos.
    """
    if value is None:
        return []
    raw = str(value)
    # Acepta ; o , como separador
    parts = [p.strip() for p in raw.replace(",", ";").split(";")]
    return [p for p in parts if p]

def _set_single_rel(node, rel_attr: str, label_cls, name: str | None):
    """
    Setea una relación 1–1 opcional (ej: autor, coleccion, pais, localidad).
    Limpia relaciones previas y conecta si 'name' viene no vacío.
    """
    rel = getattr(node, rel_attr)  # RelationshipTo
    # limpiar vínculos actuales
    for x in rel.all():
        rel.disconnect(x)
    if name:
        inst = label_cls.nodes.first_or_none(nombre=name.strip())
        if not inst:
            inst = label_cls(nombre=name.strip()).save()
        rel.connect(inst)

def _set_many_names(node, rel_attr: str, label_cls, names: list[str]):
    """
    Setea relaciones N–N desde lista de nombres (ej: materiales, tecnicas, exposiciones).
    Sobrescribe: limpia y vuelve a conectar.
    """
    rel = getattr(node, rel_attr)  # RelationshipTo
    for x in rel.all():
        rel.disconnect(x)
    for n in names:
        nn = n.strip()
        if not nn:
            continue
        # Para Exposicion usamos 'titulo' en el modelo
        if label_cls.__name__ == "Exposicion":
            inst = label_cls.nodes.first_or_none(titulo=nn)
            if not inst:
                inst = label_cls(titulo=nn).save()
        else:
            inst = label_cls.nodes.first_or_none(nombre=nn)
            if not inst:
                inst = label_cls(nombre=nn).save()
        rel.connect(inst)

class PiezaViewSet(viewsets.ViewSet):
    def _parse_filters(self, request):
        colecciones = request.query_params.getlist('coleccion__nombre')
        paises      = request.query_params.getlist('pais__nombre')
        autores     = request.query_params.getlist('autor__nombre')
        localidades = request.query_params.getlist('localidad__nombre')
        tipologias  = request.query_params.getlist('tipologia')

        def _norm_list(xs):
            return [x.strip().lower() for x in xs if str(x).strip() != ""]

        return {
            "colecciones": _norm_list(colecciones),
            "paises":      _norm_list(paises),
            "autores":     _norm_list(autores),
            "localidades": _norm_list(localidades),
            "tipologias":  _norm_list(tipologias),
        }

    def _cypher_base(self):
        return """
        MATCH (p:Pieza)
        OPTIONAL MATCH (p)-[:PERTENECE_A]->(c:Coleccion)
        WITH p, collect(DISTINCT toLower(trim(c.nombre))) AS cols
        OPTIONAL MATCH (p)-[:PROCEDENTE_DE]->(pa:Pais)
        WITH p, cols, collect(DISTINCT toLower(trim(pa.nombre))) AS pais_list
        OPTIONAL MATCH (p)-[:CREADO_POR]->(a:Autor)
        WITH p, cols, pais_list, collect(DISTINCT toLower(trim(a.nombre))) AS aut_list
        OPTIONAL MATCH (p)-[:LOCALIZADO_EN]->(l:Localidad)
        WITH p, cols, pais_list, aut_list, collect(DISTINCT toLower(trim(l.nombre))) AS loc_list

        WHERE (
            size($colecciones) = 0 OR any(x IN $colecciones WHERE x IN cols)
        )
        AND (
            size($paises) = 0 OR any(x IN $paises WHERE x IN pais_list)
        )
        AND (
            size($autores) = 0 OR any(x IN $autores WHERE x IN aut_list)
        )
        AND (
            size($localidades) = 0 OR any(x IN $localidades WHERE x IN loc_list)
        )
        AND (
            size($tipologias) = 0 OR toLower(trim(coalesce(p.tipologia, ''))) IN $tipologias
        )

        RETURN p
        ORDER BY p.numero_inventario_int
        """

    def list(self, request):
        params = self._parse_filters(request)
        q = self._cypher_base()

        rows, _ = db.cypher_query(q, params)
        piezas = [Pieza.inflate(r[0]) for r in rows]

        paginator = PageNumberPagination()
        paginator.page_size = settings.REST_FRAMEWORK['PAGE_SIZE']
        page = paginator.paginate_queryset(list(piezas), request)
        ser = PiezaOutSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(ser.data)

    @action(detail=False, methods=['get'], url_path='export')
    def export_all(self, request):
        params = self._parse_filters(request)
        q = self._cypher_base()

        rows, _ = db.cypher_query(q, params)
        piezas = [Pieza.inflate(r[0]) for r in rows]

        ser = PiezaExportSerializer(piezas, many=True, context={'request': request})
        return Response(ser.data)
    
    @action(detail=False, methods=['get'], url_path='next-numero')
    def next_numero(self, request):
        # Calcula el siguiente número como: max(numero_inventario_int) + 1
        q = "MATCH (p:Pieza) RETURN coalesce(max(p.numero_inventario_int), 0) AS maxn"
        rows, _ = db.cypher_query(q)
        maxn = int(rows[0][0]) if rows and rows[0] and rows[0][0] is not None else 0
        return Response({"next": maxn + 1})


    def retrieve(self, request, pk=None):
        pieza = Pieza.nodes.get(numero_inventario=str(int(pk)))
        return Response(PiezaOutSerializer(pieza, context={'request': request}).data)

    def create(self, request):
        data = request.data

        # 1) Campos planos de Pieza (propiedades que SÍ existen como String/Float en el modelo)
        pieza = Pieza(
            numero_inventario=_get('numero_inventario', data),
            revision=_get('revision', data),
            numero_registro_anterior=_get('numero_registro_anterior', data),
            codigo_surdoc=_get('codigo_surdoc', data),
            ubicacion=_get('ubicacion', data),
            deposito=_get('deposito', data),
            estante=_get('estante', data),
            caja_actual=_get('caja_actual', data),
            tipologia=_get('tipologia', data),
            clasificacion=_get('clasificacion', data),
            conjunto=_get('conjunto', data),
            nombre_comun=_get('nombre_comun', data),
            nombre_especifico=_get('nombre_especifico', data),
            fecha_creacion=_get('fecha_creacion', data),
            # Alias: descripcion ⇢ descripcion_col
            descripcion_col=_get('descripcion_col', data, 'descripcion'),
            marcas_inscripciones=_get('marcas_inscripciones', data),
            contexto_historico=_get('contexto_historico', data),
            bibliografia=_get('bibliografia', data),
            iconografia=_get('iconografia', data),
            notas_investigacion=_get('notas_investigacion', data),
            # Alias: descripcion_conservacion ⇢ descripcion_cr
            descripcion_cr=_get('descripcion_cr', data, 'descripcion_conservacion'),
            # medidas / pesos (acepta string numérica; si vacío, None)
            alto_cm=float(_get('alto_cm', data) or 0) or None,
            ancho_cm=float(_get('ancho_cm', data) or 0) or None,
            profundidad_cm=float(_get('profundidad_cm', data) or 0) or None,
            diametro_cm=float(_get('diametro_cm', data) or 0) or None,
            espesor_mm=float(_get('espesor_mm', data) or 0) or None,
            peso_gr=float(_get('peso_gr', data) or 0) or None,
            funcion=_get('funcion', data),
            estado_conservacion=_get('estado_conservacion', data),
            responsable_conservacion=_get('responsable_conservacion', data),
            fecha_actualizacion_conservacion=_get('fecha_actualizacion_conservacion', data),
            comentarios_conservacion=_get('comentarios_conservacion', data),
            avaluo=_get('avaluo', data),
            procedencia=_get('procedencia', data),
            donante=_get('donante', data),
            fecha_ingreso=_get('fecha_ingreso', data),
            responsable_coleccion=_get('responsable_coleccion', data),
            fecha_ultima_modificacion=_get('fecha_ultima_modificacion', data),
        ).save()

        # 2) Relaciones 1–1 (strings del form)
        _set_single_rel(pieza, 'autor', Autor, _get('autor', data))
        _set_single_rel(pieza, 'coleccion', Coleccion, _get('coleccion', data))
        _set_single_rel(pieza, 'pais', Pais, _get('pais', data))
        _set_single_rel(pieza, 'localidad', Localidad, _get('localidad', data))
        _set_single_rel(pieza, 'filiacion_cultural', Cultura, _get('filiacion_cultural', data))

        # 3) Relaciones N–N (listas desde string con ; o ,)
        _set_many_names(pieza, 'materiales', Material, _split_list(_get('materialidad', data)))
        _set_many_names(pieza, 'tecnica', Tecnica, _split_list(_get('tecnica', data)))
        _set_many_names(pieza, 'exposiciones', Exposicion, _split_list(_get('exposiciones', data)))

        # 4) Componentes (lista JSON serializada o nativa)
        componentes = data.get('componentes')
        if componentes:
            comps = json.loads(componentes) if isinstance(componentes, str) else componentes
            for comp in comps:
                c = Componente(
                    pieza_numero_inventario=pieza.numero_inventario,
                    letra=(comp.get('letra') or '').strip().lower(),
                    revision=comp.get('revision', ''),

                    numero_registro_anterior=comp.get('numero_registro_anterior', ''),
                    codigo_surdoc=comp.get('codigo_surdoc', ''),

                    ubicacion=comp.get('ubicacion', ''),
                    deposito=comp.get('deposito', ''),
                    estante=comp.get('estante', ''),
                    caja_actual=comp.get('caja_actual', ''),

                    tipologia=comp.get('tipologia', ''),
                    coleccion=comp.get('coleccion', ''),
                    clasificacion=comp.get('clasificacion', ''),
                    conjunto=comp.get('conjunto', ''),
                    nombre_comun=comp.get('nombre_comun', ''),
                    nombre_especifico=comp.get('nombre_especifico', ''),
                    autor=comp.get('autor', ''),
                    filiacion_cultural=comp.get('filiacion_cultural', ''),
                    pais=comp.get('pais', ''),
                    localidad=comp.get('localidad', ''),
                    fecha_creacion=comp.get('fecha_creacion', ''),
                    descripcion_col=comp.get('descripcion_col', ''),

                    marcas_inscripciones=comp.get('marcas_inscripciones', ''),
                    tecnica=comp.get('tecnica', ''),
                    materialidad=comp.get('materialidad', ''),
                    descripcion_cr=comp.get('descripcion_cr', ''),
                    alto_cm=float(comp.get('alto_cm') or 0) or None,
                    ancho_cm=float(comp.get('ancho_cm') or 0) or None,
                    profundidad_cm=float(comp.get('profundidad_cm') or 0) or None,
                    diametro_cm=float(comp.get('diametro_cm') or 0) or None,
                    espesor_mm=float(comp.get('espesor_mm') or 0) or None,
                    peso_gr=float(comp.get('peso_gr') or 0) or None,

                    funcion=comp.get('funcion', ''),
                    contexto_historico=comp.get('contexto_historico', ''),
                    bibliografia=comp.get('bibliografia', ''),
                    iconografia=comp.get('iconografia', ''),
                    notas_investigacion=comp.get('notas_investigacion', ''),

                    estado_conservacion=comp.get('estado_conservacion', ''),
                    responsable_conservacion=comp.get('responsable_conservacion', ''),
                    fecha_actualizacion_conservacion=comp.get('fecha_actualizacion_conservacion', ''),
                    comentarios_conservacion=comp.get('comentarios_conservacion', ''),

                    # exposiciones=comp.get('exposiciones', ''),
                    avaluo=comp.get('avaluo', ''),
                    procedencia=comp.get('procedencia', ''),
                    donante=comp.get('donante', ''),
                    fecha_ingreso=comp.get('fecha_ingreso', ''),
                    responsable_coleccion=comp.get('responsable_coleccion', ''),
                    fecha_ultima_modificacion=comp.get('fecha_ultima_modificacion', ''),
                ).save()
                pieza.componentes.connect(c)

        _set_many_names(c, 'exposiciones', Exposicion, _split_list(comp.get('exposiciones', '')))

        # 5) Imagen de pieza (opcional)
        imagen = request.FILES.get('imagen')
        if imagen:
            img = Imagen(file_name=imagen.name, descripcion="").save()
            pieza.imagenes.connect(img)

        # 6) Auditoría
        after_obj = {
            "numero_inventario": pieza.numero_inventario,
            "nombre_especifico": pieza.nombre_especifico,
            "descripcion_col": pieza.descripcion_col,
            "coleccion": _get('coleccion', data),
        }
        RegistroCambioPieza.objects.create(
            usuario=request.user,
            pieza_id=pieza.numero_inventario,
            accion="CREAR",
            detalle=json.dumps({"before": None, "after": after_obj})
        )

        return Response(PiezaOutSerializer(pieza, context={'request': request}).data, status=status.HTTP_201_CREATED)
    
    def update(self, request, pk=None):
        data = request.data
        pieza = Pieza.nodes.get(numero_inventario=str(int(pk)))

        # ===== BEFORE para auditoría =====
        before_obj = {
            "numero_inventario": pieza.numero_inventario,
            "nombre_especifico": pieza.nombre_especifico,
            "descripcion_col": pieza.descripcion_col,
            "coleccion": None,  # la relación se resuelve aparte
        }

        # 1) Actualizar PROPIEDADES planas (sin tocar relaciones)
        fields_scalar = {
            'revision': _get('revision', data),
            'numero_registro_anterior': _get('numero_registro_anterior', data),
            'codigo_surdoc': _get('codigo_surdoc', data),
            'ubicacion': _get('ubicacion', data),
            'deposito': _get('deposito', data),
            'estante': _get('estante', data),
            'caja_actual': _get('caja_actual', data),
            'tipologia': _get('tipologia', data),
            'clasificacion': _get('clasificacion', data),
            'conjunto': _get('conjunto', data),
            'nombre_comun': _get('nombre_comun', data),
            'nombre_especifico': _get('nombre_especifico', data),
            'fecha_creacion': _get('fecha_creacion', data),
            'descripcion_col': _get('descripcion_col', data, 'descripcion'),
            'marcas_inscripciones': _get('marcas_inscripciones', data),
            'contexto_historico': _get('contexto_historico', data),
            'bibliografia': _get('bibliografia', data),
            'iconografia': _get('iconografia', data),
            'notas_investigacion': _get('notas_investigacion', data),

            'descripcion_cr': _get('descripcion_cr', data, 'descripcion_conservacion'),
            'alto_cm': float(_get('alto_cm', data) or 0) or None,
            'ancho_cm': float(_get('ancho_cm', data) or 0) or None,
            'profundidad_cm': float(_get('profundidad_cm', data) or 0) or None,
            'diametro_cm': float(_get('diametro_cm', data) or 0) or None,
            'espesor_mm': float(_get('espesor_mm', data) or 0) or None,
            'peso_gr': float(_get('peso_gr', data) or 0) or None,

            'funcion': _get('funcion', data),
            'estado_conservacion': _get('estado_conservacion', data),
            'responsable_conservacion': _get('responsable_conservacion', data),
            'fecha_actualizacion_conservacion': _get('fecha_actualizacion_conservacion', data),
            'comentarios_conservacion': _get('comentarios_conservacion', data),

            'avaluo': _get('avaluo', data),
            'procedencia': _get('procedencia', data),
            'donante': _get('donante', data),
            'fecha_ingreso': _get('fecha_ingreso', data),
            'responsable_coleccion': _get('responsable_coleccion', data),
            'fecha_ultima_modificacion': _get('fecha_ultima_modificacion', data),
        }
        for k, v in fields_scalar.items():
            setattr(pieza, k, v)
        pieza.save()

        # 2) Relaciones 1–1
        _set_single_rel(pieza, 'autor', Autor, _get('autor', data))
        _set_single_rel(pieza, 'coleccion', Coleccion, _get('coleccion', data))
        _set_single_rel(pieza, 'pais', Pais, _get('pais', data))
        _set_single_rel(pieza, 'localidad', Localidad, _get('localidad', data))
        _set_single_rel(pieza, 'filiacion_cultural', Cultura, _get('filiacion_cultural', data))

        # 3) Relaciones N–N
        _set_many_names(pieza, 'materiales', Material, _split_list(_get('materialidad', data)))
        _set_many_names(pieza, 'tecnica', Tecnica, _split_list(_get('tecnica', data)))
        _set_many_names(pieza, 'exposiciones', Exposicion, _split_list(_get('exposiciones', data)))

        # 4) Componentes (modo “reemplazar” como ya hacías)
        componentes = data.get('componentes')
        if componentes is not None:
            comps = json.loads(componentes) if isinstance(componentes, str) else componentes
            # eliminar actuales
            for c in pieza.componentes.all():
                pieza.componentes.disconnect(c)
                c.delete()
            # crear de nuevo
            for comp in comps:
                c = Componente(
                    pieza_numero_inventario=pieza.numero_inventario,
                    letra=(comp.get('letra') or '').strip().lower(),
                    revision=comp.get('revision', ''),

                    numero_registro_anterior=comp.get('numero_registro_anterior', ''),
                    codigo_surdoc=comp.get('codigo_surdoc', ''),

                    ubicacion=comp.get('ubicacion', ''),
                    deposito=comp.get('deposito', ''),
                    estante=comp.get('estante', ''),
                    caja_actual=comp.get('caja_actual', ''),

                    tipologia=comp.get('tipologia', ''),
                    coleccion=comp.get('coleccion', ''),
                    clasificacion=comp.get('clasificacion', ''),
                    conjunto=comp.get('conjunto', ''),
                    nombre_comun=comp.get('nombre_comun', ''),
                    nombre_especifico=comp.get('nombre_especifico', ''),
                    autor=comp.get('autor', ''),
                    filiacion_cultural=comp.get('filiacion_cultural', ''),
                    pais=comp.get('pais', ''),
                    localidad=comp.get('localidad', ''),
                    fecha_creacion=comp.get('fecha_creacion', ''),
                    descripcion_col=comp.get('descripcion_col', ''),

                    marcas_inscripciones=comp.get('marcas_inscripciones', ''),
                    tecnica=comp.get('tecnica', ''),
                    materialidad=comp.get('materialidad', ''),
                    descripcion_cr=comp.get('descripcion_cr', ''),
                    alto_cm=float(comp.get('alto_cm') or 0) or None,
                    ancho_cm=float(comp.get('ancho_cm') or 0) or None,
                    profundidad_cm=float(comp.get('profundidad_cm') or 0) or None,
                    diametro_cm=float(comp.get('diametro_cm') or 0) or None,
                    espesor_mm=float(comp.get('espesor_mm') or 0) or None,
                    peso_gr=float(comp.get('peso_gr') or 0) or None,

                    funcion=comp.get('funcion', ''),
                    contexto_historico=comp.get('contexto_historico', ''),
                    bibliografia=comp.get('bibliografia', ''),
                    iconografia=comp.get('iconografia', ''),
                    notas_investigacion=comp.get('notas_investigacion', ''),

                    estado_conservacion=comp.get('estado_conservacion', ''),
                    responsable_conservacion=comp.get('responsable_conservacion', ''),
                    fecha_actualizacion_conservacion=comp.get('fecha_actualizacion_conservacion', ''),
                    comentarios_conservacion=comp.get('comentarios_conservacion', ''),

                    # exposiciones=comp.get('exposiciones', ''),
                    avaluo=comp.get('avaluo', ''),
                    procedencia=comp.get('procedencia', ''),
                    donante=comp.get('donante', ''),
                    fecha_ingreso=comp.get('fecha_ingreso', ''),
                    responsable_coleccion=comp.get('responsable_coleccion', ''),
                    fecha_ultima_modificacion=comp.get('fecha_ultima_modificacion', ''),
                ).save()
                pieza.componentes.connect(c)

        _set_many_names(c, 'exposiciones', Exposicion, _split_list(comp.get('exposiciones', '')))

        # 5) Imagen de pieza (opcional)
        imagen = request.FILES.get('imagen')
        if imagen:
            img = Imagen(file_name=imagen.name, descripcion="").save()
            pieza.imagenes.connect(img)

        # 6) Auditoría
        after_obj = {
            "numero_inventario": pieza.numero_inventario,
            "nombre_especifico": pieza.nombre_especifico,
            "descripcion_col": pieza.descripcion_col,
            "coleccion": _get('coleccion', data),
        }
        RegistroCambioPieza.objects.create(
            usuario=request.user,
            pieza_id=pieza.numero_inventario,
            accion="EDITAR",
            detalle=json.dumps({"before": before_obj, "after": after_obj})
        )

        return Response(PiezaOutSerializer(pieza, context={'request': request}).data)


    def destroy(self, request, pk=None):
        pieza = Pieza.nodes.get(numero_inventario=str(int(pk)))
        before_obj = {
            "numero_inventario": pieza.numero_inventario,
            "nombre_especifico": pieza.nombre_especifico,
            "descripcion_col": pieza.descripcion_col,
            "coleccion": None,
        }
        RegistroCambioPieza.objects.create(
            usuario=request.user,
            pieza_id=pieza.numero_inventario,
            accion="ELIMINAR",
            detalle=json.dumps({"before": before_obj, "after": None})
        )
        pieza.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# ------- COMPONENTES -------
class ComponenteViewSet(viewsets.ViewSet):
    def list(self, request):
        comps = Componente.nodes.all()
        # Ordenar por pieza_numero_inventario (convertido a int para orden numérico)
        comps = sorted(comps, key=lambda c: int(c.pieza_numero_inventario))
        paginator = PageNumberPagination()
        paginator.page_size = settings.REST_FRAMEWORK['PAGE_SIZE']
        page = paginator.paginate_queryset(list(comps), request)
        ser = ComponenteOutSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(ser.data)

    def retrieve(self, request, pk=None):
        comp = Componente.nodes.get(uid=pk)
        ser = ComponenteOutSerializer(comp, context={'request': request})
        return Response(ser.data)

class ImagenViewSet(viewsets.ViewSet):
    def list(self, request):
        imgs = sorted(Imagen.nodes.all(), key=lambda i: i.file_name.casefold())
        paginator = PageNumberPagination()
        paginator.page_size = settings.REST_FRAMEWORK['PAGE_SIZE']
        page = paginator.paginate_queryset(imgs, request)

        start = paginator.page.start_index() - 1
        counter = {'n': start}
        def next_img_id():
            counter['n'] += 1
            return counter['n']

        ser = ImagenListSerializer(page, many=True, context={
            'request': request,
            'next_img_id': next_img_id
        })
        return paginator.get_paginated_response(ser.data)

    def retrieve(self, request, pk=None):
        img = Imagen.nodes.get(id=int(pk))
        rel = f"{settings.MEDIA_URL}{img.file_name}"
        url = request.build_absolute_uri(rel)
        data = {'id': int(pk), 'imagen': url, 'descripcion': img.descripcion or None}
        return Response(data)

    def create(self, request):
        data = request.data
        img = Imagen(file_name=data.get('file_name'), descripcion=data.get('descripcion', '')).save()
        rel = f"{settings.MEDIA_URL}{img.file_name}"
        url = request.build_absolute_uri(rel)
        return Response({'id': 0, 'imagen': url, 'descripcion': img.descripcion or None}, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        img = Imagen.nodes.get(id=int(pk))
        img.descripcion = request.data.get('descripcion', img.descripcion)
        img.save()
        rel = f"{settings.MEDIA_URL}{img.file_name}"
        url = request.build_absolute_uri(rel)
        return Response({'id': int(pk), 'imagen': url, 'descripcion': img.descripcion or None})

    def destroy(self, request, pk=None):
        img = Imagen.nodes.get(id=int(pk))
        img.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# helpers para catálogos
def _catalog_json(names_iterable):
    names = {(n or "").strip() for n in names_iterable}
    names.discard("")
    ordered = sorted(names, key=lambda s: s.casefold())
    return [{"id": i + 1, "nombre": n} for i, n in enumerate(ordered)]

class PaisViewSet(viewsets.ViewSet):
    def list(self, request):
        data = _catalog_json(p.nombre for p in Pais.nodes.all())
        return Response(data)

class ColeccionViewSet(viewsets.ViewSet):
    def list(self, request):
        data = _catalog_json(c.nombre for c in Coleccion.nodes.all())
        return Response(data)

class AutorViewSet(viewsets.ViewSet):
    def list(self, request):
        data = _catalog_json(a.nombre for a in Autor.nodes.all())
        return Response(data)

class LocalidadViewSet(viewsets.ViewSet):
    def list(self, request):
        data = _catalog_json(l.nombre for l in Localidad.nodes.all())
        return Response(data)

class TipologiaViewSet(viewsets.ViewSet):
    def list(self, request):
        q = """
        MATCH (p:Pieza)
        WITH trim(coalesce(p.tipologia,'')) AS nombre
        WHERE nombre <> ''
        RETURN DISTINCT nombre
        """
        rows, _ = db.cypher_query(q)
        nombres = [r[0] for r in rows]
        data = _catalog_json(nombres)
        return Response(data)
    
class ExposicionViewSet(viewsets.ViewSet):
    def list(self, request):
        import os
        import pandas as pd
        csv_path = os.path.join(os.getcwd(), "neo4j", "import", "exposiciones.csv")
        expos = []
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            expos = [{"id": i + 1, "nombre": str(n)} for i, n in enumerate(df["nombre"].dropna().unique())]
        return Response(expos)
    
class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, "role", None) == "admin")

@api_view(['POST'])
@permission_classes([IsAdminRole])
def importacion_masiva(request):
    excel_file = request.FILES.get('excel')
    images_zip = request.FILES.get('images_zip')
    if not excel_file or not images_zip:
        return Response({"detail": "Faltan archivos"}, status=400)

    # Guardar archivos en la ruta esperada
    excel_path = "/app/inventario.xlsx"
    images_dir = "/imagenes"
    with open(excel_path, "wb") as f:
        for chunk in excel_file.chunks():
            f.write(chunk)
    # Descomprimir ZIP de imágenes
    import zipfile
    import os
    with zipfile.ZipFile(images_zip) as zf:
        zf.extractall(images_dir)

    # Ejecutar el comando de importación
    t0 = time.monotonic()
    proc = subprocess.run(
        ["python", "manage.py", "import_mapa", "--excel", excel_path, "--images_dir", images_dir],
        cwd="/app",
        capture_output=True,
        text=True,
    )
    elapsed = time.monotonic() - t0
    if proc.returncode != 0:
        return Response({"detail": "Error en importación", "output": proc.stderr}, status=500)
    # Buscar resumen en la salida
    resumen = ""
    for line in proc.stdout.splitlines():
        if "Import finalizado" in line:
            resumen = line
            break
    return Response({"mensaje": resumen or "Importación finalizada", "tiempo": elapsed})