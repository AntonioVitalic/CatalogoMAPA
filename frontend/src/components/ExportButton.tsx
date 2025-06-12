// frontend/src/components/ExportButton.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { CollectionItem, User } from "@/types";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface ExportButtonProps {
  selectedItems: CollectionItem[];
  user: User | null;
}

const ExportButton = ({ selectedItems, user }: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

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
    "Estante",
  ];

  const exportToCSV = () => {
    if (selectedItems.length === 0) {
      toast.error("No hay piezas seleccionadas para exportar");
      return;
    }
    setIsExporting(true);
    try {
      // BOM para forzar UTF-8 en Excel
      let csvContent = "\uFEFF" + headers.join(",") + "\n";

      selectedItems.forEach((item) => {
        const row = [
          item.inventoryNumber,
          item.commonName,
          item.attributedName || "",
          item.author || "",
          item.collection,
          item.country,
          item.locality || "",
          item.creationDate || "",
          (item.materials || []).join("; "),
          item.conservationState,
          item.collectionDescription,
          item.previousRegistryNumber || "",
          item.surdoc || "",
          item.location || "",
          item.deposit || "",
          item.shelf || "",
        ];

        const escaped = row.map((field) => {
          if (field.includes(',') || field.includes('\n') || field.includes('"')) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        });

        csvContent += escaped.join(",") + "\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `mapa_export_${new Date().toISOString().split("T")[0]}.csv`);
      toast.success(`${selectedItems.length} piezas exportadas a CSV`);
    } catch (e) {
      console.error(e);
      toast.error("Error al exportar a CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = () => {
    if (selectedItems.length === 0) {
      toast.error("No hay piezas seleccionadas para exportar");
      return;
    }
    setIsExporting(true);
    try {
      // Construimos un array de arrays: [headers, ...rows]
      const data: Array<string[]> = [
        headers,
        ...selectedItems.map((item) => [
          item.inventoryNumber,
          item.commonName,
          item.attributedName || "",
          item.author || "",
          item.collection,
          item.country,
          item.locality || "",
          item.creationDate || "",
          (item.materials || []).join("; "),
          item.conservationState,
          item.collectionDescription,
          item.previousRegistryNumber || "",
          item.surdoc || "",
          item.location || "",
          item.deposit || "",
          item.shelf || "",
        ]),
      ];

      // Generamos la hoja y el libro
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Piezas");

      // Obtenemos array buffer y guardamos
      const wbout = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([wbout], {
        type: "application/octet-stream",
      });
      saveAs(blob, `mapa_export_${new Date().toISOString().split("T")[0]}.xlsx`);

      toast.success(`${selectedItems.length} piezas exportadas a Excel`);
    } catch (e) {
      console.error(e);
      toast.error("Error al exportar a Excel");
    } finally {
      setIsExporting(false);
    }
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
