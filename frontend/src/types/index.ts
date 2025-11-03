
export type UserRole = 'visitor' | 'editor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuditInfo {
  createdBy?: User;
  createdAt?: Date;
  lastModifiedBy?: User;
  lastModifiedAt?: Date;
}

export interface CollectionItem {
 id: string;
  inventoryNumber: string;
  letra?: string;
  unidad_relacionada?: string;
  previousRegistryNumber?: string;
  surdoc?: string;
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
  tecnica?: string[];
  materialidad?: string;
  descripcion_cr?: string;
  alto_cm?: number;
  ancho_cm?: number;
  profundidad_cm?: number;
  diametro_cm?: number;
  espesor_mm?: number;
  peso_gr?: number;
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
  etiqueta_eliminado?: boolean;
  componentes?: ComponenteItem[];
  imagenes?: { imagen: string; descripcion?: string }[];
}

export type ComponenteItem = {
  id: string;
  pieza_numero_inventario: string;
  letra?: string;
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
  tecnica?: string[];
  materialidad?: string;
  descripcion_cr?: string;
  alto_cm?: number;
  ancho_cm?: number;
  profundidad_cm?: number;
  diametro_cm?: number;
  espesor_mm?: number;
  peso_gr?: number;
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
  imagenes?: { imagen: string; descripcion?: string }[];
};

export interface SearchFilters {
  query: string;
  country?: string[];
  collection?: string[];
  author?: string[];
  locality?: string[];
  tipologias?: string[];
  exhibitions?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export type ViewMode = 'grid' | 'list';

export interface PaginationState {
  page: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  viewMode: ViewMode;
}
