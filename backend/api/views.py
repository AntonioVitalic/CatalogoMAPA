from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action, api_view, permission_classes
from django.conf import settings
from rest_framework.permissions import BasePermission, IsAuthenticated
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.utils.text import get_valid_filename
from neomodel import db
from datetime import datetime, timedelta
import subprocess
import time
import json
import copy
import re
import openpyxl
from openpyxl.drawing.image import Image as XLImage
import tempfile
import requests
import os
from io import BytesIO
from .models import (
    Pieza, Componente, Imagen, Autor, Pais,
    Localidad, Material, Tecnica, Coleccion, Cultura, Exposicion,
    Tipologia,
)

from .serializers import (
    PiezaOutSerializer, ComponenteOutSerializer,
    ImagenOutSerializer, ImagenListSerializer, PiezaExportSerializer
)

from accounts.models import RegistroCambioPieza

_UNSET = object() # esto es para distinguir None de no-seteado
_NUM_ORDER_EXPR = "coalesce(p.numero_inventario_int, toInteger(p.numero_inventario))"
_NUM_ORDER_CLAUSE = f"ORDER BY {_NUM_ORDER_EXPR}"


def _clean_empty(value):
    """Normaliza valores que representan "vacío"."""
    if value is None:
        return None
    if value == "":
        return ""
    if isinstance(value, str):
        cleaned = value.strip()
        if cleaned.lower() in {"nat", "nat 00:00:00"}:
            return ""
        return value
    return value


def _canonical(value):
    """Normaliza valores para comparaciones en auditoría."""
    if value in (None, ""):
        return ""
    if isinstance(value, str):
        cleaned = value.strip()
        if cleaned.lower() in {"nat", "nat 00:00:00"}:
            return "NaT"
        return cleaned
    if isinstance(value, (list, tuple)):
        return [_canonical(v) for v in value]
    return value

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

def _get_optional(field, data, *aliases):
    """
    Igual que ``_get`` pero devuelve ``_UNSET`` cuando la clave no viene
    en ``data``. Permite diferenciar entre "no enviado" y "enviado vacío".
    """
    keys = (field,) + tuple(aliases)
    for key in keys:
        getter = getattr(data, "get", None)
        if callable(getter):
            value = getter(key, _UNSET)
            if value is not _UNSET:
                return value
        # Para estructuras tipo dict
        if isinstance(data, dict) and key in data:
            return data[key]
    return _UNSET

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

def _to_float_or_none(value):
    """Convierte ``value`` a ``float``. Devuelve ``None`` solo cuando el valor
    viene vacío o no es convertible. Acepta ``0`` como un número válido."""
    if value in (None, "", "null", "Null", "NULL"):
        return None
    try:
        fval = float(value)
    except (TypeError, ValueError):
        return None
    return fval


def _to_int_or_none(value):
    if value in (None, "", "null", "Null", "NULL"):
        return None
    try:
        text = str(value).strip()
        if not text:
            return None
        fval = float(text)
    except (TypeError, ValueError):
        return None
    if not fval.is_integer():
        return None
    ival = int(fval)
    if ival == 0:
        return None
    return ival

def _store_uploaded_image(uploaded_file):
    """Persiste el archivo recibido en MEDIA_ROOT y devuelve su nombre relativo."""
    if not uploaded_file:
        return None

    filename = get_valid_filename(os.path.basename(uploaded_file.name) or "imagen")

    upload_subdir = getattr(settings, 'MEDIA_UPLOAD_SUBDIR', 'uploads')
    destination_dir = os.path.join(settings.MEDIA_ROOT, upload_subdir)
    os.makedirs(destination_dir, exist_ok=True)
    relative_path = os.path.join(upload_subdir, filename)

    # ``default_storage.save`` puede devolver un nombre distinto si había colisiones
    return default_storage.save(relative_path, uploaded_file)


def _numero_inventario_to_int(value):
    if value in (None, ""):
        return None
    text = str(value).strip()
    if not text:
        return None
    match = re.match(r"^-?\d+", text)
    if not match:
        return None
    try:
        value_int = int(match.group(0))
    except ValueError:
        return None
    if value_int <= 0:
        return None
    return value_int


def _rel_display_value(node):
    if hasattr(node, 'nombre') and node.nombre:
        return node.nombre
    if hasattr(node, 'titulo') and node.titulo:
        return node.titulo
    return None


def _set_single_rel(node, rel_attr: str, label_cls, name: str | None):
    """
    Setea una relación 1–1 opcional (ej: autor, coleccion, pais, localidad).
    Devuelve ``(changed, before, after)`` para auditoría.
    """
    rel = getattr(node, rel_attr)  # RelationshipTo
    current_nodes = list(rel.all())
    before_value = None
    for x in current_nodes:
        rel_val = _rel_display_value(x)
        if rel_val is not None:
            before_value = rel_val
            break

    target_name = (name or "").strip()
    if not target_name:
        target_name = None

    if (before_value or None) == (target_name or None):
        # No hay cambios reales
        if target_name is None and current_nodes:
            for x in current_nodes:
                rel.disconnect(x)
        return False, before_value, target_name

    for x in current_nodes:
        rel.disconnect(x)
    if target_name:
        lookup_field = 'titulo' if label_cls.__name__ == "Exposicion" else 'nombre'
        inst = label_cls.nodes.first_or_none(**{lookup_field: target_name})
        if not inst:
            inst = label_cls(**{lookup_field: target_name}).save()
        rel.connect(inst)
    return True, before_value, target_name

