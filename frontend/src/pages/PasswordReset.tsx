import { useState, FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/services/api";

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

export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const tokenMissing = !uid || !token;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!password) {
      setError("Ingresa una nueva contraseña.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/accounts/password-reset-confirm/", {
        uid,
        token,
        password,
      });
      setMessage(data?.detail || "Contraseña actualizada correctamente.");
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(
        extractErrorMessage(err, "No fue posible actualizar la contraseña, inténtalo nuevamente.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Restablecer contraseña</CardTitle>
          <CardDescription>
            {tokenMissing
              ? "El enlace de recuperación es inválido o ha expirado."
              : "Define una nueva contraseña para acceder nuevamente a tu cuenta."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokenMissing ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  El enlace de recuperación no es válido. Solicita uno nuevo desde la página de inicio de sesión.
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full">
                <Link to="/login">Volver al inicio de sesión</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar nueva contraseña"}
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login">Volver al inicio de sesión</Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}