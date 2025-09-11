import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import api from "@/services/api";

export default function MiCuenta() {
  const { user, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.password && form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    try {
      await api.patch(`/accounts/user/${user?.id}/`, {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        ...(form.password ? { password: form.password } : {}),
      });
      setSuccess("Datos actualizados correctamente.");
      setEditing(false);
      await refreshProfile();
    } catch (err: any) {
      setError("Error al actualizar datos.");
    }
  };

   return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onLoginClick={() => {}} />
      <div className="flex flex-col items-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Mi cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            {!editing ? (
              <div className="space-y-4">
                <div><b>Nombre:</b> {user?.first_name} {user?.last_name}</div>
                <div><b>Email:</b> {user?.email}</div>
                <div><b>Rol:</b> {user?.role === "admin"
                  ? "Administrador"
                  : user?.role === "editor"
                    ? "Editor"
                    : "Visitante"
                }</div>
                <Button onClick={() => setEditing(true)} className="mt-4">Editar información</Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSave}>
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre:</label>
                  <Input name="first_name" value={form.first_name} onChange={handleChange} placeholder="Nombre" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Apellido:</label>
                  <Input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Apellido" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">E-mail:</label>
                  <Input name="email" value={form.email} onChange={handleChange} placeholder="Email" required type="email" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contraseña:</label>
                  <Input name="password" value={form.password} onChange={handleChange} placeholder="Nueva contraseña" type="password" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirmar contraseña:</label>
                  <Input name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirmar contraseña" type="password" />
                </div>
                {error && <div className="text-red-600 text-sm">{error}</div>}
                {success && <div className="text-green-600 text-sm">{success}</div>}
                <div className="flex gap-2">
                  <Button type="submit">Guardar</Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
        <Button variant="outline" className="mt-6" onClick={() => window.location.href = "/"}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}