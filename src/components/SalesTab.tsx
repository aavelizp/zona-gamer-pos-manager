import { useState } from "react";
import { useStore, fmtUsd, type SaleRecord } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ReceiptDialog, type ReceiptData } from "@/components/Receipt";
import { Trash2, FileText, AlertTriangle } from "lucide-react";

export function SalesTab() {
  const sales = useStore((s) => s.sales);
  const deleteSale = useStore((s) => (s as any).deleteSale);
  const resetConsoleStats = useStore((s) => (s as any).resetConsoleStats);
  const consoles = useStore((s) => s.consoles);

  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Ordenar ventas mostrando las más recientes primero
  const sortedSales = [...sales].sort((a, b) => b.ts - a.ts);

  const handleShowReceipt = (sale: SaleRecord) => {
    setReceiptData({
      ts: sale.ts,
      rate: sale.rate,
      consoleName: sale.consoleName,
      minutes: sale.minutes || 0,
      timeAmount: sale.timeAmount,
      items: sale.items,
      total: sale.total,
      method: sale.method,
      cashUsd: sale.cashUsd,
      mobileBs: sale.mobileBs,
      cashBs: sale.cashBs,
      customer: { name: sale.customer || "Consumidor Final" }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <h2 className="font-display text-xl text-primary">📊 Ventas del Día</h2>
        <p className="text-sm text-muted-foreground">{sales.length} transacciones</p>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-display tracking-wider border-b border-border">
            <tr>
              <th className="p-3">Hora</th>
              <th className="p-3">Concepto</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Método</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {sortedSales.length === 0 ? (
              <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">No hay ventas registradas hoy.</td></tr>
            ) : (
              sortedSales.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 text-muted-foreground">{new Date(s.ts).toLocaleTimeString("es-VE", { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-3 font-semibold">{s.concept} {s.consoleName ? `(${s.consoleName})` : ""}</td>
                  <td className="p-3">{s.customer || "—"}</td>
                  <td className="p-3 uppercase text-xs">{s.method}</td>
                  <td className="p-3 text-right font-display text-accent">{fmtUsd(s.total)}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" onClick={() => handleShowReceipt(s)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => {
                        if (confirm("⚠️ ¿Estás seguro de eliminar esta venta? El monto se restará inmediatamente de la caja del día.")) {
                          deleteSale(s.id);
                        }
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border pt-6 mt-6">
        <h2 className="font-display text-lg text-destructive flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" /> Limpiar Historial de Consolas (Datos de Prueba)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {consoles.map(c => (
            <Button key={c.id} variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => {
              if (confirm(`⚠️ ¿Borrar todo el historial y dejar en 0 horas a la ${c.name}?`)) {
                resetConsoleStats(c.id);
              }
            }}>
              Resetear {c.name}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">Al resetear una consola, sus horas totales jugadas volverán a 0. Ideal para borrar datos de pruebas.</p>
      </div>

      <ReceiptDialog open={!!receiptData} onClose={() => setReceiptData(null)} data={receiptData} />
    </div>
  );
}