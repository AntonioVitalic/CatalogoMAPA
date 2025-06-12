import { useState, useEffect } from "react";
import Search from "@/components/Search";
import FilterPanel from "@/components/FilterPanel";
import ItemGrid from "@/components/ItemGrid";
import { CollectionItem, PaginationState, SearchFilters, ViewMode } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8002";
const ITEMS_PER_PAGE = 20;

export default function Index() {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    itemsPerPage: ITEMS_PER_PAGE,        // <— ahora obligatorio
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
    materials: [],
    exhibitions: [],
    dateFrom: "",
    dateTo: "",
  });

  // Carga de datos combinando búsqueda simple + filtros avanzados
  const fetchPiezas = async (page = 1, filters: SearchFilters = searchFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("page_size", ITEMS_PER_PAGE.toString());

      if (filters.query) {
        params.append("search", filters.query);
      }
      (filters.country || []).forEach((c) => params.append("pais__nombre", c));
      (filters.collection || []).forEach((c) =>
        params.append("coleccion__nombre", c)
      );
      (filters.author || []).forEach((a) =>
        params.append("autor__nombre", a)
      );
      (filters.locality || []).forEach((l) =>
        params.append("localidad__nombre", l)
      );
      (filters.materials || []).forEach((m) =>
        params.append("materiales__nombre", m)
      );
      (filters.exhibitions || []).forEach((e) =>
        params.append("exposiciones__titulo", e)
      );
      if (filters.dateFrom)
        params.append("fecha_creacion_after", filters.dateFrom);
      if (filters.dateTo) params.append("fecha_creacion_before", filters.dateTo);

      const res = await fetch(`${API_URL}/api/piezas/?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar piezas");
      const data = await res.json();

      const mapped: CollectionItem[] = data.results.map((p: any) => {
        const imgPath = p.imagenes[0]?.imagen;
        const imageUrl = imgPath
          ? imgPath.startsWith("http")
            ? imgPath
            : `${API_URL}${imgPath}`
          : "";
        return {
          id: String(p.id),
          inventoryNumber: p.numero_inventario,
          commonName: p.nombre_especifico || "",
          attributedName: undefined,
          country: p.pais || "",
          locality: p.localidad || "",
          creationDate: p.fecha_creacion || "",
          materials: p.materiales ?? [],
          collectionDescription: p.descripcion || "",
          conservationState: p.estado_conservacion || "",
          location: undefined,
          deposit: undefined,
          shelf: undefined,
          imageUrl,
          thumbnailUrl: imageUrl,
          collection: p.coleccion || "",
          author: p.autor || "",
          exhibitions: p.exposiciones ?? [],
        };
      });

      setItems(mapped);
      setPagination((prev) => ({
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

  // Efecto inicial y al cambiar filtros
  useEffect(() => {
    fetchPiezas(1, searchFilters);
  }, [searchFilters]);

  // Handlers
  const handleSearch = (simple: SearchFilters) => {
    // mantiene filtros avanzados y actualiza solo el query
    setSearchFilters((prev) => ({ ...prev, query: simple.query }));
  };
  const handleApplyFilters = (advanced: SearchFilters) => {
    setSearchFilters(advanced);
    setShowFilters(false);
  };
  const handleResetFilters = () => {
    setSearchFilters({
      query: "",
      country: [],
      collection: [],
      author: [],
      locality: [],
      materials: [],
      exhibitions: [],
      dateFrom: "",
      dateTo: "",
    });
  };
  const handlePageChange = (page: number) => fetchPiezas(page, searchFilters);
  const handleViewModeChange = (mode: ViewMode) =>
    setPagination((p) => ({ ...p, viewMode: mode }));
  const [selectedItems, setSelectedItems] = useState<CollectionItem[]>([]);
  const handleSelectItem = (item: CollectionItem) =>
    setSelectedItems((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item]
    );
  const handleSelectAll = () => {
    const all = items.every((i) => selectedItems.some((s) => s.id === i.id));
    setSelectedItems(all ? [] : items);
  };

  return (
    <div className="p-6 space-y-4">
      <Search
        onSearch={handleSearch}
        showAdvanced={showFilters}
        toggleAdvanced={() => setShowFilters((v) => !v)}
      />

      {showFilters && (
        <FilterPanel
          initialFilters={searchFilters}
          onApplyFilters={handleApplyFilters}
          onReset={handleResetFilters}
        />
      )}

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
  );
}
