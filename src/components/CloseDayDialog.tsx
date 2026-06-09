import { useMemo } from "react";
import { useStore, fmtUsd } from "@/lib/store";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, AlertTriangle } from "lucide-react";
import { exportData } from "@/lib/excel";

export function CloseDayDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const sales = useStore((s) => s.sales || []);
  const expenses = useStore((s) => s.expenses || []);
  const products = useStore((s) => s.products || []);
  const credits = useStore((s) => s.credits || []);
  const closeDay = useStore((s) => s.closeDay);
  const rate = useStore((s) => s.rate);

  const stats = useMemo(() => {
    // El turno comienza a las 6:00 AM para evitar cierres erróneos a medianoche
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
      totalFacturado,
      horasJuego,
      snacks,
      efectivo,
      pagoMovilBs,
      fiado,
      deudas,
      netCashUsd,
      netMobileBs,
      todaySales
    };
  }, [sales, expenses, rate]);

  const handleCloseDay = () => {
    if (confirm("⚠️ ¿Estás seguro de CERRAR LA CAJA? Esto guardará el reporte en la Bóveda y reiniciará los contadores.")) {
      closeDay();
      onOpenChange(false);
    }
  };

  const nowStr = new Date().toLocaleString("es-VE", { 
    day: "numeric", month: "numeric", year: "numeric", 
    hour: "numeric", minute: "numeric", second: "numeric", hour12: true 
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Forzamos fondo blanco y diseño limpio para que parezca un documento impreso */}
      <DialogContent className="max-w-4xl p-0 bg-white text-slate-900 border-none overflow-hidden rounded-xl shadow-2xl">
        <DialogTitle className="sr-only">Cierre de Caja</DialogTitle>
        
        <div className="p-8 max-h-[85vh] overflow-y-auto bg-white font-sans">
          
          {/* ENCABEZADO */}
          <h2 className="text-3xl font-black text-center text-slate-900 tracking-wider uppercase mb-1">
            RESUMEN DE CIERRE DIARIO · TWINS GAMER
          </h2>
          <p className="text-center text-slate-500 text-sm mb-6">
            {nowStr} · Tasa: Bs {rate}/$
          </p>
          <div className="border-b-2 border-slate-900 mb-6" />

          {/* TOTAL FACTURADO (AZUL) */}
          <div className="bg-[#f0f7ff] border border-[#b6d4fe] rounded-xl p-6 mb-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">TOTAL FACTURADO HOY</p>
            <p className="text-6xl font-black text-blue-600 mb-1">{fmtUsd(stats.totalFacturado)}</p>
            <p className="text-lg text-teal-600 font-medium">Bs {(stats.totalFacturado * rate).toLocaleString("es-VE", { maximumFractionDigits: 2 })}</p>
          </div>

          {/* HORAS Y SNACKS */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-sm text-slate-600 mb-2 flex items-center gap-2">🎮 Horas de Juego</p>
              <p className="text-3xl font-black text-slate-900">{fmtUsd(stats.horasJuego)}</p>
              <p className="text-sm text-teal-600 mt-1">Bs {(stats.horasJuego * rate).toLocaleString("es-VE", { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-sm text-slate-600 mb-2 flex items-center gap-2">🛍️ Inventario / Snacks</p>
              <p className="text-3xl font-black text-slate-900">{fmtUsd(stats.snacks)}</p>
              <p className="text-sm text-teal-600 mt-1">Bs {(stats.snacks * rate).toLocaleString("es-VE", { maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* ARQUEO DE CAJA */}
          <h3 className="text-lg font-black uppercase text-slate-700 tracking-widest mb-4">ARQUEO POR MÉTODO DE PAGO</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#f0fdf4] border border-[#4ade80] rounded-xl p-5 shadow-sm">
              <p className="text-sm text-slate-600 mb-2 flex items-center gap-2">💵 Efectivo en Caja ($)</p>
              <p className="text-4xl font-black text-[#166534]">{fmtUsd(stats.efectivo)}</p>
            </div>
            
            <div className="bg-[#eff6ff] border border-[#60a5fa] rounded-xl p-5 shadow-sm">
              <p className="text-sm text-slate-600 mb-2 flex items-center gap-2">📱 Pago Móvil / Transferencia (Bs)</p>
              <p className="text-4xl font-black text-blue-600">Bs {stats.pagoMovilBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</p>
              <p className="text-sm text-slate-500 mt-1">≈ {fmtUsd(stats.pagoMovilBs / rate)}</p>
            </div>
            
            <div className="bg-[#fffbeb] border border-[#fbbf24] rounded-xl p-5 shadow-sm">
              <p className="text-sm text-slate-600 mb-2 flex items-center gap-2">🤝 Fiado Otorgado Hoy</p>
              <p className="text-4xl font-black text-[#b45309]">{fmtUsd(stats.fiado)}</p>
              <p className="text-sm text-slate-500 mt-1">No está en caja</p>
            </div>
            
            <div className="bg-[#ecfdf5] border border-[#34d399] rounded-xl p-5 shadow-sm">
              <p className="text-sm text-slate-600 mb-2 flex items-center gap-2">🧾 Deudas Recuperadas Hoy</p>
              <p className="text-4xl font-black text-[#059669]">{fmtUsd(stats.deudas)}</p>
            </div>
          </div>

          {/* TOTAL ESPERADO (POST GASTOS) */}
          <div className="bg-slate-100 border border-slate-300 rounded-xl p-6 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-4">TOTAL ESPERADO EN CAJA (NETO · POST-GASTOS)</p>
            <p className="text-xl text-slate-800 mb-2">Efectivo $: <span className="font-black text-black">{fmtUsd(stats.netCashUsd)}</span></p>
            <p className="text-xl text-slate-800">Pago Móvil Bs: <span className="font-black text-black">Bs {stats.netMobileBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</span></p>
          </div>

        </div>

        {/* BARRA DE BOTONES INFERIOR */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center px-8">
          <div className="flex items-center gap-2 text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-xs font-semibold">Asegúrate de descargar el Excel antes de cerrar.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300 text-slate-700 bg-white hover:bg-slate-100">
              Cancelar
            </Button>
            <Button onClick={() => exportData({ sales: stats.todaySales, products, credits, rate })} className="bg-green-600 hover:bg-green-700 text-white shadow-md font-bold">
              <Download className="h-4 w-4 mr-2" /> Descargar Excel
            </Button>
            <Button onClick={handleCloseDay} className="bg-slate-900 hover:bg-slate-800 text-white shadow-md font-bold tracking-wider">
              CONFIRMAR CIERRE
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}