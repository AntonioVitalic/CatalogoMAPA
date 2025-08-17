from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, MeView, UsersListView, UserUpdateView, RegistroCambiosView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/',    LoginView.as_view()),      # devuelve access + refresh
    path('refresh/',  TokenRefreshView.as_view()),
    path('me/',       MeView.as_view()),
    path('users/',    UsersListView.as_view()),
    path('user/<int:pk>/', UserUpdateView.as_view()),
    path('registro-cambios-catalogo/', RegistroCambiosView.as_view()),
]
