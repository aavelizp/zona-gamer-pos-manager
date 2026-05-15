import { useEffect, useState } from "react";
import { useStore, fmtUsd, fmtBs } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Wallet, AlertTriangle } from "lucide-react";
import { MixedPaymentInputs } from "@/components/MixedPaymentInputs";

export function CreditsTab() {
  const credits = useStore((s) => s.credits);
  const rate = useStore((s) => s.rate);
  const payCredit = useStore((s) => s.payCredit);

  const [payingId, setPayingId] = useState<string | null>(null);
  const credit = credits.find((c) => c.id === payingId);
  const [method, setMethod] = useState<"full" | "mixed">("full");
  const [fullPayMode, setFullPayMode] = useState<"cash" | "mobile">("cash");
  const [cashUsd, setCashUsd] = useState("");
  const [mobileBs, setMobileBs] = useState("");
  const [billReceived, setBillReceived] = useState("");

  useEffect(() => {
    setMethod("full"); setFullPayMode("cash"); setCashUsd(""); setMobileBs(""); setBillReceived("");
  }, [payingId]);

  const total = credit?.amount ?? 0;
  const cashUsdN = parseFloat(cashUsd) || 0;
  const mobileBsN = parseFloat(mobileBs) || 0;
  const mobileUsd = rate > 0 ? mobileBsN / rate : 0;
  const paid = method === "full" ? total : cashUsdN + mobileUsd;
  const remaining = total - paid;
  const covered = paid + 0.01 >= total;

  // Change calc for cash
  const billN = parseFloat(billReceived) || 0;
  const cashTarget = method === "full" && fullPayMode === "cash" ? total : method === "mixed" ? cashUsdN : 0;
  const rawChange = billN - cashTarget;
  const showChange = (method === "full" && fullPayMode === "cash") || (method === "mixed" && cashTarget > 0);
  const changeDisplay = rawChange < 1 ? "$0 (Sin cambio en centavos)" : fmtUsd(rawChange);

  const submit = () => {
    if (!credit) return;
    if (method === "mixed" && !covered) return;
    const resolvedCashUsd = method === "full" ? (fullPayMode === "cash" ? total : 0) : cashUsdN;
    const resolvedMobileBs = method === "full" ? (fullPayMode === "mobile" ? total * rate : 0) : mobileBsN;
    payCredit(credit.id, {
      method,
      cashUsd: resolvedCashUsd,
      mobileBs: resolvedMobileBs,
      amount: total,
    });
    setPayingId(null);
  };

  return (
    <Card className="p-4">
      <h3 className="font-display text-lg mb-3">Cuentas por Cobrar ({credits.length})</h3>
      <div className="space-y-2">
        {credits.map((c) => {
          const over = c.amount > 10;
          return (
            <div key={c.id} className={`grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center p-3 rounded-md ${over ? "bg-warning/10 border border-warning/40" : "bg-secondary/40"}`}>
              <div>
                <p className="font-semibold flex items-center gap-2">
                  {c.customer}
                  {over && <AlertTriangle className="h-4 w-4 text-warning" />}
                </p>
                <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString("es-VE")} {c.note && `· ${c.note}`}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg">{fmtUsd(c.amount)}</p>
                <p className="text-xs text-accent">{fmtBs(c.amount, rate)}</p>
              </div>
              <Button size="sm" onClick={() => setPayingId(c.id)}><Wallet className="h-4 w-4 mr-1" />Pagar</Button>
            </div>
          );
        })}
        {credits.length === 0 && <p className="text-sm text-muted-foreground">Sin deudas activas. 🎉</p>}
      </div>

      <Dialog open={!!payingId} onOpenChange={(o) => !o && setPayingId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Pagar Deuda · {credit?.customer}</DialogTitle></DialogHeader>
          {credit && (
            <div className="space-y-3">
              <Card className="p-3 bg-secondary/40">
                <div className="flex justify-between font-display text-lg"><span>TOTAL</span><span>{fmtUsd(total)}</span></div>
                <div className="flex justify-between text-sm text-accent"><span>En Bs</span><span>{fmtBs(total, rate)}</span></div>
              </Card>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={method === "full" ? "default" : "outline"} onClick={() => setMethod("full")}>Completo</Button>
                <Button variant={method === "mixed" ? "default" : "outline"} onClick={() => setMethod("mixed")}>Mixto</Button>
              </div>
              {method === "full" && (
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant={fullPayMode === "cash" ? "default" : "outline"} onClick={() => setFullPayMode("cash")}>Efectivo $</Button>
                  <Button size="sm" variant={fullPayMode === "mobile" ? "default" : "outline"} onClick={() => setFullPayMode("mobile")}>Pago Móvil Bs</Button>
                </div>
              )}
              {method === "mixed" && (
                <div className="space-y-2">
                  <div><Label>Efectivo $</Label><Input type="number" step="0.01" value={cashUsd} onChange={(e) => setCashUsd(e.target.value)} /></div>
                  <div>
                    <Label>Pago Móvil Bs</Label>
                    <Input type="number" step="0.01" value={mobileBs} onChange={(e) => setMobileBs(e.target.value)} />
                    <p className="text-xs text-muted-foreground">≈ {fmtUsd(mobileUsd)}</p>
                  </div>
                  <div className={`text-sm ${covered ? "text-success" : "text-warning"}`}>
                    Pagado: {fmtUsd(paid)} / {fmtUsd(total)} {covered ? "✓" : `· Falta ${fmtUsd(Math.max(0, remaining))}`}
                  </div>
                </div>
              )}
              {showChange && cashTarget > 0 && (
                <div className="space-y-1 border border-border rounded-md p-3 bg-background/40">
                  <Label className="text-xs">Billete recibido ($)</Label>
                  <Input type="number" step="0.01" value={billReceived} onChange={(e) => setBillReceived(e.target.value)} placeholder={cashTarget.toFixed(2)} />
                  {billN > 0 && (
                    <p className={`text-sm ${rawChange < 1 ? "text-muted-foreground" : "text-accent"}`}>
                      Vuelto a entregar: <span className="font-display">{changeDisplay}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingId(null)}>Cancelar</Button>
            <Button onClick={submit} disabled={method === "mixed" && !covered}>Confirmar Pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
