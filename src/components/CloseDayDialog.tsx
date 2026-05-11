import { useMemo, useRef, useState } from "react";
import { useStore, fmtUsd, fmtBs } from "@/lib/store";
import { exportData } from "@/lib/excel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { AlertTriangle, FileSpreadsheet, RotateCcw, Gamepad2, ShoppingBag, Banknote, Smartphone, HandCoins, Receipt, ImageDown } from "lucide-react";
import { toast } from "sonner";
import { toPng } from "html-to-image";

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
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const downloadImage = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      // Wait a frame so layout is stable
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const dataUrl = await toPng(reportRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      link.download = `Cierre_Caja_${date}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Imagen descargada");
    } catch (e) {
      console.error(e);
      toast.error("Error al generar la imagen");
    } finally {
      setDownloading(false);
    }
  };

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

        <div ref={reportRef} style={{ backgroundColor: "#ffffff", color: "#0f172a", padding: "20px", borderRadius: 8, fontFamily: "Hind, system-ui, sans-serif" }}>
          <div style={{ textAlign: "center", paddingBottom: 12, borderBottom: "2px solid #0f172a", marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 24, margin: 0, color: "#0f172a" }}>RESUMEN DE CIERRE DIARIO · TWINS GAMER</h2>
            <p style={{ fontSize: 12, margin: "4px 0 0", color: "#475569" }}>{new Date().toLocaleString("es-VE")} · Tasa: Bs {rate}/$</p>
          </div>

          {/* Total */}
          <div style={{ padding: 16, borderRadius: 8, backgroundColor: "#eff6ff", border: "2px solid #3b82f6", marginBottom: 12 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#475569" }}>Total Facturado Hoy</div>
            <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 32, color: "#1d4ed8" }}>{fmtUsd(report.totalUsd)}</div>
            <div style={{ color: "#0e7490" }}>{fmtBs(report.totalUsd, rate)}</div>
          </div>

          {/* Por categoría */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ padding: 12, borderRadius: 8, border: "1px solid #cbd5e1", backgroundColor: "#f8fafc" }}>
              <div style={{ fontSize: 11, color: "#475569" }}>🎮 Horas de Juego</div>
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20, color: "#0f172a" }}>{fmtUsd(report.horasUsd)}</div>
              <div style={{ fontSize: 11, color: "#0e7490" }}>{fmtBs(report.horasUsd, rate)}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, border: "1px solid #cbd5e1", backgroundColor: "#f8fafc" }}>
              <div style={{ fontSize: 11, color: "#475569" }}>🛍️ Inventario / Snacks</div>
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20, color: "#0f172a" }}>{fmtUsd(report.inventarioUsd)}</div>
              <div style={{ fontSize: 11, color: "#0e7490" }}>{fmtBs(report.inventarioUsd, rate)}</div>
            </div>
          </div>

          {/* Arqueo */}
          <h3 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 13, textTransform: "uppercase", letterSpacing: 2, color: "#475569", margin: "12px 0 8px" }}>Arqueo por Método de Pago</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ padding: 12, borderRadius: 8, border: "1px solid #22c55e", backgroundColor: "#f0fdf4" }}>
              <div style={{ fontSize: 11, color: "#475569" }}>💵 Efectivo en Caja ($)</div>
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20, color: "#15803d" }}>{fmtUsd(report.cashUsd)}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, border: "1px solid #3b82f6", backgroundColor: "#eff6ff" }}>
              <div style={{ fontSize: 11, color: "#475569" }}>📱 Pago Móvil / Transferencia (Bs)</div>
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20, color: "#1d4ed8" }}>Bs {report.mobileBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</div>
              <div style={{ fontSize: 11, color: "#475569" }}>≈ {fmtUsd(report.mobileBs / (rate || 1))}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, border: "1px solid #f59e0b", backgroundColor: "#fffbeb" }}>
              <div style={{ fontSize: 11, color: "#475569" }}>🤝 Fiado Otorgado Hoy</div>
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20, color: "#b45309" }}>{fmtUsd(report.fiadoHoy)}</div>
              <div style={{ fontSize: 11, color: "#475569" }}>No está en caja</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, border: "1px solid #10b981", backgroundColor: "#ecfdf5" }}>
              <div style={{ fontSize: 11, color: "#475569" }}>🧾 Deudas Recuperadas Hoy</div>
              <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 20, color: "#047857" }}>{fmtUsd(report.deudasCobradas)}</div>
            </div>
          </div>

          {/* Cuadre */}
          <div style={{ padding: 12, borderRadius: 8, border: "1px solid #cbd5e1", backgroundColor: "#f1f5f9" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#475569", marginBottom: 4 }}>Total Esperado en Caja</div>
            <div style={{ fontSize: 13, color: "#0f172a" }}>Efectivo $: <span style={{ fontFamily: "'Archivo Black', sans-serif" }}>{fmtUsd(report.cashUsd)}</span></div>
            <div style={{ fontSize: 13, color: "#0f172a" }}>Pago Móvil Bs: <span style={{ fontFamily: "'Archivo Black', sans-serif" }}>Bs {report.mobileBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })}</span></div>
          </div>
        </div>


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
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
          </Button>
          <Button variant="outline" onClick={downloadImage} disabled={downloading}>
            <ImageDown className="h-4 w-4 mr-1" /> {downloading ? "Generando..." : "Descargar Resumen (Imagen)"}
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
