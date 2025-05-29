# catalogo/models.py

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Pais(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    def __str__(self): 
        return self.nombre

class Localidad(models.Model):
    nombre = models.CharField(max_length=100)
    pais = models.ForeignKey(Pais, on_delete=models.PROTECT, related_name="localidades")
    def __str__(self):
        return f"{self.nombre} ({self.pais.nombre})"

class Cultura(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.nombre

class Coleccion(models.Model):
    nombre = models.CharField(max_length=200, unique=True)
    def __str__(self):
        return self.nombre

class Autor(models.Model):
    nombre = models.CharField(max_length=200, unique=True)
    def __str__(self):
        return self.nombre

class Exposicion(models.Model):
    titulo = models.CharField(max_length=200, unique=True)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    def __str__(self):
        return self.titulo

class Material(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.nombre

class Tecnica(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.nombre

class Pieza(models.Model):
    numero_inventario = models.CharField(max_length=50, unique=True)  # e.g. "2813"
    numero_registro_anterior = models.CharField(max_length=100, null=True, blank=True)  # if any
    codigo_surdoc = models.CharField(max_length=100, null=True, blank=True)  # código SURDOC u otro sistema
    # Ubicación interna en bodega/exhibición:
    ubicacion = models.CharField(max_length=200, null=True, blank=True)  # ubicación (sala o depósito)
    deposito = models.CharField(max_length=100, null=True, blank=True)
    estante = models.CharField(max_length=100, null=True, blank=True)
    caja_actual = models.CharField(max_length=100, null=True, blank=True)
    # Clasificación museológica:
    tipologia = models.CharField(max_length=100, null=True, blank=True)
    coleccion = models.ForeignKey(Coleccion, on_delete=models.PROTECT, related_name="piezas")
    clasificacion = models.CharField(max_length=100, null=True, blank=True)
    conjunto = models.CharField(max_length=200, null=True, blank=True)  # conjunto/serie al que pertenece, si aplica
    nombre_especifico = models.CharField(max_length=200, null=True, blank=True)  # nombre atribuido (ej. en lengua originaria)
    autor = models.ForeignKey(Autor, on_delete=models.PROTECT, null=True, blank=True, related_name="piezas")
    filiacion_cultural = models.ForeignKey(Cultura, on_delete=models.PROTECT, null=True, blank=True, related_name="piezas")
    pais = models.ForeignKey(Pais, on_delete=models.PROTECT, null=True, blank=True, related_name="piezas")
    localidad = models.ForeignKey(Localidad, on_delete=models.PROTECT, null=True, blank=True, related_name="piezas")
    fecha_creacion = models.CharField(max_length=100, null=True, blank=True)  # texto libre (e.g. "Siglo XX" o año aprox)
    descripcion = models.TextField(null=True, blank=True)  # descripción física o de colección
    marcas_inscripciones = models.TextField(null=True, blank=True)
    contexto_historico = models.TextField(null=True, blank=True)
    bibliografia = models.TextField(null=True, blank=True)
    iconografia = models.TextField(null=True, blank=True)
    notas_investigacion = models.TextField(null=True, blank=True)
    tecnica = models.ManyToManyField(Tecnica, blank=True, related_name="piezas")
    materiales = models.ManyToManyField(Material, blank=True, related_name="piezas")
    exposiciones = models.ManyToManyField(Exposicion, blank=True, related_name="piezas")
    avaluo = models.CharField(max_length=100, null=True, blank=True)  # valor o valuación
    procedencia = models.CharField(max_length=200, null=True, blank=True)  # origen/procedencia (ej. donación, compra)
    donante = models.CharField(max_length=200, null=True, blank=True)
    fecha_ingreso = models.CharField(max_length=100, null=True, blank=True)
    # Conservación:
    estado_conservacion = models.CharField(max_length=50, null=True, blank=True)  # e.g. "BUENO", "REGULAR", etc.
    descripcion_conservacion = models.TextField(null=True, blank=True)  # detalles de conservación/restauración
    responsable_conservacion = models.CharField(max_length=100, null=True, blank=True)
    fecha_actualizacion_conservacion = models.CharField(max_length=100, null=True, blank=True)
    comentarios_conservacion = models.TextField(null=True, blank=True)
    # Meta:
    responsable_coleccion = models.CharField(max_length=100, null=True, blank=True)  # quién es encargado de esta pieza
    fecha_ultima_modificacion = models.CharField(max_length=100, null=True, blank=True)
    # Campos de trazabilidad:
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="piezas_creadas")
    updated_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="piezas_editadas")

    def __str__(self):
        return f"Pieza {self.numero_inventario}"

class Componente(models.Model):
    pieza = models.ForeignKey(Pieza, on_delete=models.CASCADE, related_name="componentes")
    letra = models.CharField(max_length=10, null=True, blank=True)  # Identificador del componente (ej. "a", "b")
    nombre_comun = models.CharField(max_length=200)    # nombre común (español) del componente
    nombre_atribuido = models.CharField(max_length=200, null=True, blank=True)  # nombre en lengua originaria
    descripcion = models.TextField(null=True, blank=True)  # descripción física detallada
    funcion = models.CharField(max_length=200, null=True, blank=True)  # función del componente dentro de la pieza
    forma = models.CharField(max_length=100, null=True, blank=True)    # forma (configuración o shape) del componente
    tecnica = models.ManyToManyField(Tecnica, blank=True, related_name="componentes")   # técnicas aplicadas
    materiales = models.ManyToManyField(Material, blank=True, related_name="componentes") # materiales usados
    marcas_inscripciones = models.TextField(null=True, blank=True)  # marcas o inscripciones
    peso_kg = models.FloatField(null=True, blank=True)              # peso en kg
    alto_cm = models.FloatField(null=True, blank=True)              # dimensiones del componente
    ancho_cm = models.FloatField(null=True, blank=True)
    profundidad_cm = models.FloatField(null=True, blank=True)
    diametro_cm = models.FloatField(null=True, blank=True)
    espesor_mm = models.FloatField(null=True, blank=True)
    # Conservación por componente (opcional, generalmente se registra a nivel pieza):
    estado_conservacion = models.CharField(max_length=50, null=True, blank=True)  # estado individual, si se registra
    # Trazabilidad:
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="componentes_creados")
    updated_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="componentes_editados")

    def __str__(self):
        return f"Componente {self.pieza.numero_inventario}{self.letra or ''}"

class Imagen(models.Model):
    imagen = models.ImageField(upload_to="imagenes")  # archivo de imagen almacenado localmente
    pieza = models.ForeignKey(Pieza, null=True, blank=True, on_delete=models.CASCADE, related_name="imagenes")
    componente = models.ForeignKey(Componente, null=True, blank=True, on_delete=models.CASCADE, related_name="imagenes")
    descripcion = models.CharField(max_length=255, null=True, blank=True)  # descripción/caption opcional de la foto
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Imagen de {self.pieza or self.componente}"
