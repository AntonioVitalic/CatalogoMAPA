// frontend/src/components/ItemDetail.tsx
import { CollectionItem } from "@/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Edit, DownloadIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { saveAs } from "file-saver";

interface ItemDetailProps {
  item: CollectionItem;
}

const ItemDetail = ({ item }: ItemDetailProps) => {
  const { role } = useAuth();
  const isEditorOrAdmin = role === "editor" || role === "admin";

  const handleEdit = () => {
    toast.info("Funcionalidad de edición no implementada en esta demo");
  };

  const downloadImage = async () => {
    if (!item.imageUrl) {
      toast.error("No hay imagen disponible para descargar");
      return;
    }
    try {
      toast.loading("Descargando imagen...");
      const response = await fetch(item.imageUrl);
      if (!response.ok) throw new Error("Error al descargar la imagen");
      const blob = await response.blob();
      // Extraemos la extensión o usamos .jpg por defecto
      const extension = item.imageUrl.split(".").pop()?.split(/\#|\?/)[0] || "jpg";
      saveAs(
        blob,
        `${item.inventoryNumber || item.commonName || "imagen"}.${extension}`
      );
      toast.success("Imagen descargada correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al descargar la imagen");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al catálogo
          </Button>
        </Link>

        {isEditorOrAdmin && (
          <Button onClick={handleEdit} variant="secondary" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Editar pieza
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-muted rounded-lg overflow-hidden">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.commonName}
                className="w-full h-auto object-contain"
              />
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">Imagen no disponible</p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              {item.creationDate
                ? `Fecha de creación: ${item.creationDate}`
                : "Fecha desconocida"}
            </p>
            <Button variant="ghost" size="sm" onClick={downloadImage}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Descargar imagen
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">{item.inventoryNumber}</p>
            <h1 className="text-2xl font-bold">{item.commonName}</h1>
            {item.attributedName && (
              <p className="text-lg text-muted-foreground">{item.attributedName}</p>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            {item.author && <DetailItem label="Autor" value={item.author} />}
            <DetailItem label="Colección" value={item.collection} />
            <DetailItem label="País" value={item.country} />
            {item.locality && <DetailItem label="Localidad" value={item.locality} />}
            <DetailItem
              label="Materialidad"
              value={
                Array.isArray(item.materials)
                  ? item.materials.join(", ")
                  : item.materials
              }
            />
            <DetailItem
              label="Estado de conservación"
              value={item.conservationState}
            />
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Descripción</h3>
            <p className="text-sm">{item.collectionDescription}</p>
          </div>

          {(item.previousRegistryNumber ||
            item.surdoc ||
            item.location ||
            item.deposit ||
            item.shelf) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold">Información adicional</h3>
                {item.previousRegistryNumber && (
                  <DetailItem
                    label="Número de registro anterior"
                    value={item.previousRegistryNumber}
                  />
                )}
                {item.surdoc && <DetailItem label="ID SURDOC" value={item.surdoc} />}
                {item.location && <DetailItem label="Ubicación" value={item.location} />}
                {item.deposit && <DetailItem label="Depósito" value={item.deposit} />}
                {item.shelf && <DetailItem label="Estante" value={item.shelf} />}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-sm font-medium">{label}</p>
    <p>{value}</p>
  </div>
);

export default ItemDetail;
