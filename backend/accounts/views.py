from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db import transaction
from .models import Usuario, RegistroCambioPieza
from .serializers import UsuarioPublicSerializer, RegistroCambioPiezaSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

def _admin_activo_existe(exclude_id=None):
    qs = Usuario.objects.filter(role='admin', is_active=True)
    if exclude_id:
        qs = qs.exclude(id=exclude_id)
    return qs.exists()

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        first_name = request.data.get('first_name','').strip()
        last_name  = request.data.get('last_name','').strip()
        email      = request.data.get('email','').strip().lower()
        password   = request.data.get('password','')
        role       = request.data.get('role','visitor')

        if role == 'admin' and _admin_activo_existe():
            return Response({'error':'Ya existe un administrador activo.'}, status=400)
        if not all([first_name, last_name, email, password]):
            return Response({'error':'Faltan campos obligatorios'}, status=400)
        if Usuario.objects.filter(email=email).exists():
            return Response({'error':'Email ya registrado'}, status=400)

        user = Usuario.objects.create_user(email=email, password=password,
                                           first_name=first_name, last_name=last_name,
                                           is_active=True, role=role)
        # emitir tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UsuarioPublicSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=201)

class LoginView(TokenObtainPairView):
    """
    Usa el serializer por defecto de SimpleJWT (email como username).
    Cuerpo esperado: {"email": "...", "password": "..."}
    """
    # Para usar email en lugar de username, SimpleJWT mira USERNAME_FIELD del modelo (ya es 'email')
    # Así que no hace falta serializer custom si mantienes ese contrato.

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response(UsuarioPublicSerializer(request.user).data)

class UsersListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role != 'admin':
            return Response({'detail':'Forbidden'}, status=403)
        users = Usuario.objects.all().order_by('-date_joined')
        return Response(UsuarioPublicSerializer(users, many=True).data)

class UserUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def patch(self, request, pk):
        if request.user.role != 'admin':
            return Response({'detail':'Forbidden'}, status=403)
        try:
            u = Usuario.objects.get(pk=pk)
        except Usuario.DoesNotExist:
            return Response(status=404)

        role = request.data.get('role')
        is_active = request.data.get('is_active')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')

        if role == 'admin' and _admin_activo_existe(exclude_id=u.id):
            return Response({'error':'Ya existe un administrador activo.'}, status=400)

        if first_name is not None: u.first_name = first_name
        if last_name is not None:  u.last_name = last_name
        if role is not None:       u.role = role
        if is_active is not None:  u.is_active = bool(is_active)
        u.save()
        return Response(UsuarioPublicSerializer(u).data)

class RegistroCambiosView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role not in ('admin','editor'):
            return Response({'detail':'Forbidden'}, status=403)
        regs = RegistroCambioPieza.objects.select_related('usuario').all()
        return Response(RegistroCambioPiezaSerializer(regs, many=True).data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def borrar_historial_cambios(request):
    if request.user.role != 'admin':
        return Response({'detail': 'Forbidden'}, status=403)
    RegistroCambioPieza.objects.all().delete()
    return Response({'detail': 'Historial borrado'}, status=204)