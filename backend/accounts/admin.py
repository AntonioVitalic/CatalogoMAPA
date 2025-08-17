from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, RegistroCambioPieza

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    model = Usuario
    list_display = ('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Roles', {'fields': ('role',)}),
        ('Permissions', {'fields': ('is_active','is_staff','is_superuser','groups','user_permissions')}),
        ('Important dates', {'fields': ('last_login','date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email','password1','password2','first_name','last_name','role','is_active','is_staff','is_superuser'),
        }),
    )
    filter_horizontal = ('groups','user_permissions',)

@admin.register(RegistroCambioPieza)
class RegistroCambioPiezaAdmin(admin.ModelAdmin):
    list_display = ('id', 'usuario', 'pieza_id', 'accion', 'fecha')
    list_filter = ('accion', 'fecha')
    search_fields = ('pieza_id', 'usuario__email')
    ordering = ('-fecha',)
