
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SearchFilters } from "@/types";
import { X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { mockMaterials, mockCountries, mockCollections, mockAuthors, mockLocalities } from "@/data/mockData";

// Mock exhibitions data (this would come from your data source)
const mockExhibitions = [
  "Textiles Andinos",
  "Artesanía Contemporánea",
  "Cerámica Precolombina",
  "Arte Popular Chileno",
  "Máscaras Ceremoniales"
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
    materials: [],
    exhibitions: [],
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  const handleCheckboxChange = (
    category: "country" | "collection" | "author" | "locality" | "materials" | "exhibitions",
    value: string
  ) => {
    setFilters((prev) => {
      const currentValues = prev[category] || [];
      if (Array.isArray(currentValues)) {
        if (currentValues.includes(value)) {
          return {
            ...prev,
            [category]: currentValues.filter((item) => item !== value),
          };
        } else {
          return {
            ...prev,
            [category]: [...currentValues, value],
          };
        }
      }
      return prev;
    });
  };

  const handleReset = () => {
    setFilters({
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
    onReset();
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  return (
    <div className="bg-background border rounded-lg p-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Filtros</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReset}
          className="h-8 px-2 text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Resetear
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["countries", "collections"]}>
        <AccordionItem value="countries">
          <AccordionTrigger>País</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {mockCountries.map((country) => (
                <div key={country} className="flex items-center space-x-2">
                  <Checkbox
                    id={`country-${country}`}
                    checked={filters.country?.includes(country) || false}
                    onCheckedChange={() =>
                      handleCheckboxChange("country", country)
                    }
                  />
                  <Label
                    htmlFor={`country-${country}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {country}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="collections">
          <AccordionTrigger>Colección</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {mockCollections.map((collection) => (
                <div key={collection} className="flex items-center space-x-2">
                  <Checkbox
                    id={`collection-${collection}`}
                    checked={filters.collection?.includes(collection) || false}
                    onCheckedChange={() =>
                      handleCheckboxChange("collection", collection)
                    }
                  />
                  <Label
                    htmlFor={`collection-${collection}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {collection}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="authors">
          <AccordionTrigger>Autor</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {mockAuthors.map((author) => (
                <div key={author} className="flex items-center space-x-2">
                  <Checkbox
                    id={`author-${author}`}
                    checked={filters.author?.includes(author) || false}
                    onCheckedChange={() =>
                      handleCheckboxChange("author", author)
                    }
                  />
                  <Label
                    htmlFor={`author-${author}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {author}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="localities">
          <AccordionTrigger>Localidad</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {mockLocalities.map((locality) => (
                <div key={locality} className="flex items-center space-x-2">
                  <Checkbox
                    id={`locality-${locality}`}
                    checked={filters.locality?.includes(locality) || false}
                    onCheckedChange={() =>
                      handleCheckboxChange("locality", locality)
                    }
                  />
                  <Label
                    htmlFor={`locality-${locality}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {locality}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="materials">
          <AccordionTrigger>Materialidad</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {mockMaterials.map((material) => (
                <div key={material} className="flex items-center space-x-2">
                  <Checkbox
                    id={`material-${material}`}
                    checked={filters.materials?.includes(material) || false}
                    onCheckedChange={() =>
                      handleCheckboxChange("materials", material)
                    }
                  />
                  <Label
                    htmlFor={`material-${material}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {material}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* New Exhibitions filter */}
        <AccordionItem value="exhibitions">
          <AccordionTrigger>Exhibiciones</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {mockExhibitions.map((exhibition) => (
                <div key={exhibition} className="flex items-center space-x-2">
                  <Checkbox
                    id={`exhibition-${exhibition}`}
                    checked={filters.exhibitions?.includes(exhibition) || false}
                    onCheckedChange={() =>
                      handleCheckboxChange("exhibitions", exhibition)
                    }
                  />
                  <Label
                    htmlFor={`exhibition-${exhibition}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {exhibition}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="date">
          <AccordionTrigger>Fecha de creación</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Desde</Label>
                <Input
                  id="dateFrom"
                  type="text"
                  placeholder="Año (ej. 1900)"
                  value={filters.dateFrom || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">Hasta</Label>
                <Input
                  id="dateTo"
                  type="text"
                  placeholder="Año (ej. 2000)"
                  value={filters.dateTo || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-6">
        <Button onClick={handleApply} className="w-full">
          Aplicar filtros
        </Button>
      </div>
    </div>
  );
};

export default FilterPanel;
