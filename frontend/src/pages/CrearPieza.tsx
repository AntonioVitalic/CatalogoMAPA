import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type ComponentForm = {
  letra: string;
  nombre_comun: string;
  nombre_atribuido: string;
  descripcion: string;
  funcion: string;
  forma: string;
  marcas_inscripciones: string;
  peso_kg: string;
  alto_cm: string;
  ancho_cm: string;
  profundidad_cm: string;
  diametro_cm: string;
  espesor_mm: string;
  estado_conservacion: string;
  materialidad: string;
  tecnica: string;
};

const initialComp: ComponentForm = {
  letra: "", nombre_comun: "", nombre_atribuido: "", descripcion: "",
  funcion: "", forma: "", marcas_inscripciones: "",
  peso_kg: "", alto_cm: "", ancho_cm: "", profundidad_cm: "", diametro_cm: "", espesor_mm: "",
  estado_conservacion: "", materialidad: "", tecnica: ""
};

export default function CrearPieza() {
  const navigate = useNavigate();
  const [pieceData, setPieceData] = useState({
    numero_inventario: "",
    revision: "",
    numero_registro_anterior: "",
    codigo_surdoc: "",
    ubicacion: "",
    deposito: "",
    estante: "",
    caja_actual: "",
    tipologia: "",
    clasificacion: "",
    conjunto: "",
    nombre_comun: "",
    nombre_especifico: "",
    fecha_creacion: "",
    descripcion: "",
    marcas_inscripciones: "",
    contexto_historico: "",
    bibliografia: "",
    iconografia: "",
    notas_investigacion: "",
    avaluo: "",
    procedencia: "",
    donante: "",
    fecha_ingreso: "",
    estado_conservacion: "",
    descripcion_conservacion: "",
    responsable_conservacion: "",
    fecha_actualizacion_conservacion: "",
    comentarios_conservacion: "",
    responsable_coleccion: "",
    autor: "",
    filiacion_cultural: "",
    pais: "",
    localidad: "",
    coleccion: "",
    materialidad: "",
    tecnica: ""
  });
  const [components, setComponents] = useState<ComponentForm[]>([]);
  const [compForm, setCompForm] = useState<ComponentForm>(initialComp);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showCompModal, setShowCompModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Catálogos para autocompletar
  const [authors, setAuthors] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [localidades, setLocalidades] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [tipologias, setTipologias] = useState<string[]>([]);

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [autRes, paisRes, locRes, colRes, tipRes] = await Promise.all([
          api.get("/api/autores/"), api.get("/api/paises/"),
          api.get("/api/localidades/"), api.get("/api/colecciones/"), api.get("/api/tipologias/")
        ]);
        setAuthors(autRes.data.map((a: any) => a.nombre));
        setCountries(paisRes.data.map((p: any) => p.nombre));
        setLocalidades(locRes.data.map((l: any) => l.nombre));
        setCollections(colRes.data.map((c: any) => c.nombre));
        setTipologias(tipRes.data.map((t: any) => t.nombre));
      } catch (err) {
        console.error("Error cargando catálogos:", err);
      }
    };
    const fetchNextNumber = async () => {
      try {
        const res = await api.get("/api/piezas/?page=1&page_size=1");
        const total = res.data.count ?? 0;
        const nextNum = total + 1;
        setPieceData(prev => ({ ...prev, numero_inventario: String(nextNum) }));
      } catch {
        // Si falla, dejar campo vacío para completar manualmente
      }
    };
    fetchCatalogs();
    fetchNextNumber();
  }, []);

  const handleChangePiece = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPieceData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddComponentModal = () => {
    let defaultLetter = "a";
    if (components.length > 0) {
      const lastLetter = components[components.length - 1].letra;
      if (lastLetter) {
        defaultLetter = String.fromCharCode(lastLetter.toLowerCase().charCodeAt(0) + 1);
      }
    }
    setEditIndex(null);
    setCompForm({ ...initialComp, letra: defaultLetter });
    setShowCompModal(true);
  };

  const handleEditComponentModal = (index: number) => {
    setEditIndex(index);
    setCompForm({ ...components[index] });
    setShowCompModal(true);
  };

  const handleRemoveComponent = (index: number) => {
    setComponents(prev => prev.filter((_, i) => i !== index));
  };

  const handleChangeComp = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveComponent = () => {
    if (!compForm.letra.trim()) {
      alert("La letra es obligatoria para el componente.");
      return;
    }
    const compData = { ...compForm, letra: compForm.letra.trim().toLowerCase() };
    if (editIndex !== null) {
      setComponents(prev => prev.map((comp, i) => (i === editIndex ? compData : comp)));
    } else {
      setComponents(prev => [...prev, compData]);
    }
    setShowCompModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(pieceData).forEach(([key, value]) => {
        formData.append(key, value ?? "");
      });
      formData.append("componentes", JSON.stringify(components));
      if (file) {
        formData.append("imagen", file);
      }
      const response = await api.post("/api/piezas/", formData);
      const newPiece = response.data;
      alert("Pieza creada correctamente");
      navigate(`/detail/${newPiece.id}`);
    } catch (err: any) {
      console.error("Error creando pieza:", err);
      const msg = err.response?.data?.detail || err.message;
      alert("No se pudo crear la pieza. " + msg);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Crear nueva pieza</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Número de inventario</label>
            <input
              type="text"
              name="numero_inventario"
              className="w-full input"
              value={pieceData.numero_inventario}
              onChange={handleChangePiece}
              disabled
            />
            <small className="text-gray-600">Este número se asigna automáticamente. (Se toma el siguiente número disponible en la base de datos)</small>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Código SURDOC</label>
            <input
              type="text"
              name="codigo_surdoc"
              className="w-full input"
              value={pieceData.codigo_surdoc}
              onChange={handleChangePiece}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Autor</label>
            <input
              type="text"
              name="autor"
              list="list-autores"
              className="w-full input"
              value={pieceData.autor}
              onChange={handleChangePiece}
            />
            <datalist id="list-autores">
              {authors.map(a => <option key={a} value={a} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">País</label>
            <input
              type="text"
              name="pais"
              list="list-paises"
              className="w-full input"
              value={pieceData.pais}
              onChange={handleChangePiece}
            />
            <datalist id="list-paises">
              {countries.map(p => <option key={p} value={p} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Localidad</label>
            <input
              type="text"
              name="localidad"
              list="list-localidades"
              className="w-full input"
              value={pieceData.localidad}
              onChange={handleChangePiece}
            />
            <datalist id="list-localidades">
              {localidades.map(l => <option key={l} value={l} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Colección</label>
            <input
              type="text"
              name="coleccion"
              list="list-colecciones"
              className="w-full input"
              value={pieceData.coleccion}
              onChange={handleChangePiece}
            />
            <datalist id="list-colecciones">
              {collections.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipología</label>
            <input
              type="text"
              name="tipologia"
              list="list-tipologias"
              className="w-full input"
              value={pieceData.tipologia}
              onChange={handleChangePiece}
            />
            <datalist id="list-tipologias">
              {tipologias.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
          {/* ...otros campos de pieza... */}
        </div>

        <h3 className="text-xl font-semibold mt-6 mb-2">Componentes</h3>
        {components.length > 0 ? (
          <div className="mb-4 space-y-2">
            {components.map((comp, idx) => (
              <div key={idx} className="p-2 bg-gray-50 border rounded flex items-center justify-between">
                <div>
                  <strong>Componente {comp.letra.toUpperCase()}</strong>
                  {comp.nombre_comun && ` – ${comp.nombre_comun}`}
                  {comp.nombre_atribuido && ` (${comp.nombre_atribuido})`}
                </div>
                <div className="space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleEditComponentModal(idx)}>
                    Editar
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveComponent(idx)}>
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-4 text-sm text-muted-foreground">No hay componentes añadidos.</p>
        )}
        <Button type="button" variant="secondary" onClick={handleAddComponentModal}>
          Añadir componente
        </Button>

        <div className="mt-6">
          <label className="block text-sm font-medium mb-1">Imagen (.jpg opcional)</label>
          <input
            type="file"
            accept=".jpg"
            onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
          />
        </div>

        <div className="mt-6 flex items-center gap-4">
          <Button type="submit" variant="default">Guardar pieza</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/")}>Cancelar</Button>
        </div>
      </form>

      <Dialog open={showCompModal} onOpenChange={setShowCompModal}>
        <DialogContent className="max-w-lg w-full">
          <h3 className="text-lg font-semibold mb-4">
            {editIndex !== null ? `Editar componente ${compForm.letra.toUpperCase()}` : "Añadir componente"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Letra *</label>
              <input
                type="text"
                name="letra"
                maxLength={1}
                className="w-full input"
                value={compForm.letra}
                onChange={handleChangeComp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nombre común</label>
              <input
                type="text"
                name="nombre_comun"
                className="w-full input"
                value={compForm.nombre_comun}
                onChange={handleChangeComp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nombre atribuido</label>
              <input
                type="text"
                name="nombre_atribuido"
                className="w-full input"
                value={compForm.nombre_atribuido}
                onChange={handleChangeComp}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea
                name="descripcion"
                rows={2}
                className="w-full textarea"
                value={compForm.descripcion}
                onChange={handleChangeComp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Función</label>
              <input
                type="text"
                name="funcion"
                className="w-full input"
                value={compForm.funcion}
                onChange={handleChangeComp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Forma</label>
              <input
                type="text"
                name="forma"
                className="w-full input"
                value={compForm.forma}
                onChange={handleChangeComp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Peso (kg)</label>
              <input
                type="number"
                step="any"
                name="peso_kg"
                className="w-full input"
                value={compForm.peso_kg}
                onChange={handleChangeComp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Alto (cm)</label>
              <input
                type="number"
                step="any"
                name="alto_cm"
                className="w-full input"
                value={compForm.alto_cm}
                onChange={handleChangeComp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ancho (cm)</label>
              <input
                type="number"
                step="any"
                name="ancho_cm"
                className="w-full input"
                value={compForm.ancho_cm}
                onChange={handleChangeComp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Profundidad (cm)</label>
              <input
                type="number"
                step="any"
                name="profundidad_cm"
                className="w-full input"
                value={compForm.profundidad_cm}
                onChange={handleChangeComp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Diámetro (cm)</label>
              <input
                type="number"
                step="any"
                name="diametro_cm"
                className="w-full input"
                value={compForm.diametro_cm}
                onChange={handleChangeComp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Espesor (mm)</label>
              <input
                type="number"
                step="any"
                name="espesor_mm"
                className="w-full input"
                value={compForm.espesor_mm}
                onChange={handleChangeComp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado de conservación</label>
              <input
                type="text"
                name="estado_conservacion"
                className="w-full input"
                value={compForm.estado_conservacion}
                onChange={handleChangeComp}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Materialidad</label>
              <input
                type="text"
                name="materialidad"
                className="w-full input"
                value={compForm.materialidad}
                onChange={handleChangeComp}
              />
              <small className="text-gray-500">* Separe múltiples materiales con coma</small>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Técnica</label>
              <input
                type="text"
                name="tecnica"
                className="w-full input"
                value={compForm.tecnica}
                onChange={handleChangeComp}
              />
              <small className="text-gray-500">* Separe múltiples técnicas con coma</small>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="default" onClick={handleSaveComponent}>
              Guardar
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowCompModal(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}