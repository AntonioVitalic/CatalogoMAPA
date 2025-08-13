import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder: string;
  label: string;
}

const SearchableMultiSelect = ({
  options,
  selectedValues,
  onSelectionChange,
  placeholder,
  label,
}: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = options.filter(o =>
    o.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggle = (value: string, checked: boolean) => {
    if (checked) onSelectionChange([...selectedValues, value]);
    else onSelectionChange(selectedValues.filter(v => v !== value));
  };

  const display = selectedValues.length
    ? `${selectedValues.length} seleccionado${selectedValues.length > 1 ? "s" : ""}`
    : placeholder;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={isOpen}
          className="w-full justify-between h-9 text-sm px-3">
          <span className="truncate">{display}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-2 text-center text-xs text-muted-foreground">
              No se encontraron opciones
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((opt) => (
                <div key={opt} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${label}-${opt}`}
                    checked={selectedValues.includes(opt)}
                    onCheckedChange={(c) => toggle(opt, Boolean(c))}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`${label}-${opt}`} className="text-sm font-normal cursor-pointer flex-1">
                    {opt}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableMultiSelect;
