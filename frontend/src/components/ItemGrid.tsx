
import { CollectionItem, PaginationState, ViewMode } from "@/types";
import ItemCard from "./ItemCard";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, CheckSquare } from "lucide-react";

interface ItemGridProps {
  items: CollectionItem[];
  loading?: boolean;
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onViewModeChange: (mode: ViewMode) => void;
  selectedItems: CollectionItem[];
  onSelectItem: (item: CollectionItem) => void;
  onSelectAll: () => void;
  totalItems: number;
}

const ItemGrid = ({
  items,
  loading,
  pagination,
  onPageChange,
  onViewModeChange,
  selectedItems,
  onSelectItem,
  onSelectAll,
  totalItems,
}: ItemGridProps) => {
  const isSelected = (item: CollectionItem) => {
    return selectedItems.some((selectedItem) => selectedItem.id === item.id);
  };

  // Check if all visible items are selected
  const areAllSelected = items.length > 0 && items.every(item => isSelected(item));

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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
            isSelected(item) ? 'ring-2 ring-primary' : ''
          }`}
        >
          <div className="flex-shrink-0 mr-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-md">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.commonName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-xs text-muted-foreground">Sin imagen</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between">
              <div className="max-w-[70%] space-y-1">
                <p className="text-xs text-muted-foreground">{item.inventoryNumber}</p>
                <h3 className="font-medium text-sm truncate">{item.commonName}</h3>
                {item.attributedName && (
                  <p className="text-xs text-muted-foreground truncate">{item.attributedName}</p>
                )}
                {item.author && (
                  <p className="text-xs">
                    <span className="font-medium">Autor:</span> {item.author}
                  </p>
                )}
                <p className="text-xs">
                  <span className="font-medium">Estado:</span> {item.conservationState}
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.materials.slice(0, 2).map((material, idx) => (
                    <span key={idx} className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                      {material}
                    </span>
                  ))}
                  {item.materials.length > 2 && (
                    <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                      +{item.materials.length - 2}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col space-y-1 ml-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs px-2 py-1 h-auto"
                  onClick={() => onSelectItem(item)}
                >
                  {isSelected(item) ? "Deseleccionar" : "Seleccionar"}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs px-2 py-1 h-auto"
                  onClick={() => window.location.href = `/detail/${item.id}`}
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          className="flex items-center gap-2"
          title={areAllSelected ? "Deseleccionar todo" : "Seleccionar todo"}
        >
          <CheckSquare size={16} />
          {areAllSelected ? "Deseleccionar todo" : `Seleccionar todo (${totalItems})`}
        </Button>
        
        <div className="bg-background border rounded-md p-1 flex">
          <Button
            variant={pagination.viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="rounded-r-none"
            title="Vista de cuadrícula"
          >
            <LayoutGrid size={18} />
          </Button>
          <Button
            variant={pagination.viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="rounded-l-none"
            title="Vista de lista"
          >
            <List size={18} />
          </Button>
        </div>
      </div>

      {pagination.viewMode === 'grid' ? renderGridView() : renderListView()}

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => {
                if (pagination.page > 1) {
                  onPageChange(pagination.page - 1);
                }
              }}
              className={pagination.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const pageNum = pagination.page <= 3
              ? i + 1
              : pagination.page >= pagination.totalPages - 2
                ? pagination.totalPages - 4 + i
                : pagination.page - 2 + i;
                
            if (pageNum <= 0 || pageNum > pagination.totalPages) return null;
            
            return (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => onPageChange(pageNum)}
                  isActive={pagination.page === pageNum}
                  className="cursor-pointer"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          
          {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          
          {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 1 && (
            <PaginationItem>
              <PaginationLink
                onClick={() => onPageChange(pagination.totalPages)}
                className="cursor-pointer"
              >
                {pagination.totalPages}
              </PaginationLink>
            </PaginationItem>
          )}
          
          <PaginationItem>
            <PaginationNext
              onClick={() => {
                if (pagination.page < pagination.totalPages) {
                  onPageChange(pagination.page + 1);
                }
              }}
              className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default ItemGrid;
