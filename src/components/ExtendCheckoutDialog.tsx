import { useEffect, useState } from "react";
import { useStore, fmtUsd, fmtBs, type ConsoleState } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MixedPaymentInputs } from "@/components/MixedPaymentInputs";
import { ReceiptDialog, type ReceiptData } from "@/components/Receipt";
import { Receipt } from "lucide-react";

interface ExtendProps {
  open: boolean;
  onClose: () => void;
  consoleObj: ConsoleState;
  addMinutes: number;
}

export function ExtendCheckoutDialog({ open, onClose, consoleObj, addMinutes }: ExtendProps) {
  const rate = useStore((s) => s.rate);
  const extendSession = useStore((s) => s.extendPaidSession);

  const total = +(consoleObj.ratePerHour * (addMinutes / 60)).toFixed(2);

  const [method, setMethod] = useState<"full" | "mixed" | "credit">("full");
  const [fullPayMode, setFullPayMode] = useState<"cash" | "mobile" | "cash_bs">("cash");
  const [cashUsd, setCashUsd] = useState("");
  const [mobileBs, setMobileBs] = useState("");
  const [cashBs, setCashBs] = useState("");
  const [mobileBank, setMobileBank] = useState(""); // 👈 AUDITORÍA
  const [mobileRef, setMobileRef] = useState("");   // 👈 AUDITORÍA
  
  const [name, setName] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setMethod("full"); setFullPayMode("cash"); setCashUsd(""); setMobileBs(""); setCashBs(""); setMobileBank(""); setMobileRef("");
      setName(consoleObj.session?.customerName || ""); setReceipt(null); setPending(false);
    }
  }, [open, consoleObj.session?.customerName]);

  const cashUsdN = parseFloat(cashUsd) || 0;
  const mobileBsN = parseFloat(mobileBs) || 0;
  const cashBsN = parseFloat(cashBs) || 0;
  const mobileUsd = rate > 0 ? mobileBsN / rate : 0;
  const cashBsUsd = rate > 0 ? cashBsN / rate : 0;
  const paid = method === "full" ? total : method === "mixed" ? (cashUsdN + mobileUsd + cashBsUsd) : 0;
  const remaining = total - paid;
  
  const resolvedCashUsd = method === "full" ? (fullPayMode === "cash" ? total : 0) : method === "mixed" ? cashUsdN : 0;
  const resolvedMobileBs = method === "full" ? (fullPayMode === "mobile" ? total * rate : 0) : method === "mixed" ? mobileBsN : 0;
  const resolvedCashBs = method === "full" ? (fullPayMode === "cash_bs" ? total * rate : 0) : method === "mixed" ? cashBsN : 0;
  const finalMethod = method === "full" && fullPayMode === "cash_bs" ? "cash_bs" : method;

  // REGLA DE AUDITORÍA
  const needsRef = (method === "full" && fullPayMode === "mobile") || (method === "mixed" && mobileBsN > 0);
  const isValidRef = !needsRef || (mobileBank !== "" && mobileRef.length >= 4);

  const submit = () => {
    if (method === "mixed" && remaining > 0.01) return;
    if (method === "credit" && !name.trim()) return;
    if (!isValidRef) return;
    
    setReceipt({
      ts: Date.now(), rate, consoleName: consoleObj.name, minutes: addMinutes, timeAmount: total,
      items: [{ name: `Extensión ${consoleObj.name} (+${addMinutes} min)`, qty: 1, price: total }],
      total, method: finalMethod, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, cashBs: resolvedCashBs,
      customer: { name: name.trim() || "Consumidor Final" },
    });
    setPending(true);
  };

  const handleReceiptClose = () => {
    setReceipt(null);
    if (pending) {
      extendSession(consoleObj.id, addMinutes, { method: finalMethod, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, mobileBank: needsRef ? mobileBank : undefined, mobileRef: needsRef ? mobileRef : undefined, total, customer: name.trim() || undefined });
      setPending(false);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open && !receipt} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Extender Tiempo · {consoleObj.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Card className="p-3 bg-secondary/40">
              <div className="flex justify-between text-sm"><span>Extensión prepagada</span><span>+{addMinutes} min</span></div>
              <div className="border-t border-border my-2" />
              <div className="flex justify-between font-display text-lg"><span>TOTAL</span><span>{fmtUsd(total)}</span></div>
            </Card>
            <div><Label className="text-xs">Cliente</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            
            <div className="grid grid-cols-3 gap-2"> <Button variant={method === "full" ? "default" : "outline"} onClick={() => setMethod("full")}>Completo</Button> <Button variant={method === "mixed" ? "default" : "outline"} onClick={() => setMethod("mixed")}>Mixto</Button> <Button variant={method === "credit" ? "default" : "outline"} onClick={() => setMethod("credit")}>Fiado</Button> </div>
            
            {method === "full" && (
              <div className="space-y-2 border border-border rounded-md p-3 bg-background/40">
                <Label className="text-xs uppercase tracking-wider text-accent font-semibold">¿Cómo pagó?</Label>
                <RadioGroup value={fullPayMode} onValueChange={(v) => setFullPayMode(v as any)} className="grid grid-cols-1 gap-2">
                  <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="cash" /><div><p className="text-sm font-semibold">Efectivo $</p></div></label>
                  <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "mobile" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="mobile" /><div><p className="text-sm font-semibold">Pago Móvil Bs</p></div></label>
                  <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash_bs" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="cash_bs" /><div><p className="text-sm font-semibold">Efectivo Bs 💵</p></div></label>
                </RadioGroup>
                
                {fullPayMode === "mobile" && (
                  <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-primary/10 rounded-md border border-primary/20">
                    <div><Label className="text-[10px] uppercase font-bold text-primary tracking-wider">Banco *</Label><select className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary" value={mobileBank} onChange={(e) => setMobileBank(e.target.value)}><option value="">Seleccione...</option><option value="Banesco">Banesco</option><option value="Mercantil">Mercantil</option><option value="Venezuela">Venezuela</option><option value="Provincial">Provincial</option><option value="BNC">BNC</option><option value="Bancamiga">Bancamiga</option><option value="Tesoro">Tesoro</option><option value="Otro">Otro</option></select></div>
                    <div><Label className="text-[10px] uppercase font-bold text-primary tracking-wider">Referencia *</Label><Input type="text" maxLength={8} value={mobileRef} onChange={(e) => setMobileRef(e.target.value.replace(/\D/g, ''))} className="h-9 text-xs font-display tracking-widest bg-background" placeholder="Ej: 1234" /></div>
                  </div>
                )}
              </div>
            )}
            
            {method === "mixed" && (<MixedPaymentInputs total={total} cashUsd={cashUsd} mobileBs={mobileBs} cashBs={cashBs} mobileBank={mobileBank} mobileRef={mobileRef} setCashUsd={setCashUsd} setMobileBs={setMobileBs} setCashBs={setCashBs} setMobileBank={setMobileBank} setMobileRef={setMobileRef} />)}
            
            {!isValidRef && <p className="text-xs text-destructive animate-pulse text-center font-bold mt-2">⚠️ REQUERIDO: Selecciona el Banco y escribe la Referencia</p>}
          </div>
          <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={submit} disabled={(method === "mixed" && remaining > 0.01) || !isValidRef || (method === "credit" && !name.trim())} className="bg-gradient-to-r from-primary to-accent"><Receipt className="h-4 w-4 mr-1" />Cobrar y Extender</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ReceiptDialog open={!!receipt} onClose={handleReceiptClose} data={receipt} />
    </>
  );
}