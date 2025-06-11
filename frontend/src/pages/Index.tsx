// frontend/src/pages/Index.tsx
import { useState, useEffect } from "react";
import { CollectionItem, PaginationState, SearchFilters, ViewMode } from "@/types";
import Header from "@/components/Header";
import Search from "@/components/Search";
import FilterPanel from "@/components/FilterPanel";
import ItemGrid from "@/components/ItemGrid";
import ExportButton from "@/components/ExportButton";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8002";

const Index = () => {
  const { user, login } = useAuth();

  // --- Estados de login/modal ---
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Búsqueda simple vs avanzada ---
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({ query: "" });

  // --- Datos y paginación ---
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    itemsPerPage: ITEMS_PER_PAGE,
    totalItems: 0,
    totalPages: 0,
    viewMode: "grid",
  });

  // --- Selección ---
  const [selectedItems, setSelectedItems] = useState<CollectionItem[]>([]);

  // Función para cargar datos de la API con filtros y paginación
  const fetchPiezas = async (
    page: number = 1,
    filters: SearchFilters = searchFilters
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("page_size", String(ITEMS_PER_PAGE));

      if (filters.query) params.append("search", filters.query);
      if (filters.country)
        filters.country.forEach(c => params.append("pais__nombre", c));
      if (filters.collection)
        filters.collection.forEach(c => params.append("coleccion__nombre", c));
      if (filters.author)
        filters.author.forEach(a => params.append("autor__nombre", a));
      if (filters.locality)
        filters.locality.forEach(l => params.append("localidad__nombre", l));
      if (filters.dateFrom) params.append("fecha_creacion__gte", filters.dateFrom);
      if (filters.dateTo) params.append("fecha_creacion__lte", filters.dateTo);

      const res = await fetch(`${API_URL}/api/piezas/?${params.toString()}`);
      if (!res.ok) throw new Error("Error en la respuesta de la red");
      const data = await res.json();

      console.log("Datos recibidos:", data);
      setItems(data.results);
      setPagination(p => ({
        ...p,
        page,
        totalItems: data.count,
        totalPages: Math.ceil(data.count / ITEMS_PER_PAGE),
      }));
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar piezas desde el backend");
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchPiezas(1);
  }, []);

  // Handlers
  const handlePageChange = (newPage: number) => {
    fetchPiezas(newPage);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setPagination(p => ({ ...p, viewMode: mode }));
  };

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    fetchPiezas(1, filters);
  };

  const handleAdvancedFilters = (filters: SearchFilters) => {
    setSearchFilters(filters);
    fetchPiezas(1, filters);
  };

  const handleResetFilters = () => {
    const empty: SearchFilters = { query: "" };
    setSearchFilters(empty);
    fetchPiezas(1, empty);
  };

  const handleSelectItem = (item: CollectionItem) => {
    setSelectedItems(prev => {
      const exists = prev.some(i => i.id === item.id);
      if (exists) return prev.filter(i => i.id !== item.id);
      return [...prev, item];
    });
  };

  const handleSelectAll = () => {
    const allSel = items.every(item => selectedItems.some(i => i.id === item.id));
    if (allSel) {
      setSelectedItems(prev =>
        prev.filter(i => !items.some(item => item.id === i.id))
      );
      toast.info(`Se han deseleccionado ${items.length} piezas`);
    } else {
      const toAdd = items.filter(item =>
        !selectedItems.some(i => i.id === item.id)
      );
      setSelectedItems(prev => [...prev, ...toAdd]);
      toast.success(`Se han seleccionado ${items.length} piezas`);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor ingrese email y contraseña");
      return;
    }
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast.success("Inicio de sesión exitoso");
        setShowLogin(false);
      } else {
        toast.error("Credenciales inválidas");
      }
    } catch {
      toast.error("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={() => setShowLogin(true)} />

      <main className="flex-1 container mx-auto py-8 px-4 md:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Catálogo MAPA</h1>
          <p className="text-muted-foreground">
            Explora la colección del Museo de Arte Popular Americano Tomás Lago
          </p>
        </div>

        {/* Search + Toggle Advanced */}
        <div className="mb-8">
          <Search
            onSearch={handleSearch}
            showAdvanced={showAdvancedSearch}
            toggleAdvanced={() => setShowAdvancedSearch(v => !v)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {showAdvancedSearch && (
            <aside className="lg:col-span-1">
              <FilterPanel
                onApplyFilters={handleAdvancedFilters}
                onReset={handleResetFilters}
                initialFilters={searchFilters}
              />
            </aside>
          )}

          <div className={showAdvancedSearch ? "lg:col-span-3" : "lg:col-span-4"}>
            <div className="mb-6 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages} · {pagination.totalItems} piezas
              </p>
              <ExportButton selectedItems={selectedItems} user={user} />
            </div>

            <ItemGrid
              items={items}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onViewModeChange={handleViewModeChange}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onSelectAll={handleSelectAll}
              totalItems={items.length}
            />
          </div>
        </div>
      </main>

      {/* Modal de Login */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar sesión</DialogTitle>
            <DialogDescription>
              Ingresa tus credenciales para acceder al sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLoginSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="admin@mapa.cl o editor@mapa.cl"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Cualquier texto (demo)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Cargando..." : "Iniciar sesión"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
