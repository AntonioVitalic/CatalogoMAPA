import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import api from "@/services/api";
import Header from "@/components/Header";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "admin" | "editor" | "visitor";
};

type LogEntry = {
  id: number;
  usuario: User;
  pieza_id: string;
  accion: string;
  fecha: string;
  detalle: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8002";

export default function HistorialCambios() {
  const { user, role } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || role !== "editor") return;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await api.get<LogEntry[]>("/accounts/registro-cambios-catalogo/", { baseURL: API_URL });
        // Filtrar solo registros del usuario autenticado
        const myLogs = res.data.filter(l => l.usuario?.id === user.id);
        setLogs(myLogs);
      } catch (err) {
        console.error("Error cargando historial:", err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [user, role]);

  if (role !== "editor") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No autorizado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={() => setShowLogin(true)} />
      <div className="flex-1 flex flex-col items-center bg-background p-6">
        <Card className="w-full max-w-5xl">
        <CardHeader className="relative flex flex-row items-center justify-between">
        {/* Izquierda: botón volver */}
        <div className="flex items-center gap-2">
            <Button variant="default" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2" /> Volver
            </Button>
        </div>
        {/* Título centrado */}
        <CardTitle className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold">
            Historial de cambios (mi actividad)
        </CardTitle>
        {/* Derecha: espacio reservado */}
        <div className="flex items-center" style={{ visibility: "hidden" }}>
            <Button variant="default">
            {/* Espacio para que el título no se solape */}
            Placeholder
            </Button>
        </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border rounded-lg bg-white shadow">
              <thead>
                <tr>
                  <th className="text-left p-2 border font-semibold">Pieza</th>
                  <th className="text-left p-2 border font-semibold">Acción</th>
                  <th className="text-left p-2 border font-semibold">Fecha y hora</th>
                  <th className="text-left p-2 border font-semibold">Antes</th>
                  <th className="text-left p-2 border font-semibold">Después</th>
                </tr>
              </thead>
              <tbody>
                {!loading && logs.map(log => {
                  let before: any = "";
                  let after: any = "";
                  try {
                    const parsed = JSON.parse(log.detalle);
                    before = parsed?.before ?? "";
                    after = parsed?.after ?? "";
                  } catch {
                    // si no es JSON, mostrar todo en "Después"
                    after = log.detalle ?? "";
                  }
                  const fmt = (v: any) => (v === null || v === undefined ? "" : (typeof v === "object" ? JSON.stringify(v) : String(v)));
                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-2 border">{log.pieza_id}</td>
                      <td className="p-2 border">{log.accion}</td>
                      <td className="p-2 border">{new Date(log.fecha).toLocaleString()}</td>
                      <td className="p-2 border"><pre className="whitespace-pre-wrap text-sm">{fmt(before)}</pre></td>
                      <td className="p-2 border"><pre className="whitespace-pre-wrap text-sm">{fmt(after)}</pre></td>
                    </tr>
                  );
                })}
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-muted-foreground">No hay registros.</td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={5} className="text-center p-6">Cargando…</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
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
    </div>
  );
}