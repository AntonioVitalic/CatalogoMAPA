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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8002";

interface ExportButtonProps {
  selectedItems: CollectionItem[];
  user: User | null;
}

const ExportButton = ({ selectedItems, user }: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const pdfColumns = [
    { header: "N° de inventario", dataKey: "inventoryNumber" },
    { header: "Imagen", dataKey: "image" },
    { header: "Nombre común", dataKey: "nombreComun" },
    { header: "Nombre atribuido", dataKey: "nombreAtribuido" },
    { header: "País", dataKey: "pais" },
    { header: "Localidad", dataKey: "localidad" },
    { header: "Fecha de creación", dataKey: "fechaCreacion" },
    { header: "Materialidad", dataKey: "materialidad" },
    { header: "Descripción de colecciones", dataKey: "descripcionColecciones" },
    { header: "Estado de conservación", dataKey: "estadoConservacion" },
  ] as const;

  const csvHeaders = pdfColumns
    .filter((column) => column.dataKey !== "image")
    .map((column) => column.header);

  const exportToCSV = () => {
    if (selectedItems.length === 0) {
      toast.error("No hay piezas seleccionadas para exportar");
      return;
    }
    setIsExporting(true);
    try {
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

  const fetchImageAsDataUrl = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Error al leer la imagen"));
        reader.readAsDataURL(blob);
      });

      const dimensions = await new Promise<{ width: number; height: number } | null>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      });

      if (!dimensions) return null;

      return {
        dataUrl,
        width: dimensions.width,
        height: dimensions.height,
      };
    } catch (error) {
      console.error("No se pudo cargar la imagen para el PDF", error);
      return null;
    }
  };

  const containsExtendedCharacters = (value: string) => /[^\u0000-\u00ff]/.test(value);

  const createTextImage = (text: string, width: number, fontSize = 9) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return null;

    const scale = window.devicePixelRatio || 2;
    const padding = 4 * scale;
    const usableWidth = Math.max(width * scale - padding * 2, scale);
    const fontFamily = "sans-serif";
    const lineHeight = fontSize * scale * 1.35;

    const wrapText = (value: string) => {
      if (!value) return [""];
      const words = value.split(/(\s+)/).filter((segment) => segment.length > 0);
      const lines: string[] = [];
      let currentLine = "";

      const pushCurrentLine = () => {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = "";
        }
      };

      const appendWord = (word: string) => {
        const tentative = currentLine + word;
        if (context.measureText(tentative).width <= usableWidth) {
          currentLine = tentative;
          return;
        }

        if (context.measureText(word).width > usableWidth) {
          const characters = Array.from(word);
          characters.forEach((char) => {
            const nextTentative = currentLine + char;
            if (context.measureText(nextTentative).width <= usableWidth) {
              currentLine = nextTentative;
            } else {
              pushCurrentLine();
              currentLine = char;
            }
          });
          return;
        }

        pushCurrentLine();
        currentLine = word.trimStart();
      };

      context.font = `${fontSize * scale}px ${fontFamily}`;
      words.forEach((word) => {
        if (/^\s+$/.test(word)) {
          appendWord(word);
        } else {
          appendWord(word);
        }
      });

      pushCurrentLine();
      return lines.length ? lines : [""];
    };

    context.font = `${fontSize * scale}px ${fontFamily}`;
    const lines = wrapText(text);
    const height = Math.max(lineHeight * lines.length + padding * 2, fontSize * scale + padding * 2);
    canvas.width = Math.max(width * scale, scale);
    canvas.height = Math.ceil(height);

    context.font = `${fontSize * scale}px ${fontFamily}`;
    context.fillStyle = "#000";
    context.textBaseline = "top";

    lines.forEach((line, index) => {
      context.fillText(line, padding, padding + index * lineHeight);
    });

    return {
      dataUrl: canvas.toDataURL("image/png"),
      width,
      height: canvas.height / scale,
    };
  };

  const exportToPDF = async () => {
    if (selectedItems.length === 0) {
      toast.error("No hay piezas seleccionadas para exportar");
      return;
    }
    setIsExporting(true);
    try {
       const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a3" });
      const maxImageSize = { width: 90, height: 90 };

      const bodyRows = await Promise.all(
        selectedItems.map(async (item) => {
          const imageUrl = item.imagenes?.[0]?.imagen
            ? item.imagenes[0].imagen.startsWith("http")
              ? item.imagenes[0].imagen
              : `${API_URL}${item.imagenes[0].imagen}`
            : "";

          const imageData = imageUrl ? await fetchImageAsDataUrl(imageUrl) : null;
          let scaledImage = imageData;

          if (imageData) {
            const ratio = Math.min(
              maxImageSize.width / imageData.width,
              maxImageSize.height / imageData.height,
              1
            );

            scaledImage = {
              dataUrl: imageData.dataUrl,
              width: imageData.width * ratio,
              height: imageData.height * ratio,
            };
          }

          return {
            inventoryNumber: String(item.inventoryNumber ?? ""),
            image: scaledImage,
            nombreComun: String(item.nombre_comun ?? ""),
            nombreAtribuido: String(item.nombre_especifico ?? ""),
            pais: String(item.pais ?? ""),
            localidad: String(item.localidad ?? ""),
            fechaCreacion: String(item.fecha_creacion ?? ""),
            materialidad: String(item.materialidad ?? ""),
            descripcionColecciones: String(item.descripcion_col ?? ""),
            estadoConservacion: String(item.estado_conservacion ?? ""),
          };
        })
      );

      autoTable(doc, {
        columns: pdfColumns as unknown as { header: string; dataKey: string }[],
        body: bodyRows,
        margin: { top: 40, bottom: 30, left: 30, right: 30 },
        styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak", valign: "top" },
        headStyles: { fillColor: [33, 37, 41], fontSize: 9 },
        columnStyles: {
           inventoryNumber: { cellWidth: 70 },
          image: { cellWidth: 100, minCellHeight: 90, halign: "center", valign: "middle" },
          nombreComun: { cellWidth: 120 },
          nombreAtribuido: { cellWidth: 150 },
          pais: { cellWidth: 70 },
          localidad: { cellWidth: 90 },
          fechaCreacion: { cellWidth: 80 },
          materialidad: { cellWidth: 100 },
          descripcionColecciones: { cellWidth: 200 },
          estadoConservacion: { cellWidth: 110 },
        },
        didParseCell: (data) => {
          if (data.section === "body") {
            if (data.column.dataKey === "image") {
              data.cell.text = [""];
            }

            if (
              data.column.dataKey === "nombreAtribuido" &&
              typeof data.cell.raw === "string" &&
              containsExtendedCharacters(data.cell.raw)
            ) {
              data.cell.text = [""];
            }
          }
        },
        didDrawCell: (data) => {
          if (data.section !== "body") return;

          if (data.column.dataKey === "image" && data.cell.raw) {
            const imageData = data.cell.raw as { dataUrl: string; width: number; height: number } | null;
            if (imageData) {
              const x = data.cell.x + (data.cell.width - imageData.width) / 2;
              const y = data.cell.y + (data.cell.height - imageData.height) / 2;
              doc.addImage(imageData.dataUrl, "PNG", x, y, imageData.width, imageData.height);
            }
          }

          if (
            data.column.dataKey === "nombreAtribuido" &&
            typeof data.cell.raw === "string" &&
            containsExtendedCharacters(data.cell.raw)
          ) {
            const textImage = createTextImage(data.cell.raw, data.cell.width, 9);
            if (textImage) {
              const x = data.cell.x + 2;
              const y = data.cell.y + 2;
              doc.addImage(textImage.dataUrl, "PNG", x, y, textImage.width, textImage.height);
              data.row.height = Math.max(data.row.height, textImage.height + 6);
            }
          }
        },
      });

      doc.save(`mapa_export_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success(`${selectedItems.length} piezas exportadas a PDF`);
    } catch (e) {
      console.error(e);
      toast.error("Error al exportar a PDF");
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
        <DropdownMenuItem onClick={exportToPDF}>
          Exportar a PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
