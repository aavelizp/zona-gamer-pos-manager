import { useMemo, useState } from "react";
import { useStore, fmtUsd, fmtBs } from "@/lib/store";
import { exportData } from "@/lib/excel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { AlertTriangle, FileSpreadsheet, RotateCcw, Gamepad2, ShoppingBag, Banknote, Smartphone, HandCoins, Receipt } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function CloseDayDialog({ open, onOpenChange }: Props) {
  const rate = useStore((s) => s.rate);
  const sales = useStore((s) => s.sales);
  const products = useStore((s) => s.products);
  const credits = useStore((s) => s.credits);
  const closeDay = useStore((s) => s.closeDay);
  const [confirming, setConfirming] = useState(false);

  const report = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const today = sales.filter((s) => s.ts >= start.getTime());

    const totalUsd = today.reduce((a, s) => a + s.total, 0);
    const horasUsd = today.reduce((a, s) => a + (s.timeAmount || 0), 0);
    const inventarioUsd = today.reduce((a, s) => a + (s.concept === "Consola" ? (s.extrasAmount || 0) : 0), 0);
    const cashUsd = today.reduce((a, s) => a + (s.cashUsd || 0), 0);
    const mobileBs = today.reduce((a, s) => a + (s.mobileBs || 0), 0);
    const deudasCobradas = today.filter((s) => s.concept === "Deuda Cobrada").reduce((a, s) => a + s.total, 0);

    // Credits granted today (still in credits list with createdAt today)
    const fiadoHoy = credits.filter((c) => c.createdAt >= start.getTime()).reduce((a, c) => a + c.amount, 0);

    return { today, totalUsd, horasUsd, inventarioUsd, cashUsd, mobileBs, deudasCobradas, fiadoHoy };
  }, [sales, credits]);

  const handleClose = () => {
    // Force backup export first
    exportData({ sales: report.today, products, credits, rate });
    closeDay();
    toast.success("Caja cerrada. Respaldo descargado.");
    setConfirming(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" /> CIERRE DE CAJA
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{new Date().toLocaleString("es-VE")} · Tasa: Bs {rate}/$</p>
        </DialogHeader>

        {/* Total */}
        <Card className="p-4 bg-primary/10 border-primary/40">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Total Facturado Hoy</div>
          <div className="font-display text-3xl text-primary">{fmtUsd(report.totalUsd)}</div>
          <div className="text-accent">{fmtBs(report.totalUsd, rate)}</div>
        </Card>

        {/* Por categoría */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Gamepad2 className="h-4 w-4" /> Horas de Juego</div>
            <div className="font-display text-xl">{fmtUsd(report.horasUsd)}</div>
            <div className="text-xs text-accent">{fmtBs(report.horasUsd, rate)}</div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShoppingBag className="h-4 w-4" /> Inventario / Snacks</div>
            <div className="font-display text-xl">{fmtUsd(report.inventarioUsd)}</div>
            <div className="text-xs text-accent">{fmtBs(report.inventarioUsd, rate)}</div>
          </Card>
        </div>

        {/* Arqueo por método */}
        <div>
          <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground mb-2">Arqueo por Método de Pago</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Card className="p-3 border-green-500/30">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Banknote className="h-4 w-4 text-green-500" /> Efectivo en Caja ($)</div>
              <div className="font-display text-xl text-green-500">{fmtUsd(report.cashUsd)}</div>
            </Card>
            <Card className="p-3 border-blue-500/30">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Smartphone className="h-4 w-4 text-blue-400" /> Pago Móvil / Transferencia (Bs)</div>
              <div className="font-display text-xl text-blue-400">Bs {report.mobileBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</div>
              <div className="text-xs text-muted-foreground">≈ {fmtUsd(report.mobileBs / (rate || 1))}</div>
            </Card>
            <Card className="p-3 border-amber-500/30">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><HandCoins className="h-4 w-4 text-amber-500" /> Fiado Otorgado Hoy</div>
              <div className="font-display text-xl text-amber-500">{fmtUsd(report.fiadoHoy)}</div>
              <div className="text-xs text-muted-foreground">No está en caja</div>
            </Card>
            <Card className="p-3 border-emerald-500/30">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Receipt className="h-4 w-4 text-emerald-500" /> Deudas Recuperadas Hoy</div>
              <div className="font-display text-xl text-emerald-500">{fmtUsd(report.deudasCobradas)}</div>
            </Card>
          </div>
        </div>

        {/* Cuadre */}
        <Card className="p-3 bg-secondary/30">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total Esperado en Caja</div>
          <div className="text-sm">Efectivo $: <span className="font-display text-base">{fmtUsd(report.cashUsd)}</span></div>
          <div className="text-sm">Pago Móvil Bs: <span className="font-display text-base">Bs {report.mobileBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</span></div>
        </Card>

        {confirming && (
          <Card className="p-3 border-destructive/60 bg-destructive/10">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold">¿Estás seguro?</p>
                <p className="text-xs text-muted-foreground">Se borrarán los datos de ventas de HOY. Asegúrate de haber descargado tu reporte primero. NO se tocarán: inventario, cuentas por cobrar, clientes del Club Gamer, ni los minutos acumulados históricos de las consolas.</p>
              </div>
            </div>
          </Card>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => exportData({ sales: report.today, products, credits, rate })}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Descargar Excel
          </Button>
          {!confirming ? (
            <Button variant="destructive" onClick={() => setConfirming(true)}>
              <RotateCcw className="h-4 w-4 mr-1" /> Finalizar Día y Reiniciar Caja
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setConfirming(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleClose}>
                <RotateCcw className="h-4 w-4 mr-1" /> Sí, Cerrar y Reiniciar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
