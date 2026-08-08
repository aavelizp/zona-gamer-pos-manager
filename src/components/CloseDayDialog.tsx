import { useRef, useMemo, useState, useEffect } from "react";
import { useStore, fmtUsd } from "@/lib/store";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, FileSpreadsheet, XCircle, RefreshCcw, Database } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

export function CloseDayDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const sales = useStore(s => s.sales || []);
  const rate = useStore(s => s.rate);
  const closeDay = useStore(s => s.closeDay);
  
  const printRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setNow(new Date());
      setIsProcessing(false);
    }
  }, [open]);

  // Reloj comercial para cierres nocturnos
  const businessDate = useMemo(() => {
    const d = new Date(now);
    if (d.getHours() < 6) d.setDate(d.getDate() - 1);
    return d;
  }, [now]);

  const shiftStart = useMemo(() => {
    const d = new Date();
    if (d.getHours() < 6) d.setDate(d.getDate() - 1);
    d.setHours(6, 0, 0, 0);
    return d;
  }, [open]);

  // 👇 1. MATEMÁTICA ACTUALIZADA (AHORA SUMA EL EFECTIVO EN BS) 👇
  const stats = useMemo(() => {
    const tSales = sales.filter(s => s.ts >= shiftStart.getTime());
    let totalFacturadoUsd = 0; let horasUsd = 0; let snacksUsd = 0;
    let cashUsd = 0; let mobileBs = 0; let cashBs = 0; let fiadoUsd = 0; let deudasRecuperadasUsd = 0;

    tSales.forEach(s => {
      if (s.concept === "Deuda Cobrada") {
        deudasRecuperadasUsd += (s.total || 0); cashUsd += (s.cashUsd || 0); mobileBs += (s.mobileBs || 0); cashBs += (s.cashBs || 0);
      } else {
        totalFacturadoUsd += (s.total || 0); horasUsd += (s.timeAmount || 0); snacksUsd += (s.extrasAmount || 0);
        if (s.method === "credit") fiadoUsd += (s.total || 0);
        else { cashUsd += (s.cashUsd || 0); mobileBs += (s.mobileBs || 0); cashBs += (s.cashBs || 0); }
      }
    });

    return { totalFacturadoUsd, horasUsd, snacksUsd, cashUsd, mobileBs, cashBs, fiadoUsd, deudasRecuperadasUsd };
  }, [sales, shiftStart]);

  // 👇 2. FUNCIÓN PARA DESCARGAR EXCEL MULTI-PESTAÑA 👇
  const descargarExcel = () => {
    const storeData = useStore.getState();
    const fecha = new Date().toISOString().split('T')[0];

    const escapeXml = (unsafe: string) => String(unsafe).replace(/[<>&'"]/g, c => {
      switch (c) { case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;'; case '\'': return '&apos;'; case '"': return '&quot;'; default: return c; }
    });

    const createSheet = (name: string, rows: any[][]) => {
      let sheet = `<Worksheet ss:Name="${name}"><Table>`;
      rows.forEach(row => {
        sheet += `<Row>`;
        row.forEach(cell => {
          const type = typeof cell === 'number' ? 'Number' : 'String';
          sheet += `<Cell><Data ss:Type="${type}">${type === 'String' ? escapeXml(cell) : cell}</Data></Cell>`;
        });
        sheet += `</Row>`;
      });
      sheet += `</Table></Worksheet>`;
      return sheet;
    };

    let xml = `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">`;

    // Pestaña 1: Ventas
    const salesRows = [["Concepto", "Cliente", "Total USD", "Efectivo USD", "Pago Movil BS", "Efectivo Físico BS", "Metodo"]];
    (storeData.sales || []).forEach(s => salesRows.push([s.concept, s.customer || "General", s.total, s.cashUsd || 0, s.mobileBs || 0, s.cashBs || 0, s.method]));
    xml += createSheet("Ventas de Hoy", salesRows);

    // Pestaña 2: Inventario
    const invRows = [["Producto", "Precio USD", "Stock Disponible"]];
    (storeData.products || []).forEach(p => invRows.push([p.name, p.price, p.stock]));
    xml += createSheet("Inventario", invRows);

    // Pestaña 3: Clientes
    const memberRows = [["Nombre", "Telefono", "Cédula", "Minutos Jugados", "Minutos Recompensa"]];
    (storeData.members || []).forEach(m => memberRows.push([m.name, m.phone || "N/A", m.idDoc || "N/A", m.totalMinutes, m.rewardMinutes]));
    xml += createSheet("Club Gamer", memberRows);

    // Pestaña 4: Gastos
    const expRows = [["Descripcion", "Monto USD", "Categoria"]];
    (storeData.expenses || []).forEach(e => expRows.push([e.description, e.amount, e.category || "N/A"]));
    xml += createSheet("Gastos", expRows);

    xml += `</Workbook>`;

    const blobExcel = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const urlExcel = URL.createObjectURL(blobExcel);
    const aExcel = document.createElement('a');
    aExcel.href = urlExcel;
    aExcel.download = `Reporte_TwinsGamer_${fecha}.xls`;
    aExcel.click();
    URL.revokeObjectURL(urlExcel);
    toast.success("✅ Reporte Excel Multi-pestaña descargado");
  };

  // 👇 3. FUNCIÓN PARA DESCARGAR BACKUP JSON MANUALMENTE 👇
  const descargarRespaldoJson = () => {
    const storeData = useStore.getState();
    const fecha = new Date().toISOString().split('T')[0];
    const paquete = { state: storeData, version: 0 };
    const blobJson = new Blob([JSON.stringify(paquete, null, 2)], { type: 'application/json' });
    const urlJson = URL.createObjectURL(blobJson);
    const aJson = document.createElement('a');
    aJson.href = urlJson;
    aJson.download = `Respaldo_Sistema_${fecha}.json`;
    aJson.click();
    URL.revokeObjectURL(urlJson);
    toast.success("✅ Copia de seguridad del sistema descargada");
  };

  const downloadImage = async () => {
    if (!printRef.current) return;
    setIsProcessing(true);
    const toastId = toast.loading("Descargando imagen...");
    
    try {
      const canvas = await html2canvas(printRef.current, { 
        backgroundColor: "#ffffff",
        scale: 2, 
        useCORS: true,
        logging: false
      });
      
      const dataUrl = canvas.toDataURL("image/png");
      const fileName = `Cierre_Caja_${businessDate.toLocaleDateString('es-VE').replace(/\//g,'-')}.png`;

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      
      link.click();
      
      document.body.removeChild(link);
      toast.success("¡Imagen descargada exitosamente!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar la imagen.", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseDay = () => {
    if (confirm("⚠️ ¿Estás seguro de cerrar la caja? Esto archivará las ventas actuales y reiniciará el turno.")) {
      closeDay();
      onOpenChange(false);
      toast.success("Caja cerrada exitosamente.");
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 bg-white">
        
        <div ref={printRef} className="p-6 bg-white text-slate-800 font-sans">
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
            <h2 className="font-display text-3xl text-slate-900 tracking-widest uppercase">CIERRE DE CAJA</h2>
            <p className="text-xs text-slate-500 mt-1">
              Fecha Contable: {businessDate.toLocaleDateString("es-VE")} <br/>
              (Emitido: {now.toLocaleTimeString("es-VE")}) · Tasa: Bs {rate.toLocaleString('es-VE')}/$
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Facturado Hoy</p>
              <p className="font-display text-5xl text-blue-600 leading-none">{fmtUsd(stats.totalFacturadoUsd)}</p>
              <p className="text-teal-600 font-bold mt-2 text-sm">Bs {(stats.totalFacturadoUsd * rate).toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-slate-600 font-bold mb-2">🎮 Horas de Juego</p>
                <p className="font-display text-2xl text-slate-900">{fmtUsd(stats.horasUsd)}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-slate-600 font-bold mb-2">🛍️ Snacks</p>
                <p className="font-display text-2xl text-slate-900">{fmtUsd(stats.snacksUsd)}</p>
              </div>
            </div>

            <h3 className="font-display text-sm text-slate-900 uppercase tracking-widest pt-2">Arqueo por método de pago</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-[10px] sm:text-xs text-slate-700 font-bold mb-1">💵 Efectivo ($)</p>
                <p className="font-display text-xl text-emerald-700">{fmtUsd(stats.cashUsd)}</p>
              </div>
              
              <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4">
                <p className="text-[10px] sm:text-xs text-slate-700 font-bold mb-1">📱 Pago Móvil (Bs)</p>
                <p className="font-display text-xl text-blue-600">Bs {stats.mobileBs.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
              </div>

              {/* 👇 NUEVO RECUADRO DE EFECTIVO FÍSICO BS 👇 */}
              <div className="bg-yellow-50/50 border border-yellow-200 rounded-2xl p-4">
                <p className="text-[10px] sm:text-xs text-slate-700 font-bold mb-1">🇻🇪 Efectivo (Bs)</p>
                <p className="font-display text-xl text-yellow-700">Bs {stats.cashBs.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
              </div>

              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
                <p className="text-[10px] sm:text-xs text-slate-700 font-bold mb-1">🤝 Fiado Hoy</p>
                <p className="font-display text-xl text-amber-700">{fmtUsd(stats.fiadoUsd)}</p>
              </div>

              <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 col-span-2">
                <p className="text-[10px] sm:text-xs text-slate-700 font-bold mb-1">📝 Recuperado (Deudas Pagadas)</p>
                <p className="font-display text-xl text-teal-600">{fmtUsd(stats.deudasRecuperadasUsd)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 👇 ZONA DE BOTONES RENOVADA 👇 */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 rounded-b-lg">
          <div className="flex items-start gap-2 bg-amber-100/50 text-amber-800 p-3 rounded-lg border border-amber-200 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>Exporta tu imagen, Excel o Backup antes de confirmar el cierre de caja.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold" onClick={descargarExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-bold" onClick={descargarRespaldoJson}>
              <Database className="h-4 w-4 mr-2" /> Backup JSON
            </Button>
          </div>

          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 shadow-sm" onClick={downloadImage} disabled={isProcessing}>
            {isProcessing ? <RefreshCcw className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2" />}
            {isProcessing ? "Procesando..." : "Descargar Imagen del Cierre"}
          </Button>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200">
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 font-bold h-12" onClick={() => onOpenChange(false)}>
              <XCircle className="h-4 w-4 mr-2" /> Cancelar
            </Button>
            <Button onClick={handleCloseDay} className="bg-slate-900 hover:bg-black text-white h-12 font-bold tracking-widest shadow-md">
              CERRAR CAJA
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}