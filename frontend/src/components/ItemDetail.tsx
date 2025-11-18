// frontend/src/components/ItemDetail.tsx
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CollectionItem } from "@/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Edit, DownloadIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { getComponentDisplayLetter } from "@/utils/componentLabel";
import { formatInventoryNumberWithComponents } from "@/utils/inventoryNumber";
interface ItemDetailProps {
  item: CollectionItem;
}

const ItemDetail = ({ item }: ItemDetailProps) => {
  const { role } = useAuth();
  const isEditorOrAdmin = role === "editor" || role === "admin";
  const [showFullInfo, setShowFullInfo] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationState = location.state as { from?: string } | null;

  const handleEdit = () => {
    navigate(`/editar-pieza/${item.id}`, {
      state: { from: navigationState?.from ?? `${location.pathname}` },
    });
  };

  const handleBack = () => {
    if (navigationState?.from) {
      navigate(navigationState.from);
      return;
    }
    navigate("/home?page=1");
  };

  const displayInventoryNumber = formatInventoryNumberWithComponents(
    item.inventoryNumber,
    item.componentes
  );

  const componentImages = (item.componentes ?? []).flatMap((component, idx) =>
    (component.imagenes ?? []).map((img) => ({
      ...img,
      descripcion:
        img.descripcion || `${item.inventoryNumber}${getComponentDisplayLetter(component.letra, idx).toLowerCase()}`,
    }))
  );

  const additionalImages = [
    ...(item.imagenes?.slice(1) ?? []),
    ...componentImages,
  ];

  const FIELD_LABELS: Record<string, string> = {
    inventoryNumber: "N° de inventario",
    pieza_numero_inventario: "N° de inventario",
    letra: "Letra",
    unidad_relacionada: "Unidad relacionada",
    previousRegistryNumber: "N° de registro anterior",
    surdoc: "SURDOC",
    ubicacion: "Ubicación",
    deposito: "Depósito",
    estante_o_fullspace: "Estante o fullspace",
    cajas_o_nivel: "Cajas o nivel",
    tipologia: "Tipología",
    coleccion: "Colección",
    clasificacion: "Clasificación",
    conjunto: "Conjunto",
    nombre_comun: "Nombre común",
    nombre_especifico: "Nombre atribuido",
    autor: "Autor",
    filiacion_cultural: "Filiación cultural",
    pais: "País",
    localidad: "Localidad",
    fecha_creacion: "Fecha de creación",
    descripcion_col: "Descripción colección",
    marcas_inscripciones: "Marcas o inscripciones",
    tecnica: "Técnica",
    materialidad: "Materialidad",
    descripcion_cr: "Descripción conservación",
    alto_cm: "Alto (cm)",
    ancho_cm: "Ancho (cm)",
    profundidad_cm: "Profundidad (cm)",
    diametro_cm: "Diámetro (cm)",
    espesor_mm: "Espesor (mm)",
    peso_gr: "Peso (gr)",
    funcion: "Función",
    contexto_historico: "Contexto histórico",
    bibliografia: "Bibliografía",
    iconografia: "Iconografía",
    notas_investigacion: "Notas de investigación",
    estado_conservacion: "Estado de conservación",
    responsable_conservacion: "Responsable conservación",
    fecha_actualizacion_conservacion: "Fecha actualización conservación",
    comentarios_conservacion: "Comentarios conservación",
    exposiciones: "Exposiciones",
    avaluo: "Avaluo",
    procedencia: "Procedencia",
    donante: "Donante",
    fecha_ingreso: "Fecha ingreso",
    responsable_coleccion: "Responsable colección",
    fecha_ultima_modificacion: "Fecha última modificación",
    imagenes: "Imágenes",
  };

  const downloadImage = async () => {
    if (!item.imagenes) {
      toast.error("No hay imagen disponible para descargar");
      return;
    }
    try {
      toast.loading("Descargando imagen...");
      const response = await fetch(item.imagenes[0].imagen);
      if (!response.ok) throw new Error("Error al descargar la imagen");
      const blob = await response.blob();
      // Extraemos la extensión o usamos .jpg por defecto
      const extension = item.imagenes[0].imagen.split(".").pop()?.split(/\#|\?/)[0] || "jpg";
      saveAs(
        blob,
        `${item.inventoryNumber || item.nombre_comun || "imagen"}.${extension}`
      );
      toast.success("Imagen descargada correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al descargar la imagen");
    }
  };

  const ORDERED_FIELD_KEYS = Object.keys(FIELD_LABELS);

  const formatFieldValue = (key: string, value: unknown) => {
    if (value === null || value === undefined) {
      return "Sin dato";
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "Sin dato";
    }

    if (typeof value === "string") {
      const trimmed = value.trim();

      if (!trimmed) {
        return "Sin dato";
      }

      if (key === "letra") {
        return trimmed.toUpperCase();
      }

      return trimmed;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? String(value) : "Sin dato";
    }

    if (typeof value === "boolean") {
      return value ? "Sí" : "No";
    }

    return String(value);
  };

  const getOrderedKeys = (data: Record<string, unknown>) => {
    const ordered = ORDERED_FIELD_KEYS.filter((key) =>
      Object.prototype.hasOwnProperty.call(data, key)
    );

    const additional = Object.keys(data).filter(
      (key) => key !== "componentes" && !ORDERED_FIELD_KEYS.includes(key)
    );

    return [...ordered, ...additional];
  };

  // Helper para mostrar todos los campos de una pieza/componente
  const renderFullInfo = (data: any, title: string) => {
    const normalizedData: Record<string, unknown> = data ?? {};
    const keysToRender = getOrderedKeys(normalizedData);

    return (
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <table className="w-full text-sm border">
          <tbody>
            {keysToRender.map((key) => {
              if (key === "componentes") {
                return null;
              }

              if (key === "imagenes") {
                const rawImages = (normalizedData as any).imagenes;
                const images = Array.isArray(rawImages)
                  ? rawImages
                  : rawImages && typeof rawImages === "object"
                    ? Object.values(rawImages)
                    : [];

                if (!images || images.length === 0) {
                  return null;
                }

                return (
                  <tr key={key}>
                    <td className="font-medium pr-2 align-top">{FIELD_LABELS[key]}</td>
                    <td>
                      {images.map((img: any, i: number) => (
                        <img
                          key={i}
                          src={img.imagen}
                          alt={img.descripcion || ""}
                          className="inline-block h-16 mr-2"
                        />
                      ))}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={key}>
                  <td className="font-medium pr-2 align-top">{FIELD_LABELS[key] || key}</td>
                  <td>{formatFieldValue(key, normalizedData[key])}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inventario
        </Button>

        {item.etiqueta_eliminado && (
          <span className="text-xs font-bold text-red-600 bg-red-100 border border-red-400 px-2 py-1 rounded ml-2">
            Eliminado
          </span>
        )}

        {isEditorOrAdmin && (
          <Button onClick={handleEdit} variant="secondary" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Editar pieza
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => setShowFullInfo(true)}>
          Ver información completa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-muted rounded-lg overflow-hidden">
            {item.imagenes && item.imagenes.length > 0 ? (
              <img
                src={item.imagenes[0].imagen}
                alt={item.imagenes[0].descripcion || ""}
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
              {item.fecha_creacion
                ? `Fecha de creación: ${item.fecha_creacion}`
                : "Fecha desconocida"}
            </p>
            <Button variant="ghost" size="sm" onClick={downloadImage}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Descargar imagen principal
            </Button>
          </div>

          {additionalImages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Otras imágenes
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {additionalImages.map((img, index) => (
                  <div
                    key={`${img.imagen}-${index}`}
                    className="relative w-full overflow-hidden rounded-md bg-muted/20"
                  >
                    <img
                      src={img.imagen}
                      alt={img.descripcion || item.nombre_comun || `Imagen ${index + 2}`}
                      className="w-full h-28 sm:h-32 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">{displayInventoryNumber}</p>
            <h1 className="text-2xl font-bold">{item.nombre_comun}</h1>
            {item.nombre_especifico && (
              <p className="text-lg text-muted-foreground">{item.nombre_especifico}</p>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            {item.autor && <DetailItem label="Autor" value={item.autor ? item.autor : "Sin dato de autor"} />}
            <DetailItem label="Colección" value={item.coleccion ? item.coleccion : "Sin dato de coleccion"} />
            <DetailItem label="País" value={item.pais ? item.pais : "Sin dato de país"} />
            {item.localidad && <DetailItem label="Localidad" value={item.localidad ? item.localidad : "Sin dato de localidad"} />}
            <DetailItem
              label="Materialidad"
              value={
                item.materialidad && item.materialidad.length > 0
                  ? Array.isArray(item.materialidad)
                    ? item.materialidad.join(", ")
                    : item.materialidad
                  : "Sin dato"
              }
            />
            <DetailItem
              label="Estado de conservación"
              value={item.estado_conservacion ? item.estado_conservacion : "Sin dato"}
            />
            {/* Enlace a SURDOC */}
            {item.surdoc && (
              <DetailItem
                label="Enlace a SURDOC"
                value={
                  <a
                    href={`https://www.surdoc.cl/registro/${item.surdoc}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {`https://www.surdoc.cl/registro/${item.surdoc}`}
                  </a>
                }
              />
            )}
          </div>

          <Separator />

          <div>
             <h3 className="font-semibold mb-2">Descripción</h3>
              <p className="text-sm">
                {item.descripcion_col && item.descripcion_col.length > 0
                  ? item.descripcion_col
                  : "Sin descripción"}
              </p>
          </div>

          {(item.previousRegistryNumber ||
            item.surdoc ||
            item.localidad ||
            item.deposito ||
            item.estante_o_fullspace) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold">Información adicional</h3>
                {item.previousRegistryNumber && (
                  <DetailItem
                    label="Número de registro anterior"
                    value={item.previousRegistryNumber ? item.previousRegistryNumber : "Sin dato"}
                  />
                )}
                {item.surdoc && <DetailItem label="ID SURDOC" value={item.surdoc ? item.surdoc : "Sin dato de ID de SURDOC"} />}
                {item.localidad && <DetailItem label="Ubicación" value={item.localidad ? item.localidad : "Sin dato de ubicación"} />}
                {item.deposito && <DetailItem label="Depósito" value={item.deposito ? item.deposito : "Sin dato de depósito"} />}
                 {item.estante_o_fullspace && (
                  <DetailItem
                    label="Estante o fullspace"
                    value={item.estante_o_fullspace ? item.estante_o_fullspace : "Sin dato de estante o fullspace"}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de información completa */}
      <Dialog open={showFullInfo} onOpenChange={setShowFullInfo}>
        <DialogContent className="max-w-4xl w-full bg-white p-8 overflow-y-auto" style={{ maxHeight: "90vh" }}>
          <DialogTitle>Información completa de la pieza</DialogTitle>
          <DialogDescription>
            Detalle de todos los campos y componentes asociados a la pieza.
          </DialogDescription>
          {renderFullInfo(item, "Pieza principal")}
          {item.componentes && item.componentes.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-2">Componentes</h3>
              {item.componentes.map((comp: any, idx: number) => (
                <div key={comp.id || comp.letra || idx}>
                  {renderFullInfo(comp, `Componente ${getComponentDisplayLetter(comp.letra, idx)}`)}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-sm font-medium">{label}</p>
    <p>{value}</p>
  </div>
);

export default ItemDetail;
