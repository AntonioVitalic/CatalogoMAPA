from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import Usuario, RegistroCambioPieza
from .serializers import UsuarioPublicSerializer, RegistroCambioPiezaSerializer
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.views import TokenObtainPairView


token_generator = PasswordResetTokenGenerator()

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

        # Ahora la app permite tener más de 1 usuario admin
        # if role == 'admin' and _admin_activo_existe():
        #     return Response({'error':'Ya existe un administrador activo.'}, status=400)
        if not all([first_name, last_name, email, password]):
            return Response({'error':'Faltan campos obligatorios'}, status=400)
        if Usuario.objects.filter(email=email).exists():
            return Response({'error':'Email ya registrado'}, status=400)

        # Si es visitante, crear inactivo
        is_active = False if role == 'visitor' else True

        user = Usuario.objects.create_user(email=email, password=password,
                                           first_name=first_name, last_name=last_name,
                                           is_active=is_active, role=role)
        if role == 'visitor':
            return Response({'detail': 'Solicitud enviada, espera aprobación del administrador.'}, status=201)
        # emitir tokens solo si es activo
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UsuarioPublicSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=201)

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'El correo electrónico es obligatorio.'}, status=400)

        try:
            user = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            # Para evitar enumeración de usuarios, devolvemos éxito genérico
            return Response({'detail': 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.'})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)
        reset_link = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/recuperar-password?uid={uid}&token={token}"
        subject = 'Recuperación de contraseña - Inventario MAPA'
        message = (
            'Hola,\n\n'
            'Se ha solicitado restablecer la contraseña de tu cuenta en Inventario MAPA. '
            'Para continuar, haz clic en el siguiente enlace o cópialo en tu navegador:\n\n'
            f"{reset_link}\n\n"
            'Si no solicitaste este cambio, puedes ignorar este mensaje.'
        )

        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
        except Exception:
            return Response({'error': 'No se pudo enviar el correo de recuperación. Intenta nuevamente más tarde.'}, status=500)
        return Response({'detail': 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get('uid', '')
        token = request.data.get('token', '')
        password = request.data.get('password', '')

        if not all([uid, token, password]):
            return Response({'error': 'Faltan datos para restablecer la contraseña.'}, status=400)

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = Usuario.objects.get(pk=user_id)
        except (ValueError, Usuario.DoesNotExist, TypeError):
            return Response({'error': 'El enlace de recuperación no es válido.'}, status=400)

        if not token_generator.check_token(user, token):
            return Response({'error': 'El enlace de recuperación ha expirado o no es válido.'}, status=400)

        try:
            validate_password(password, user)
        except ValidationError as exc:
            return Response({'error': ' '.join(exc.messages)}, status=400)

        from django.utils import timezone
        user.set_password(password)
        user.last_login = timezone.now()
        user.save(update_fields=['password', 'last_login'])

        return Response({'detail': 'Contraseña actualizada correctamente.'})


class LoginView(TokenObtainPairView):
    """
    Usa el serializer por defecto de SimpleJWT (email como username).
    Cuerpo esperado: {"email": "...", "password": "..."}
    """
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'
    # Para usar email en lugar de username, SimpleJWT mira USERNAME_FIELD del modelo (ya es 'email')


class LogoutView(APIView):
    """
    Blacklistea el refresh token enviado, invalidando la sesión.
    Cuerpo esperado: {"refresh": "<refresh_token>"}
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_raw = request.data.get('refresh', '')
        if not refresh_raw:
            return Response({'detail': 'Falta el refresh token.'}, status=400)
        try:
            token = RefreshToken(refresh_raw)
            token.blacklist()
        except TokenError:
            return Response({'detail': 'Refresh token inválido o ya revocado.'}, status=400)
        return Response(status=204)


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

        # Ahora la app permite tener más de 1 usuario admin
        # if role == 'admin' and _admin_activo_existe(exclude_id=u.id):
        #     return Response({'error':'Ya existe un administrador activo.'}, status=400)

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