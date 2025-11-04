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
  locations: string[];
  tipologias: string[];
  exhibitions: string[];
};

type MultiFilterKey =
  | "country"
  | "collection"
  | "author"
  | "locality"
  | "location"
  | "tipologias"
  | "exhibitions";

type FilterDescriptor = {
  key: MultiFilterKey;
  optionsKey: keyof FilterOptions;
  label: string;
  placeholder: string;
};

type NamedResource = {
  id: number;
  nombre: string;
};

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
    location: [],
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
    locations: [],
    tipologias: [],
    exhibitions: [],
  });

  // sync si nos pasan initialFilters (reabrir panel)
  useEffect(() => {
    if (initialFilters) setFilters(initialFilters);
  }, [initialFilters]);

  // cargar opciones desde el backend
  useEffect(() => {
      const fetchCatalog = async (path: string): Promise<string[]> => {
      const response = await fetch(`${API_URL}${path}`);
      if (!response.ok) {
        throw new Error(`Error al cargar ${path}`);
      }
      const data: NamedResource[] = await response.json();
      return data.map((item) => item.nombre);
    };
    (async () => {
      try {
         const [countries, collections, authors, localities, locations, tipologias, exhibitions] =
          await Promise.all([
            fetchCatalog("/api/paises/"),
            fetchCatalog("/api/colecciones/"),
            fetchCatalog("/api/autores/"),
            fetchCatalog("/api/localidades/"),
            fetchCatalog("/api/ubicacion/"),
            fetchCatalog("/api/tipologias/"),
            fetchCatalog("/api/exposiciones/"),
          ]);
        setOpts({
          countries,
          collections,
          authors,
          localities,
          locations,
          tipologias,
          exhibitions,
        });
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    })();
  }, []);

  const onMulti = (
    category: MultiFilterKey,
    values: string[]
  ) => setFilters(prev => ({ ...prev, [category]: values }));

  const handleReset = () => {
    const cleared: SearchFilters = {
      query: "",
      country: [],
      collection: [],
      author: [],
      locality: [],
      location: [],
      tipologias: [],
      exhibitions: [],
      dateFrom: "",
      dateTo: "",
    };
    setFilters(cleared);
    onReset();
  };

   const MULTI_FILTERS: FilterDescriptor[] = [
    {
      key: "country",
      optionsKey: "countries",
      label: "País",
      placeholder: "Selec. países",
    },
    {
      key: "collection",
      optionsKey: "collections",
      label: "Colección",
      placeholder: "Selec. colecciones",
    },
    {
      key: "author",
      optionsKey: "authors",
      label: "Autor",
      placeholder: "Selec. autores",
    },
    {
      key: "locality",
      optionsKey: "localities",
      label: "Localidad",
      placeholder: "Selec. localidades",
    },
    {
      key: "location",
      optionsKey: "locations",
      label: "Ubicación",
      placeholder: "Selec. ubicaciones",
    },
    {
      key: "tipologias",
      optionsKey: "tipologias",
      label: "Tipología",
      placeholder: "Selec. tipologías",
    },
    {
      key: "exhibitions",
      optionsKey: "exhibitions",
      label: "Exposiciones",
      placeholder: "Selec. exposiciones",
    },
  ];

  return (
    <div className="bg-background border rounded-lg p-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Filtros</h3>
        <Button size="sm" variant="ghost" onClick={handleReset} className="h-8 px-2 text-muted-foreground">
          <X className="h-4 w-4 mr-1" /> Resetear todos los filtros
        </Button>
      </div>

      <div className="space-y-4">
        {MULTI_FILTERS.map(({ key, optionsKey, label, placeholder }) => {
          const selectedValues = (filters[key] ?? []) as string[];
          const hasSelection = selectedValues.length > 0;
          const options = opts[optionsKey];

          return (
            <div key={key} className="flex items-center gap-3">
              <Label className="text-sm font-medium w-28">{label}</Label>
              <SearchableMultiSelect
                options={options}
                selectedValues={selectedValues}
                onSelectionChange={(value) => onMulti(key, value)}
                placeholder={placeholder}
                label={label}
              />
              {hasSelection && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="ml-2"
                  onClick={() => setFilters((prev) => ({ ...prev, [key]: [] }))}
                  title={`Limpiar ${label.toLowerCase()}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}

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
