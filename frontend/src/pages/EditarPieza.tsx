import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";

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
  fecha_ultima_modificacion: string;
};

const initialComp: ComponentForm = {
  letra: "", nombre_comun: "", nombre_atribuido: "", descripcion: "",
  funcion: "", forma: "", marcas_inscripciones: "",
  peso_kg: "", alto_cm: "", ancho_cm: "", profundidad_cm: "", diametro_cm: "", espesor_mm: "",
  estado_conservacion: "", materialidad: "", tecnica: "", fecha_ultima_modificacion: ""
};

export default function EditarPieza() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

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
    tecnica: "",
    fecha_ultima_modificacion: ""
  });
  const [components, setComponents] = useState<ComponentForm[]>([]);
  const [compForm, setCompForm] = useState<ComponentForm>(initialComp);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showCompModal, setShowCompModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);

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

    const fetchPieza = async () => {
      try {
        const res = await api.get(`/api/piezas/${id}/`);
        const p = res.data;
        setPieceData({
          numero_inventario: p.numero_inventario || "",
          revision: p.revision || "",
          numero_registro_anterior: p.numero_registro_anterior || "",
          codigo_surdoc: p.codigo_surdoc || "",
          ubicacion: p.ubicacion || "",
          deposito: p.deposito || "",
          estante: p.estante || "",
          caja_actual: p.caja_actual || "",
          tipologia: p.tipologia || "",
          clasificacion: p.clasificacion || "",
          conjunto: p.conjunto || "",
          nombre_comun: p.nombre_comun || "",
          nombre_especifico: p.nombre_especifico || "",
          fecha_creacion: p.fecha_creacion || "",
          descripcion: p.descripcion_col || p.descripcion || "",
          marcas_inscripciones: p.marcas_inscripciones || "",
          contexto_historico: p.contexto_historico || "",
          bibliografia: p.bibliografia || "",
          iconografia: p.iconografia || "",
          notas_investigacion: p.notas_investigacion || "",
          avaluo: p.avaluo || "",
          procedencia: p.procedencia || "",
          donante: p.donante || "",
          fecha_ingreso: p.fecha_ingreso || "",
          estado_conservacion: p.estado_conservacion || "",
          descripcion_conservacion: p.descripcion_conservacion || "",
          responsable_conservacion: p.responsable_conservacion || "",
          fecha_actualizacion_conservacion: p.fecha_actualizacion_conservacion || "",
          comentarios_conservacion: p.comentarios_conservacion || "",
          responsable_coleccion: p.responsable_coleccion || "",
          autor: p.autor || "",
          filiacion_cultural: p.filiacion_cultural || "",
          pais: p.pais || "",
          localidad: p.localidad || "",
          coleccion: p.coleccion || "",
          materialidad: Array.isArray(p.materiales) ? p.materiales.join(", ") : "",
          tecnica: Array.isArray(p.tecnica) ? p.tecnica.join(", ") : "",
          fecha_ultima_modificacion: p.fecha_ultima_modificacion || ""
        });
        if (p.componentes && Array.isArray(p.componentes)) {
          const compList: ComponentForm[] = p.componentes.map((c: any) => ({
            letra: c.letra || "",
            nombre_comun: c.nombre_comun || "",
            nombre_atribuido: c.nombre_atribuido || "",
            descripcion: c.descripcion || "",
            funcion: c.funcion || "",
            forma: c.forma || "",
            marcas_inscripciones: c.marcas_inscripciones || "",
            peso_kg: c.peso_kg?.toString() || "",
            alto_cm: c.alto_cm?.toString() || "",
            ancho_cm: c.ancho_cm?.toString() || "",
            profundidad_cm: c.profundidad_cm?.toString() || "",
            diametro_cm: c.diametro_cm?.toString() || "",
            espesor_mm: c.espesor_mm?.toString() || "",
            estado_conservacion: c.estado_conservacion || "",
            materialidad: Array.isArray(c.materiales) ? c.materiales.join(", ") : "",
            tecnica: Array.isArray(c.tecnica) ? c.tecnica.join(", ") : ""
          }));
          setComponents(compList);
        }
      } catch (err) {
        console.error("Error cargando pieza:", err);
        alert("No se pudo cargar los datos de la pieza.");
        navigate("/");
      }
    };

    fetchCatalogs();
    fetchPieza();
  }, [id, navigate]);

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
      await api.put(`/api/piezas/${id}/`, formData);
      alert("Pieza editada correctamente");
      navigate(`/detail/${id}`);
    } catch (err: any) {
      console.error("Error editando pieza:", err);
      const msg = err.response?.data?.detail || err.message;
      alert("No se pudo guardar los cambios. " + msg);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-muted/40 py-8">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6">
        <div className="relative flex items-center gap-4 mb-6">
          {/* Left: Volver */}
          <div>
            <Button variant="default" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2" />
              Volver
            </Button>
          </div>

          {/* Centered title */}
          <h2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold m-0">
            Editar pieza #{id}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Número de inventario</label>
              <input
                type="text"
                name="numero_inventario"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.numero_inventario}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Código SURDOC</label>
              <input
                type="text"
                name="codigo_surdoc"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.codigo_surdoc}
                onChange={handleChangePiece}
              />
            </div>

            {/* Resto de campos: usar el mismo estilo que CrearPieza */}
            <div>
              <label className="block text-sm font-medium mb-1">Autor</label>
              <input
                type="text"
                name="autor"
                list="list-autores"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.tipologia}
                onChange={handleChangePiece}
              />
              <datalist id="list-tipologias">
                {tipologias.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ubicación</label>
              <input
                type="text"
                name="ubicacion"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.ubicacion}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Depósito</label>
              <input
                type="text"
                name="deposito"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.deposito}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estante</label>
              <input
                type="text"
                name="estante"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.estante}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Caja actual</label>
              <input
                type="text"
                name="caja_actual"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.caja_actual}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Clasificación</label>
              <input
                type="text"
                name="clasificacion"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.clasificacion}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Conjunto</label>
              <input
                type="text"
                name="conjunto"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.conjunto}
                onChange={handleChangePiece}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Descripción catálogo</label>
              <textarea
                name="descripcion"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.descripcion}
                onChange={handleChangePiece}
              />
            </div>

            {/* Resto de campos (marcas, contexto, bibliografía, etc.) */}
            <div>
              <label className="block text-sm font-medium mb-1">Marcas o inscripciones</label>
              <input
                type="text"
                name="marcas_inscripciones"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.marcas_inscripciones}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contexto histórico</label>
              <input
                type="text"
                name="contexto_historico"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.contexto_historico}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bibliografía</label>
              <input
                type="text"
                name="bibliografia"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.bibliografia}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Iconografía</label>
              <input
                type="text"
                name="iconografia"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.iconografia}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notas de investigación</label>
              <input
                type="text"
                name="notas_investigacion"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.notas_investigacion}
                onChange={handleChangePiece}
              />
            </div>

            {/* Campos de conservación y demás */}
            <div>
              <label className="block text-sm font-medium mb-1">Estado de conservación</label>
              <input
                type="text"
                name="estado_conservacion"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.estado_conservacion}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción conservación</label>
              <input
                type="text"
                name="descripcion_conservacion"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.descripcion_conservacion}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Responsable conservación</label>
              <input
                type="text"
                name="responsable_conservacion"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.responsable_conservacion}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fecha actualización conservación</label>
              <input
                type="text"
                name="fecha_actualizacion_conservacion"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.fecha_actualizacion_conservacion}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Comentarios conservación</label>
              <input
                type="text"
                name="comentarios_conservacion"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.comentarios_conservacion}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Avaluo</label>
              <input
                type="text"
                name="avaluo"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.avaluo}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Procedencia</label>
              <input
                type="text"
                name="procedencia"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.procedencia}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Donante</label>
              <input
                type="text"
                name="donante"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.donante}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fecha ingreso</label>
              <input
                type="text"
                name="fecha_ingreso"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.fecha_ingreso}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Responsable colección</label>
              <input
                type="text"
                name="responsable_coleccion"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.responsable_coleccion}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Filiación cultural</label>
              <input
                type="text"
                name="filiacion_cultural"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.filiacion_cultural}
                onChange={handleChangePiece}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fecha última modificación</label>
              <input
                type="text"
                name="fecha_ultima_modificacion"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.fecha_ultima_modificacion}
                disabled
              />
            </div>
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
            <p className="mb-4 text-sm text-muted-foreground">Esta pieza no tiene componentes.</p>
          )}
          <Button type="button" variant="secondary" onClick={handleAddComponentModal}>
            Añadir componente
          </Button>

          <div className="mt-6">
            <label className="block text-sm font-medium mb-1">Nueva imagen (opcional, .jpg)</label>
            <input
              type="file"
              accept=".jpg"
              onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
            />
            <small className="text-gray-600">Sube un archivo solo si deseas reemplazar la imagen actual.</small>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <Button type="submit" variant="default">Guardar cambios</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
          </div>
        </form>

        <Dialog open={showCompModal} onOpenChange={setShowCompModal}>
          <DialogContent className="max-w-3xl w-full bg-white p-8 overflow-y-auto" style={{ maxHeight: "90vh" }}>
            <h3 className="text-lg font-semibold mb-6">
              {editIndex !== null ? `Editar componente ${compForm.letra.toUpperCase()}` : "Añadir componente"}
            </h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSaveComponent();
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Letra *</label>
                  <input
                    type="text"
                    name="letra"
                    maxLength={1}
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={compForm.letra}
                    onChange={handleChangeComp}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre común</label>
                  <input
                    type="text"
                    name="nombre_comun"
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={compForm.nombre_comun}
                    onChange={handleChangeComp}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre atribuido</label>
                  <input
                    type="text"
                    name="nombre_atribuido"
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={compForm.nombre_atribuido}
                    onChange={handleChangeComp}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <textarea
                    name="descripcion"
                    rows={2}
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={compForm.descripcion}
                    onChange={handleChangeComp}
                  />
                </div>

                {/* Resto campos del modal con el mismo estilo */}
                <div>
                  <label className="block text-sm font-medium mb-2">Función</label>
                  <input type="text" name="funcion" className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" value={compForm.funcion} onChange={handleChangeComp}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Forma</label>
                  <input type="text" name="forma" className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" value={compForm.forma} onChange={handleChangeComp}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Peso (kg)</label>
                  <input type="number" step="any" name="peso_kg" className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" value={compForm.peso_kg} onChange={handleChangeComp}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Alto (cm)</label>
                  <input type="number" step="any" name="alto_cm" className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" value={compForm.alto_cm} onChange={handleChangeComp}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ancho (cm)</label>
                  <input type="number" step="any" name="ancho_cm" className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" value={compForm.ancho_cm} onChange={handleChangeComp}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Profundidad (cm)</label>
                  <input type="number" step="any" name="profundidad_cm" className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" value={compForm.profundidad_cm} onChange={handleChangeComp}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Diámetro (cm)</label>
                  <input type="number" step="any" name="diametro_cm" className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" value={compForm.diametro_cm} onChange={handleChangeComp}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Espesor (mm)</label>
                  <input type="number" step="any" name="espesor_mm" className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" value={compForm.espesor_mm} onChange={handleChangeComp}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Estado de conservación</label>
                  <input type="text" name="estado_conservacion" className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" value={compForm.estado_conservacion} onChange={handleChangeComp}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Materialidad</label>
                  <input type="text" name="materialidad" className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" value={compForm.materialidad} onChange={handleChangeComp}/>
                  <small className="text-gray-500">* Separe múltiples materiales con coma</small>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Técnica</label>
                  <input type="text" name="tecnica" className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" value={compForm.tecnica} onChange={handleChangeComp}/>
                  <small className="text-gray-500">* Separe múltiples técnicas con coma</small>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="default" onClick={handleSaveComponent}>
                  Guardar
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCompModal(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}