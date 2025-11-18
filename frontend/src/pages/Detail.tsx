import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { CollectionItem } from "@/types";
import Header from "@/components/Header";
import ItemDetail from "@/components/ItemDetail";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getComponentDisplayLetter } from "@/utils/componentLabel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8002";

const FIELD_LABELS: Record<string, string> = {
  pieza_numero_inventario: "N° de inventario",
  letra: "Letra",
  unidad_relacionada: "Unidad relacionada",
  numero_registro_anterior: "N° de registro anterior",
  codigo_surdoc: "SURDOC",
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
};

const formatComponentValue = (key: string, value: unknown) => {
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

  return String(value);
};


const Detail = () => {
  const { id } = useParams<{ id: string }>();
  console.log("Detail cargado, id =", id);
  const [item, setItem] = useState<CollectionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const fromState = (location.state as { from?: string } | null)?.from;
  const [expandedComps, setExpandedComps] = useState<{ [idx: number]: boolean }>({});

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
        // Mapear los datos de la API a la estructura CollectionItem, sustituyendo "Sin dato" por campos nulos/vacíos
        const mappedItem: CollectionItem = {
          id: data.id ? String(data.id) : "",
          inventoryNumber: data.numero_inventario || "Sin dato",
          letra: data.letra || "",
          unidad_relacionada: data.unidad_relacionada || "",
          previousRegistryNumber: data.numero_registro_anterior || "",
          surdoc: data.codigo_surdoc || "",
          ubicacion: data.ubicacion || "",
          deposito: data.deposito || "",
          estante_o_fullspace: data.estante_o_fullspace || "",
          cajas_o_nivel: data.cajas_o_nivel || "",
          tipologia: data.tipologia || "",
          coleccion: data.coleccion || "",
          clasificacion: data.clasificacion || "",
          conjunto: data.conjunto || "",
          nombre_comun: data.nombre_comun || "",
          nombre_especifico: data.nombre_especifico || "",
          autor: data.autor || "",
          filiacion_cultural: data.filiacion_cultural || "",
          pais: data.pais || "",
          localidad: data.localidad || "",
          fecha_creacion: data.fecha_creacion || "",
          descripcion_col: data.descripcion_col || "",
          marcas_inscripciones: data.marcas_inscripciones || "",
          tecnica: data.tecnica || [],
          materialidad: data.materialidad || "",
          descripcion_cr: data.descripcion_cr || "",
          alto_cm: data.alto_cm ?? null,
          ancho_cm: data.ancho_cm ?? null,
          profundidad_cm: data.profundidad_cm ?? null,
          diametro_cm: data.diametro_cm ?? null,
          espesor_mm: data.espesor_mm ?? null,
          peso_gr: data.peso_gr ?? null,
          funcion: data.funcion || "",
          contexto_historico: data.contexto_historico || "",
          bibliografia: data.bibliografia || "",
          iconografia: data.iconografia || "",
          notas_investigacion: data.notas_investigacion || "",
          estado_conservacion: data.estado_conservacion || "",
          responsable_conservacion: data.responsable_conservacion || "",
          fecha_actualizacion_conservacion: data.fecha_actualizacion_conservacion || "",
          comentarios_conservacion: data.comentarios_conservacion || "",
          exposiciones: data.exposiciones || "",
          avaluo: data.avaluo || "",
          procedencia: data.procedencia || "",
          donante: data.donante || "",
          fecha_ingreso: data.fecha_ingreso || "",
          responsable_coleccion: data.responsable_coleccion || "",
          fecha_ultima_modificacion: data.fecha_ultima_modificacion || "",
          componentes: Array.isArray(data.componentes)
            ? data.componentes.map((component: any) => ({
                ...component,
                imagenes: Array.isArray(component.imagenes)
                  ? component.imagenes.map((img: any) => ({
                      ...img,
                      imagen: img.imagen.startsWith("http")
                        ? img.imagen
                        : `${API_URL}${img.imagen}`,
                    }))
                  : [],
              }))
            : [],
          imagenes: Array.isArray(data.imagenes)
            ? data.imagenes.map((img: any) => ({
                ...img,
                imagen: img.imagen.startsWith("http") ? img.imagen : `${API_URL}${img.imagen}`,
              }))
            : [],
        };
        
        // If nombre_comun is missing but nombre_especifico exists, use nombre_especifico as nombre_comun
        if (mappedItem.nombre_comun === "Sin dato" && mappedItem.nombre_especifico) {
          mappedItem.nombre_comun = mappedItem.nombre_especifico;
          mappedItem.nombre_especifico = "";
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
            <Button
              className="mt-4"
              onClick={() => {
                if (fromState) {
                  navigate(fromState);
                  return;
                }
                const params = new URLSearchParams(location.search);
                const queryString = params.toString();
                if (queryString) {
                  navigate(`/home?${queryString}`);
                } else {
                  navigate("/home?page=1");
                }
              }}
            >
              Volver al inventario
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
        {item.componentes && item.componentes.length > 0 && (
          <div className="mt-8 ml-12">
            <h2 className="text-xl font-bold mb-4">Componentes</h2>
            {item.componentes.map((comp, idx) => (
              <div key={idx} className="mb-6 border rounded-lg p-6 bg-muted/10 ml-8">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  Componente {getComponentDisplayLetter(comp.letra, idx)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setExpandedComps((prev) => ({
                        ...prev,
                        [idx]: !prev[idx],
                      }))
                    }
                  >
                    {expandedComps[idx] ? "Ocultar información" : "Mostrar información"}
                  </Button>
                </h3>
                {expandedComps[idx] && (
                  <table className="w-full text-sm border bg-white rounded shadow">
                    <tbody>
                      {Object.entries(comp).map(([key, value]) => (
                        key !== "imagenes" && (
                          <tr key={key}>
                            <td className="font-medium pr-4 py-2 align-top text-right w-1/3 text-muted-foreground">
                              {FIELD_LABELS[key] || key}
                            </td>
                            <td className="pl-4 py-2 align-top">{formatComponentValue(key, value)}</td>
                          </tr>
                        )
                      ))}
                      {comp.imagenes && comp.imagenes.length > 0 && (
                        <tr>
                          <td className="font-medium pr-4 py-2 align-top text-right text-muted-foreground">Imágenes</td>
                          <td className="pl-4 py-2 align-top">
                              <div className="flex flex-wrap gap-3">
                              {comp.imagenes.map((img: any, i: number) => (
                                <div key={i} className="inline-flex flex-col items-start">
                                  <img
                                    src={img.imagen}
                                    alt={img.descripcion || ""}
                                    className="inline-block h-16 w-16 object-cover rounded border"
                                  />
                                  <span className="mt-1 text-[10px] font-medium text-muted-foreground">
                                    Imagen {String(i).padStart(2, "0")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
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
