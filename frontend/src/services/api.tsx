import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8002";

const api = axios.create({
  baseURL: API_BASE,
});

// Request: añade token si existe
api.interceptors.request.use((config) => {
  const access = localStorage.getItem("access");
  if (access) {
    if (!config.headers) {
      config.headers = {} as typeof config.headers;
    }
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Response: si 401, intenta refresh
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  pendingQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token: any) => {
              if (original.headers) {
                original.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(original));
            },
            reject,
          });
        });
      }

      isRefreshing = true;
      try {
        const refresh = localStorage.getItem("refresh");
        if (!refresh) throw new Error("No refresh token");

        const { data } = await axios.post(`${API_BASE}/accounts/refresh/`, { refresh });
        const newAccess = data.access;
        localStorage.setItem("access", newAccess);
        processQueue(null, newAccess);
        if (original.headers) {
          original.headers.Authorization = `Bearer ${newAccess}`;
        }
        return api(original);
      } catch (err) {
        processQueue(err, null);
        // limpiar y (opcional) redirigir
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
