import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CollectionItem } from "@/types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Eye } from "lucide-react";

interface ItemCardProps {
  item: CollectionItem;
  onSelect: (item: CollectionItem) => void;
  isSelected: boolean;
}

const ItemCard = ({ item, onSelect, isSelected }: ItemCardProps) => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const viewDetails = () => {
    navigate(`/detail/${item.id}`);
  };

  return (
    <Card className={`overflow-hidden hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <div className="relative aspect-square">
        <div className="absolute inset-0 flex justify-center items-center bg-muted/30">
          {!item.thumbnailUrl && <span className="text-muted-foreground text-sm">Sin imagen</span>}
        </div>
        {item.thumbnailUrl && (
          <img
            src={item.thumbnailUrl}
            alt={item.commonName}
            className="w-full h-full object-cover"
          />
        )}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-primary-foreground"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div>
            <p className="text-xs text-muted-foreground">{item.inventoryNumber}</p>
            <h3 className="font-medium line-clamp-2">{item.commonName}</h3>
            {item.attributedName && (
              <p className="text-sm text-muted-foreground line-clamp-1">{item.attributedName}</p>
            )}
          </div>
          
          {item.collection && (
            <div>
              <p className="text-xs font-medium">Colección</p>
              <p className="text-sm line-clamp-1">{item.collection}</p>
            </div>
          )}

          {item.author && (
            <div>
              <p className="text-xs font-medium">Autor</p>
              <p className="text-sm line-clamp-1">{item.author}</p>
            </div>
          )}

          {item.materials && item.materials.length > 0 && (
            <div>
              <p className="text-xs font-medium">Materialidad</p>
              <p className="text-sm line-clamp-2">{item.materials.join(", ")}</p>
            </div>
          )}

          {item.conservationState && (
            <div>
              <p className="text-xs font-medium">Estado de conservación</p>
              <p className="text-sm">{item.conservationState}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {item.country}{item.locality ? `, ${item.locality}` : ''}
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm"
          className="w-full"
          onClick={() => onSelect(item)}
        >
          {isSelected ? "Deseleccionar" : "Seleccionar"}
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={viewDetails}
          className="ml-2"
        >
          <Eye size={16} className="mr-1" />
          Ver detalle
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ItemCard;
