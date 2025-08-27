import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import api from "@/services/api";

export default function ImportacionMasiva() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [imagesZip, setImagesZip] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleImport = async () => {
    if (!excelFile || !imagesZip) {
      alert("Debes seleccionar el Excel y el archivo ZIP de imágenes.");
      return;
    }
    setLoading(true);
    setResult("");
    const formData = new FormData();
    formData.append("excel", excelFile);
    formData.append("images_zip", imagesZip);

    try {
      const res = await api.post("/api/importacion-masiva/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data?.mensaje || "Importación finalizada.");
    } catch (err: any) {
      setResult("Error en la importación: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={() => {}} />
        <main className="flex-1">
            <div className="max-w-xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-4">Importación masiva</h1>
            <div className="space-y-4">
                <div>
                <label className="block font-medium mb-1">Excel de inventario (.xlsx)</label>
                <input type="file" accept=".xlsx" onChange={e => setExcelFile(e.target.files?.[0] || null)} />
                </div>
                <div>
                <label className="block font-medium mb-1">Imágenes (archivo ZIP)</label>
                <input type="file" accept=".zip" onChange={e => setImagesZip(e.target.files?.[0] || null)} />
                </div>
                <Button onClick={handleImport} disabled={loading || !excelFile || !imagesZip}>
                {loading ? "Importando..." : "Confirmar importación"}
                </Button>
                {result && <div className="mt-4 p-2 bg-gray-100 rounded">{result}</div>}
                <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
                Volver al inicio
                </Button>
            </div>
            </div>
        </main>
    </div>
  );
}