from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from django.conf import settings
from neomodel import db
import json

from .models import (
    Pieza, Componente, Imagen, Autor, Pais,
    Localidad, Material, Coleccion
)

from .serializers import (
    PiezaOutSerializer, ComponenteOutSerializer,
    ImagenOutSerializer, ImagenListSerializer, PiezaExportSerializer
)

from accounts.models import RegistroCambioPieza

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

    def retrieve(self, request, pk=None):
        pieza = Pieza.nodes.get(numero_inventario=str(int(pk)))
        return Response(PiezaOutSerializer(pieza, context={'request': request}).data)

    def create(self, request):
        data = request.data
        # Crear la pieza en Neo4j
        pieza = Pieza(
            numero_inventario=data.get('numero_inventario'),
            revision=data.get('revision', ''),
            numero_registro_anterior=data.get('numero_registro_anterior', ''),
            codigo_surdoc=data.get('codigo_surdoc', ''),
            ubicacion=data.get('ubicacion', ''),
            deposito=data.get('deposito', ''),
            estante=data.get('estante', ''),
            caja_actual=data.get('caja_actual', ''),
            tipologia=data.get('tipologia', ''),
            clasificacion=data.get('clasificacion', ''),
            conjunto=data.get('conjunto', ''),
            nombre_comun=data.get('nombre_comun', ''),
            nombre_especifico=data.get('nombre_especifico', ''),
            fecha_creacion=data.get('fecha_creacion', ''),
            descripcion=data.get('descripcion', ''),
            marcas_inscripciones=data.get('marcas_inscripciones', ''),
            contexto_historico=data.get('contexto_historico', ''),
            bibliografia=data.get('bibliografia', ''),
            iconografia=data.get('iconografia', ''),
            notas_investigacion=data.get('notas_investigacion', ''),
            avaluo=data.get('avaluo', ''),
            procedencia=data.get('procedencia', ''),
            donante=data.get('donante', ''),
            fecha_ingreso=data.get('fecha_ingreso', ''),
            estado_conservacion=data.get('estado_conservacion', ''),
            descripcion_conservacion=data.get('descripcion_conservacion', ''),
            responsable_conservacion=data.get('responsable_conservacion', ''),
            fecha_actualizacion_conservacion=data.get('fecha_actualizacion_conservacion', ''),
            comentarios_conservacion=data.get('comentarios_conservacion', ''),
            responsable_coleccion=data.get('responsable_coleccion', ''),
            filiacion_cultural=data.get('filiacion_cultural', ''),
            pais=data.get('pais', ''),
            localidad=data.get('localidad', ''),
            coleccion=data.get('coleccion', ''),
            materialidad=data.get('materialidad', ''),
            tecnica=data.get('tecnica', ''),
        ).save()

        # Componentes
        componentes = data.get('componentes')
        if componentes:
            import json
            comps = json.loads(componentes) if isinstance(componentes, str) else componentes
            for comp in comps:
                c = Componente(
                    pieza_numero_inventario=pieza.numero_inventario,
                    letra=comp.get('letra', ''),
                    nombre_comun=comp.get('nombre_comun', ''),
                    nombre_atribuido=comp.get('nombre_atribuido', ''),
                    descripcion=comp.get('descripcion', ''),
                    funcion=comp.get('funcion', ''),
                    forma=comp.get('forma', ''),
                    marcas_inscripciones=comp.get('marcas_inscripciones', ''),
                    peso_kg=float(comp.get('peso_kg', 0) or 0),
                    alto_cm=float(comp.get('alto_cm', 0) or 0),
                    ancho_cm=float(comp.get('ancho_cm', 0) or 0),
                    profundidad_cm=float(comp.get('profundidad_cm', 0) or 0),
                    diametro_cm=float(comp.get('diametro_cm', 0) or 0),
                    espesor_mm=float(comp.get('espesor_mm', 0) or 0),
                    estado_conservacion=comp.get('estado_conservacion', ''),
                    materialidad=comp.get('materialidad', ''),
                    tecnica=comp.get('tecnica', ''),
                ).save()
                pieza.componentes.connect(c)

        # Imagen (si se subió)
        imagen = request.FILES.get('imagen')
        if imagen:
            file_name = imagen.name
            img = Imagen(file_name=file_name, descripcion="").save()
            pieza.imagenes.connect(img)

        # Auditoría: guardar estado "before" / "after" en detalle (JSON-string)
        after_obj = {
            "numero_inventario": pieza.numero_inventario,
            "nombre_especifico": pieza.nombre_especifico,
            "descripcion": pieza.descripcion,
            "coleccion": pieza.coleccion,
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
        # Actualizar campos
        for field in [
            'revision', 'numero_registro_anterior', 'codigo_surdoc', 'ubicacion', 'deposito', 'estante', 'caja_actual',
            'tipologia', 'clasificacion', 'conjunto', 'nombre_comun', 'nombre_especifico', 'fecha_creacion',
            'descripcion', 'marcas_inscripciones', 'contexto_historico', 'bibliografia', 'iconografia',
            'notas_investigacion', 'avaluo', 'procedencia', 'donante', 'fecha_ingreso', 'estado_conservacion',
            'descripcion_conservacion', 'responsable_conservacion', 'fecha_actualizacion_conservacion',
            'comentarios_conservacion', 'responsable_coleccion', 'filiacion_cultural', 'pais', 'localidad',
            'coleccion', 'materialidad', 'tecnica'
        ]:
            if field in data:
                setattr(pieza, field, data.get(field))
        pieza.save()

        # Componentes (actualización simple: eliminar y volver a crear)
        componentes = data.get('componentes')
        if componentes:
            import json
            comps = json.loads(componentes) if isinstance(componentes, str) else componentes
            # Eliminar componentes previos
            for c in pieza.componentes.all():
                pieza.componentes.disconnect(c)
                c.delete()
            # Crear nuevos
            for comp in comps:
                c = Componente(
                    pieza_numero_inventario=pieza.numero_inventario,
                    letra=comp.get('letra', ''),
                    nombre_comun=comp.get('nombre_comun', ''),
                    nombre_atribuido=comp.get('nombre_atribuido', ''),
                    descripcion=comp.get('descripcion', ''),
                    funcion=comp.get('funcion', ''),
                    forma=comp.get('forma', ''),
                    marcas_inscripciones=comp.get('marcas_inscripciones', ''),
                    peso_kg=float(comp.get('peso_kg', 0) or 0),
                    alto_cm=float(comp.get('alto_cm', 0) or 0),
                    ancho_cm=float(comp.get('ancho_cm', 0) or 0),
                    profundidad_cm=float(comp.get('profundidad_cm', 0) or 0),
                    diametro_cm=float(comp.get('diametro_cm', 0) or 0),
                    espesor_mm=float(comp.get('espesor_mm', 0) or 0),
                    estado_conservacion=comp.get('estado_conservacion', ''),
                    materialidad=comp.get('materialidad', ''),
                    tecnica=comp.get('tecnica', ''),
                ).save()
                pieza.componentes.connect(c)

        # Imagen (si se subió)
        imagen = request.FILES.get('imagen')
        if imagen:
            file_name = imagen.name
            img = Imagen(file_name=file_name, descripcion="").save()
            pieza.imagenes.connect(img)

        # Auditoría: construir objeto before/after con algunos campos relevantes
        # before_obj fue capturado antes de modificar 'pieza' (ver abajo)
        before_obj = {}
        for f in ["numero_inventario", "nombre_especifico", "descripcion", "coleccion"]:
            before_obj[f] = getattr(pieza, f, None)
        # ya se guardó la pieza arriba; construir after_obj
        after_obj = {
            "numero_inventario": pieza.numero_inventario,
            "nombre_especifico": pieza.nombre_especifico,
            "descripcion": pieza.descripcion,
            "coleccion": pieza.coleccion,
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
            "descripcion": pieza.descripcion,
            "coleccion": pieza.coleccion,
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
        ser = ComponenteOutSerializer(comps, many=True, context={'request': request})
        return Response(ser.data)

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