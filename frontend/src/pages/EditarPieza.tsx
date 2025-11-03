import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { getComponentDisplayLetter } from "@/utils/componentLabel";
import {
  ComponentImageForm,
  extractMediaFileName,
  prepareComponentPayload,
} from "@/utils/componentImages";

type ComponentForm = {
  id?: string;
  pieza_numero_inventario: string;
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

type PieceForm = {
  numero_inventario: string;
  letra: string;
  unidad_relacionada: string;
  numero_registro_anterior: string;
  codigo_surdoc: string;
  ubicacion: string;
  deposito: string;
  estante_o_fullspace: string;
  cajas_o_nivel: string;
  tipologia: string;
  coleccion: string;
  clasificacion: string;
  conjunto: string;
  nombre_comun: string;
  nombre_especifico: string;
  autor: string;
  filiacion_cultural: string;
  pais: string;
  localidad: string;
  fecha_creacion: string;
  descripcion_col: string;
  marcas_inscripciones: string;
  tecnica: string;
  materialidad: string;
  descripcion_cr: string;
  alto_cm: string;
  ancho_cm: string;
  profundidad_cm: string;
  diametro_cm: string;
  espesor_mm: string;
  peso_gr: string;
  funcion: string;
  contexto_historico: string;
  bibliografia: string;
  iconografia: string;
  notas_investigacion: string;
  estado_conservacion: string;
  responsable_conservacion: string;
  fecha_actualizacion_conservacion: string;
  comentarios_conservacion: string;
  exposiciones: string;
  avaluo: string;
  procedencia: string;
  donante: string;
  fecha_ingreso: string;
  responsable_coleccion: string;
  fecha_ultima_modificacion: string;
  imagenes: ComponentImageForm[];
};

const initialComp: ComponentForm = {
  pieza_numero_inventario: "",
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

const initialPiece: PieceForm = {
  numero_inventario: "",
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
  imagenes: [],
};


export default function EditarPieza() {
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [pieceData, setPieceData] = useState<PieceForm>(initialPiece);
  const [initialPieceData, setInitialPieceData] = useState<PieceForm>(initialPiece);
  const [components, setComponents] = useState<ComponentForm[]>([]);
  const [initialComponents, setInitialComponents] = useState<ComponentForm[]>([]);
  const [compForm, setCompForm] = useState<ComponentForm>(initialComp);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showCompModal, setShowCompModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [initialComponentsPayloadJson, setInitialComponentsPayloadJson] = useState<string>("[]");

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

  const [authors, setAuthors] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [localidades, setLocalidades] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [tipologias, setTipologias] = useState<string[]>([]);
  const [exposiciones, setExposiciones] = useState<string[]>([]);

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [autRes, paisRes, locRes, colRes, tipRes, expRes] = await Promise.all([
          api.get("/api/autores/"), api.get("/api/paises/"),
          api.get("/api/localidades/"), api.get("/api/colecciones/"),
          api.get("/api/tipologias/"), api.get("/api/exposiciones/")
        ]);
        setAuthors(autRes.data.map((a: any) => a.nombre));
        setCountries(paisRes.data.map((p: any) => p.nombre));
        setLocalidades(locRes.data.map((l: any) => l.nombre));
        setCollections(colRes.data.map((c: any) => c.nombre));
        setTipologias(tipRes.data.map((t: any) => t.nombre));
        setExposiciones(expRes.data.map((e: any) => e.nombre));
      } catch (err) {
        console.error("Error cargando inventarios:", err);
      }
    };

    const fetchPieza = async () => {
      try {
        const res = await api.get(`/api/piezas/${id}/`);
        const p = res.data;
        const nextPiece: PieceForm = {
          numero_inventario: p.numero_inventario || "",
          letra: p.letra || "",
          unidad_relacionada: p.unidad_relacionada || "",
          numero_registro_anterior: p.numero_registro_anterior || "",
          codigo_surdoc: p.codigo_surdoc || "",
          ubicacion: p.ubicacion || "",
          deposito: p.deposito || "",
          estante_o_fullspace: p.estante_o_fullspace || "",
          cajas_o_nivel: p.cajas_o_nivel || "",
          tipologia: p.tipologia || "",
          coleccion: p.coleccion || "",
          clasificacion: p.clasificacion || "",
          conjunto: p.conjunto || "",
          nombre_comun: p.nombre_comun || "",
          nombre_especifico: p.nombre_especifico || "",
          autor: p.autor || "",
          filiacion_cultural: p.filiacion_cultural || "",
          pais: p.pais || "",
          localidad: p.localidad || "",
          fecha_creacion: p.fecha_creacion || "",
          descripcion_col: p.descripcion_col || "",
          marcas_inscripciones: p.marcas_inscripciones || "",
          tecnica: Array.isArray(p.tecnica) ? p.tecnica.join(", ") : p.tecnica || "",
          materialidad: Array.isArray(p.materialidad) ? p.materialidad.join(", ") : p.materialidad || "",
          descripcion_cr: p.descripcion_cr || "",
          alto_cm: p.alto_cm !== undefined && p.alto_cm !== null ? p.alto_cm.toString() : "",
          ancho_cm: p.ancho_cm !== undefined && p.ancho_cm !== null ? p.ancho_cm.toString() : "",
          profundidad_cm: p.profundidad_cm !== undefined && p.profundidad_cm !== null ? p.profundidad_cm.toString() : "",
          diametro_cm: p.diametro_cm !== undefined && p.diametro_cm !== null ? p.diametro_cm.toString() : "",
          espesor_mm: p.espesor_mm !== undefined && p.espesor_mm !== null ? p.espesor_mm.toString() : "",
          peso_gr: p.peso_gr !== undefined && p.peso_gr !== null ? p.peso_gr.toString() : "",
          funcion: p.funcion || "",
          contexto_historico: p.contexto_historico || "",
          bibliografia: p.bibliografia || "",
          iconografia: p.iconografia || "",
          notas_investigacion: p.notas_investigacion || "",
          estado_conservacion: p.estado_conservacion || "",
          responsable_conservacion: p.responsable_conservacion || "",
          fecha_actualizacion_conservacion: p.fecha_actualizacion_conservacion || "",
          comentarios_conservacion: p.comentarios_conservacion || "",
          exposiciones: Array.isArray(p.exposiciones) ? p.exposiciones.join(", ") : p.exposiciones || "",
          avaluo: p.avaluo || "",
          procedencia: p.procedencia || "",
          donante: p.donante || "",
          fecha_ingreso: p.fecha_ingreso || "",
          responsable_coleccion: p.responsable_coleccion || "",
          fecha_ultima_modificacion: p.fecha_ultima_modificacion || "",
          imagenes: (p.imagenes ?? []).map((img: any) => ({
            imagen: img.imagen,
            descripcion: img.descripcion ?? "",
            file_name: extractMediaFileName(img.imagen),
          })),
        };
        setPieceData(nextPiece);
        setInitialPieceData(JSON.parse(JSON.stringify(nextPiece)) as PieceForm);
        if (p.componentes && Array.isArray(p.componentes)) {
          const compList: ComponentForm[] = p.componentes.map((c: any) => ({
            pieza_numero_inventario: c.pieza_numero_inventario || "",
            letra: c.letra || "",
            unidad_relacionada: c.unidad_relacionada || "",
            numero_registro_anterior: c.numero_registro_anterior || "",
            codigo_surdoc: c.codigo_surdoc || "",
            ubicacion: c.ubicacion || "",
            deposito: c.deposito || "",
            estante_o_fullspace: c.estante_o_fullspace || "",
            cajas_o_nivel: c.cajas_o_nivel || "",
            tipologia: c.tipologia || "",
            coleccion: c.coleccion || "",
            clasificacion: c.clasificacion || "",
            conjunto: c.conjunto || "",
            nombre_comun: c.nombre_comun || "",
            nombre_especifico: c.nombre_especifico || "",
            autor: c.autor || "",
            filiacion_cultural: c.filiacion_cultural || "",
            pais: c.pais || "",
            localidad: c.localidad || "",
            fecha_creacion: c.fecha_creacion || "",
            descripcion_col: c.descripcion_col || "",
            marcas_inscripciones: c.marcas_inscripciones || "",
            tecnica: Array.isArray(c.tecnica) ? c.tecnica.join(", ") : c.tecnica || "",
            materialidad: Array.isArray(c.materialidad) ? c.materialidad.join(", ") : c.materialidad || "",
            descripcion_cr: c.descripcion_cr || "",
            alto_cm: c.alto_cm?.toString() || "",
            ancho_cm: c.ancho_cm?.toString() || "",
            profundidad_cm: c.profundidad_cm?.toString() || "",
            diametro_cm: c.diametro_cm?.toString() || "",
            espesor_mm: c.espesor_mm?.toString() || "",
            peso_gr: c.peso_gr?.toString() || "",
            funcion: c.funcion || "",
            contexto_historico: c.contexto_historico || "",
            bibliografia: c.bibliografia || "",
            iconografia: c.iconografia || "",
            notas_investigacion: c.notas_investigacion || "",
            estado_conservacion: c.estado_conservacion || "",
            responsable_conservacion: c.responsable_conservacion || "",
            fecha_actualizacion_conservacion: c.fecha_actualizacion_conservacion || "",
            comentarios_conservacion: c.comentarios_conservacion || "",
            exposiciones: Array.isArray(c.exposiciones) ? c.exposiciones.join(", ") : c.exposiciones || "",
            avaluo: c.avaluo || "",
            procedencia: c.procedencia || "",
            donante: c.donante || "",
            fecha_ingreso: c.fecha_ingreso || "",
            responsable_coleccion: c.responsable_coleccion || "",
            fecha_ultima_modificacion: c.fecha_ultima_modificacion || "",
            imagenes: (c.imagenes ?? []).map((img: any) => ({
              imagen: img.imagen,
              descripcion: img.descripcion ?? "",
              file_name: extractMediaFileName(img.imagen),
            })),
          }));
          setComponents(compList);
          setInitialComponents(JSON.parse(JSON.stringify(compList)) as ComponentForm[]);
          const preparedInitial = prepareComponentPayload(compList);
          setInitialComponentsPayloadJson(JSON.stringify(preparedInitial.payload));
        } else {
          setComponents([]);
          setInitialComponentsPayloadJson("[]");
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
    const field = name as keyof PieceForm;
    setPieceData(prev => ({ ...prev, [field]: value }));
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
    setCompForm({
      ...initialComp,
      letra: defaultLetter,
      pieza_numero_inventario: pieceData.numero_inventario,
      imagenes: [],
    });
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
      const changedFields: Record<string, unknown> = {};

      const normalizeValue = (value: PieceForm[keyof PieceForm]) => {
        if (Array.isArray(value)) {
          return JSON.stringify(value);
        }
        return value ?? "";
      };
      (Object.keys(pieceData) as (keyof PieceForm)[]).forEach((key) => {
        if (key === "imagenes") {
          return;
        }

        const currentValue = pieceData[key];
        const initialValue = initialPieceData[key];

        if (normalizeValue(currentValue) === normalizeValue(initialValue)) {
          return;
        }

        const fieldKey = key as string;

        if (Array.isArray(currentValue)) {
          changedFields[fieldKey] = currentValue;
        } else if (typeof currentValue === "object" && currentValue !== null) {
          changedFields[fieldKey] = currentValue;
        } else {
          changedFields[fieldKey] = currentValue ?? "";
        }
      });

      const preparedComponents = prepareComponentPayload(components);
      const componentsPayload = preparedComponents.payload;
      const componentFiles = preparedComponents.files;
      const componentsJson = JSON.stringify(componentsPayload);
      const componentsChanged = componentsJson !== initialComponentsPayloadJson;
      if (componentsChanged) {
        changedFields.componentes = componentsPayload;
      }
      if (componentFiles.length > 0 && !componentsChanged) {
        changedFields.componentes = componentsPayload;
      }

      const hasFile = Boolean(file) || componentFiles.length > 0;
      const hasChanges = hasFile || Object.keys(changedFields).length > 0;

      if (!hasChanges) {
        alert("No se detectaron cambios para guardar.");
        return;
      }

      if (hasFile) {
        const formData = new FormData();
        Object.entries(changedFields).forEach(([key, value]) => {
          if (value === undefined || value === null) {
            formData.append(key, "");
            return;
          }

          if (Array.isArray(value) || typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        });

        if (file) {
          formData.append("imagen", file);
        }
        componentFiles.forEach(({ field, file: compFile }) => {
          formData.append(field, compFile);
        });
        await api.put(`/api/piezas/${id}/`, formData);
      } else {
        await api.put(`/api/piezas/${id}/`, changedFields);
      }
      alert("Pieza editada correctamente");
      navigate(`/detail/${id}`);
    } catch (err: any) {
      console.error("Error editando pieza:", err);
      const msg = err.response?.data?.detail || err.message;
      alert("No se pudo guardar los cambios. " + msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={() => setShowLogin(true)} />
      <div className="flex justify-center items-start bg-muted/40 py-8">
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
            {/* Número de inventario */}
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
            {/* Letra
            <div>
              <label className="block text-sm font-medium mb-1">Letra</label>
              <input
                type="text"
                name="letra"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.letra}
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
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.ubicacion}
                onChange={handleChangePiece}
              />
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
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.tipologia}
                onChange={handleChangePiece}
                list="tipologias-list"
              />
              <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
              <datalist id="tipologias-list">
                {tipologias.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            {/* Colección */}
            <div>
              <label className="block text-sm font-medium mb-1">Colección</label>
              <input
                type="text"
                name="coleccion"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.coleccion}
                onChange={handleChangePiece}
                list="collections-list"
              />
              <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
              <datalist id="collections-list">
                {collections.map((c) => (
                  <option key={c} value={c} />
                ))}
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
            {/* Autor */}
            <div>
              <label className="block text-sm font-medium mb-1">Autor</label>
              <input
                type="text"
                name="autor"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.autor}
                onChange={handleChangePiece}
                list="authors-list"
              />
              <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
              <datalist id="authors-list">
                {authors.map((a) => (
                  <option key={a} value={a} />
                ))}
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
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.pais}
                onChange={handleChangePiece}
                list="countries-list"
              />
              <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
              <datalist id="countries-list">
                {countries.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            {/* Localidad */}
            <div>
              <label className="block text-sm font-medium mb-1">Localidad</label>
              <input
                type="text"
                name="localidad"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.localidad}
                onChange={handleChangePiece}
                list="localidades-list"
              />
              <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
              <datalist id="localidades-list">
                {localidades.map((l) => (
                  <option key={l} value={l} />
                ))}
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
                name="descripcion_col"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.descripcion_col}
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
                name="descripcion_cr"
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.descripcion_cr}
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
                className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={pieceData.exposiciones}
                onChange={handleChangePiece}
                list="exposiciones-list"
              />
              <small className="text-gray-500">Puedes preseleccionar valores ya guardados.</small>
              <datalist id="exposiciones-list">
                {exposiciones.map((e) => (
                  <option key={e} value={e} />
                ))}
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
              onChange={handleMainImageChange}
            />
            <small className="text-gray-600">Sube un archivo solo si deseas reemplazar la imagen actual.</small>
            {(imagePreview || pieceData.imagenes?.[0]) && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">Vista previa</p>
                <img
                  src={imagePreview ?? pieceData.imagenes?.[0]?.imagen}
                  alt="Vista previa de la pieza"
                  className="mt-2 h-32 w-auto rounded border object-contain bg-white"
                />
              </div>
            )}
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
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                    value={compForm.ubicacion}
                    onChange={handleChangeComp}
                  />
                </div>
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Colección</label>
                  <input
                    type="text"
                    name="coleccion"
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                    value={compForm.coleccion}
                    onChange={handleChangeComp}
                  />
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
                  <label className="block text-sm font-medium mb-2">Autor</label>
                  <input
                    type="text"
                    name="autor"
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2"
                    value={compForm.autor}
                    onChange={handleChangeComp}
                  />
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
                  />
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
                    className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={2}
                    value={compForm.marcas_inscripciones}
                    onChange={handleChangeComp}
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
                  />
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
                    <small className="text-gray-500">Puedes subir varias imágenes (.jpg) para cada componente. Los nombres deben seguir el formato indicado por el museo.</small>
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