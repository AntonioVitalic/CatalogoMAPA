import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CollectionItem } from "@/types";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Eye } from "lucide-react";
import { formatInventoryNumberWithComponents } from "@/utils/inventoryNumber";
import { getComponentDisplayLetter } from "@/utils/componentLabel";
interface ItemCardProps {
  item: CollectionItem;
  onSelect: (item: CollectionItem) => void;
  isSelected: boolean;
}

const ItemCard = ({ item, onSelect, isSelected }: ItemCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();

  const displayInventoryNumber = formatInventoryNumberWithComponents(
    item.inventoryNumber,
    item.componentes
  );

  const viewDetails = () => {
    navigate(`/detail/${item.id}`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const images = item.imagenes ?? [];
  const componentImages = (item.componentes ?? []).flatMap((component, idx) =>
    (component.imagenes ?? []).map((img) => ({
      ...img,
      descripcion:
        img.descripcion || `${item.inventoryNumber}${getComponentDisplayLetter(component.letra, idx).toLowerCase()}`,
    }))
  );
  const displayImages = [...images, ...componentImages];
  const hasImages = displayImages.length > 0;
  const showGrid = displayImages.length > 1;
  const maxGridImages = 4;

  return (
    <Card
      className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer group ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={viewDetails}
    >
      {/* Imagen - aspect ratio 4:3 en vez de cuadrado */}
      <div className="relative aspect-[4/3] bg-muted/10 flex items-center justify-center overflow-hidden">
        {hasImages ? (
          showGrid ? (
            <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-full p-0.5">
              {displayImages.slice(0, maxGridImages).map((img, index) => {
                const remaining = Math.max(displayImages.length - maxGridImages, 0);
                const isLastVisible =
                  index === Math.min(displayImages.length, maxGridImages) - 1;
                return (
                  <div key={`${img.imagen}-${index}`} className="relative w-full h-full overflow-hidden rounded-sm bg-background">
                    <img
                      src={img.imagen}
                      alt={img.descripcion || item.nombre_comun || "Sin imagen"}
                      className="w-full h-full object-cover"
                    />
                    {remaining > 0 && isLastVisible && (
                      <div className="absolute inset-0 bg-black/50 text-white text-xs font-semibold flex items-center justify-center">
                        +{remaining}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <img
              src={displayImages[0].imagen}
              alt={displayImages[0].descripcion || item.nombre_comun || "Sin imagen"}
              className="max-h-full max-w-full object-contain p-1"
            />
          )
        ) : (
          <span className="text-muted-foreground text-xs">Sin imagen</span>
        )}
        {/* Overlay al hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary-foreground" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {item.etiqueta_eliminado && (
          <span className="absolute top-1.5 left-1.5 text-[10px] font-bold text-red-600 bg-red-100 border border-red-400 px-1.5 py-0.5 rounded">
            Eliminado
          </span>
        )}
      </div>

      <CardContent className="p-2.5">
        <p className="text-[10px] text-muted-foreground leading-tight">{displayInventoryNumber}</p>
        <h3 className="font-medium text-sm leading-tight line-clamp-1 mt-0.5">{item.nombre_comun}</h3>
        {item.nombre_especifico && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.nombre_especifico}</p>
        )}
        {item.coleccion && (
          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
            {item.coleccion}
          </p>
        )}
        {(item.pais || item.localidad) && (
          <p className="text-[10px] text-muted-foreground line-clamp-1">
            {item.pais}{item.localidad ? `, ${item.localidad}` : ''}
          </p>
        )}
        {/* Botones compactos */}
        <div className="flex gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => onSelect(item)}
          >
            {isSelected ? "Deseleccionar" : "Seleccionar"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={viewDetails}
          >
            <Eye size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemCard;
