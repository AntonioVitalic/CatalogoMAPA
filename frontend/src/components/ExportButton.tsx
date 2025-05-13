
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { CollectionItem, User } from "@/types";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface ExportButtonProps {
  selectedItems: CollectionItem[];
  user: User | null;
}

const ExportButton = ({ selectedItems, user }: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    if (selectedItems.length === 0) {
      toast.error("No hay piezas seleccionadas para exportar");
      return;
    }

    setIsExporting(true);

    try {
      // Define columns for all users - matching the detail view
      const headers = [
        "N° de inventario", 
        "Nombre común", 
        "Nombre atribuido", 
        "Autor",
        "Colección",
        "País", 
        "Localidad", 
        "Fecha de creación", 
        "Materialidad", 
        "Estado de conservación",
        "Descripción",
        "N° de registro anterior", 
        "SURDOC", 
        "Ubicación",
        "Depósito",
        "Estante"
      ];

      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      
      selectedItems.forEach(item => {
        const row = [
          item.inventoryNumber,
          item.commonName,
          item.attributedName || '',
          item.author || '',
          item.collection,
          item.country,
          item.locality || '',
          item.creationDate || '',
          (item.materials || []).join('; '),
          item.conservationState,
          item.collectionDescription,
          item.previousRegistryNumber || '',
          item.surdoc || '',
          item.location || '',
          item.deposit || '',
          item.shelf || ''
        ];
            
        // Ensure each field is properly escaped for CSV
        const escapedRow = row.map(field => {
          // If the field contains a comma, newline, or double quote, enclose it in double quotes
          if (field && (field.includes(',') || field.includes('\n') || field.includes('"'))) {
            // Replace double quotes with two double quotes
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        });
        
        csvContent += escapedRow.join(',') + '\n';
      });
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `mapa_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${selectedItems.length} piezas exportadas exitosamente`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error("Error al exportar datos");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = () => {
    if (selectedItems.length === 0) {
      toast.error("No hay piezas seleccionadas para exportar");
      return;
    }
    
    // For demo purposes, we'll just show a toast
    // In a real implementation, you'd use a library like xlsx to create the Excel file
    toast.success("Exportación a Excel no implementada en esta demo");
    toast("Utilice la exportación a CSV por ahora");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          disabled={selectedItems.length === 0 || isExporting}
          className="flex items-center gap-2"
        >
          <Download size={16} />
          Exportar {selectedItems.length > 0 && `(${selectedItems.length})`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToCSV}>
          Exportar a CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          Exportar a Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