def _set_many_names(node, rel_attr: str, label_cls, names: list[str]):
    """
    Setea relaciones N–N desde lista de nombres (ej: materiales, tecnicas, exposiciones).
    Devuelve ``(changed, before_list, after_list)``.
    """
    rel = getattr(node, rel_attr)  # RelationshipTo
    current_nodes = list(rel.all())
    before_names = [(_rel_display_value(x) or "").strip() for x in current_nodes if _rel_display_value(x)]

    cleaned_new = []
    for n in names:
        nn = (n or "").strip()
        if nn:
            cleaned_new.append(nn)

    before_norm = sorted([b.casefold() for b in before_names])
    after_norm = sorted([c.casefold() for c in cleaned_new])
    if before_norm == after_norm:
        return False, before_names, cleaned_new

    for x in current_nodes:
        rel.disconnect(x)

    connected_names = []
    for nn in cleaned_new:
        lookup_field = 'titulo' if label_cls.__name__ == "Exposicion" else 'nombre'
        inst = label_cls.nodes.first_or_none(**{lookup_field: nn})
        if not inst:
            inst = label_cls(**{lookup_field: nn}).save()
        rel.connect(inst)
        connected_names.append(getattr(inst, lookup_field))

    return True, before_names, connected_names

def _sync_component_relations(component: Componente, data: dict):
    """Sincroniza relaciones 1–1 y N–N del componente a partir de ``data``."""
    _set_single_rel(component, 'autor_rel', Autor, data.get('autor'))
    _set_single_rel(component, 'coleccion_rel', Coleccion, data.get('coleccion'))
    _set_single_rel(component, 'pais_rel', Pais, data.get('pais'))
    _set_single_rel(component, 'localidad_rel', Localidad, data.get('localidad'))
    _set_single_rel(component, 'filiacion_cultural_rel', Cultura, data.get('filiacion_cultural'))
    _set_single_rel(component, 'tipologias', Tipologia, data.get('tipologia'))
    expos_list = _split_list(data.get('exposiciones', ''))
    _set_many_names(component, 'exposiciones_rel', Exposicion, expos_list)

def _snapshot_component_state(component: Componente) -> dict:
    data = component.__dict__.copy()
    for key in (
        '_id', '_labels', '_properties',
        'autor_rel', 'coleccion_rel', 'pais_rel', 'localidad_rel',
        'filiacion_cultural_rel', 'tipologias', 'exposiciones_rel',
        'imagenes',
    ):
        data.pop(key, None)
    exposiciones = data.get('exposiciones')
    if exposiciones is not None:
        try:
            data['exposiciones'] = list(exposiciones)
        except TypeError:
            data['exposiciones'] = exposiciones
    return data


def extract_year(fecha: str) -> int | None:
    """
    Extrae el año numérico desde fecha_creacion.
    Soporta formatos: 'ca. 1950', '1950', '1950-1970', 'Siglo XX', 'Primera mitad del siglo XX', etc.
    """
    if not fecha or not isinstance(fecha, str):
        return None
    fecha = fecha.lower().strip()

    # año simple
    m = re.search(r'(\d{4})', fecha)
    if m:
        return int(m.group(1))

    # rango de años (cuando no se detectó por el caso simple, ej: "1944-1956")
    m = re.search(r'(\d{4})\s*-\s*(\d{4})', fecha)
    if m:
        return int(m.group(1))

    # Casos textuales frecuentes (primera/segunda mitad, finales, etc.)
    textual_map = {
        "primera mitad del siglo xx": 1900,
        "primera mitad de siglo xx": 1900,
        "segunda mitad del siglo xx": 1950,
        "segunda mitad de siglo xx": 1950,
        "primera mitad del siglo xix": 1800,
        "primera mitad de siglo xix": 1800,
        "segunda mitad del siglo xix": 1850,
        "segunda mitad de siglo xix": 1850,
        "primera mitad del siglo xxi": 2000,
        "primera mitad de siglo xxi": 2000,
        "segunda mitad del siglo xxi": 2050,
        "segunda mitad de siglo xxi": 2050,
        "mediados del siglo xx": 1950,
        "mediados de siglo xx": 1950,
        "principios del siglo xx": 1900,
        "principios de siglo xx": 1900,
        "principios del siglo xxi": 2000,
        "principios de siglo xxi": 2000,
        "finales del siglo xx": 1980,
        "finales de siglo xx": 1980,
        "finales del siglo xix": 1890,
        "finales de siglo xix": 1890,
        "inicios del siglo xx": 1900,
        "inicios de siglo xx": 1900,
        "inicios del siglo xxi": 2000,
        "inicios de siglo xxi": 2000,
        "finales del siglo xix e inicios del xx": 1890,
        "finales del siglo xix e inicios del siglo xx": 1890,
        "segunda mitad del siglo xix a primera mitad del siglo xx": 1850,
    }
    for key, val in textual_map.items():
        if key in fecha:
            return val

    # siglo con números romanos
    m = re.search(r'siglo\s*([xiv]+)', fecha)
    if m:
        siglo = m.group(1)
        siglos = {
            'ix': 800, 'x': 900, 'xi': 1000, 'xii': 1100, 'xiii': 1200,
            'xiv': 1300, 'xv': 1400, 'xvi': 1500, 'xvii': 1600, 'xviii': 1700,
            'xix': 1800, 'xx': 1900, 'xxi': 2000,
        }
        return siglos.get(siglo)

    return None

