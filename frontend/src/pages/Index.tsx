import { useState, useEffect } from "react";
import { CollectionItem, PaginationState, SearchFilters, ViewMode } from "@/types";
import { mockItems } from "@/data/mockData";
import Header from "@/components/Header";
import Search from "@/components/Search";
import FilterPanel from "@/components/FilterPanel";
import ItemGrid from "@/components/ItemGrid";
import ExportButton from "@/components/ExportButton";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 20;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Index = () => {
  const { user, login } = useAuth();
  
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({ query: "" });
  const [filteredItems, setFilteredItems] = useState<CollectionItem[]>(mockItems);
  const [selectedItems, setSelectedItems] = useState<CollectionItem[]>([]);
  
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    itemsPerPage: ITEMS_PER_PAGE,
    totalItems: mockItems.length,
    totalPages: Math.ceil(mockItems.length / ITEMS_PER_PAGE),
    viewMode: 'grid'
  });

  const [displayedItems, setDisplayedItems] = useState<CollectionItem[]>([]);

  useEffect(() => {
    applyFilters(searchFilters);
  }, []);

  const applyFilters = (filters: SearchFilters) => {
    setLoading(true);
    
    // Simulate API call with setTimeout
    setTimeout(() => {
      let results = [...mockItems];
      
      // Text search
      if (filters.query) {
        const query = filters.query.toLowerCase();
        results = results.filter(
          (item) =>
            item.commonName.toLowerCase().includes(query) ||
            item.inventoryNumber.toLowerCase().includes(query) ||
            (item.attributedName && item.attributedName.toLowerCase().includes(query)) ||
            item.collectionDescription.toLowerCase().includes(query)
        );
      }
      
      // Country filter
      if (filters.country && filters.country.length > 0) {
        results = results.filter((item) => filters.country?.includes(item.country));
      }
      
      // Collection filter
      if (filters.collection && filters.collection.length > 0) {
        results = results.filter((item) => filters.collection?.includes(item.collection));
      }
      
      // Author filter
      if (filters.author && filters.author.length > 0) {
        results = results.filter((item) => item.author && filters.author?.includes(item.author));
      }
      
      // Locality filter
      if (filters.locality && filters.locality.length > 0) {
        results = results.filter((item) => item.locality && filters.locality?.includes(item.locality));
      }
      
      // Materials filter
      if (filters.materials && filters.materials.length > 0) {
        results = results.filter((item) => {
          if (!item.materials) return false;
          return filters.materials?.some(material => item.materials.includes(material));
        });
      }
      
      // Exhibitions filter
      if (filters.exhibitions && filters.exhibitions.length > 0) {
        results = results.filter((item) => {
          if (!item.exhibitions) return false;
          return filters.exhibitions?.some(exhibition => item.exhibitions?.includes(exhibition));
        });
      }
      
      // Date range filter
      if (filters.dateFrom) {
        results = results.filter(
          (item) => item.creationDate && parseInt(item.creationDate) >= parseInt(filters.dateFrom || "0")
        );
      }
      
      if (filters.dateTo) {
        results = results.filter(
          (item) => item.creationDate && parseInt(item.creationDate) <= parseInt(filters.dateTo || "9999")
        );
      }
      
      setFilteredItems(results);
      
      // Update pagination
      const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
      const newPage = Math.min(pagination.page, totalPages || 1);
      
      setPagination({
        ...pagination,
        page: newPage,
        totalItems: results.length,
        totalPages: totalPages || 1,
      });
      
      // Remember filters
      setSearchFilters(filters);
      setLoading(false);
    }, 500);
  };

  const handleSearch = (filters: SearchFilters) => {
    // Combine new text query with existing advanced filters
    const combinedFilters = { ...searchFilters, ...filters };
    applyFilters(combinedFilters);
  };

  const handleAdvancedFilters = (filters: SearchFilters) => {
    applyFilters({ ...filters });
  };

  const handleResetFilters = () => {
    setSearchFilters({ query: "" });
    applyFilters({ query: "" });
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page });
  };

  const handleViewModeChange = (viewMode: ViewMode) => {
    setPagination({ ...pagination, viewMode });
  };

  const handleSelectItem = (item: CollectionItem) => {
    setSelectedItems((prev) => {
      const isSelected = prev.some((selectedItem) => selectedItem.id === item.id);
      if (isSelected) {
        return prev.filter((selectedItem) => selectedItem.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleSelectAll = () => {
    // Check if all currently visible items are already selected
    const allSelected = displayedItems.every(item => 
      selectedItems.some(selectedItem => selectedItem.id === item.id)
    );
    
    if (allSelected) {
      // If all are selected, deselect the visible items
      setSelectedItems(prevSelected => 
        prevSelected.filter(selectedItem => 
          !displayedItems.some(item => item.id === selectedItem.id)
        )
      );
      toast.info(`Se han deseleccionado ${displayedItems.length} piezas`);
    } else {
      // If not all selected, select all visible items that aren't already selected
      const newSelectedItems = [...selectedItems];
      
      displayedItems.forEach(item => {
        if (!selectedItems.some(selectedItem => selectedItem.id === item.id)) {
          newSelectedItems.push(item);
        }
      });
      
      setSelectedItems(newSelectedItems);
      toast.success(`Se han seleccionado ${displayedItems.length} piezas`);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor ingrese email y contraseña");
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        toast.success("Inicio de sesión exitoso");
        setShowLogin(false);
      } else {
        toast.error("Credenciales inválidas");
      }
    } catch (error) {
      toast.error("Error al iniciar sesión");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Update displayed items when pagination or filtered items change
  useEffect(() => {
    const startIndex = (pagination.page - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    setDisplayedItems(filteredItems.slice(startIndex, endIndex));
  }, [filteredItems, pagination.page, pagination.itemsPerPage]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={() => setShowLogin(true)} />
      
      <main className="flex-1 container mx-auto py-8 px-4 md:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Catálogo MAPA</h1>
          <p className="text-muted-foreground">
            Explora la colección del Museo de Arte Popular Americano Tomás Lago
          </p>
        </div>

        <div className="mb-8">
          <Search 
            onSearch={handleSearch} 
            showAdvanced={showAdvancedSearch}
            toggleAdvanced={() => setShowAdvancedSearch(!showAdvancedSearch)} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {showAdvancedSearch && (
            <aside className="lg:col-span-1">
              <FilterPanel 
                onApplyFilters={handleAdvancedFilters}
                onReset={handleResetFilters}
                initialFilters={searchFilters}
              />
            </aside>
          )}

          <div className={showAdvancedSearch ? "lg:col-span-3" : "lg:col-span-4"}>
            <div className="mb-6 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Mostrando {filteredItems.length > 0 ? (pagination.page - 1) * pagination.itemsPerPage + 1 : 0}-
                {Math.min(pagination.page * pagination.itemsPerPage, filteredItems.length)} de{" "}
                {filteredItems.length} piezas
              </p>
              
              <ExportButton selectedItems={selectedItems} user={user} />
            </div>

            <ItemGrid
              items={displayedItems}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onViewModeChange={handleViewModeChange}
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onSelectAll={handleSelectAll}
              totalItems={displayedItems.length}
            />
          </div>
        </div>
      </main>

      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar sesión</DialogTitle>
            <DialogDescription>
              Ingresa tus credenciales para acceder al sistema.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleLoginSubmit}>
            <div className="space-y-4 py-4">
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
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Cargando..." : "Iniciar sesión"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
