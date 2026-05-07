import { useEffect, useState } from "react";
import { useStore, fmtUsd, fmtBs } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Wallet, AlertTriangle } from "lucide-react";

export function CreditsTab() {
  const credits = useStore((s) => s.credits);
  const rate = useStore((s) => s.rate);
  const payCredit = useStore((s) => s.payCredit);

  const [payingId, setPayingId] = useState<string | null>(null);
  const credit = credits.find((c) => c.id === payingId);
  const [method, setMethod] = useState<"full" | "mixed">("full");
  const [cashUsd, setCashUsd] = useState("");
  const [mobileBs, setMobileBs] = useState("");

  useEffect(() => { setMethod("full"); setCashUsd(""); setMobileBs(""); }, [payingId]);

  const total = credit?.amount ?? 0;
  const cashUsdN = parseFloat(cashUsd) || 0;
  const mobileBsN = parseFloat(mobileBs) || 0;
  const mobileUsd = rate > 0 ? mobileBsN / rate : 0;
  const paid = method === "full" ? total : cashUsdN + mobileUsd;
  const remaining = total - paid;

  const submit = () => {
    if (!credit) return;
    if (method === "mixed" && remaining > 0.01) return;
    payCredit(credit.id, {
      method,
      cashUsd: method === "full" ? total : cashUsdN,
      mobileBs: method === "mixed" ? mobileBsN : 0,
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
              {method === "mixed" && (
                <div className="space-y-2">
                  <div><Label>Efectivo $</Label><Input type="number" step="0.01" value={cashUsd} onChange={(e) => setCashUsd(e.target.value)} /></div>
                  <div>
                    <Label>Pago Móvil Bs</Label>
                    <Input type="number" step="0.01" value={mobileBs} onChange={(e) => setMobileBs(e.target.value)} />
                    <p className="text-xs text-muted-foreground">≈ {fmtUsd(mobileUsd)}</p>
                  </div>
                  <div className={`text-sm ${Math.abs(remaining) < 0.01 ? "text-success" : "text-warning"}`}>
                    {remaining > 0.01 ? `Falta: ${fmtUsd(remaining)}` : remaining < -0.01 ? `Vuelto: ${fmtUsd(-remaining)}` : "Pago exacto ✓"}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingId(null)}>Cancelar</Button>
            <Button onClick={submit}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