class PiezaViewSet(viewsets.ViewSet):
    def _parse_filters(self, request):
        colecciones = request.query_params.getlist('coleccion__nombre')
        paises      = request.query_params.getlist('pais__nombre')
        autores     = request.query_params.getlist('autor__nombre')
        localidades = request.query_params.getlist('localidad__nombre')
        tipologias  = request.query_params.getlist('tipologia')
        expos_a     = request.query_params.getlist('exposiciones')
        expos_b     = request.query_params.getlist('exposiciones__titulo')
        fecha_from  = request.query_params.get('fecha_creacion_after', '').strip()
        fecha_to    = request.query_params.get('fecha_creacion_before', '').strip()


        def _norm_list(xs):
            # Elimina espacios, convierte a minúsculas y elimina comillas dobles
            return [x.strip().lower().replace('"', '') for x in xs if str(x).strip() != ""]

        return {
            "colecciones": _norm_list(colecciones),
            "paises":      _norm_list(paises),
            "autores":     _norm_list(autores),
            "localidades": _norm_list(localidades),
            "tipologias":  _norm_list(tipologias),
            "exposiciones": _norm_list(expos_a + expos_b),
            "fecha_from":  fecha_from,
            "fecha_to":    fecha_to,
        }
    
    def _filter_by_fecha(self, piezas, fecha_from: str, fecha_to: str):
        """Filtra una lista de piezas aplicando los límites de fecha (inclusive)."""
        year_from = extract_year(fecha_from) if fecha_from else None
        year_to = extract_year(fecha_to) if fecha_to else None

        if year_from is None and year_to is None:
            return piezas

        filtered = []
        for pieza in piezas:
            year = extract_year(getattr(pieza, 'fecha_creacion', '') or '')
            if year is None:
                continue
            if year_from is not None and year < year_from:
                continue
            if year_to is not None and year > year_to:
                continue
            filtered.append(pieza)
        return filtered

    def _cypher_base(self):
        return f"""
        MATCH (p:Pieza)
        OPTIONAL MATCH (p)-[:PERTENECE_A]->(c:Coleccion)
        WITH p, collect(DISTINCT toLower(trim(c.nombre))) AS cols
        OPTIONAL MATCH (p)-[:PROCEDENTE_DE]->(pa:Pais)
        WITH p, cols, collect(DISTINCT toLower(trim(pa.nombre))) AS pais_list
        OPTIONAL MATCH (p)-[:CREADO_POR]->(a:Autor)
        WITH p, cols, pais_list, collect(DISTINCT toLower(trim(a.nombre))) AS aut_list
        OPTIONAL MATCH (p)-[:LOCALIZADO_EN]->(l:Localidad)
        WITH p, cols, pais_list, aut_list, collect(DISTINCT toLower(trim(l.nombre))) AS loc_list
        WITH p, cols, pais_list, aut_list, loc_list,
             [e IN coalesce(p.exposiciones, []) | toLower(trim(replace(e, '"', '')))] AS expo_list
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
        AND (
            size($exposiciones) = 0 OR any(x IN $exposiciones WHERE any(e IN expo_list WHERE e CONTAINS x))
        )
        RETURN p
        {_NUM_ORDER_CLAUSE}
        """

    def list(self, request):
        params = self._parse_filters(request)
        q = self._cypher_base()

        search = request.query_params.get("search", "").strip()
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", settings.REST_FRAMEWORK['PAGE_SIZE']))
        skip = (page - 1) * page_size
        fecha_from = params.get("fecha_from")
        fecha_to = params.get("fecha_to")
        use_fecha_filter = bool(fecha_from or fecha_to)

        if search:
            # Consulta simple, ignora filtros avanzados
            q_simple = f"""
            MATCH (p:Pieza)
            WHERE toString(p.numero_inventario) CONTAINS '{search}'
            OR toLower(coalesce(p.nombre_comun, '')) CONTAINS '{search.lower()}'
            OR toLower(coalesce(p.nombre_especifico, '')) CONTAINS '{search.lower()}'
            OR toLower(coalesce(p.descripcion_col, '')) CONTAINS '{search.lower()}'
            RETURN p
            {_NUM_ORDER_CLAUSE} SKIP {skip} LIMIT {page_size}
            """
            rows, _ = db.cypher_query(q_simple)
            piezas = [Pieza.inflate(r[0]) for r in rows]
            if use_fecha_filter:
                piezas = self._filter_by_fecha(piezas, fecha_from, fecha_to)
            total_count = len(piezas)
        else:
            if use_fecha_filter:
                rows, _ = db.cypher_query(q, params)
                piezas_all = [Pieza.inflate(r[0]) for r in rows]
                piezas = self._filter_by_fecha(piezas_all, fecha_from, fecha_to)
                total_count = len(piezas)
                piezas = piezas[skip:skip + page_size]
            else:
                q_page = q.replace(_NUM_ORDER_CLAUSE, f"{_NUM_ORDER_CLAUSE} SKIP {skip} LIMIT {page_size}")
                rows, _ = db.cypher_query(q_page, params)
                piezas = [Pieza.inflate(r[0]) for r in rows]
                q_count = q.replace(_NUM_ORDER_CLAUSE, "")
                count_rows, _ = db.cypher_query(q_count, params)
                total_count = len(count_rows)

        ser = PiezaOutSerializer(piezas, many=True, context={'request': request})

         # Construir next/previous preservando query params
        base_url = request.build_absolute_uri(request.path)
        query_params = request.GET.copy()
        query_params['page_size'] = str(page_size)

        next_url = None
        previous_url = None
        if skip + page_size < total_count:
            next_params = query_params.copy()
            next_params['page'] = str(page + 1)
            next_url = f"{base_url}?{next_params.urlencode()}"
        if page > 1:
            prev_params = query_params.copy()
            prev_params['page'] = str(page - 1)
            previous_url = f"{base_url}?{prev_params.urlencode()}"

        return Response({
            "count": total_count,
            "next": next_url,
            "previous": previous_url,
            "results": ser.data
        })

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
        q = (
            "MATCH (p:Pieza) "
            "RETURN coalesce(max(coalesce(p.numero_inventario_int, toInteger(p.numero_inventario))), 0) AS maxn"
        )
        rows, _ = db.cypher_query(q)
        maxn = int(rows[0][0]) if rows and rows[0] and rows[0][0] is not None else 0
        return Response({"next": maxn + 1})


    def retrieve(self, request, pk=None):
        pieza = Pieza.nodes.get(numero_inventario=str(int(pk)))
        return Response(PiezaOutSerializer(pieza, context={'request': request}).data)

    def create(self, request):
        data = request.data
        numero_raw = _get('numero_inventario', data)
        numero_int = _numero_inventario_to_int(numero_raw)
        if numero_int is None:
            return Response(
                {"detail": "El número de inventario debe ser un entero positivo."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        numero_inventario = str(numero_int)

        # 1) Campos planos de Pieza (propiedades que SÍ existen como String/Float en el modelo)
        pieza = Pieza(
            numero_inventario=numero_inventario,
            numero_inventario_int=numero_int,
            revision=_get('revision', data),
            numero_registro_anterior=_get('numero_registro_anterior', data),
            codigo_surdoc=_get('codigo_surdoc', data),
            ubicacion=_get('ubicacion', data),
            deposito=_to_int_or_none(_get('deposito', data, default=None)),
            estante=_get('estante', data),
            caja_actual=_get('caja_actual', data),
            tipologia=_get('tipologia', data),
            coleccion=_get('coleccion', data),
            clasificacion=_get('clasificacion', data),
            conjunto=_get('conjunto', data),
            nombre_comun=_get('nombre_comun', data),
            nombre_especifico=_get('nombre_especifico', data),
            autor=_get('autor', data),
            filiacion_cultural=_get('filiacion_cultural', data),
            pais=_get('pais', data),
            localidad=_get('localidad', data),
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
        _set_single_rel(pieza, 'autor_rel', Autor, _get('autor', data))
        _set_single_rel(pieza, 'coleccion_rel', Coleccion, _get('coleccion', data))
        _set_single_rel(pieza, 'pais_rel', Pais, _get('pais', data))
        _set_single_rel(pieza, 'localidad_rel', Localidad, _get('localidad', data))
        _set_single_rel(pieza, 'filiacion_cultural_rel', Cultura, _get('filiacion_cultural', data))
        _set_single_rel(pieza, 'tipologias', Tipologia, _get('tipologia', data))

        # 3) Relaciones N–N (listas desde string con ; o ,)
        _set_many_names(pieza, 'materiales', Material, _split_list(_get('materialidad', data)))
        _set_many_names(pieza, 'tecnica', Tecnica, _split_list(_get('tecnica', data)))
        # _set_many_names(pieza, 'exposiciones', Exposicion, _split_list(_get('exposiciones', data)))

        # NUEVO: guardar exposiciones como lista
        expos_list = _split_list(_get('exposiciones', data))
        pieza.exposiciones = expos_list
        pieza.save()
        _set_many_names(pieza, 'exposiciones_rel', Exposicion, expos_list)

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
                    deposito=_to_int_or_none(comp.get('deposito')),
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
                    alto_cm=_to_float_or_none(comp.get('alto_cm')),
                    ancho_cm=_to_float_or_none(comp.get('ancho_cm')),
                    profundidad_cm=_to_float_or_none(comp.get('profundidad_cm')),
                    diametro_cm=_to_float_or_none(comp.get('diametro_cm')),
                    espesor_mm=_to_float_or_none(comp.get('espesor_mm')),
                    peso_gr=_to_float_or_none(comp.get('peso_gr')),

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
                 # NUEVO: exposiciones de componente (string -> lista)
                c.exposiciones = _split_list(comp.get('exposiciones', ''))
                c.save()
                _sync_component_relations(c, comp)
                pieza.componentes.connect(c)
                # exposiciones_raw = comp.get('exposiciones', '')
                # exposiciones_list = _split_list(exposiciones_raw)
                # if exposiciones_list and any(e.strip() for e in exposiciones_list):
                #     _set_many_names(c, 'exposiciones', Exposicion, exposiciones_list)

        # 5) Imagen de pieza (opcional)
        imagen = request.FILES.get('imagen')
        if imagen:
            stored_name = _store_uploaded_image(imagen)
            if stored_name:
                img = Imagen(file_name=stored_name, descripcion="").save()
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

        cambios_pieza: list[dict] = []
        
        def add_cambio_pieza(campo, antes, despues):
            for cambio in cambios_pieza:
                if cambio.get("campo") == campo:
                    cambio["antes"] = antes
                    cambio["despues"] = despues
                    return
            cambios_pieza.append({
                "campo": campo,
                "antes": antes,
                "despues": despues,
            })

        # Guardar snapshot de componentes antes
        before_components = []
        for c in pieza.componentes.all():
            before_components.append(_snapshot_component_state(c))

        # 1) Actualizar PROPIEDADES planas (sin tocar relaciones)
        scalar_field_map = {
            'revision': ('revision',),
            'numero_registro_anterior': ('numero_registro_anterior',),
            'codigo_surdoc': ('codigo_surdoc',),
            'ubicacion': ('ubicacion',),
            'deposito': ('deposito',),
            'estante': ('estante',),
            'caja_actual': ('caja_actual',),
            'tipologia': ('tipologia',),
            'coleccion': ('coleccion',),
            'clasificacion': ('clasificacion',),
            'conjunto': ('conjunto',),
            'nombre_comun': ('nombre_comun',),
            'nombre_especifico': ('nombre_especifico',),
            'autor': ('autor',),
            'filiacion_cultural': ('filiacion_cultural',),
            'pais': ('pais',),
            'localidad': ('localidad',),
            'fecha_creacion': ('fecha_creacion',),
            'descripcion_col': ('descripcion_col', 'descripcion'),
            'marcas_inscripciones': ('marcas_inscripciones',),
            'contexto_historico': ('contexto_historico',),
            'bibliografia': ('bibliografia',),
            'iconografia': ('iconografia',),
            'notas_investigacion': ('notas_investigacion',),
            'descripcion_cr': ('descripcion_cr', 'descripcion_conservacion'),
            'alto_cm': ('alto_cm',),
            'ancho_cm': ('ancho_cm',),
            'profundidad_cm': ('profundidad_cm',),
            'diametro_cm': ('diametro_cm',),
            'espesor_mm': ('espesor_mm',),
            'peso_gr': ('peso_gr',),
            'funcion': ('funcion',),
            'estado_conservacion': ('estado_conservacion',),
            'responsable_conservacion': ('responsable_conservacion',),
            'fecha_actualizacion_conservacion': ('fecha_actualizacion_conservacion',),
            'comentarios_conservacion': ('comentarios_conservacion',),
            'avaluo': ('avaluo',),
            'procedencia': ('procedencia',),
            'donante': ('donante',),
            'fecha_ingreso': ('fecha_ingreso',),
            'responsable_coleccion': ('responsable_coleccion',),
            'fecha_ultima_modificacion': ('fecha_ultima_modificacion',),
        }
        
        float_fields = {
            'alto_cm', 'ancho_cm', 'profundidad_cm',
            'diametro_cm', 'espesor_mm', 'peso_gr'
        }

        int_fields = {'deposito'}

        updated_scalar = False
        for attr, keys in scalar_field_map.items():
            raw_value = _get_optional(keys[0], data, *keys[1:])
            if raw_value is _UNSET:
                continue
            if attr in float_fields:
                value = _to_float_or_none(raw_value)
            elif attr in int_fields:
                value = _to_int_or_none(raw_value)
            else:
                value = _clean_empty(raw_value)
            before_value = getattr(pieza, attr, None)
            if _canonical(before_value) == _canonical(value):
                continue
            setattr(pieza, attr, value)
            updated_scalar = True
            add_cambio_pieza(attr, before_value, value)


        exposiciones_value = _get_optional('exposiciones', data)
        expos_list_for_rel = None
        if exposiciones_value is not _UNSET:
            before_list = list(getattr(pieza, 'exposiciones', []) or [])
            new_list = _split_list(exposiciones_value)
            expos_list_for_rel = new_list
            if sorted([v.strip().lower() for v in before_list if v]) != sorted([v.strip().lower() for v in new_list if v]):
                pieza.exposiciones = new_list
                updated_scalar = True
                add_cambio_pieza("exposiciones", before_list, new_list)


        if updated_scalar:
            pieza.save()

        # 2) Relaciones 1–1
        autor_val = _get_optional('autor', data)
        if autor_val is not _UNSET:
            changed, before_rel, after_rel = _set_single_rel(pieza, 'autor_rel', Autor, autor_val)
            if changed:
                add_cambio_pieza("autor", before_rel, after_rel)

        coleccion_val = _get_optional('coleccion', data)
        if coleccion_val is not _UNSET:
            changed, before_rel, after_rel = _set_single_rel(pieza, 'coleccion_rel', Coleccion, coleccion_val)
            if changed:
                add_cambio_pieza("coleccion", before_rel, after_rel)

        pais_val = _get_optional('pais', data)
        if pais_val is not _UNSET:
            changed, before_rel, after_rel = _set_single_rel(pieza, 'pais_rel', Pais, pais_val)
            if changed:
                add_cambio_pieza("pais", before_rel, after_rel)


        localidad_val = _get_optional('localidad', data)
        if localidad_val is not _UNSET:
            changed, before_rel, after_rel = _set_single_rel(pieza, 'localidad_rel', Localidad, localidad_val)
            if changed:
                add_cambio_pieza("localidad", before_rel, after_rel)

        filiacion_val = _get_optional('filiacion_cultural', data)
        if filiacion_val is not _UNSET:
            changed, before_rel, after_rel = _set_single_rel(pieza, 'filiacion_cultural_rel', Cultura, filiacion_val)
            if changed:
                add_cambio_pieza("filiacion_cultural", before_rel, after_rel)

        tipologia_val = _get_optional('tipologia', data)
        if tipologia_val is not _UNSET:
            changed, before_rel, after_rel = _set_single_rel(pieza, 'tipologias', Tipologia, tipologia_val)
            if changed:
                add_cambio_pieza("tipologia", before_rel, after_rel)

        # 3) Relaciones N–N
        materialidad_val = _get_optional('materialidad', data)
        if materialidad_val is not _UNSET:
            changed, before_rel, after_rel = _set_many_names(pieza, 'materiales', Material, _split_list(materialidad_val))
            if changed:
                add_cambio_pieza("materialidad", before_rel, after_rel)

        tecnica_val = _get_optional('tecnica', data)
        if tecnica_val is not _UNSET:
            changed, before_rel, after_rel = _set_many_names(pieza, 'tecnica', Tecnica, _split_list(tecnica_val))
            if changed:
                add_cambio_pieza("tecnica", before_rel, after_rel)

        if expos_list_for_rel is not None:
            changed, before_rel, after_rel = _set_many_names(pieza, 'exposiciones_rel', Exposicion, expos_list_for_rel)
            if changed:
                add_cambio_pieza("exposiciones_rel", before_rel, after_rel)
        
        # 4) Componentes (modo “reemplazar”)
        componentes = data.get('componentes')
        after_components = []
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
                    deposito=_to_int_or_none(comp.get('deposito')),
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
                    exposiciones=_split_list(comp.get('exposiciones', '')),
                    avaluo=comp.get('avaluo', ''),
                    procedencia=comp.get('procedencia', ''),
                    donante=comp.get('donante', ''),
                    fecha_ingreso=comp.get('fecha_ingreso', ''),
                    responsable_coleccion=comp.get('responsable_coleccion', ''),
                    fecha_ultima_modificacion=comp.get('fecha_ultima_modificacion', ''),
                ).save()
                _sync_component_relations(c, comp)
                pieza.componentes.connect(c)
                # exposiciones_raw = comp.get('exposiciones', '')
                # exposiciones_list = _split_list(exposiciones_raw)
                # if exposiciones_list and any(e.strip() for e in exposiciones_list):
                #     _set_many_names(c, 'exposiciones', Exposicion, exposiciones_list)
                # snapshot after
                after_components.append(_snapshot_component_state(c))

        # Cambios en componentes
        cambios_componentes = []

        def add_cambio_componente(campo, antes, despues):
            for cambio in cambios_componentes:
                if cambio.get("campo") == campo:
                    cambio["antes"] = antes
                    cambio["despues"] = despues
                    return
            cambios_componentes.append({
                "campo": campo,
                "antes": antes,
                "despues": despues,
            })

        if after_components or (componentes is not None and before_components):
            letras_antes = {c.get("letra", ""): c for c in before_components}
            letras_despues = {c.get("letra", ""): c for c in after_components}
            for letra, comp_after in letras_despues.items():
                comp_before = letras_antes.get(letra, {})
                for campo, valor_after in comp_after.items():
                    if campo.startswith("_"):
                        continue
                    valor_before = comp_before.get(campo, None)
                    if _canonical(valor_before) != _canonical(valor_after):
                        add_cambio_componente(
                            f"Componente {letra}: {campo}",
                            valor_before,
                            valor_after,
                        )
            for letra, comp_before in letras_antes.items():
                if letra not in letras_despues:
                    add_cambio_componente(
                        f"Componente {letra}",
                        comp_before,
                        None,
                    )
            for letra, comp_after in letras_despues.items():
                if letra not in letras_antes:
                    add_cambio_componente(
                        f"Componente {letra}",
                        None,
                        comp_after,
                    )

        imagen = request.FILES.get('imagen')
        if imagen:
            existing_imgs = list(pieza.imagenes.all())
            before_imgs = [img.file_name for img in existing_imgs]
            stored_name = _store_uploaded_image(imagen)
            if stored_name:
                for old_img in existing_imgs:
                    pieza.imagenes.disconnect(old_img)
                    old_img.delete()
                new_img = Imagen(file_name=stored_name, descripcion="").save()
                pieza.imagenes.connect(new_img)
                add_cambio_pieza("imagenes", before_imgs, [stored_name])

        if cambios_pieza or cambios_componentes:
            RegistroCambioPieza.objects.create(
                usuario=request.user,
                pieza_id=pieza.numero_inventario,
                accion="EDITAR",
                detalle=json.dumps({
                    "cambios_pieza": cambios_pieza,
                    "cambios_componentes": cambios_componentes,
                }, ensure_ascii=False, indent=2)
            )
        numero_int_actual = _numero_inventario_to_int(pieza.numero_inventario)
        if numero_int_actual is not None and pieza.numero_inventario_int != numero_int_actual:
            pieza.numero_inventario_int = numero_int_actual
            pieza.save()

        return Response(PiezaOutSerializer(pieza, context={'request': request}).data)


    def destroy(self, request, pk=None):
        # Solo admin
        if not (request.user and getattr(request.user, "role", None) == "admin"):
            return Response({"detail": "Solo administradores pueden eliminar piezas."}, status=status.HTTP_403_FORBIDDEN)

        pieza = Pieza.nodes.get(numero_inventario=str(int(pk)))

        # Verifica fecha_ingreso
        fecha_ingreso = pieza.fecha_ingreso
        if fecha_ingreso:
            try:
                # Asume formato YYYY-MM-DD, ajusta si es necesario
                fecha_dt = datetime.strptime(fecha_ingreso[:10], "%Y-%m-%d")
                if (datetime.now() - fecha_dt).days > 365:
                    return Response({"detail": "No se puede eliminar piezas con fecha de ingreso mayor a 1 año."}, status=status.HTTP_400_BAD_REQUEST)
            except Exception:
                pass  # Si no se puede parsear, permite eliminar

        # Marca como eliminada (agrega propiedad o relación)
        pieza.etiqueta_eliminado = True
        pieza.save()

        # Auditoría
        RegistroCambioPieza.objects.create(
            usuario=request.user,
            pieza_id=pieza.numero_inventario,
            accion="EDITAR",
            detalle=json.dumps({"eliminado": True})
        )
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

def _catalog_from_queries(*queries: str) -> list[dict]:
    """Ejecuta una o varias consultas Cypher que retornan un único campo"""
    collected: list[str] = []
    for query in queries:
        if not query:
            continue
        rows, _ = db.cypher_query(query)
        for row in rows:
            if not row:
                continue
            value = row[0]
            if isinstance(value, str):
                cleaned = value.strip()
            else:
                cleaned = value
            if cleaned:
                collected.append(str(cleaned))
    return _catalog_json(collected)

class PaisViewSet(viewsets.ViewSet):
    def list(self, request):
        data = _catalog_from_queries(
            """
            MATCH (p:Pieza)-[:PROCEDENTE_DE]->(pa:Pais)
            WITH DISTINCT trim(pa.nombre) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
            """
            MATCH (comp:Componente)-[:PROCEDENTE_DE]->(pa:Pais)
            WITH DISTINCT trim(pa.nombre) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
            """
            MATCH (c:Componente)
            WITH DISTINCT trim(c.pais) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
        )
        return Response(data)

class ColeccionViewSet(viewsets.ViewSet):
    def list(self, request):
        data = _catalog_from_queries(
            """
            MATCH (p:Pieza)-[:PERTENECE_A]->(c:Coleccion)
            WITH DISTINCT trim(c.nombre) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
            """
            MATCH (comp:Componente)-[:PERTENECE_A]->(c:Coleccion)
            WITH DISTINCT trim(c.nombre) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
            """
            MATCH (comp:Componente)
            WITH DISTINCT trim(comp.coleccion) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
        )
        return Response(data)

class AutorViewSet(viewsets.ViewSet):
    def list(self, request):
        data = _catalog_from_queries(
            """
            MATCH (p:Pieza)-[:CREADO_POR]->(a:Autor)
            WITH DISTINCT trim(a.nombre) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
            """
            MATCH (comp:Componente)-[:CREADO_POR]->(a:Autor)
            WITH DISTINCT trim(a.nombre) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
            """
            MATCH (comp:Componente)
            WITH DISTINCT trim(comp.autor) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
        )
        return Response(data)

class LocalidadViewSet(viewsets.ViewSet):
    def list(self, request):
        data = _catalog_from_queries(
            """
            MATCH (p:Pieza)-[:LOCALIZADO_EN]->(l:Localidad)
            WITH DISTINCT trim(l.nombre) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
            """
            MATCH (comp:Componente)-[:LOCALIZADO_EN]->(l:Localidad)
            WITH DISTINCT trim(l.nombre) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
            """
            MATCH (comp:Componente)
            WITH DISTINCT trim(comp.localidad) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
        )
        return Response(data)

class TipologiaViewSet(viewsets.ViewSet):
    def list(self, request):
        data = _catalog_from_queries(
            """
            MATCH (p:Pieza)
            WITH DISTINCT trim(coalesce(p.tipologia, '')) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
            """
            MATCH (p:Pieza)-[:TIENE_TIPOLOGIA]->(t:Tipologia)
            WITH DISTINCT trim(coalesce(t.nombre, '')) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
            """
            MATCH (comp:Componente)
            WITH DISTINCT trim(coalesce(comp.tipologia, '')) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
             """
            MATCH (comp:Componente)-[:TIENE_TIPOLOGIA]->(t:Tipologia)
            WITH DISTINCT trim(coalesce(t.nombre, '')) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
            """
            MATCH (t:Tipologia)
            WITH DISTINCT trim(coalesce(t.nombre, '')) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
        )
        return Response(data)
    
class ExposicionViewSet(viewsets.ViewSet):
    def list(self, request):
        # Unir exposiciones desde Pieza y desde Componentes
        data = _catalog_from_queries(
            """
            MATCH (p:Pieza)
            UNWIND coalesce(p.exposiciones, []) AS expo
            WITH DISTINCT trim(replace(expo, '"', '')) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
            """
            MATCH (p:Pieza)-[:EXHIBIDO_EN]->(e:Exposicion)
            WITH DISTINCT trim(coalesce(e.titulo, '')) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
            """
            MATCH (comp:Componente)
            UNWIND coalesce(comp.exposiciones, []) AS expo
            WITH DISTINCT trim(replace(expo, '"', '')) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
            """
            MATCH (comp:Componente)-[:EXHIBIDO_EN]->(e:Exposicion)
            WITH DISTINCT trim(coalesce(e.titulo, '')) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
            """
            MATCH (e:Exposicion)
            WITH DISTINCT trim(coalesce(e.titulo, '')) AS nombre
            WHERE nombre <> ''
            RETURN nombre
            ORDER BY nombre
            """,
        )
        return Response(data)
    
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

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def exportar_excel_con_imagenes(request):
    ids = request.data.get("ids", [])
    if not ids or not isinstance(ids, list):
        return Response({"detail": "Debes enviar una lista de IDs"}, status=400)
    
    piezas = [Pieza.nodes.get(numero_inventario=str(int(id_))) for id_ in ids]

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Piezas"

    headers = [
        "N° de inventario", "Nombre común", "Nombre atribuido", "País", "Localidad",
        "Fecha de creación", "Materialidad", "Descripción de colecciones", "Estado de conservación", "Imagen"
    ]
    ws.append(headers)
    
    # Ajustamos ancho de columnas para que el contenido se vea completo
    column_widths = {
        "A": 16,  # N° de inventario
        "B": 22,  # Nombre común
        "C": 22,  # Nombre atribuido
        "D": 16,  # País
        "E": 20,  # Localidad
        "F": 18,  # Fecha de creación
        "G": 22,  # Materialidad
        "H": 32,  # Descripción de colecciones
        "I": 22,  # Estado de conservación
        "J": 24,  # Imagen
    }
    for column, width in column_widths.items():
        ws.column_dimensions[column].width = width

    # Ajustamos la altura de la fila de encabezados
    ws.row_dimensions[1].height = 28

    # Usa PiezaOutSerializer para obtener datos completos
    ser = PiezaOutSerializer(piezas, many=True, context={'request': request})

    for idx, pieza_data in enumerate(ser.data, start=2):
        # Extrae materialidad desde tecnica o materiales
        materialidad = ""
        if isinstance(pieza_data.get("tecnica"), list):
            materialidad = ", ".join(pieza_data["tecnica"])
        elif pieza_data.get("materialidad"):
            materialidad = pieza_data["materialidad"]

        row = [
            pieza_data.get("numero_inventario", ""),
            pieza_data.get("nombre_comun", ""),
            pieza_data.get("nombre_especifico", ""),
            pieza_data.get("pais", ""),
            pieza_data.get("localidad", ""),
            pieza_data.get("fecha_creacion", ""),
            materialidad,
            pieza_data.get("descripcion_col", ""),
            pieza_data.get("estado_conservacion", ""),
            "",  # Aquí irá la imagen embebida
        ]
        ws.append(row)

        # Ajustamos la altura de la fila para acomodar imágenes y texto
        ws.row_dimensions[idx].height = 150

        # Imagen embebida (leer desde /imagenes)
        imagenes = pieza_data.get("imagenes", [])
        if imagenes and len(imagenes) > 0:
            img_url = imagenes[0].get("imagen")
            if img_url:
                # Extraer nombre de archivo desde la URL
                # Ejemplo: http://localhost:8002/imagenes/04600.00.jpg -> 04600.00.jpg
                file_name = img_url.split("/imagenes/")[-1]
                img_path = os.path.join("/imagenes", file_name)
                
                if os.path.exists(img_path):
                    try:
                        img = XLImage(img_path)
                        img.width = 180
                        img.height = 180
                        cell = f"J{idx}"  # Columna J es la 10ma (Imagen)
                        ws.add_image(img, cell)
                    except Exception as e:
                        print(f"Error al insertar imagen {file_name}: {e}")
                else:
                    print(f"Imagen no encontrada: {img_path}")

    with BytesIO() as output:
        wb.save(output)
        output.seek(0)
        response = HttpResponse(
            output.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="piezas_con_imagenes.xlsx"'
        return response