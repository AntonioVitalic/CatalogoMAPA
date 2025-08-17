from rest_framework import serializers
from .models import Usuario, RegistroCambioPieza

class UsuarioPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'first_name', 'last_name', 'email', 'role', 'is_active', 'date_joined']

class RegistroCambioPiezaSerializer(serializers.ModelSerializer):
    usuario = UsuarioPublicSerializer()
    class Meta:
        model = RegistroCambioPieza
        fields = ['id', 'usuario', 'pieza_id', 'accion', 'fecha', 'detalle']
