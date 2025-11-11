import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { getComponentDisplayLetter } from "@/utils/componentLabel";
import { ComponentImageForm, prepareComponentPayload } from "@/utils/componentImages";

type ComponentForm = {
  id?: string;
  pieza_numero_inventario?: string;
  letra: string;
  unidad_relacionada?: string;
  numero_registro_anterior?: string;
  codigo_surdoc?: string;
  ubicacion?: string;
  deposito?: string;
  estante_o_fullspace?: string;
  cajas_o_nivel?: string;
  tipologia?: string;
  coleccion?: string;
  clasificacion?: string;
  conjunto?: string;
  nombre_comun?: string;
  nombre_especifico?: string;
  autor?: string;
  filiacion_cultural?: string;
  pais?: string;
  localidad?: string;
  fecha_creacion?: string;
  descripcion_col?: string;
  marcas_inscripciones?: string;
  tecnica?: string;
  materialidad?: string;
  descripcion_cr?: string;
  alto_cm?: string;
  ancho_cm?: string;
  profundidad_cm?: string;
  diametro_cm?: string;
  espesor_mm?: string;
  peso_gr?: string;
  funcion?: string;
  contexto_historico?: string;
  bibliografia?: string;
  iconografia?: string;
  notas_investigacion?: string;
  estado_conservacion?: string;
  responsable_conservacion?: string;
  fecha_actualizacion_conservacion?: string;
  comentarios_conservacion?: string;
  exposiciones?: string;
  avaluo?: string;
  procedencia?: string;
  donante?: string;
  fecha_ingreso?: string;
  responsable_coleccion?: string;
  fecha_ultima_modificacion?: string;
  imagenes?: ComponentImageForm[];
};

const initialComp: ComponentForm = {
  letra: "",
  unidad_relacionada: "",
  numero_registro_anterior: "",
  codigo_surdoc: "",
  ubicacion: "",
  deposito: "",
  estante_o_fullspace: "",
  cajas_o_nivel: "",
  tipologia: "",
  coleccion: "",
  clasificacion: "",
  conjunto: "",
  nombre_comun: "",
  nombre_especifico: "",
  autor: "",
  filiacion_cultural: "",
  pais: "",
  localidad: "",
  fecha_creacion: "",
  descripcion_col: "",
  marcas_inscripciones: "",
  tecnica: "",
  materialidad: "",
  descripcion_cr: "",
  alto_cm: "",
  ancho_cm: "",
  profundidad_cm: "",
  diametro_cm: "",
  espesor_mm: "",
  peso_gr: "",
  funcion: "",
  contexto_historico: "",
  bibliografia: "",
  iconografia: "",
  notas_investigacion: "",
  estado_conservacion: "",
  responsable_conservacion: "",
  fecha_actualizacion_conservacion: "",
  comentarios_conservacion: "",
  exposiciones: "",
  avaluo: "",
  procedencia: "",
  donante: "",
  fecha_ingreso: "",
  responsable_coleccion: "",
  fecha_ultima_modificacion: "",
  imagenes: []
};

