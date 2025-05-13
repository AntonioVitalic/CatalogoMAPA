
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CollectionItem } from "@/types";
import { mockItems } from "@/data/mockData";
import Header from "@/components/Header";
import ItemDetail from "@/components/ItemDetail";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const Detail = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<CollectionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      const foundItem = mockItems.find((item) => item.id === id);
      setItem(foundItem || null);
      setLoading(false);
    }, 500);
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
