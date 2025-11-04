import { SearchFilters } from "@/types";

interface ActiveFiltersProps {
  filters: SearchFilters;
  onResetFilters?: () => void; // opcional por si luego se desea tener botón "limpiar"
}

const ActiveFilters = ({ filters }: ActiveFiltersProps) => {
  const active: string[] = [];

  if (filters.country?.length)
    active.push(`país: ${filters.country.join(", ")}`);
  if (filters.collection?.length)
    active.push(`colección: ${filters.collection.join(", ")}`);
  if (filters.author?.length)
    active.push(`autor: ${filters.author.join(", ")}`);
  if (filters.locality?.length)
    active.push(`localidad: ${filters.locality.join(", ")}`);
  if (filters.location?.length)
    active.push(`ubicación: ${filters.location.join(", ")}`);
  if (filters.tipologias?.length)
    active.push(`tipología: ${filters.tipologias.join(", ")}`);
  if (filters.exhibitions?.length)
    active.push(`exhibiciones: ${filters.exhibitions.join(", ")}`);
  if (filters.dateFrom || filters.dateTo)
    active.push(
      `fecha de creación: ${filters.dateFrom || "?"} - ${filters.dateTo || "?"}`
    );

  if (active.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
      <span className="text-sm font-medium">Se ha filtrado por:</span>
      <span className="text-sm text-muted-foreground">
        {active.join(", ")}
      </span>
    </div>
  );
};

export default ActiveFilters;
