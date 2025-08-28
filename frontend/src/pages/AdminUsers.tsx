import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pencil, UserX, UserCheck, Plus, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";

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

type LogEntry = {
  id: number;
  usuario: User;
  pieza_id: string;
  accion: string;
  fecha: string;
  detalle: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"activos" | "inactivos" | "historial">("activos");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const bootstrap = async () => {
      const access = localStorage.getItem("access");
      if (!access) {
        setError("No autenticado");
        return;
      }
      try {
        const meRes = await api.get<User>("/accounts/me/", { baseURL: API_URL });
        setMe(meRes.data);
        if (meRes.data.role !== "admin" && meRes.data.role !== "editor") {
          setError("Solo administradores y editores pueden ver esta página.");
          setMe(meRes.data);
          return;
        }
        await fetchUsers(tab === "historial" ? "activos" : tab);
        if (meRes.data.role === "admin" || meRes.data.role === "editor") {
          const logsRes = await api.get<LogEntry[]>("/accounts/registro-cambios-catalogo/", { baseURL: API_URL });
          setLogs(logsRes.data);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const fetchUsers = async (tab: "activos" | "inactivos") => {
    try {
      const usersRes = await api.get<User[]>("/accounts/users/", { baseURL: API_URL });
      setUsers(usersRes.data.filter(u => tab === "activos" ? u.is_active : !u.is_active));
    } catch (err: any) {
      setError("Error al cargar usuarios");
    }
  };

  const handleDeactivate = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleActivate = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedUser) return;
    try {
      await api.patch(`/accounts/user/${selectedUser.id}/`, { is_active: !selectedUser.is_active });
      setShowModal(false);
      setSelectedUser(null);
      await fetchUsers(tab === "historial" ? "activos" : tab);
    } catch (err) {
      setError("Error al actualizar usuario");
    }
  };

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Alert variant="destructive" className="max-w-md w-full">
        <AlertDescription>
          {error}
          {me && (
            <div className="mt-2 text-sm text-muted-foreground">
              Iniciaste sesión como: <b>{me.first_name} {me.last_name}</b> (rol {me.role})
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
  if (!me) return <div>Cargando…</div>;

  return (
   <div className="min-h-screen flex flex-col">
    <Header onLoginClick={() => setShowLogin(true)} />
    <div className="min-h-screen flex flex-col items-center bg-background">
      <Card className="w-full max-w-5xl mt-8">
        <CardHeader className="relative flex flex-row items-center justify-between">
          {/* Left: Volver */}
          <div className="flex items-center gap-2">
            <Button variant="default" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2" />
              Volver
            </Button>
          </div>

          {/* Centered title (absolutely positioned) */}
          <CardTitle className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold">
            Gestión de Usuarios
          </CardTitle>

          {/* Right: Crear Usuario */}
          <div className="flex items-center">
            <Button variant="default" onClick={() => alert("Funcionalidad de crear usuario no implementada")}>
              <Plus className="mr-2" /> Crear Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="activos">Activos</TabsTrigger>
              <TabsTrigger value="inactivos">Inactivos</TabsTrigger>
              <TabsTrigger value="historial">Historial de cambios</TabsTrigger>
            </TabsList>
            <TabsContent value="activos">
              <UserTable
                users={users}
                onEdit={user => alert("Funcionalidad de editar usuario no implementada")}
                onDeactivate={handleDeactivate}
                type="activos"
              />
            </TabsContent>
            <TabsContent value="inactivos">
              <UserTable
                users={users}
                onEdit={user => alert("Funcionalidad de editar usuario no implementada")}
                onActivate={handleActivate}
                type="inactivos"
              />
            </TabsContent>
            <TabsContent value="historial">
              <div className="flex justify-end mb-2">
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!window.confirm("¿Seguro que deseas borrar todo el historial de cambios?")) return;
                    try {
                      await api.delete("/accounts/borrar-historial-cambios/", { baseURL: API_URL });
                      setLogs([]);
                    } catch (err) {
                      alert("Error al borrar el historial");
                    }
                  }}
                >
                  Borrar historial de cambios
                </Button>
              </div>
              <ChangeLogTable logs={logs} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-lg">
            <div className="border-b pb-3">
              <h3 className="text-lg font-medium">
                {selectedUser.is_active ? "Confirmar Desactivación" : "Confirmar Activación"}
              </h3>
            </div>
            <div className="py-4 space-y-3">
              <p>
                ¿Estás seguro de que deseas {selectedUser.is_active ? "desactivar" : "activar"} al usuario <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>?
              </p>
            </div>
            <div className="border-t pt-3 flex justify-end space-x-3">
              <Button
                variant={selectedUser.is_active ? "destructive" : "default"}
                onClick={confirmAction}
              >
                {selectedUser.is_active ? "Desactivar" : "Activar"}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
     {/* Dialog de login sencillo (igual que Index) */}
     {showLogin && (
       <Dialog open onOpenChange={setShowLogin}>
         <DialogContent>
           <h2 className="text-lg font-semibold mb-4">Iniciar sesión</h2>
           <form className="space-y-4">
             <div className="space-y-2">
               <label className="block text-sm font-medium">Email</label>
               <input type="email" className="w-full input" placeholder="admin@mapa.cl o editor@mapa.cl" />
             </div>
             <div className="space-y-2">
               <label className="block text-sm font-medium">Contraseña</label>
               <input type="password" className="w-full input" placeholder="Cualquier texto (demo)" />
             </div>
             <Button className="w-full">Iniciar sesión</Button>
           </form>
         </DialogContent>
       </Dialog>
     )}
   </div>
  );
}

