import { CollectionItem, PaginationState, ViewMode, SearchFilters } from "@/types";
import ItemCard from "./ItemCard";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LayoutGrid, List, Check } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { formatInventoryNumberWithComponents } from "@/utils/inventoryNumber";
import { getComponentDisplayLetter } from "@/utils/componentLabel";

interface ItemGridProps {
  items: CollectionItem[];
  loading?: boolean;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onViewModeChange: (mode: ViewMode) => void;
  selectedItems: CollectionItem[];
  onSelectItem: (item: CollectionItem) => void;
  onSelectAllVisible: () => void;
  onSelectAllFiltered: () => void;
  totalFilteredItems: number;
  searchFilters: SearchFilters;
  userRole?: "admin" | "editor" | "visitor";
  onItemsPerPageChange: (size: number) => void;
  itemsPerPageOptions: readonly number[];
}

const ItemGrid = ({
  items,
  loading,
  pagination,
  onPageChange,
  onViewModeChange,
  selectedItems,
  onSelectItem,
  onSelectAllVisible,
  onSelectAllFiltered,
  totalFilteredItems,
  searchFilters,
  userRole,
  onItemsPerPageChange,
  itemsPerPageOptions,
}: ItemGridProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSelected = (item: CollectionItem) =>
    selectedItems.some((i) => i.id === item.id);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p>Cargando...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <p>No se encontraron piezas con los criterios de búsqueda.</p>
      </div>
    );
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-6">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onSelect={onSelectItem}
          isSelected={isSelected(item)}
        />
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex border rounded-md p-3 hover:bg-accent/10 transition-colors ${
            isSelected(item) ? "ring-2 ring-primary" : ""
          }`}
        >
          <div className="flex-shrink-0 mr-3">
            <div className="relative h-16 w-16 rounded-md bg-muted/10 flex items-center justify-center">
               {(() => {
                const componentImages = (item.componentes ?? []).flatMap((component, idx) =>
                  (component.imagenes ?? []).map((img) => ({
                    ...img,
                    descripcion:
                      img.descripcion ||
                      `${item.inventoryNumber}${getComponentDisplayLetter(component.letra, idx).toLowerCase()}`,
                  }))
                );

                const displayImages = [...(item.imagenes ?? []), ...componentImages];

                if (displayImages.length > 0) {
                  return (
                    <img
                      src={displayImages[0].imagen}
                      alt={displayImages[0].descripcion || ""}
                      className="max-h-full max-w-full object-contain p-1"
                    />
                  );
                }

                return (
                  <div className="flex h-full w-full items-center justify-center p-2">
                    <span className="text-xs text-muted-foreground text-center">
                      Sin imagen
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between">
              <div className="max-w-[70%] space-y-1">
              <p className="text-xs text-muted-foreground">
                {formatInventoryNumberWithComponents(
                  item.inventoryNumber,
                  item.componentes
                )}
              </p>
              <h3 className="font-medium text-sm truncate">
                {item.nombre_comun}
              </h3>
              {item.nombre_especifico && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {item.nombre_especifico}
                </p>
              )}
               {item.autor && (
                <div>
                  <p className="text-xs font-medium">Autor</p>
                  <p className="text-sm line-clamp-1">{item.autor}</p>
                </div>
              )}
              {item.etiqueta_eliminado && (
                <span className="text-xs font-bold text-red-600 bg-red-100 border border-red-400 px-2 py-1 rounded ml-2">
                  Eliminado
                </span>
              )}
              <div className="flex flex-wrap gap-4 items-center mt-1">
                {item.coleccion && (
                  <span className="text-xs">
                    <span className="font-medium">Colección:</span> {item.coleccion}
                  </span>
                )}
                {item.estado_conservacion && (
                  <span className="text-xs">
                    <span className="font-medium">Estado de conservación:</span> {item.estado_conservacion}
                  </span>
                )}
                {(item.pais || item.localidad) && (
                  <span className="text-xs text-muted-foreground">
                    {item.pais}{item.localidad ? `, ${item.localidad}` : ""}
                  </span>
                )}
              </div>
            </div>
              <div className="flex flex-col space-y-2 ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1 h-auto border border-primary"
                  onClick={() => onSelectItem(item)}
                >
                  {isSelected(item) ? "Deseleccionar" : "Seleccionar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1 h-auto min-w-[80px] whitespace-nowrap border border-primary"
                  onClick={() => {
                    navigate(`/detail/${item.id}`, {
                      state: { from: `${location.pathname}${location.search}` },
                    });
                  }}
                >
                  Ver detalle
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderItemsPerPageSelect = () => (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        Cantidad de piezas por página:
      </span>
      <Select
        value={String(pagination.itemsPerPage)}
        onValueChange={(value) => onItemsPerPageChange(Number(value))}
      >
        <SelectTrigger className="w-[4.5rem] h-9">
          <SelectValue placeholder={String(pagination.itemsPerPage)} />
        </SelectTrigger>
        <SelectContent>
          {itemsPerPageOptions.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
       <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {(userRole === "admin" || userRole === "editor") && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSelectAllFiltered}
                  className="flex items-center gap-2"
                >
                  <Check size={16} />
                  Seleccionar todas las filtradas ({totalFilteredItems})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSelectAllVisible}
                  className="flex items-center gap-2"
                >
                  <Check size={16} />
                  Seleccionar todas las visibles ({items.length})
                </Button>
              </div>
              {renderItemsPerPageSelect()}
            </>
          )}
          {(userRole !== "admin" && userRole !== "editor") && renderItemsPerPageSelect()}
        </div>
        <div className={`bg-background border rounded-md p-1 flex ${userRole === "visitor" ? "ml-auto" : ""}`}>
          <Button
            variant={pagination.viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className="rounded-r-none"
          >
            <LayoutGrid size={18} />
          </Button>
          <Button
            variant={pagination.viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("list")}
            className="rounded-l-none"
          >
            <List size={18} />
          </Button>
        </div>
      </div>
      {pagination.viewMode === "grid" ? renderGridView() : renderListView()}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            />
          </PaginationItem>
          {Array.from(
            { length: Math.min(5, pagination.totalPages) },
            (_, i) => {
              const pageNum =
                pagination.page <= 3
                  ? i + 1
                  : pagination.page >= pagination.totalPages - 2
                  ? pagination.totalPages - 4 + i
                  : pagination.page - 2 + i;
              if (pageNum < 1 || pageNum > pagination.totalPages) return null;
              const isActive = pagination.page === pageNum;
              return (
                 <PaginationItem key={pageNum}>
                  <button
                    onClick={() => onPageChange(pageNum)}
                    className={cn(
                      buttonVariants({
                        variant: isActive ? "outline" : "ghost",
                        size: "default",
                      }),
                      "min-w-[2rem] h-9 px-2",
                      isActive && "bg-primary/10 border-primary shadow font-bold text-primary"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                </PaginationItem>
              );
            }
          )}
          {pagination.totalPages > 5 &&
            pagination.page < pagination.totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
          {pagination.totalPages > 5 &&
            pagination.page < pagination.totalPages - 1 && (
              <PaginationItem>
                <button
                  onClick={() => onPageChange(pagination.totalPages)}
                  className={cn(
                    buttonVariants({
                      variant: "ghost",
                      size: "default",
                    }),
                    "min-w-[2rem] h-9 px-2"
                  )}
                >
                  {pagination.totalPages}
                </button>
              </PaginationItem>
            )}
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default ItemGrid;
