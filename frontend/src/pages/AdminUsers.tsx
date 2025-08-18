import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8002";

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "admin" | "editor" | "visitor";
  is_active: boolean;
  date_joined: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const bootstrap = async () => {
      const access = localStorage.getItem("access");
      if (!access) {
        setError("No autenticado");
        return;
      }

      try {
        // quién soy
        const meRes = await api.get<User>("/accounts/me/", { baseURL: API_URL });
        setMe(meRes.data);

        if (meRes.data.role !== "admin") {
          setError("Solo el administrador puede ver esta página.");
          setMe(meRes.data); // para mostrar el nombre del usuario si quieres
          return;
        }

        // usuarios
        const usersRes = await api.get<User[]>("/accounts/users/", {
          baseURL: API_URL,
        });
        setUsers(usersRes.data);
      } catch (err: any) {
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          err?.message ||
          "Error";
        setError(msg);
      }
    };

    bootstrap();
  }, []);

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Alert variant="destructive" className="max-w-md w-full">
        <AlertDescription>
          {error}
          {me && (
            <div className="mt-2 text-sm text-muted-foreground">
              Iniciaste sesión como: <b>{me.first_name} {me.last_name}</b> (posees el rol {me.role})
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
  if (!me) return <div>Cargando…</div>;

  return (
    <div className="p-4">
      <h1 style={{ fontWeight: 700, fontSize: 22, marginBottom: 12 }}>
        Gestión de Usuarios
      </h1>
      <table className="w-full border">
        <thead>
          <tr>
            <th className="text-left p-2 border">Nombre y Apellido</th>
            <th className="text-left p-2 border">Email</th>
            <th className="text-left p-2 border">Rol</th>
            <th className="text-left p-2 border">Activo</th>
            <th className="text-left p-2 border">Fecha registro</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="p-2 border">
                {u.first_name} {u.last_name}
              </td>
              <td className="p-2 border">{u.email}</td>
              <td className="p-2 border">{u.role}</td>
              <td className="p-2 border">{u.is_active ? "Sí" : "No"}</td>
              <td className="p-2 border">
                {new Date(u.date_joined).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
