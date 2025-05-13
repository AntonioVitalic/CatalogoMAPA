
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
  previousRegistryNumber?: string;
  surdoc?: string;
  commonName: string;
  attributedName?: string;
  country: string;
  locality?: string;
  creationDate?: string;
  materials: string[];
  collectionDescription: string;
  conservationState: string;
  location?: string;
  deposit?: string;
  shelf?: string;
  imageUrl: string;
  thumbnailUrl: string;
  collection: string;
  author?: string;
  exhibitions?: string[];
  auditInfo?: AuditInfo;
}

export interface SearchFilters {
  query: string;
  country?: string[];
  collection?: string[];
  author?: string[];
  locality?: string[];
  materials?: string[];
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
