import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Detail from "./pages/Detail";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AdminUsers from "./pages/AdminUsers";
import CrearPieza from "./pages/CrearPieza";
import EditarPieza from "./pages/EditarPieza";
import HistorialCambios from "./pages/HistorialCambios";
import ImportacionMasiva from "./pages/ImportacionMasiva";

export default function AppRoutes() {
  const { isAuthenticated, loading, user } = useContext(AuthContext);

  if (loading) return null; // o un spinner

  const canEdit = !!user && (user.role === "admin" || user.role === "editor");
  const canAdmin = !!user && user.role === "admin";

   return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/"
        element={isAuthenticated ? <Index /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/:page"
        element={isAuthenticated ? <Index /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/detail/:id"
        element={isAuthenticated ? <Detail /> : <Navigate to="/auth" replace />}
      />
      {/* Rutas protegidas por rol */}
      <Route
        path="/admin/users"
        element={isAuthenticated ? (canAdmin ? <AdminUsers /> : <Navigate to="/" replace />) : <Navigate to="/auth" replace />}
      />
      <Route
        path="/crear-pieza"
        element={
          isAuthenticated ? (canEdit ? <CrearPieza /> : <Navigate to="/" replace />) : <Navigate to="/auth" replace />
        }
      />
      <Route
        path="/editar-pieza/:id"
        element={
          isAuthenticated ? (canEdit ? <EditarPieza /> : <Navigate to="/" replace />) : <Navigate to="/auth" replace />
        }
      />
      <Route
        path="/historial-cambios"
        element={
          isAuthenticated ? (canEdit ? <HistorialCambios /> : <Navigate to="/" replace />) : <Navigate to="/auth" replace />
        }
      />
      <Route
        path="/importacion-masiva"
        element={
          isAuthenticated ? (canAdmin ? <ImportacionMasiva /> : <Navigate to="/" replace />) : <Navigate to="/auth" replace />
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}