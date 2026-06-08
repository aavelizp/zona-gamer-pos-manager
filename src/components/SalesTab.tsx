import { useStore, fmtUsd, fmtBs } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Clock, AlertOctagon, Trash2 } from "lucide-react";
import { exportData } from "@/lib/excel";

export function SalesTab() {
  const sales = useStore((s) => s.sales || []);
  const pastClosures = useStore((s) => (s as any).pastClosures || []);
  const products = useStore((s) => s.products || []);
  const credits = useStore((s) => s.credits || []);
  const rate = useStore((s) => s.rate);
  const deleteSale = useStore((s) => s.deleteSale);

  const formatDate = (ts: number) => {
    if (!ts) return "Fecha desconocida";
    return new Date(ts).toLocaleString("es-VE", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-md flex items-start gap-3">
        <AlertOctagon className="h-6 w-6 text-red-500 shrink-0" />
        <div>
          <h3 className="text-red-400 font-bold uppercase tracking-widest">Panel de Rescate de Datos</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Aquí ves <b>TODO</b> el historial sin filtros de fecha ni hora. Si el sistema te ocultó las ventas por pasar de la medianoche, las encontrarás en la primera tabla. Si por error le diste a "Cerrar Caja", las encontrarás intactas en la <b>Bóveda de Cierres Anteriores</b> más abajo.
          </p>
        </div>
      </div>

      <Card className="p-4 border-primary/30 shadow-[0_0_15px_rgba(158,84,255,0.1)]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-lg text-primary flex items-center gap-2">
            <Clock className="h-5 w-5" /> Ventas Activas en Memoria
          </h3>
          <Button onClick={() => exportData({ sales, products, credits, rate })} variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/10">
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar a Excel
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-2">Fecha/Hora</th>
                <th className="p-2">Concepto</th>
                <th className="p-2">Cliente</th>
                <th className="p-2 text-right">Total</th>
                <th className="p-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sales.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground italic">No hay ventas activas. Si cerraste la caja, revisa la bóveda abajo.</td></tr>
              ) : (
                [...sales].sort((a,b) => b.ts - a.ts).map(s => (
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="p-2 font-mono text-xs">{formatDate(s.ts)}</td>
                    <td className="p-2">{s.concept}</td>
                    <td className="p-2">{s.customer || "---"}</td>
                    <td className="p-2 text-right font-bold text-accent">{fmtUsd(s.total)}</td>
                    <td className="p-2 text-center">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:bg-red-500/10" onClick={() => { if(confirm("¿Seguro que deseas eliminar esta venta?")) deleteSale(s.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
        <h3 className="font-display text-lg text-yellow-500 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" /> Bóveda de Cierres Anteriores (Caja Fuerte)
        </h3>
        <div className="space-y-4">
          {pastClosures.length === 0 ? (
            <p className="text-center text-muted-foreground italic p-4">No hay cierres guardados en la bóveda aún.</p>
          ) : (
            [...pastClosures].sort((a:any, b:any) => b.date - a.date).map((closure: any) => (
              <div key={closure.id} className="border border-border/50 rounded-md p-4 bg-secondary/20 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="font-bold text-yellow-400 text-lg">Cierre del {formatDate(closure.date)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cantidad de Ventas: {closure.sales?.length || 0} | Ingreso Bruto: <span className="text-white font-bold">{fmtUsd(closure.totalSales)}</span>
                  </p>
                </div>
                <Button onClick={() => exportData({ sales: closure.sales || [], products, credits, rate })} variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/10">
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Descargar Excel de este Cierre
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}