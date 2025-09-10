import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import api from "@/services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8002";
const ITEMS_PER_PAGE = 10;

export default function Index() {
  const { page: pageParam } = useParams<{ page?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Lee el parámetro page del query string
  const params = new URLSearchParams(location.search);
  const initialPage = params.get("page") && !isNaN(Number(params.get("page"))) ? Number(params.get("page")) : 1;

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
  const [showNeo4j, setShowNeo4j] = useState(false);

  // // Carga inicial y cuando cambian página o filtros
  // useEffect(() => {
  //   const currentPage = pageParam && !isNaN(Number(pageParam)) ? Number(pageParam) : 1;
  //   setPagination((prev) => ({ ...prev, page: currentPage }));
  //   fetchPiezas(currentPage, searchFilters);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [pageParam, searchFilters]);

  // useEffect(() => {
  //   // Lee los filtros y la página desde los query params si existen
  //   const params = new URLSearchParams(location.search);
  //   const page = params.get("page") ? Number(params.get("page")) : initialPage;
  //   const filters: SearchFilters = { ...searchFilters };
  //   // Rellena filters con los valores de los params
  //   // ...parsea cada filtro según tu estructura...
  //   setPagination((prev) => ({ ...prev, page }));
  //   setSearchFilters(filters);
  //   fetchPiezas(page, filters);
  // }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const page = params.get("page") && !isNaN(Number(params.get("page"))) ? Number(params.get("page")) : 1;
    setPagination((prev) => ({ ...prev, page }));

    fetchPiezas(page, searchFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, searchFilters]);

  const mapResultToItem = (p: any): CollectionItem => {
    const imgPath = p.imagenes?.[0]?.imagen;
    const imageUrl = imgPath ? (imgPath.startsWith("http") ? imgPath : `${API_URL}${imgPath}`) : "";
    return {
      id: String(p.id),
      inventoryNumber: p.numero_inventario,
      letra: p.letra ?? "",
      revision: p.revision ?? "",
      previousRegistryNumber: p.numero_registro_anterior ?? "",
      surdoc: p.codigo_surdoc ?? "",
      ubicacion: p.ubicacion ?? "",
      deposito: p.deposito ?? "",
      estante: p.estante ?? "",
      caja_actual: p.caja_actual ?? "",
      tipologia: p.tipologia ?? "",
      coleccion: p.coleccion ?? "",
      clasificacion: p.clasificacion ?? "",
      conjunto: p.conjunto ?? "",
      nombre_comun: p.nombre_comun ?? "",
      nombre_especifico: p.nombre_especifico ?? "",
      autor: p.autor ?? "",
      filiacion_cultural: p.filiacion_cultural ?? "",
      pais: p.pais ?? "",
      localidad: p.localidad ?? "",
      fecha_creacion: p.fecha_creacion ?? "",
      descripcion_col: p.descripcion_col ?? "",
      marcas_inscripciones: p.marcas_inscripciones ?? "",
      tecnica: p.tecnica ?? [],
      materialidad: p.materialidad ?? "",
      descripcion_cr: p.descripcion_cr ?? "",
      alto_cm: p.alto_cm ?? null,
      ancho_cm: p.ancho_cm ?? null,
      profundidad_cm: p.profundidad_cm ?? null,
      diametro_cm: p.diametro_cm ?? null,
      espesor_mm: p.espesor_mm ?? null,
      peso_gr: p.peso_gr ?? null,
      funcion: p.funcion ?? "",
      contexto_historico: p.contexto_historico ?? "",
      bibliografia: p.bibliografia ?? "",
      iconografia: p.iconografia ?? "",
      notas_investigacion: p.notas_investigacion ?? "",
      estado_conservacion: p.estado_conservacion ?? "",
      responsable_conservacion: p.responsable_conservacion ?? "",
      fecha_actualizacion_conservacion: p.fecha_actualizacion_conservacion ?? "",
      comentarios_conservacion: p.comentarios_conservacion ?? "",
      exposiciones: p.exposiciones ?? "",
      avaluo: p.avaluo ?? "",
      procedencia: p.procedencia ?? "",
      donante: p.donante ?? "",
      fecha_ingreso: p.fecha_ingreso ?? "",
      responsable_coleccion: p.responsable_coleccion ?? "",
      fecha_ultima_modificacion: p.fecha_ultima_modificacion ?? "",
      componentes: p.componentes ?? [],
      imagenes: p.imagenes ?? [],
    };
  };

  const buildParamsFromFilters = (page: number, filters: SearchFilters, includePageSize = false) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    if (includePageSize) {
      params.append("page_size", ITEMS_PER_PAGE.toString());
    }
    if (filters.query) params.append("search", filters.query);
    filters.country?.forEach((c) => params.append("pais__nombre", c));
    filters.collection?.forEach((c) => params.append("coleccion__nombre", c));
    filters.author?.forEach((a) => params.append("autor__nombre", a));
    filters.locality?.forEach((l) => params.append("localidad__nombre", l));
    filters.tipologias?.forEach((t) => params.append("tipologia", t));
    // Normaliza exposiciones antes de agregarlas al URLSearchParams
    filters.exhibitions?.forEach((e) => {
      const normalized = e.replace(/"/g, "").trim().toLowerCase();
      params.append("exposiciones__titulo", normalized);
    });
    if (filters.dateFrom) params.append("fecha_creacion_after", filters.dateFrom);
    if (filters.dateTo) params.append("fecha_creacion_before", filters.dateTo);

    return params;
  };

  const fetchPiezas = async (page: number, filters: SearchFilters) => {
    setLoading(true);
    try {
      const params = buildParamsFromFilters(page, filters, true);
      const res = await fetch(`${API_URL}/api/piezas/?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar piezas");
      const data = await res.json();

      const mapped: CollectionItem[] = (data.results || []).map(mapResultToItem);

      setItems(mapped);
      setPagination((prev) => ({
        ...prev,
        page,
        totalItems: data.count ?? 0,
        totalPages: Math.max(1, Math.ceil((data.count ?? 0) / ITEMS_PER_PAGE)),
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar por texto (búsqueda simple)
  const handleSearch = (simple: SearchFilters) =>
    setSearchFilters((prev) => ({ ...prev, query: simple.query }));

  // Aplicar filtros avanzados y serializar la URL
  const handleApplyFilters = (advanced: SearchFilters) => {
    setSearchFilters(advanced);
    setPagination((prev) => ({ ...prev, page: 1 }));

    const params = buildParamsFromFilters(1, advanced, false);
    navigate(`/home?${params.toString()}`);
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

  // Cambiar página (URL)
  const handlePageChange = (newPage: number) => {
    const params = buildParamsFromFilters(newPage, searchFilters, false);
    navigate(`/home?${params.toString()}`);
  };

  const handleViewModeChange = (mode: ViewMode) =>
    setPagination((p) => ({ ...p, viewMode: mode }));

  // Selección de piezas
  const [selectedItems, setSelectedItems] = useState<CollectionItem[]>([]);
  const handleSelectItem = (item: CollectionItem) =>
    setSelectedItems((prev) =>
      prev.some((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [...prev, item]
    );

  // Seleccionar SOLO lo visible en la página actual (modo “Solo visible en página actual”)
  const handleSelectAllVisible = () => {
    setSelectedItems((prev) => {
      const map = new Map(prev.map((i) => [i.id, i]));
      items.forEach((it) => map.set(it.id, it));
      return Array.from(map.values());
    });
  };

  // Seleccionar TODAS las filtradas (todas las páginas) vía endpoint /export
  const handleSelectAllFiltered = async () => {
    setLoading(true);
    try {
      const params = buildParamsFromFilters(1, searchFilters, true); // page no importa, backend ignora paginación
      // remueve parámetros de paginación si quedaron
      params.delete("page");
      params.delete("page_size");

      const res = await fetch(`${API_URL}/api/piezas/export/?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar piezas para exportación");
      const data = await res.json();

      // mapear respuesta minimal a CollectionItem (sin imágenes)
      const mapped: CollectionItem[] = (data || []).map((p: any) => ({
        id: String(p.numero_inventario),
        inventoryNumber: p.numero_inventario,
        commonName: p.nombre_especifico || "",
        attributedName: undefined,
        country: p.pais || "",
        locality: p.localidad || "",
        creationDate: p.fecha_creacion || "",
        materials: p.materiales ?? [],
        collectionDescription: p.descripcion_col || "",
        conservationState: p.estado_conservacion || "",
        location: p.ubicacion || "",
        deposit: p.deposito || "",
        shelf: p.estante || "",
        imageUrl: "",
        thumbnailUrl: "",
        collection: p.coleccion || "",
        author: p.autor || "",
        exhibitions: [], // ya no se usa
      }));

      setSelectedItems(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };


  // Cálculo resumen X–Y de Z
  const start = (pagination.page - 1) * pagination.itemsPerPage + 1;
  const end = Math.min(pagination.page * pagination.itemsPerPage, pagination.totalItems);

  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      <Header onLoginClick={() => setShowLogin(true)} />

      <main className="flex-1 p-6 space-y-6">
        {/* Título y subtítulo */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Catálogo MAPA</h1>
          <p className="text-muted-foreground">
            Explora la colección del Museo de Arte Popular Americano Tomás Lago
          </p>
        </div>

        {/* Buscador */}
        <Search
          onSearch={handleSearch}
          showAdvanced={showFilters}
          toggleAdvanced={() => setShowFilters((v) => !v)}
        />

        {/* Filtros activos */}
        {showFilters && (
          <ActiveFilters filters={searchFilters} onResetFilters={handleResetFilters} />
        )}

        {/* Layout con/ sin panel de filtros */}
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
            {/* Resumen + Exportar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {pagination.totalItems ? start : 0}-{end} de {pagination.totalItems} piezas
              </p>
              <div className="flex items-center gap-2">
                <ExportButton
                  selectedItems={selectedItems}
                  user={user ? { ...user, id: String(user.id), name: user.name ?? `${user.first_name} ${user.last_name}` } : null}
                />
                {user?.role === "admin" && (
                  <>
                  <Button
                    variant="default"
                    onClick={() => navigate("/importacion-masiva")}
                  >
                    Importación masiva
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => window.open("http://localhost:7475/browser/", "_blank")}
                  >
                    Ver en Neo4j
                  </Button>
                  </>
                )}
                {user && (user.role === "admin" || user.role === "editor") && (
                  <>
                    <Button variant="default" onClick={() => navigate("/crear-pieza")}>
                      Crear pieza
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        if (selectedItems.length === 0) return;
                        if (!window.confirm(`¿Seguro que deseas eliminar ${selectedItems.length} pieza(s)?`)) return;
                        for (const item of selectedItems) {
                          try {
                            await api.delete(`/api/piezas/${item.inventoryNumber}/`);
                          } catch (err) {
                            console.error("Error eliminando pieza", item.inventoryNumber, err);
                          }
                        }
                        setSelectedItems([]);
                        setTimeout(() => {
                          fetchPiezas(pagination.page, searchFilters);
                        }, 500); // espera 0.5 segundos antes de recargar
                      }}
                      disabled={selectedItems.length === 0}
                    >
                      Eliminar pieza
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Grid / Listado */}
            <ItemGrid
              items={items}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onViewModeChange={handleViewModeChange}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onSelectAllVisible={handleSelectAllVisible}
              onSelectAllFiltered={handleSelectAllFiltered}
              totalFilteredItems={pagination.totalItems}
              searchFilters={searchFilters} 
            />
          </div>
        </div>
      </main>

      {/* Modal Neo4j */}
      <Dialog open={showNeo4j} onOpenChange={setShowNeo4j}>
        <DialogContent className="max-w-5xl w-full bg-white p-0 overflow-hidden" style={{ height: "80vh" }}>
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Neo4j Browser</h2>
              <Button variant="outline" onClick={() => setShowNeo4j(false)}>Cerrar</Button>
            </div>
            <iframe
              src="http://localhost:7475/browser/"
              title="Neo4j Browser"
              className="flex-1 w-full"
              style={{ border: "none", minHeight: "60vh" }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de login (demo) */}
      {showLogin && (
        <Dialog open onOpenChange={setShowLogin}>
          <DialogContent>
            <h2 className="text-lg font-semibold mb-4">Iniciar sesión</h2>
            <form className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  className="w-full input"
                  placeholder="admin@mapa.cl o editor@mapa.cl"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Contraseña</label>
                <input
                  type="password"
                  className="w-full input"
                  placeholder="Cualquier texto (demo)"
                />
              </div>
              <Button className="w-full">Iniciar sesión</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
