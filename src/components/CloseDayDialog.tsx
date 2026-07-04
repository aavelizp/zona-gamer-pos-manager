import { useRef, useMemo, useState, useEffect } from "react";
import { useStore, fmtUsd } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gamepad2, ShoppingBag, Banknote, Smartphone, Handshake, FileText, AlertTriangle, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { exportData } from "@/lib/excel";

export function CloseDayDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const sales = useStore(s => s.sales || []);
  const products = useStore(s => s.products || []);
  const credits = useStore(s => s.credits || []);
  const rate = useStore(s => s.rate);
  const closeDay = useStore(s => s.closeDay);
  
  const printRef = useRef<HTMLDivElement>(null);

  const [now, setNow] = useState(new Date());
  
  // 👉 Plan B: Mostrar la imagen generada en pantalla
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNow(new Date());
      setPreviewImage(null); // Limpiamos la imagen al abrir
    }
  }, [open]);

  const shiftStart = useMemo(() => {
    const d = new Date();
    if (d.getHours() < 6) d.setDate(d.getDate() - 1);
    d.setHours(6, 0, 0, 0);
    return d;
  }, [open]);

  const stats = useMemo(() => {
    const tSales = sales.filter(s => s.ts >= shiftStart.getTime());

    let totalFacturadoUsd = 0;
    let horasUsd = 0;
    let snacksUsd = 0;
    
    let cashUsd = 0;
    let mobileBs = 0;
    let fiadoUsd = 0;
    let deudasRecuperadasUsd = 0;

    tSales.forEach(s => {
      if (s.concept === "Deuda Cobrada") {
        deudasRecuperadasUsd += (s.total || 0);
        cashUsd += (s.cashUsd || 0);
        mobileBs += (s.mobileBs || 0); 
      } else {
        totalFacturadoUsd += (s.total || 0);
        horasUsd += (s.timeAmount || 0);
        snacksUsd += (s.extrasAmount || 0);
        
        if (s.method === "credit") {
          fiadoUsd += (s.total || 0);
        } else {
          cashUsd += (s.cashUsd || 0);
          mobileBs += (s.mobileBs || 0); 
        }
      }
    });

    return {
      totalFacturadoUsd, horasUsd, snacksUsd,
      cashUsd, mobileBs, fiadoUsd, deudasRecuperadasUsd
    };
  }, [sales, shiftStart]);

  // 👇 DESCARGA BLINDADA A PRUEBA DE VENTANAS MODALES 👇
  const downloadImage = async () => {
    if (!printRef.current) return;
    toast("Generando imagen...", { icon: "⏳" });
    
    try {
      const canvas = await html2canvas(printRef.current, { 
        backgroundColor: "#ffffff",
        scale: 2, 
        useCORS: true,
        logging: false
      });
      
      const dataUrl = canvas.toDataURL("image/png");
      const fileName = `Cierre_Caja_${now.toLocaleDateString('es-VE').replace(/\//g,'-')}.png`;

      // 1. EL SECRETO: Creamos el enlace DENTRO de la ventana (printRef) 
      // para que el sistema de ventanas no bloquee la descarga.
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = dataUrl;
      a.download = fileName;
      
      printRef.current.appendChild(a);
      a.click();
      printRef.current.removeChild(a);

      // 2. Activamos el Plan B para celulares estrictos (iOS / Safari)
      setPreviewImage(dataUrl);

      toast.success("¡Descarga iniciada!");

    } catch (error) {
      console.error("Error capturando pantalla:", error);
      toast.error("Hubo un error técnico al generar la foto.");
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
              {now.toLocaleDateString("es-VE")} {now.toLocaleTimeString("es-VE")} · Tasa: Bs {rate.toLocaleString('es-VE')}/$
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
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-2"><Gamepad2 className="h-4 w-4" /> Horas de Juego</p>
                <p className="font-display text-2xl text-slate-900">{fmtUsd(stats.horasUsd)}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-2"><ShoppingBag className="h-4 w-4 text-emerald-500" /> Snacks</p>
                <p className="font-display text-2xl text-slate-900">{fmtUsd(stats.snacksUsd)}</p>
              </div>
            </div>

            <h3 className="font-display text-sm text-slate-900 uppercase tracking-widest pt-2">Arqueo por método de pago</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-[10px] sm:text-xs text-slate-600 flex items-center gap-1 mb-1"><Banknote className="h-3 w-3 text-emerald-600" /> Efectivo en Caja ($)</p>
                <p className="font-display text-xl text-emerald-700">{fmtUsd(stats.cashUsd)}</p>
              </div>
              
              <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4">
                <p className="text-[10px] sm:text-xs text-slate-600 flex items-center gap-1 mb-1"><Smartphone className="h-3 w-3 text-blue-500" /> Pago Móvil (Bs)</p>
                <p className="font-display text-xl text-blue-600">Bs {stats.mobileBs.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
              </div>

              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
                <p className="text-[10px] sm:text-xs text-slate-600 flex items-center gap-1 mb-1"><Handshake className="h-3 w-3 text-amber-500" /> Fiado Hoy</p>
                <p className="font-display text-xl text-amber-700">{fmtUsd(stats.fiadoUsd)}</p>
              </div>

              <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
                <p className="text-[10px] sm:text-xs text-slate-600 flex items-center gap-1 mb-1"><FileText className="h-3 w-3 text-teal-400" /> Deudas Recuperadas</p>
                <p className="font-display text-xl text-teal-600">{fmtUsd(stats.deudasRecuperadasUsd)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 rounded-b-lg">
          <div className="flex items-start gap-2 bg-amber-100/50 text-amber-800 p-3 rounded-lg border border-amber-200 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>Guarda tu imagen y tu Excel antes de cerrar la caja.</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 border-slate-300 text-slate-700 bg-white hover:bg-slate-100" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={downloadImage}>
              <Download className="h-4 w-4 mr-2" /> Descargar
            </Button>
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => exportData({ sales, products, credits, rate })}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
            </Button>
          </div>
          <Button onClick={handleCloseDay} className="w-full bg-slate-900 hover:bg-black text-white h-12 font-bold tracking-widest">
            CONFIRMAR CIERRE
          </Button>

          {/* 👇 PLAN B INFALIBLE PARA CELULARES ESTRICTOS 👇 */}
          {previewImage && (
            <div className="mt-4 p-4 border border-indigo-200 rounded-xl bg-indigo-50 text-center animate-in fade-in slide-in-from-top-4">
              <p className="text-sm font-bold text-indigo-800 mb-1">
                ¿Tu celular bloqueó la descarga?
              </p>
              <p className="text-xs text-indigo-600 mb-3">
                Mantén presionada la imagen aquí abajo y selecciona <strong>"Guardar en Fotos"</strong> o <strong>"Compartir"</strong>.
              </p>
              <img src={previewImage} alt="Ticket Cierre" className="max-w-full rounded shadow-md border border-slate-300 mx-auto" />
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}