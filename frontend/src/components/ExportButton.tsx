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
    "Letra",
    "Revisión",
    "N° de registro anterior",
    "SURDOC",
    "Ubicación",
    "Depósito",
    "Estante",
    "Caja actual",
    "Tipología",
    "Colección",
    "Clasificación",
    "Conjunto",
    "Nombre común",
    "Nombre atribuido",
    "Autor",
    "Filiación cultural",
    "País",
    "Localidad",
    "Fecha de creación",
    "Descripción catálogo",
    "Marcas o inscripciones",
    "Técnica",
    "Materialidad",
    "Descripción conservación",
    "Alto (cm)",
    "Ancho (cm)",
    "Profundidad (cm)",
    "Diámetro (cm)",
    "Espesor (mm)",
    "Peso (gr)",
    "Función",
    "Contexto histórico",
    "Bibliografía",
    "Iconografía",
    "Notas de investigación",
    "Estado de conservación",
    "Responsable conservación",
    "Fecha actualización conservación",
    "Comentarios conservación",
    "Exposiciones",
    "Avaluo",
    "Procedencia",
    "Donante",
    "Fecha ingreso",
    "Responsable colección",
    "Fecha última modificación",
    "Imagen principal",
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
      const row: string[] = [
        String(item.inventoryNumber ?? ""),
        String(item.letra ?? ""),
        String(item.revision ?? ""),
        String(item.previousRegistryNumber ?? ""),
        String(item.surdoc ?? ""),
        String(item.ubicacion ?? ""),
        String(item.deposito ?? ""),
        String(item.estante ?? ""),
        String(item.caja_actual ?? ""),
        String(item.tipologia ?? ""),
        String(item.coleccion ?? ""),
        String(item.clasificacion ?? ""),
        String(item.conjunto ?? ""),
        String(item.nombre_comun ?? ""),
        String(item.nombre_especifico ?? ""),
        String(item.autor ?? ""),
        String(item.filiacion_cultural ?? ""),
        String(item.pais ?? ""),
        String(item.localidad ?? ""),
        String(item.fecha_creacion ?? ""),
        String(item.descripcion_col ?? ""),
        String(item.marcas_inscripciones ?? ""),
        Array.isArray(item.tecnica) ? item.tecnica.join(", ") : String(item.tecnica ?? ""),
        String(item.materialidad ?? ""),
        String(item.descripcion_cr ?? ""),
        String(item.alto_cm ?? ""),
        String(item.ancho_cm ?? ""),
        String(item.profundidad_cm ?? ""),
        String(item.diametro_cm ?? ""),
        String(item.espesor_mm ?? ""),
        String(item.peso_gr ?? ""),
        String(item.funcion ?? ""),
        String(item.contexto_historico ?? ""),
        String(item.bibliografia ?? ""),
        String(item.iconografia ?? ""),
        String(item.notas_investigacion ?? ""),
        String(item.estado_conservacion ?? ""),
        String(item.responsable_conservacion ?? ""),
        String(item.fecha_actualizacion_conservacion ?? ""),
        String(item.comentarios_conservacion ?? ""),
        String(item.exposiciones ?? ""),
        String(item.avaluo ?? ""),
        String(item.procedencia ?? ""),
        String(item.donante ?? ""),
        String(item.fecha_ingreso ?? ""),
        String(item.responsable_coleccion ?? ""),
        String(item.fecha_ultima_modificacion ?? ""),
        item.imagenes && item.imagenes.length > 0 ? String(item.imagenes[0].imagen) : "",
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
        String(item.inventoryNumber ?? ""),
        String(item.letra ?? ""),
        String(item.revision ?? ""),
        String(item.previousRegistryNumber ?? ""),
        String(item.surdoc ?? ""),
        String(item.ubicacion ?? ""),
        String(item.deposito ?? ""),
        String(item.estante ?? ""),
        String(item.caja_actual ?? ""),
        String(item.tipologia ?? ""),
        String(item.coleccion ?? ""),
        String(item.clasificacion ?? ""),
        String(item.conjunto ?? ""),
        String(item.nombre_comun ?? ""),
        String(item.nombre_especifico ?? ""),
        String(item.autor ?? ""),
        String(item.filiacion_cultural ?? ""),
        String(item.pais ?? ""),
        String(item.localidad ?? ""),
        String(item.fecha_creacion ?? ""),
        String(item.descripcion_col ?? ""),
        String(item.marcas_inscripciones ?? ""),
        Array.isArray(item.tecnica) ? item.tecnica.join(", ") : String(item.tecnica ?? ""),
        String(item.materialidad ?? ""),
        String(item.descripcion_cr ?? ""),
        String(item.alto_cm ?? ""),
        String(item.ancho_cm ?? ""),
        String(item.profundidad_cm ?? ""),
        String(item.diametro_cm ?? ""),
        String(item.espesor_mm ?? ""),
        String(item.peso_gr ?? ""),
        String(item.funcion ?? ""),
        String(item.contexto_historico ?? ""),
        String(item.bibliografia ?? ""),
        String(item.iconografia ?? ""),
        String(item.notas_investigacion ?? ""),
        String(item.estado_conservacion ?? ""),
        String(item.responsable_conservacion ?? ""),
        String(item.fecha_actualizacion_conservacion ?? ""),
        String(item.comentarios_conservacion ?? ""),
        String(item.exposiciones ?? ""),
        String(item.avaluo ?? ""),
        String(item.procedencia ?? ""),
        String(item.donante ?? ""),
        String(item.fecha_ingreso ?? ""),
        String(item.responsable_coleccion ?? ""),
        String(item.fecha_ultima_modificacion ?? ""),
        item.imagenes && item.imagenes.length > 0 ? String(item.imagenes[0].imagen) : "",
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
