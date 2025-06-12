import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { CollectionItem } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8002";

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<CollectionItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/piezas/${id}/`)
      .then((res) => {
        if (!res.ok) throw new Error("Pieza no encontrada");
        return res.json();
      })
      .then((p: any) => {
        const imgPath = p.imagenes[0]?.imagen;
        const imageUrl = imgPath
          ? imgPath.startsWith("http")
            ? imgPath
            : `${API_URL}${imgPath}`
          : "";
        setItem({
          id: String(p.id),
          inventoryNumber: p.numero_inventario,
          commonName: p.nombre_especifico || "",
          attributedName: undefined,
          country: p.pais || "",
          locality: p.localidad || "",
          creationDate: p.fecha_creacion || "",
          materials: p.materiales ?? [],
          collectionDescription: p.descripcion || "",
          conservationState: p.estado_conservacion || "",
          location: undefined,
          deposit: undefined,
          shelf: undefined,
          imageUrl,
          thumbnailUrl: imageUrl,
          collection: p.coleccion || "",
          author: p.autor || "",
          exhibitions: p.exposiciones ?? [],
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="p-6">Cargando...</p>;
  }
  if (!item) {
    return (
      <div className="p-6">
        <p>Pieza no encontrada.</p>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Button variant="link" onClick={() => navigate(-1)}>
        ← Volver
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{item.commonName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.commonName}
              className="w-full rounded-lg"
            />
          ) : (
            <div className="w-full h-64 bg-muted flex items-center justify-center">
              Imagen no disponible
            </div>
          )}

          <div className="space-y-2">
            <p>
              <strong>Inventario:</strong> {item.inventoryNumber}
            </p>
            {item.author && (
              <p>
                <strong>Autor:</strong> {item.author}
              </p>
            )}
            <p>
              <strong>Colección:</strong> {item.collection}
            </p>
            <p>
              <strong>País:</strong> {item.country}
            </p>
            <p>
              <strong>Localidad:</strong> {item.locality}
            </p>
            <p>
              <strong>Fecha de creación:</strong> {item.creationDate}
            </p>
            <p>
              <strong>Materialidad:</strong> {item.materials.join(", ")}
            </p>
            <p>
              <strong>Estado de conservación:</strong> {item.conservationState}
            </p>
            {item.collectionDescription && (
              <div>
                <strong>Descripción:</strong>
                <p>{item.collectionDescription}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