function UserTable({
  users,
  onEdit,
  onDeactivate,
  onActivate,
  type,
}: {
  users: User[];
  onEdit: (user: User) => void;
  onDeactivate?: (user: User) => void;
  onActivate?: (user: User) => void;
  type: "activos" | "inactivos";
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border rounded-lg bg-white shadow">
        <thead>
          <tr>
            <th className="text-left p-2 border font-semibold">Nombre y Apellido</th>
            <th className="text-left p-2 border font-semibold">Email</th>
            <th className="text-left p-2 border font-semibold">Rol</th>
            <th className="text-left p-2 border font-semibold">Activo</th>
            <th className="text-left p-2 border font-semibold">Fecha registro</th>
            <th className="text-left p-2 border font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-muted/30 transition-colors">
              <td className="p-2 border">{u.first_name} {u.last_name}</td>
              <td className="p-2 border">{u.email}</td>
              <td className="p-2 border">{u.role}</td>
              <td className="p-2 border">{u.is_active ? "Sí" : "No"}</td>
              <td className="p-2 border">{new Date(u.date_joined).toLocaleString()}</td>
              <td className="p-2 border">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(u)}
                  >
                    <Pencil size={16} className="mr-1" /> Editar
                  </Button>
                  {type === "activos" && onDeactivate && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeactivate(u)}
                    >
                      <UserX size={16} className="mr-1" /> Desactivar
                    </Button>
                  )}
                  {type === "inactivos" && onActivate && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onActivate(u)}
                    >
                      <UserCheck size={16} className="mr-1" /> Activar
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="text-center text-muted-foreground py-6">
          No hay usuarios {type === "activos" ? "activos" : "inactivos"}.
        </div>
      )}
    </div>
  );
}

function ChangeLogTable({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border rounded-lg bg-white shadow">
        <thead>
          <tr>
            <th className="text-left p-2 border font-semibold">Usuario</th>
            <th className="text-left p-2 border font-semibold">Email</th>
            <th className="text-left p-2 border font-semibold">Pieza</th>
            <th className="text-left p-2 border font-semibold">Acción</th>
            <th className="text-left p-2 border font-semibold">Fecha y hora</th>
            <th className="text-left p-2 border font-semibold">Cambios</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => {
            let cambios: any[] = [];
            try {
              const detalle = JSON.parse(log.detalle);
              if (detalle.cambios_pieza) cambios = cambios.concat(detalle.cambios_pieza);
              if (detalle.cambios_componentes) cambios = cambios.concat(detalle.cambios_componentes);
            } catch {
              // Si no es JSON, mostrar todo el detalle
              cambios = [{ campo: "detalle", antes: "", despues: log.detalle }];
            }
            return (
              <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-2 border">{log.usuario.first_name} {log.usuario.last_name}</td>
                <td className="p-2 border">{log.usuario.email}</td>
                <td className="p-2 border">{log.pieza_id}</td>
                <td className="p-2 border">{log.accion}</td>
                <td className="p-2 border">{new Date(log.fecha).toLocaleString()}</td>
                <td className="p-2 border">
                  {cambios.length === 0 ? (
                    <span className="text-muted-foreground text-sm">Sin cambios</span>
                  ) : (
                    <ul className="text-xs">
                      {cambios.map((c, i) => (
                        <li key={i}>
                          <b>{c.campo}:</b>{" "}
                          <span className="text-red-700">{c.antes === null ? "—" : JSON.stringify(c.antes)}</span>{" "}
                          <span className="mx-1">→</span>
                          <span className="text-green-700">{c.despues === null ? "—" : JSON.stringify(c.despues)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {logs.length === 0 && (
        <div className="text-center text-muted-foreground py-6">
          No hay registros de cambios.
        </div>
      )}
    </div>
  );
}