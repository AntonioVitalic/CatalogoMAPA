import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Search from "@/components/Search";
import FilterPanel from "@/components/FilterPanel";
import ItemGrid from "@/components/ItemGrid";
import ExportButton from "@/components/ExportButton";
import ActiveFilters from "@/components/ActiveFilters";
import { useAuth } from "@/hooks/useAuth";
import { CollectionItem, PaginationState, SearchFilters, ViewMode } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8002";
const ITEMS_PER_PAGE = 10;

export default function Index() {
  const { page: pageParam } = useParams<{ page?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const initialPage = pageParam && !isNaN(Number(pageParam)) ? Number(pageParam) : 1;

  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    itemsPerPage: ITEMS_PER_PAGE,
    totalItems: 0,
    totalPages: 1,
    viewMode: "grid",
  });

  const [showFilters, setShowFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: "",
    country: [],
    collection: [],
    author: [],
    locality: [],
    tipologias: [],
    exhibitions: [],
    dateFrom: "",
    dateTo: "",
  });

  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    fetchPiezas(initialPage, searchFilters);
  }, [pageParam, searchFilters]);

  const fetchPiezas = async (page: number, filters: SearchFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("page_size", ITEMS_PER_PAGE.toString());

      if (filters.query) params.append("search", filters.query);
      filters.country?.forEach(c => params.append("pais__nombre", c));
      filters.collection?.forEach(c => params.append("coleccion__nombre", c));
      filters.author?.forEach(a => params.append("autor__nombre", a));
      filters.locality?.forEach(l => params.append("localidad__nombre", l));
      // 👇 importante: coincide con views.py (getlist('tipologia'))
      filters.tipologias?.forEach(t => params.append("tipologia", t));
      // (si en el futuro agregas exposiciones, aquí iría el nombre del parámetro)
      if (filters.dateFrom)  params.append("fecha_creacion_after", filters.dateFrom);
      if (filters.dateTo)    params.append("fecha_creacion_before", filters.dateTo);

      const res = await fetch(`${API_URL}/api/piezas/?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar piezas");
      const data = await res.json();

      const mapped: CollectionItem[] = data.results.map((p: any) => {
        const imgPath = p.imagenes?.[0]?.imagen;
        const imageUrl = imgPath ? (imgPath.startsWith("http") ? imgPath : `${API_URL}${imgPath}`) : "";
        return {
          id: String(p.id),
          inventoryNumber: p.numero_inventario,
          commonName: p.nombre_especifico || "",
          attributedName: undefined,
          country: p.pais || "",
          locality: p.localidad || "",
          creationDate: p.fecha_creacion || "",
          materials: p.materiales ?? [], // puedes quitar si ya no lo usas en tarjetas
          collectionDescription: p.descripcion_col || "",
          conservationState: p.estado_conservacion || "",
          location: p.ubicacion || "",
          deposit: p.deposito || "",
          shelf: p.estante || "",
          imageUrl,
          thumbnailUrl: imageUrl,
          collection: p.coleccion || "",
          author: p.autor || "",
          exhibitions: p.exposiciones ?? [],
        };
      });

      setItems(mapped);
      setPagination(prev => ({
        ...prev,
        page,
        totalItems: data.count,
        totalPages: Math.ceil(data.count / ITEMS_PER_PAGE),
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (simple: SearchFilters) =>
    setSearchFilters(prev => ({ ...prev, query: simple.query }));

  const handleApplyFilters = (advanced: SearchFilters) => {
    setSearchFilters(advanced);
    setPagination(prev => ({ ...prev, page: 1 }));
    navigate(`/1`);
    setShowFilters(false);
  };

  const handleResetFilters = () =>
    setSearchFilters({
      query: "",
      country: [],
      collection: [],
      author: [],
      locality: [],
      tipologias: [],
      exhibitions: [],
      dateFrom: "",
      dateTo: "",
    });

  const handlePageChange = (newPage: number) => navigate(`/${newPage}`);
  const handleViewModeChange = (mode: ViewMode) =>
    setPagination(p => ({ ...p, viewMode: mode }));

  // selección para exportar
  const [selectedItems, setSelectedItems] = useState<CollectionItem[]>([]);
  const handleSelectItem = (item: CollectionItem) =>
    setSelectedItems(prev =>
      prev.some(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [...prev, item]
    );
  const handleSelectAll = () => {
    const all = items.every(i => selectedItems.some(s => s.id === i.id));
    setSelectedItems(all ? [] : items);
  };

  const start = (pagination.page - 1) * pagination.itemsPerPage + 1;
  const end = Math.min(pagination.page * pagination.itemsPerPage, pagination.totalItems);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={() => setShowLogin(true)} />

      <main className="flex-1 p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Catálogo MAPA</h1>
          <p className="text-muted-foreground">
            Explora la colección del Museo de Arte Popular Americano Tomás Lago
          </p>
        </div>

        <Search
          onSearch={handleSearch}
          showAdvanced={showFilters}
          toggleAdvanced={() => setShowFilters(v => !v)}
        />

        <div className={`grid grid-cols-1 ${showFilters ? "lg:grid-cols-4 gap-8" : ""}`}>
          {showFilters && (
            <aside className="lg:col-span-1">
              <FilterPanel
                initialFilters={searchFilters}
                onApplyFilters={handleApplyFilters}
                onReset={handleResetFilters}
              />
            </aside>
          )}
          <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {pagination.totalItems ? start : 0}-{end} de {pagination.totalItems} piezas
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
              totalItems={pagination.totalItems}
            />
          </div>
        </div>
      </main>

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
