import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";

export default function Auth() {
  type ApiErrorResponse = {
    response?: {
      data?: {
        error?: string;
        detail?: string;
      };
    };
    message?: string;
  };

  const extractErrorMessage = (err: unknown, fallback: string) => {
    const error = err as ApiErrorResponse;
    return error?.response?.data?.error || error?.response?.data?.detail || error?.message || fallback;
  };
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"visitor" | "editor" | "admin">("visitor");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/accounts/login/", {
        email: loginEmail,
        password: loginPassword,
      });
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      await refreshProfile();
      navigate("/");
     } catch (err: unknown) {
      const error = err as ApiErrorResponse;
      // Detecta el error de usuario inactivo
      if (
        error?.response?.data?.detail === "No active account found with the given credentials" ||
        error?.message === "No refresh token"
      ) {
        setError("Espera a que la administración acepte tu solicitud.");
      } else {
        setError(extractErrorMessage(error, "Error al iniciar sesión"));
      }
    } finally {
      setLoading(false);
    }
  };

   const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetMessage("");
    if (!resetEmail) {
      setResetError("Ingresa tu correo electrónico.");
      return;
    }

    setResetLoading(true);
    try {
      const { data } = await api.post("/accounts/password-reset/", { email: resetEmail });
      setResetMessage(
        data?.detail || "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña."
      );
    } catch (err: unknown) {
      setResetError(
        extractErrorMessage(err, "No fue posible enviar las instrucciones, inténtalo nuevamente.")
      );
    } finally {
      setResetLoading(false);
    }
  };


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/accounts/register/", {
        email: signupEmail,
        password: signupPassword,
        first_name: firstName,
        last_name: lastName,
        role: selectedRole,
      });
      if (signupPassword !== signupConfirmPassword) {
        setError("Las contraseñas no coinciden.");
        setLoading(false);
        return;
      }
      if (selectedRole === "visitor") {
        setError("Solicitud enviada, espera aprobación del administrador.");
        setLoading(false);
        return;
      }
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      await refreshProfile();
      navigate("/");
     } catch (err: unknown) {
      setError(extractErrorMessage(err, "Error al crear la cuenta"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Inventario MAPA</CardTitle>
          <CardDescription>
            Accede a tu cuenta para gestionar el inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
                 <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm"
                    onClick={() => {
                      setResetEmail(loginEmail);
                      setResetError("");
                      setResetMessage("");
                      setShowResetDialog(true);
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">Nombre</Label>
                    <Input
                      id="first-name"
                      placeholder="Juan"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Apellido</Label>
                    <Input
                      id="last-name"
                      placeholder="Pérez"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirmar contraseña</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Repite la contraseña"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                   <Select
                    value={selectedRole}
                    onValueChange={(value: "visitor" | "editor" | "admin") => setSelectedRole(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visitor">Visitante</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
           <Dialog
            open={showResetDialog}
            onOpenChange={(open) => {
              setShowResetDialog(open);
              if (!open) {
                setResetLoading(false);
                setResetError("");
                setResetMessage("");
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Recuperar contraseña</DialogTitle>
                <DialogDescription>
                  Ingresa el correo con el que te registraste y te enviaremos instrucciones para restablecer tu contraseña.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handlePasswordResetRequest} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Correo electrónico</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>

                {resetError && (
                  <Alert variant="destructive">
                    <AlertDescription>{resetError}</AlertDescription>
                  </Alert>
                )}

                {resetMessage && (
                  <Alert>
                    <AlertDescription>{resetMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowResetDialog(false);
                      setResetError("");
                      setResetMessage("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={resetLoading}>
                    {resetLoading ? "Enviando..." : "Enviar instrucciones"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

        </CardContent>
      </Card>
    </div>
  );
}