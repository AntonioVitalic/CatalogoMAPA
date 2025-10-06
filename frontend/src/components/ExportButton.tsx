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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8002";

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
    "País",
    "Localidad",
    "Fecha de creación",
    "Materialidad",
    "Descripción de colecciones",
    "Estado de conservación",
    "Imagen",
  ];

  const exportToCSV = () => {
    if (selectedItems.length === 0) {
      toast.error("No hay piezas seleccionadas para exportar");
      return;
    }
    setIsExporting(true);
    try {
      // Headers SIN columna de imagen
      const csvHeaders = [
        "N° de inventario",
        "Nombre común",
        "Nombre atribuido",
        "País",
        "Localidad",
        "Fecha de creación",
        "Materialidad",
        "Descripción de colecciones",
        "Estado de conservación",
      ];
      
      let csvContent = "\uFEFF" + csvHeaders.join(",") + "\n";

      selectedItems.forEach((item) => {
        const row: string[] = [
          String(item.inventoryNumber ?? ""),
          String(item.nombre_comun ?? ""),
          String(item.nombre_especifico ?? ""),
          String(item.pais ?? ""),
          String(item.localidad ?? ""),
          String(item.fecha_creacion ?? ""),
          String(item.materialidad ?? ""),
          String(item.descripcion_col ?? ""),
          String(item.estado_conservacion ?? ""),
        ];

        const escaped = row.map((field) => {
          const str = String(field);
          if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
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

  const exportToExcel = async () => {
    if (selectedItems.length === 0) {
      toast.error("No hay piezas seleccionadas para exportar");
      return;
    }
    setIsExporting(true);
    try {
      const ids = selectedItems.map(item => item.inventoryNumber);
      let access = localStorage.getItem("access");
      
      // Intentar primera petición
      let res = await fetch(`${API_URL}/api/exportar-excel-con-imagenes/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(access ? { Authorization: `Bearer ${access}` } : {}),
        },
        body: JSON.stringify({ ids }),
      });

      // Si falla con 401, refrescar token y reintentar
      if (res.status === 401) {
        const refresh = localStorage.getItem("refresh");
        if (!refresh) {
          toast.error("Sesión expirada. Por favor, inicia sesión nuevamente.");
          setIsExporting(false);
          return;
        }

        // Refrescar token
        const refreshRes = await fetch(`${API_URL}/accounts/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });

        if (!refreshRes.ok) {
          toast.error("No se pudo refrescar la sesión. Inicia sesión nuevamente.");
          setIsExporting(false);
          return;
        }

        const { access: newAccess } = await refreshRes.json();
        localStorage.setItem("access", newAccess);
        access = newAccess;

        // Reintentar con nuevo token
        res = await fetch(`${API_URL}/api/exportar-excel-con-imagenes/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
          },
          body: JSON.stringify({ ids }),
        });
      }

      if (!res.ok) throw new Error("Error al generar el Excel");
      const blob = await res.blob();
      saveAs(blob, `mapa_export_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(`${selectedItems.length} piezas exportadas a Excel con imágenes`);
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
