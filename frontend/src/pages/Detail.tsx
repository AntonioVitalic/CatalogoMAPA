import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CollectionItem } from "@/types";
import Header from "@/components/Header";
import ItemDetail from "@/components/ItemDetail";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8002";

const Detail = () => {
  const { id } = useParams<{ id: string }>();
  console.log("Detail cargado, id =", id);
  const [item, setItem] = useState<CollectionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    setLoading(true);
    const fetchPieza = async () => {
      try {
        const res = await fetch(`${API_URL}/api/piezas/${id}/`);
        if (!res.ok) {
          throw new Error("Failed to fetch pieza");
        }
        const data = await res.json();
        console.log("API response for pieza", data);
        // Map the API data to CollectionItem structure, substituting "Sin dato" for null/empty fields
        const mappedItem: CollectionItem = {
          id: data.id ? String(data.id) : "",
          inventoryNumber: data.numero_inventario || "Sin dato",
          previousRegistryNumber: data.numero_registro_anterior && data.numero_registro_anterior.trim() !== "" ? data.numero_registro_anterior : "Sin dato",
          surdoc: data.codigo_surdoc && data.codigo_surdoc.trim() !== "" ? data.codigo_surdoc : "Sin dato",
          commonName: data.nombre_comun && data.nombre_comun.trim() !== "" ? data.nombre_comun : "Sin dato",
          attributedName: data.nombre_especifico && data.nombre_especifico.trim() !== "" ? data.nombre_especifico : "",
          country: data.pais || "Sin dato",
          locality: data.localidad || "Sin dato",
          creationDate: data.fecha_creacion && data.fecha_creacion.trim() !== "" ? data.fecha_creacion : "Sin dato",
          materials: (data.materiales && Array.isArray(data.materiales) && data.materiales.length > 0) ? data.materiales : ["Sin dato"],
          collectionDescription: data.descripcion_col && data.descripcion_col.trim() !== "" ? data.descripcion_col : "Sin dato",
          conservationState: data.estado_conservacion && data.estado_conservacion.trim() !== "" ? data.estado_conservacion : "Sin dato",
          location: data.ubicacion && data.ubicacion.trim() !== "" ? data.ubicacion : "Sin dato",
          deposit: data.deposito && data.deposito.trim() !== "" ? data.deposito : "Sin dato",
          shelf: data.estante && data.estante.trim() !== "" ? data.estante : "Sin dato",
          collection: data.coleccion || "Sin dato",
          author: data.autor || "Sin dato",
          exhibitions: data.exposiciones && Array.isArray(data.exposiciones) ? data.exposiciones : [],
          auditInfo: undefined,
          imageUrl: "",
          thumbnailUrl: ""
        };
        // If there's at least one image, build its URL
        if (data.imagenes && Array.isArray(data.imagenes) && data.imagenes.length > 0) {
          const imgObj = data.imagenes[0];
          if (imgObj && imgObj.imagen) {
            // Prepend API_URL if the image path is not absolute
            mappedItem.imageUrl = imgObj.imagen.startsWith("http") ? imgObj.imagen : `${API_URL}${imgObj.imagen}`;
            mappedItem.thumbnailUrl = mappedItem.imageUrl;
          }
        }
        // If commonName is missing but attributedName exists, use attributedName as commonName
        if (mappedItem.commonName === "Sin dato" && mappedItem.attributedName) {
          mappedItem.commonName = mappedItem.attributedName;
          mappedItem.attributedName = "";
        }
        setItem(mappedItem);
      } catch (error) {
        console.error("Error fetching pieza:", error);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPieza();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onLoginClick={() => setShowLogin(true)} />
        <div className="flex-1 flex items-center justify-center">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onLoginClick={() => setShowLogin(true)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Pieza no encontrada</h2>
            <p className="text-muted-foreground">
              La pieza que estás buscando no existe o ha sido eliminada.
            </p>
            <Button className="mt-4" asChild>
              <a href="/">Volver al catálogo</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={() => setShowLogin(true)} />
      <div className="flex-1">
        <ItemDetail item={item} />
      </div>

      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-4">Iniciar sesión</h2>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="admin@mapa.cl o editor@mapa.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Cualquier texto (demo)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full">Iniciar sesión</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Detail;
