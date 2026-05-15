import { useEffect, useState } from "react";
import { MixedPaymentInputs } from "@/components/MixedPaymentInputs";
import { useStore, fmtUsd, fmtBs, type ConsoleState } from "@/lib/store";
import { ReceiptDialog, type ReceiptData } from "@/components/Receipt";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  consoleObj: ConsoleState;
  addMinutes: number;
}

export function ExtendCheckoutDialog({ open, onClose, consoleObj, addMinutes }: Props) {
  const rate = useStore((s) => s.rate);
  const extend = useStore((s) => s.extendPaidSession);

  const total = +(consoleObj.ratePerHour * (addMinutes / 60)).toFixed(2);

  const [method, setMethod] = useState<"full" | "mixed" | "credit">("full");
  const [fullPayMode, setFullPayMode] = useState<"cash" | "mobile">("cash");
  const [cashUsd, setCashUsd] = useState("");
  const [mobileBs, setMobileBs] = useState("");
  const [name, setName] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setMethod("full"); setFullPayMode("cash"); setCashUsd(""); setMobileBs("");
      setName(consoleObj.session?.customerName || ""); setReceipt(null); setPending(false);
    }
  }, [open, consoleObj.session?.customerName]);

  const cashUsdN = parseFloat(cashUsd) || 0;
  const mobileBsN = parseFloat(mobileBs) || 0;
  const mobileUsd = rate > 0 ? mobileBsN / rate : 0;
  const paid = method === "full" ? total : method === "mixed" ? cashUsdN + mobileUsd : 0;
  const remaining = total - paid;
  const resolvedCashUsd = method === "full" ? (fullPayMode === "cash" ? total : 0) : method === "mixed" ? cashUsdN : 0;
  const resolvedMobileBs = method === "full" ? (fullPayMode === "mobile" ? total * rate : 0) : method === "mixed" ? mobileBsN : 0;

  const submit = () => {
    if (method === "mixed" && remaining > 0.01) return;
    if (method === "credit" && !name.trim()) return;
    setReceipt({
      ts: Date.now(), rate, consoleName: consoleObj.name, minutes: addMinutes,
      timeAmount: total,
      items: [{ name: `Extensión ${consoleObj.name} (+${addMinutes} min)`, qty: 1, price: total }],
      total, method, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs,
      customer: { name: name.trim() || "Consumidor Final" },
    });
    setPending(true);
  };

  const handleReceiptClose = () => {
    setReceipt(null);
    if (pending) {
      extend(consoleObj.id, addMinutes, { method, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, total, customer: name.trim() || undefined });
      setPending(false);
      onClose();
      toast.success(`+${addMinutes} min añadidos. La sesión continúa.`);
    }
  };

  return (
    <>
      <Dialog open={open && !receipt} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Extender +{addMinutes} min · {consoleObj.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Card className="p-3 bg-secondary/40">
              <div className="flex justify-between text-sm"><span>Tiempo extra</span><span>+{addMinutes} min</span></div>
              <div className="flex justify-between font-display text-lg"><span>TOTAL</span><span>{fmtUsd(total)}</span></div>
              <div className="flex justify-between text-sm text-accent"><span>En Bs</span><span>{fmtBs(total, rate)}</span></div>
            </Card>
            <div>
              <Label className="text-xs">Cliente</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant={method === "full" ? "default" : "outline"} onClick={() => setMethod("full")}>Completo</Button>
              <Button variant={method === "mixed" ? "default" : "outline"} onClick={() => setMethod("mixed")}>Mixto</Button>
              <Button variant={method === "credit" ? "default" : "outline"} onClick={() => setMethod("credit")}>Fiado</Button>
            </div>
            {method === "full" && (
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant={fullPayMode === "cash" ? "default" : "outline"} onClick={() => setFullPayMode("cash")}>Efectivo $</Button>
                <Button size="sm" variant={fullPayMode === "mobile" ? "default" : "outline"} onClick={() => setFullPayMode("mobile")}>Pago Móvil Bs</Button>
              </div>
            )}
            {method === "mixed" && (
              <MixedPaymentInputs
                total={total}
                cashUsd={cashUsd}
                mobileBs={mobileBs}
                setCashUsd={setCashUsd}
                setMobileBs={setMobileBs}
              />
            )}
            {method === "credit" && !name.trim() && <p className="text-xs text-destructive">Indica el nombre del cliente para fiar.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              onClick={submit}
              disabled={
                (method === "mixed" && remaining > 0.01) ||
                (method === "credit" && !name.trim())
              }
              className="bg-gradient-to-r from-primary to-accent"
            >
              <Receipt className="h-4 w-4 mr-1" /> Cobrar y extender
            </Button>
          </DialogFooter>
          <p className="text-[10px] text-muted-foreground text-center">El cronómetro NO se corta. Se le suman los minutos.</p>
        </DialogContent>
      </Dialog>
      <ReceiptDialog open={!!receipt} onClose={handleReceiptClose} data={receipt} />
    </>
  );
}
