import { useMemo } from "react";
import { useStore, fmtUsd, fmtBs } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Receipt, AlertTriangle } from "lucide-react";

export function CloseDayDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const sales = useStore((s) => s.sales || []);
  const expenses = useStore((s) => s.expenses || []);
  const closeDay = useStore((s) => s.closeDay);
  const rate = useStore((s) => s.rate);

  const stats = useMemo(() => {
    // 👈 MAGIA AQUÍ: Le enseñamos a la ventana que el turno comienza a las 6:00 AM
    // Así, si estás a la 1:00 AM, buscará las ventas del día anterior correctamente.
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
      count: todaySales.length 
    };
  }, [sales, expenses, rate]);

  const handleCloseDay = () => {
    if (confirm("⚠️ ¿Estás seguro de CERRAR LA CAJA? Esto pondrá los contadores en cero. ¡Asegúrate de descargar el Excel primero!")) {
      closeDay();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" /> Cierre de Caja
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className="p-4 bg-secondary/30 space-y-2 border-primary/20">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Ventas del Turno:</span>
              <span className="font-bold">{stats.count}</span>
            </div>
            <div className="border-t border-border/50 my-2" />
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-green-400">Efectivo ($) en Caja:</span>
              <span className="font-display text-lg text-green-400">{fmtUsd(stats.cashUsd)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-blue-400">Pago Móvil (Bs):</span>
              <span className="font-display text-lg text-blue-400">{fmtBs(stats.mobileBs / rate, rate)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-emerald-400">Efectivo Bs:</span>
              <span className="font-display text-lg text-emerald-400">{fmtBs(stats.cashBs / rate, rate)}</span>
            </div>

            <div className="border-t border-border/50 my-2" />
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-yellow-500">Fiado (Por Cobrar):</span>
              <span className="font-display text-yellow-500">{fmtUsd(stats.credit)}</span>
            </div>
          </Card>

          <div className="bg-warning/10 border border-warning/30 p-3 rounded-md flex gap-2">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <p className="text-[10px] text-warning">Recuerda descargar el reporte en Excel antes de cerrar la caja, ya que los montos volverán a cero.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCloseDay} className="bg-gradient-to-r from-primary to-accent">Confirmar Cierre</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}