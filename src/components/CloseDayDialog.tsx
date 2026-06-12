import { useMemo, useRef } from "react";
import { useStore, fmtUsd } from "@/lib/store";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, AlertTriangle, Camera } from "lucide-react";
import { exportData } from "@/lib/excel";
import html2canvas from "html2canvas";
import { toast } from "sonner";

export function CloseDayDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const sales = useStore((s) => s.sales || []);
  const expenses = useStore((s) => s.expenses || []);
  const products = useStore((s) => s.products || []);
  const credits = useStore((s) => s.credits || []);
  const closeDay = useStore((s) => s.closeDay);
  const rate = useStore((s) => s.rate);

  const printRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const shiftStart = new Date();
    if (shiftStart.getHours() < 6) {
      shiftStart.setDate(shiftStart.getDate() - 1);
    }
    shiftStart.setHours(6, 0, 0, 0);
    const shiftTime = shiftStart.getTime();

    const todaySales = sales.filter((s) => s && s.ts && s.ts >= shiftTime);
    const todayExpenses = expenses.filter((e) => e && e.ts && e.ts >= shiftTime);

    let totalFacturado = 0;
    let horasJuego = 0;
    let snacks = 0;
    let efectivo = 0;
    let pagoMovilBs = 0;
    let fiado = 0;
    let deudas = 0;

    todaySales.forEach((s) => {
      if (s.concept === "Deuda Cobrada") {
        deudas += s.total || 0;
        efectivo += s.cashUsd || 0;
        pagoMovilBs += (s.mobileBs || 0) + ((s.cashBs || 0) * rate);
      } else {
        totalFacturado += s.total || 0;
        horasJuego += s.timeAmount || 0;
        snacks += s.extrasAmount || 0;

        if (s.method === "credit") {
          fiado += s.total || 0;
        } else {
          efectivo += s.cashUsd || 0;
          pagoMovilBs += (s.mobileBs || 0) + ((s.cashBs || 0) * rate);
        }
      }
    });

    let expCashUsd = 0;
    let expMobileBs = 0;
    todayExpenses.forEach((e) => {
      if (e.method === "cash") expCashUsd += e.amount || 0;
      if (e.method === "mobile") expMobileBs += e.amountBs || (e.amount * rate);
    });

    const netCashUsd = efectivo - expCashUsd;
    const netMobileBs = pagoMovilBs - expMobileBs;

    return { 
      totalFacturado, horasJuego, snacks, efectivo, pagoMovilBs, fiado, deudas, netCashUsd, netMobileBs, todaySales
    };
  }, [sales, expenses, rate]);

  const handleCloseDay = () => {
    if (confirm("⚠️ ¿Estás seguro de CERRAR LA CAJA? Esto guardará el reporte en la Bóveda y reiniciará los contadores.")) {
      closeDay();
      onOpenChange(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!printRef.current) {
      toast.error("No se pudo ubicar el área a capturar.");
      return;
    }
    
    try {
      toast.loading("Generando imagen...", { id: "img-toast" });
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(printRef.current, { 
        scale: 1.5, // 👈 Reducido de 2 a 1.5 para un tamaño más amigable
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: 800 // 👈 Fuerza a la cámara a tomar la foto con formato de PC, incluso desde el celular
      });
      
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const dateStr = new Date().toLocaleDateString('es-VE').replace(/\//g, '-');
      
      link.href = dataUrl;
      link.download = `Cierre_Caja_TwinsGamer_${dateStr}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Imagen descargada con éxito 📸", { id: "img-toast" });
    } catch (error) {
      console.error(error);
      toast.error("Hubo un error al generar la imagen", { id: "img-toast" });
    }
  };

  const nowStr = new Date().toLocaleString("es-VE", { 
    day: "numeric", month: "numeric", year: "numeric", 
    hour: "numeric", minute: "numeric", second: "numeric", hour12: true 
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 bg-white text-slate-900 border-none overflow-hidden rounded-xl shadow-2xl">
        <DialogTitle className="sr-only">Cierre de Caja</DialogTitle>
        
        <div className="max-h-[85vh] overflow-y-auto bg-slate-100 flex justify-center">
          
          {/* 👇 RECUADRO CON TAMAÑO MÁXIMO (700px) PARA QUE LA FOTO SEA COMPACTA 👇 */}
          <div ref={printRef} className="p-6 bg-white w-full max-w-[700px] shadow-sm">
            <h2 className="text-2xl font-black text-center text-slate-900 tracking-wider uppercase mb-1">
              RESUMEN DE CIERRE DIARIO
            </h2>
            <p className="text-center text-slate-500 text-xs mb-4">
              {nowStr} · Tasa: Bs {rate}/$
            </p>
            <div className="border-b-2 border-slate-900 mb-5" />

            <div className="bg-[#f0f7ff] border border-[#b6d4fe] rounded-lg p-5 mb-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">TOTAL FACTURADO HOY</p>
              <p className="text-5xl font-black text-blue-600 mb-1">{fmtUsd(stats.totalFacturado)}</p>
              <p className="text-base text-teal-600 font-medium">Bs {(stats.totalFacturado * rate).toLocaleString("es-VE", { maximumFractionDigits: 2 })}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">🎮 Horas de Juego</p>
                <p className="text-2xl font-black text-slate-900">{fmtUsd(stats.horasJuego)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">🛍️ Snacks</p>
                <p className="text-2xl font-black text-slate-900">{fmtUsd(stats.snacks)}</p>
              </div>
            </div>

            <h3 className="text-sm font-black uppercase text-slate-700 tracking-widest mb-3">ARQUEO POR MÉTODO DE PAGO</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#f0fdf4] border border-[#4ade80] rounded-lg p-4">
                <p className="text-xs text-slate-600 mb-1">💵 Efectivo en Caja ($)</p>
                <p className="text-2xl font-black text-[#166534]">{fmtUsd(stats.efectivo)}</p>
              </div>
              <div className="bg-[#eff6ff] border border-[#60a5fa] rounded-lg p-4">
                <p className="text-xs text-slate-600 mb-1">📱 Pago Móvil (Bs)</p>
                <p className="text-2xl font-black text-blue-600">Bs {stats.pagoMovilBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-[#fffbeb] border border-[#fbbf24] rounded-lg p-4">
                <p className="text-xs text-slate-600 mb-1">🤝 Fiado Hoy</p>
                <p className="text-2xl font-black text-[#b45309]">{fmtUsd(stats.fiado)}</p>
              </div>
              <div className="bg-[#ecfdf5] border border-[#34d399] rounded-lg p-4">
                <p className="text-xs text-slate-600 mb-1">🧾 Deudas Recuperadas</p>
                <p className="text-2xl font-black text-[#059669]">{fmtUsd(stats.deudas)}</p>
              </div>
            </div>

            <div className="bg-slate-100 border border-slate-300 rounded-lg p-5">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">TOTAL ESPERADO EN CAJA (NETO · POST-GASTOS)</p>
              <p className="text-lg text-slate-800">Efectivo $: <span className="font-black text-black">{fmtUsd(stats.netCashUsd)}</span></p>
              <p className="text-lg text-slate-800">Pago Móvil Bs: <span className="font-black text-black">Bs {stats.netMobileBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</span></p>
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-slate-200 p-4 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 w-full sm:w-auto">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-[10px] font-medium leading-tight">Guarda tu imagen y tu Excel<br/>antes de cerrar la caja.</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300 text-slate-700 hover:bg-slate-100">
              Cancelar
            </Button>
            <Button onClick={handleDownloadImage} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              <Camera className="h-4 w-4 mr-2" /> Imagen
            </Button>
            <Button onClick={() => exportData({ sales: stats.todaySales, products, credits, rate })} className="bg-green-600 hover:bg-green-700 text-white font-bold">
              <Download className="h-4 w-4 mr-2" /> Excel
            </Button>
            <Button onClick={handleCloseDay} className="bg-slate-900 hover:bg-slate-800 text-white font-bold">
              CONFIRMAR CIERRE
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}