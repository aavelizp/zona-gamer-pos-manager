import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export function ReconciliationTab() {
  const sales = useStore((s) => s.sales || []);
  const rate = useStore((s) => s.rate);

  const bankTotals = useMemo(() => {
    // Calculamos desde las 6:00 AM para que cuadre con el Cierre de Caja
    const shiftStart = new Date();
    if (shiftStart.getHours() < 6) {
      shiftStart.setDate(shiftStart.getDate() - 1);
    }
    shiftStart.setHours(6, 0, 0, 0);
    const shiftTime = shiftStart.getTime();

    const todaySales = sales.filter((s) => s && s.ts && s.ts >= shiftTime);
    
    const totals: Record<string, number> = {};
    
    todaySales.forEach((s) => {
      // Sumamos únicamente lo que haya entrado por pago móvil (mobileBs)
      if (s.mobileBs && s.mobileBs > 0) {
        const bank = s.mobileBank || "Banco no especificado";
        totals[bank] = (totals[bank] || 0) + s.mobileBs;
      }
    });

    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [sales]);

  const totalMobile = bankTotals.reduce((acc, [_, amount]) => acc + amount, 0);

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6 border-teal-500/30 bg-teal-500/5">
        <h3 className="font-display text-lg text-teal-400 flex items-center gap-2 mb-2">
          <Building2 className="h-5 w-5" /> Conciliación Bancaria
        </h3>
        <p className="text-sm text-muted-foreground">
          Total recibido por Pago Móvil o Transferencia en este turno, agrupado por banco emisor.
        </p>
      </Card>

      <Card className="border-border/40 overflow-hidden p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-border/50 gap-2">
          <h4 className="font-bold text-foreground">Total General en Bancos</h4>
          <span className="font-display text-2xl text-blue-400">Bs {totalMobile.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</span>
        </div>

        {bankTotals.length === 0 ? (
          <p className="text-center text-muted-foreground italic py-8">No hay pagos móviles registrados en este turno.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankTotals.map(([bank, amount]) => (
              <div key={bank} className="bg-secondary/20 border border-border/50 rounded-xl p-4 flex flex-col justify-center items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold text-center">{bank}</span>
                <span className="font-display text-xl text-foreground">Bs {amount.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}