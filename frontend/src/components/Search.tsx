
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchFilters } from "@/types";
import { Search as SearchIcon } from "lucide-react";

interface SearchProps {
  onSearch: (filters: SearchFilters) => void;
  showAdvanced: boolean;
  toggleAdvanced: () => void;
}

const Search = ({ onSearch, showAdvanced, toggleAdvanced }: SearchProps) => {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query });
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex flex-col space-y-4">
        <div className="flex w-full items-center space-x-2">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre, número de inventario, descripción..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Buscar</Button>
          <Button
            type="button"
            variant="outline"
            onClick={toggleAdvanced}
          >
            {showAdvanced ? "Búsqueda simple" : "Búsqueda avanzada"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Search;