export default function CrearPieza() {
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  const [pieceData, setPieceData] = useState({
    numero_inventario: "",
    unidad_relacionada: "",
    numero_registro_anterior: "",
    codigo_surdoc: "",
    ubicacion: "",
    deposito: "",
    estante_o_fullspace: "",
    cajas_o_nivel: "",
    tipologia: "",
    clasificacion: "",
    conjunto: "",
    nombre_comun: "",
    nombre_especifico: "",
    fecha_creacion: "",
    descripcion: "",
    alto_cm: "",
    ancho_cm: "",
    profundidad_cm: "",
    diametro_cm: "",
    espesor_mm: "",
    peso_gr: "",
    funcion: "",
    marcas_inscripciones: "",
    contexto_historico: "",
    bibliografia: "",
    iconografia: "",
    notas_investigacion: "",
    exposiciones: "",
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Catálogos para autocompletar
  const [authors, setAuthors] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [localidades, setLocalidades] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [ubicaciones, setUbicaciones] = useState<string[]>([]);
  const [tipologias, setTipologias] = useState<string[]>([]);
  const [exposiciones, setExposiciones] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const revokeImagePreviews = (images?: ComponentImageForm[]) => {
    images?.forEach(img => {
      if (img?.file && typeof img.imagen === "string" && img.imagen.startsWith("blob:")) {
        URL.revokeObjectURL(img.imagen);
      }
    });
  };

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [autRes, paisRes, locRes, colRes, ubiRes, tipRes, expRes] = await Promise.all([
          api.get("/api/autores/"),
          api.get("/api/paises/"),
          api.get("/api/localidades/"),
          api.get("/api/colecciones/"),
          api.get("/api/ubicacion/"),
          api.get("/api/tipologias/"),
          api.get("/api/exposiciones/")
        ]);
        setAuthors(autRes.data.map((a: any) => a.nombre));
        setCountries(paisRes.data.map((p: any) => p.nombre));
        setLocalidades(locRes.data.map((l: any) => l.nombre));
        setCollections(colRes.data.map((c: any) => c.nombre));
        setUbicaciones(ubiRes.data.map((u: any) => u.nombre));
        setTipologias(tipRes.data.map((t: any) => t.nombre));
        setExposiciones(expRes.data.map((e: any) => e.nombre));
      } catch (err) {
        console.error("Error cargando inventarios:", err);
      }
    };
    const fetchNextNumber = async () => {
      try {
        const res = await api.get("/api/piezas/next-numero/");
        if (res.data?.next) {
          setPieceData(prev => ({ ...prev, numero_inventario: String(res.data.next) }));
        }
      } catch (err) {
        console.error("Error obteniendo next-numero:", err);
        // Dejar el campo editable en caso de error
      }
    };
    fetchCatalogs();
    fetchNextNumber();
  }, []);

  const handleChangePiece = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPieceData(prev => ({ ...prev, [name]: value }));
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0] ?? null;
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setFile(nextFile);
    setImagePreview(nextFile ? URL.createObjectURL(nextFile) : null);
  };

  const handleAddComponentModal = () => {
    let defaultLetter = "b";
    if (components.length > 0) {
      const lastLetter = components[components.length - 1].letra;
      if (lastLetter) {
        defaultLetter = String.fromCharCode(lastLetter.toLowerCase().charCodeAt(0) + 1);
      }
    }
    setEditIndex(null);
    setCompForm({ ...initialComp, letra: defaultLetter, imagenes: [] });
    setShowCompModal(true);
  };

  const handleEditComponentModal = (index: number) => {
    setEditIndex(index);
    const target = components[index];
    setCompForm({
      ...target,
      imagenes: target.imagenes ? target.imagenes.map(img => ({ ...img })) : [],
    });
    setShowCompModal(true);
  };

  const handleRemoveComponent = (index: number) => {
    const target = components[index];
    revokeImagePreviews(target?.imagenes);
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
      const preparedComponents = prepareComponentPayload(components);
      formData.append("componentes", JSON.stringify(preparedComponents.payload));
      if (file) {
        formData.append("imagen", file);
      }
      preparedComponents.files.forEach(({ field, file: compFile }) => {
        formData.append(field, compFile);
      });
      const response = await api.post("/api/piezas/", formData);
      const newPiece = response.data;
      alert("Pieza creada correctamente");
      navigate(`/detail/${newPiece.numero_inventario}`);
    } catch (err: any) {
      console.error("Error creando pieza:", err);
      const msg = err.response?.data?.detail || err.message;
      alert("No se pudo crear la pieza. " + msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={() => setShowLogin(true)} />
      <div className="flex justify-center items-start bg-muted/40 py-8">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6">
          <div className="relative flex items-center gap-4 mb-6">
            <div>
              <Button variant="default" onClick={() => navigate("/")}>
                <ArrowLeft className="mr-2" />
                Volver
              </Button>
            </div>
            <h2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold m-0">
              Crear nueva pieza
            </h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Número de inventario */}
              <div>
                <label className="block text-sm font-medium mb-1">Número de inventario</label>
                <input
                  type="text"
                  name="numero_inventario"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.numero_inventario}
                  onChange={handleChangePiece}
                  disabled
                />
                <small className="text-gray-600">Se asigna automáticamente (máx + 1).</small>
              </div>
              {/* Letra
              <div>
                <label className="block text-sm font-medium mb-1">Letra</label>
                <input
                  type="text"
                  name="letra"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.letra}
                  onChange={handleChangePiece}
                  disabled
                />
              </div> */}
              {/* Unidad relacionada */}
              <div>
                <label className="block text-sm font-medium mb-1">Unidad relacionada</label>
                <input
                  type="text"
                  name="unidad_relacionada"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.unidad_relacionada}
                  onChange={handleChangePiece}
                />
              </div>
              {/* Nombre común */}
              <div>
                <label className="block text-sm font-medium mb-1">Nombre común</label>
                <input
                  type="text"
                  name="nombre_comun"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.nombre_comun}
                  onChange={handleChangePiece}
                />
              </div>
              {/* Nombre atribuido */}
              <div>
                <label className="block text-sm font-medium mb-1">Nombre atribuido</label>
                <input
                  type="text"
                  name="nombre_especifico"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.nombre_especifico}
                  onChange={handleChangePiece}
                />
              </div>
              {/* Número de registro anterior */}
              <div>
                <label className="block text-sm font-medium mb-1">N° de registro anterior</label>
                <input
                  type="text"
                  name="numero_registro_anterior"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.numero_registro_anterior}
                  onChange={handleChangePiece}
                />
              </div>
              {/* SURDOC */}
              <div>
                <label className="block text-sm font-medium mb-1">SURDOC</label>
                <input
                  type="text"
                  name="codigo_surdoc"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.codigo_surdoc}
                  onChange={handleChangePiece}
                />
              </div>
              {/* Ubicación */}
              <div>
                <label className="block text-sm font-medium mb-1">Ubicación</label>
                <input
                  type="text"
                  name="ubicacion"
                  list="list-ubicaciones"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.ubicacion}
                  onChange={handleChangePiece}
                />
               <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
                <datalist id="list-ubicaciones">
                  {ubicaciones.map(u => <option key={u} value={u} />)}
                </datalist>
              </div>
              {/* Depósito */}
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
              {/* Estante o fullspace */}
              <div>
                <label className="block text-sm font-medium mb-1">Estante o fullspace</label>
                <input
                  type="text"
                  name="estante_o_fullspace"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.estante_o_fullspace}
                  onChange={handleChangePiece}
                />
              </div>
              {/* Cajas o nivel */}
              <div>
                <label className="block text-sm font-medium mb-1">Cajas o nivel</label>
                <input
                  type="text"
                  name="cajas_o_nivel"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.cajas_o_nivel}
                  onChange={handleChangePiece}
                />
              </div>
              {/* Tipología */}
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
                <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
                <datalist id="list-tipologias">
                  {tipologias.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
              {/* Colección */}
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
                <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
                <datalist id="list-colecciones">
                  {collections.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              {/* Clasificación */}
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
              {/* Conjunto */}
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
              {/* Autor */}
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
                <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
                <datalist id="list-autores">
                  {authors.map(a => <option key={a} value={a} />)}
                </datalist>
              </div>
              {/* Filiación cultural */}
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
              {/* País */}
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
                <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
                <datalist id="list-paises">
                  {countries.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>
              {/* Localidad */}
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
                <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
                <datalist id="list-localidades">
                  {localidades.map(l => <option key={l} value={l} />)}
                </datalist>
              </div>
              {/* Fecha de creación */}
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de creación</label>
                <input
                  type="text"
                  name="fecha_creacion"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.fecha_creacion}
                  onChange={handleChangePiece}
                />
              </div>
              {/* Descripción colección */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Descripción colección</label>
                <textarea
                  name="descripcion"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.descripcion}
                  onChange={handleChangePiece}
                />
              </div>
              {/* Marcas o inscripciones */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Marcas o inscripciones</label>
                <textarea
                  name="marcas_inscripciones"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                  value={pieceData.marcas_inscripciones}
                  onChange={handleChangePiece}
                />
              </div>
              {/* Técnica */}
              <div>
                <label className="block text-sm font-medium mb-1">Técnica</label>
                <input
                  type="text"
                  name="tecnica"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.tecnica}
                  onChange={handleChangePiece}
                />
                <small className="text-gray-500">* Separe múltiples técnicas con coma</small>
              </div>
              {/* Materialidad */}
              <div>
                <label className="block text-sm font-medium mb-1">Materialidad</label>
                <input
                  type="text"
                  name="materialidad"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.materialidad}
                  onChange={handleChangePiece}
                />
                <small className="text-gray-500">* Separe múltiples materiales con coma</small>
              </div>
              {/* Descripción conservación */}
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
              {/* Alto (cm) */}
              <div>
                <label className="block text-sm font-medium mb-1">Alto (cm)</label>
                <input
                  type="number"
                  step="any"
                  name="alto_cm"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.alto_cm}
                  onChange={handleChangePiece}
                />
              </div>
              {/* Ancho (cm) */}
              <div>
                <label className="block text-sm font-medium mb-1">Ancho (cm)</label>
                <input
                  type="number"
                  step="any"
                  name="ancho_cm"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.ancho_cm}
                  onChange={handleChangePiece}
                />
              </div>
              {/* Profundidad (cm) */}
              <div>
                <label className="block text-sm font-medium mb-1">Profundidad (cm)</label>
                <input
                  type="number"
                  step="any"
                  name="profundidad_cm"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.profundidad_cm}
                  onChange={handleChangePiece}
                />
              </div>
              {/* Diámetro (cm) */}
              <div>
                <label className="block text-sm font-medium mb-1">Diámetro (cm)</label>
                <input
                  type="number"
                  step="any"
                  name="diametro_cm"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.diametro_cm}
                  onChange={handleChangePiece}
                />
              </div>
              {/* Espesor (mm) */}
              <div>
                <label className="block text-sm font-medium mb-1">Espesor (mm)</label>
                <input
                  type="number"
                  step="any"
                  name="espesor_mm"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.espesor_mm}
                  onChange={handleChangePiece}
                />
              </div>
              {/* Peso (gr) */}
              <div>
                <label className="block text-sm font-medium mb-1">Peso (gr)</label>
                <input
                  type="number"
                  step="any"
                  name="peso_gr"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.peso_gr}
                  onChange={handleChangePiece}
                />
              </div>
              {/* Función */}
              <div>
                <label className="block text-sm font-medium mb-1">Función</label>
                <input
                  type="text"
                  name="funcion"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.funcion}
                  onChange={handleChangePiece}
                />
              </div>
              {/* Contexto histórico */}
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
              {/* Bibliografía */}
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
              {/* Iconografía */}
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
              {/* Notas de investigación */}
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
              {/* Estado de conservación */}
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
              {/* Responsable conservación */}
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
              {/* Fecha actualización conservación */}
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
              {/* Comentarios conservación */}
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
              {/* Exposiciones */}
              <div>
                <label className="block text-sm font-medium mb-1">Exposiciones</label>
                <input
                  type="text"
                  name="exposiciones"
                  list="list-exposiciones"
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pieceData.exposiciones}
                  onChange={handleChangePiece}
                />
                <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
                <datalist id="list-exposiciones">
                  {exposiciones.map(e => <option key={e} value={e} />)}
                </datalist>
              </div>
              {/* Avaluo */}
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
              {/* Procedencia */}
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
              {/* Donante */}
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
              {/* Fecha ingreso */}
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
              {/* Responsable colección */}
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
              {/* Fecha última modificación */}
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
                {components.map((comp, idx) => {
                  const previewImage = comp.imagenes?.[0]?.imagen;
                  const extraImages = Math.max((comp.imagenes?.length ?? 0) - 1, 0);
                  const hasPendingUploads = (comp.imagenes ?? []).some(img => Boolean(img?.file));
                  return (
                    <div key={idx} className="p-2 bg-gray-50 border rounded flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {previewImage ? (
                          <div className="relative">
                            <img
                              src={previewImage}
                              alt={`Vista previa componente ${getComponentDisplayLetter(comp.letra, idx)}`}
                              className="h-16 w-16 object-cover rounded border bg-white"
                            />
                            {extraImages > 0 && (
                              <span className="absolute -bottom-2 right-0 rounded-full bg-primary px-2 text-[10px] font-medium text-white">
                                +{extraImages}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin imágenes</span>
                        )}
                        <div>
                          <div className="font-semibold">
                            Componente {getComponentDisplayLetter(comp.letra, idx)}
                            {comp.nombre_comun && ` – ${comp.nombre_comun}`}
                            {comp.nombre_especifico && ` (${comp.nombre_especifico})`}
                          </div>
                          {hasPendingUploads && (
                            <p className="text-xs text-amber-600">Nueva imagen pendiente de guardar</p>
                          )}
                        </div>
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
                  );
                })}
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
                 onChange={handleMainImageChange}
              />
              {imagePreview && (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">Vista previa</p>
                  <img
                    src={imagePreview}
                    alt="Vista previa de la pieza"
                    className="mt-2 h-32 w-auto rounded border object-contain bg-white"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <Button type="submit" variant="default">Guardar pieza</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")}>Cancelar</Button>
            </div>
          </form>

          <Dialog open={showCompModal} onOpenChange={setShowCompModal}>
            <DialogContent className="max-w-3xl w-full bg-white p-8 overflow-y-auto" style={{ maxHeight: "90vh" }}>
              <h3 className="text-lg font-semibold mb-6">
                {editIndex !== null ? `Editar componente ${compForm.letra?.toUpperCase()}` : "Añadir componente"}
              </h3>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSaveComponent();
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Letra*</label>
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
                    <label className="block text-sm font-medium mb-2">Unidad relacionada</label>
                    <input
                      type="text"
                      name="unidad_relacionada"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.unidad_relacionada}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nombre común</label>
                    <input
                      type="text"
                      name="nombre_comun"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.nombre_comun}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nombre atribuido</label>
                    <input
                      type="text"
                      name="nombre_especifico"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.nombre_especifico}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Número de registro anterior</label>
                    <input
                      type="text"
                      name="numero_registro_anterior"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.numero_registro_anterior}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Código SURDOC</label>
                    <input
                      type="text"
                      name="codigo_surdoc"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.codigo_surdoc}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ubicación</label>
                    <input
                      type="text"
                      name="ubicacion"
                      list="list-ubicaciones"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.ubicacion}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
                  <div>
                    <label className="block text-sm font-medium mb-2">Depósito</label>
                    <input
                      type="text"
                      name="deposito"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.deposito}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Estante o fullspace</label>
                    <input
                      type="text"
                      name="estante_o_fullspace"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.estante_o_fullspace}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Cajas o nivel</label>
                    <input
                      type="text"
                      name="cajas_o_nivel"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.cajas_o_nivel}
                      onChange={handleChangeComp}
                    />
                  </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tipología</label>
                  <input
                    type="text"
                    name="tipologia"
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                    value={compForm.tipologia}
                    onChange={handleChangeComp}
                    list="list-tipologias"
                  />
                  <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Colección</label>
                  <input
                    type="text"
                    name="coleccion"
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                    value={compForm.coleccion}
                    onChange={handleChangeComp}
                    list="list-colecciones"
                  />
                  <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
                </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Clasificación</label>
                    <input
                      type="text"
                      name="clasificacion"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.clasificacion}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Conjunto</label>
                    <input
                      type="text"
                      name="conjunto"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.conjunto}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium mb-2">Autor</label>
                  <input
                    type="text"
                    name="autor"
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                    value={compForm.autor}
                    onChange={handleChangeComp}
                    list="list-autores"
                  />
                  <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
                </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Filiación cultural</label>
                    <input
                      type="text"
                      name="filiacion_cultural"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.filiacion_cultural}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium mb-2">País</label>
                  <input
                    type="text"
                    name="pais"
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                    value={compForm.pais}
                    onChange={handleChangeComp}
                    list="list-paises"
                  />
                  <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
                </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Localidad</label>
                    <input
                      type="text"
                      name="localidad"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.localidad}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha de creación</label>
                    <input
                      type="text"
                      name="fecha_creacion"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.fecha_creacion}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Descripción colección</label>
                    <textarea
                      name="descripcion_col"
                      rows={2}
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.descripcion_col}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Marcas o inscripciones</label>
                    <textarea
                      name="marcas_inscripciones"
                      rows={2}
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={pieceData.marcas_inscripciones}
                      onChange={handleChangePiece}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Técnica</label>
                    <input
                      type="text"
                      name="tecnica"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.tecnica}
                      onChange={handleChangeComp}
                    />
                    <small className="text-gray-500">* Separe múltiples técnicas con coma</small>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Materialidad</label>
                    <input
                      type="text"
                      name="materialidad"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.materialidad}
                      onChange={handleChangeComp}
                    />
                    <small className="text-gray-500">* Separe múltiples materiales con coma</small>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Descripción conservación</label>
                    <input
                      type="text"
                      name="descripcion_cr"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.descripcion_cr}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Alto (cm)</label>
                    <input
                      type="number"
                      step="any"
                      name="alto_cm"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.alto_cm}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ancho (cm)</label>
                    <input
                      type="number"
                      step="any"
                      name="ancho_cm"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.ancho_cm}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Profundidad (cm)</label>
                    <input
                      type="number"
                      step="any"
                      name="profundidad_cm"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.profundidad_cm}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Diámetro (cm)</label>
                    <input
                      type="number"
                      step="any"
                      name="diametro_cm"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.diametro_cm}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Espesor (mm)</label>
                    <input
                      type="number"
                      step="any"
                      name="espesor_mm"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.espesor_mm}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Peso (gr)</label>
                    <input
                      type="number"
                      step="any"
                      name="peso_gr"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.peso_gr}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Función</label>
                    <input
                      type="text"
                      name="funcion"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.funcion}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Contexto histórico</label>
                    <input
                      type="text"
                      name="contexto_historico"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.contexto_historico}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bibliografía</label>
                    <input
                      type="text"
                      name="bibliografia"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.bibliografia}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Iconografía</label>
                    <input
                      type="text"
                      name="iconografia"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.iconografia}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Notas de investigación</label>
                    <input
                      type="text"
                      name="notas_investigacion"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.notas_investigacion}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Estado de conservación</label>
                    <input
                      type="text"
                      name="estado_conservacion"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.estado_conservacion}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Responsable conservación</label>
                    <input
                      type="text"
                      name="responsable_conservacion"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.responsable_conservacion}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha actualización conservación</label>
                    <input
                      type="text"
                      name="fecha_actualizacion_conservacion"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.fecha_actualizacion_conservacion}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Comentarios conservación</label>
                    <input
                      type="text"
                      name="comentarios_conservacion"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.comentarios_conservacion}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium mb-2">Exposiciones</label>
                  <input
                    type="text"
                    name="exposiciones"
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                    value={compForm.exposiciones}
                    onChange={handleChangeComp}
                    list="list-exposiciones"
                  />
                  <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
                </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Avaluo</label>
                    <input
                      type="text"
                      name="avaluo"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.avaluo}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Procedencia</label>
                    <input
                      type="text"
                      name="procedencia"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.procedencia}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Donante</label>
                    <input
                      type="text"
                      name="donante"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.donante}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha ingreso</label>
                    <input
                      type="text"
                      name="fecha_ingreso"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.fecha_ingreso}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Responsable colección</label>
                    <input
                      type="text"
                      name="responsable_coleccion"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.responsable_coleccion}
                      onChange={handleChangeComp}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Fecha última modificación</label>
                    <input
                      type="text"
                      name="fecha_ultima_modificacion"
                      className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                      value={compForm.fecha_ultima_modificacion}
                      onChange={handleChangeComp}
                      disabled
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Imágenes del componente</label>
                    <div className="space-y-2">
                      {compForm.imagenes && compForm.imagenes.length > 0 ? (
                        compForm.imagenes.map((img, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <img src={img.imagen} alt={`Imagen ${idx + 1}`} className="h-16 w-16 object-cover rounded border" />
                            <input
                              type="text"
                              className="w-full rounded border px-2 py-1"
                              placeholder="Descripción"
                              value={img.descripcion ?? ""}
                              onChange={e => {
                                const newImgs = [...(compForm.imagenes ?? [])];
                                newImgs[idx] = { ...newImgs[idx], descripcion: e.target.value };
                                setCompForm(prev => ({ ...prev, imagenes: newImgs }));
                              }}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const newImgs = [...(compForm.imagenes ?? [])];
                                const [removed] = newImgs.splice(idx, 1);
                                revokeImagePreviews([removed]);
                                setCompForm(prev => ({ ...prev, imagenes: newImgs }));
                              }}
                            >
                              Quitar
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No hay imágenes asociadas.</p>
                      )}
                      <input
                        type="file"
                        accept=".jpg"
                        multiple
                        onChange={e => {
                          const files = Array.from(e.target.files ?? []);
                          const newImgs = files.map(f => ({
                            imagen: URL.createObjectURL(f),
                            descripcion: "",
                            file_name: undefined,
                          }));
                          setCompForm(prev => ({
                            ...prev,
                            imagenes: [...(prev.imagenes ?? []), ...newImgs],
                          }));
                        }}
                      />
                      {/* <small className="text-gray-500">
                        Los nombres deben seguir el formato del museo (regex de import). Se subirán al guardar la pieza si se implementa el backend para archivos por componente.
                      </small> */}
                    </div>
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

          {showLogin && (
            <Dialog open onOpenChange={setShowLogin}>
              <DialogContent>
                <h2 className="text-lg font-semibold mb-4">Iniciar sesión</h2>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Email</label>
                    <input type="email" className="w-full input" placeholder="admin@mapa.cl o editor@mapa.cl" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Contraseña</label>
                    <input type="password" className="w-full input" placeholder="Cualquier texto (demo)" />
                  </div>
                  <Button className="w-full">Iniciar sesión</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}
