import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8002";

export default function Auth() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "visitor",
  });
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        // LOGIN
        const { data } = await api.post("/accounts/login/", {
          email: form.email,
          password: form.password,
        });
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        await refreshProfile(); // <-- Actualiza el usuario en contexto
        navigate("/");
      } else {
        // REGISTRO
        const { data } = await api.post("/accounts/register/", form);
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        await refreshProfile();
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div style={{ maxWidth: 420, width: "100%" }}>
        <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 16 }}>
          {isLogin ? "Iniciar sesión" : "Registrarse"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <>
              <input
                name="first_name"
                placeholder="Nombre"
                value={form.first_name}
                onChange={handleChange}
                required
                className="border px-3 py-2 w-full"
              />
              <input
                name="last_name"
                placeholder="Apellido"
                value={form.last_name}
                onChange={handleChange}
                required
                className="border px-3 py-2 w-full"
              />
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="border px-3 py-2 w-full"
              >
                <option value="visitor">Visitante</option>
                <option value="editor">Editor</option>
                <option value="admin">Administrador</option>
              </select>
            </>
          )}

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="border px-3 py-2 w-full"
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
            className="border px-3 py-2 w-full"
          />

          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded w-full"
          >
            {isLogin ? "Entrar" : "Registrar"}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 underline text-sm"
        >
          {isLogin
            ? "¿No tienes cuenta? Regístrate"
            : "¿Ya tienes cuenta? Inicia sesión"}
        </button>

        {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      </div>
    </div>
  );
}
