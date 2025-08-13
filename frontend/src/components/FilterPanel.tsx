import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SearchFilters } from "@/types";
import { X } from "lucide-react";
import SearchableMultiSelect from "./SearchableMultiSelect";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8002";

type FilterOptions = {
  countries: string[];
  collections: string[];
  authors: string[];
  localities: string[];
  tipologias: string[];
};

// Exhibiciones (de momento mock)
const mockExhibitions = [
  "Textiles Andinos",
  "Artesanía Contemporánea",
  "Cerámica Precolombina",
  "Arte Popular Chileno",
  "Máscaras Ceremoniales",
];

interface FilterPanelProps {
  onApplyFilters: (filters: SearchFilters) => void;
  onReset: () => void;
  initialFilters?: SearchFilters;
}

const FilterPanel = ({ onApplyFilters, onReset, initialFilters }: FilterPanelProps) => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || {
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

  const [opts, setOpts] = useState<FilterOptions>({
    countries: [],
    collections: [],
    authors: [],
    localities: [],
    tipologias: [],
  });

  // sync si nos pasan initialFilters (reabrir panel)
  useEffect(() => {
    if (initialFilters) setFilters(initialFilters);
  }, [initialFilters]);

  // cargar opciones desde el backend
  useEffect(() => {
    (async () => {
      try {
        const resps = await Promise.all([
          fetch(`${API_URL}/api/paises/`),
          fetch(`${API_URL}/api/colecciones/`),
          fetch(`${API_URL}/api/autores/`),
          fetch(`${API_URL}/api/localidades/`),
          fetch(`${API_URL}/api/tipologias/`),
        ]);
        resps.forEach(r => { if (!r.ok) throw new Error("Error al cargar filtros"); });
        const [paises, coles, autores, locs, tips] = await Promise.all(resps.map(r => r.json()));
        setOpts({
          countries: paises.map((x: any) => x.nombre),
          collections: coles.map((x: any) => x.nombre),
          authors: autores.map((x: any) => x.nombre),
          localities: locs.map((x: any) => x.nombre),
          tipologias: tips.map((x: any) => x.nombre),
        });
      } catch (e) {
        console.error("Error fetching filter options:", e);
      }
    })();
  }, []);

  const onMulti = (
    category: "country" | "collection" | "author" | "locality" | "tipologias" | "exhibitions",
    values: string[]
  ) => setFilters(prev => ({ ...prev, [category]: values }));

  const handleReset = () => {
    const cleared: SearchFilters = {
      query: "",
      country: [],
      collection: [],
      author: [],
      locality: [],
      tipologias: [],
      exhibitions: [],
      dateFrom: "",
      dateTo: "",
    };
    setFilters(cleared);
    onReset();
  };

  return (
    <div className="bg-background border rounded-lg p-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Filtros</h3>
        <Button size="sm" variant="ghost" onClick={handleReset} className="h-8 px-2 text-muted-foreground">
          <X className="h-4 w-4 mr-1" /> Resetear
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium w-28">País</Label>
          <SearchableMultiSelect
            options={opts.countries}
            selectedValues={filters.country || []}
            onSelectionChange={(v) => onMulti("country", v)}
            placeholder="Seleccionar países"
            label="País"
          />
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium w-28">Colección</Label>
          <SearchableMultiSelect
            options={opts.collections}
            selectedValues={filters.collection || []}
            onSelectionChange={(v) => onMulti("collection", v)}
            placeholder="Seleccionar colecciones"
            label="Colección"
          />
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium w-28">Autor</Label>
          <SearchableMultiSelect
            options={opts.authors}
            selectedValues={filters.author || []}
            onSelectionChange={(v) => onMulti("author", v)}
            placeholder="Seleccionar autores"
            label="Autor"
          />
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium w-28">Localidad</Label>
          <SearchableMultiSelect
            options={opts.localities}
            selectedValues={filters.locality || []}
            onSelectionChange={(v) => onMulti("locality", v)}
            placeholder="Seleccionar localidades"
            label="Localidad"
          />
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium w-28">Tipología</Label>
          <SearchableMultiSelect
            options={opts.tipologias}
            selectedValues={filters.tipologias || []}
            onSelectionChange={(v) => onMulti("tipologias", v)}
            placeholder="Seleccionar tipologías"
            label="Tipología"
          />
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium w-28">Exhibición</Label>
          <SearchableMultiSelect
            options={mockExhibitions}
            selectedValues={filters.exhibitions || []}
            onSelectionChange={(v) => onMulti("exhibitions", v)}
            placeholder="Seleccionar exhibiciones"
            label="Exhibición"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Fecha de creación</Label>
          <div className="flex items-center gap-3">
            <Label htmlFor="dateFrom" className="text-xs text-muted-foreground w-16">Desde</Label>
            <Input id="dateFrom" type="text" placeholder="Año (ej. 1900)"
              value={filters.dateFrom || ""} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="h-9 text-sm" />
            <Label htmlFor="dateTo" className="text-xs text-muted-foreground w-16">Hasta</Label>
            <Input id="dateTo" type="text" placeholder="Año (ej. 2000)"
              value={filters.dateTo || ""} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="h-9 text-sm" />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={() => onApplyFilters(filters)} className="w-full">
          Aplicar filtros
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;
