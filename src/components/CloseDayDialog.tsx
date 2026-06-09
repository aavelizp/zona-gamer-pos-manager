import { useMemo } from "react";
import { useStore, fmtUsd, fmtBs } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Receipt, AlertTriangle, Download } from "lucide-react";
import { exportData } from "@/lib/excel";

export function CloseDayDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const sales = useStore((s) => s.sales || []);
  const expenses = useStore((s) => s.expenses || []);
  const products = useStore((s) => s.products || []);
  const credits = useStore((s) => s.credits || []);
  const closeDay = useStore((s) => s.closeDay);
  const rate = useStore((s) => s.rate);

  const stats = useMemo(() => {
    // Matemática intacta: El turno inicia a las 6:00 AM
    const shiftStart = new Date();
    if (shiftStart.getHours() < 6) {
      shiftStart.setDate(shiftStart.getDate() - 1);
    }
    shiftStart.setHours(6, 0, 0, 0);
    const shiftTime = shiftStart.getTime();

    const todaySales = sales.filter((s) => s && s.ts && s.ts >= shiftTime);
    const todayExpenses = expenses.filter((e) => e && e.ts && e.ts >= shiftTime);

    let cashUsd = 0;
    let mobileBs = 0;
    let cashBs = 0;
    let credit = 0;

    todaySales.forEach((s) => {
      if (s.method === "credit") {
        credit += s.total || 0;
      } else {
        cashUsd += s.cashUsd || 0;
        mobileBs += s.mobileBs || 0;
        cashBs += s.cashBs || 0;
      }
    });

    let expCashUsd = 0;
    let expMobileBs = 0;

    todayExpenses.forEach((e) => {
      if (e.method === "cash") expCashUsd += e.amount || 0;
      if (e.method === "mobile") expMobileBs += e.amountBs || (e.amount * rate);
    });

    const netCashUsd = cashUsd - expCashUsd;
    const netMobileBs = mobileBs - expMobileBs;

    return { 
      cashUsd: netCashUsd, 
      mobileBs: netMobileBs, 
      cashBs, 
      credit, 
      count: todaySales.length,
      todaySales // Guardamos esto para el botón de Excel rápido
    };
  }, [sales, expenses, rate]);

  const handleCloseDay = () => {
    if (confirm("⚠️ ¿Estás seguro de CERRAR LA CAJA? Esto guardará el turno en la Bóveda y pondrá la pantalla de inicio en $0.00.")) {
      closeDay();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0B0914] border-primary/50 shadow-[0_0_40px_rgba(158,84,255,0.2)]">
        <DialogHeader className="flex flex-col items-center justify-center pt-4 pb-2">
          {/* Logo Restaurado con Efecto Glow */}
          <div className="relative h-20 w-20 mb-3">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <img src="/logo.png" alt="Twins Gamer" className="relative h-full w-full object-contain animate-pulse" />
          </div>
          <DialogTitle className="font-display text-2xl text-white tracking-widest uppercase">
            Cierre de Caja
          </DialogTitle>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Resumen del Turno</p>
        </DialogHeader>

        <div className="space-y-4 px-2">
          <div className="bg-[#131022] rounded-xl border border-primary/20 p-5 space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">Ventas Registradas</span>
              <span className="font-display text-lg text-primary">{stats.count}</span>
            </div>
            
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Efectivo Caja ($)</span>
              <span className="font-display text-xl text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">{fmtUsd(stats.cashUsd)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-[#00E5FF] uppercase tracking-wider">Pago Móvil (Bs)</span>
              <span className="font-display text-xl text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">{fmtBs(stats.mobileBs / rate, rate)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Efectivo Bs 💵</span>
              <span className="font-display text-lg text-emerald-400">{fmtBs(stats.cashBs / rate, rate)}</span>
            </div>

            <div className="border-t border-white/5 my-2" />
            
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-yellow-500 uppercase tracking-wider font-bold">Fiado (Por Cobrar)</span>
              <span className="font-display text-yellow-500">{fmtUsd(stats.credit)}</span>
            </div>
          </div>

          {/* Botón de Excel integrado en el modal */}
          <Button 
            variant="outline" 
            className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300 font-bold"
            onClick={() => exportData({ sales: stats.todaySales, products, credits, rate })}
          >
            <Download className="h-4 w-4 mr-2" /> Descargar Excel del Turno
          </Button>

          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-md flex gap-3 items-center">
            <AlertTriangle className="h-6 w-6 text-red-400 shrink-0 animate-pulse" />
            <p className="text-[10px] text-red-200 leading-tight">
              Al confirmar, los contadores de la pantalla volverán a $0.00. Una copia intacta de este turno se guardará en la <b>Bóveda de Cierres</b>.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-2 flex-wrap gap-2 px-2 pb-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">Cancelar</Button>
          <Button onClick={handleCloseDay} className="bg-gradient-to-r from-red-600 to-red-900 text-white font-display tracking-widest hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            <Receipt className="h-4 w-4 mr-2" /> Confirmar Cierre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}