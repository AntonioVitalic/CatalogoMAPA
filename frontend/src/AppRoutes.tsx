import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Detail from "./pages/Detail";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AdminUsers from "./pages/AdminUsers";

export default function AppRoutes() {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) return null; // o un spinner

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/"
        element={isAuthenticated ? <Index /> : <Navigate to="/auth" replace />}
      />
      <Route path="/admin/users" element={isAuthenticated ? <AdminUsers /> : <Navigate to="/auth" replace />} />
      <Route path="/:page" element={isAuthenticated ? <Index /> : <Navigate to="/auth" replace />} />
      <Route path="/detail/:id" element={isAuthenticated ? <Detail /> : <Navigate to="/auth" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}