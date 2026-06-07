import { useState, useMemo } from "react";
import { useStore, fmtUsd, fmtBs, type Credit } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MixedPaymentInputs } from "@/components/MixedPaymentInputs";
import { ReceiptDialog, type ReceiptData } from "@/components/Receipt";
import { Search, Receipt as ReceiptIcon } from "lucide-react";

export function CreditsTab() {
  const credits = useStore((s) => s.credits);
  const payCredit = useStore((s) => s.payCredit);
  const rate = useStore((s) => s.rate);

  const [search, setSearch] = useState("");
  const [payObj, setPayObj] = useState<Credit | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return credits;
    return credits.filter(c => c.customer.toLowerCase().includes(q) || (c.note || "").toLowerCase().includes(q));
  }, [credits, search]);

  const [method, setMethod] = useState<"full" | "mixed">("full");
  const [fullPayMode, setFullPayMode] = useState<"cash" | "mobile" | "cash_bs">("cash");
  const [cashUsd, setCashUsd] = useState("");
  const [mobileBs, setMobileBs] = useState("");
  const [cashBs, setCashBs] = useState("");
  
  // 👈 AUDITORÍA BANCARIA AÑADIDA AQUÍ
  const [mobileBank, setMobileBank] = useState("");
  const [mobileRef, setMobileRef] = useState("");
  
  const [billReceived, setBillReceived] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [pending, setPending] = useState(false);

  const openPay = (c: Credit) => {
    setPayObj(c);
    setMethod("full"); setFullPayMode("cash"); setCashUsd(""); setMobileBs(""); setCashBs("");
    setMobileBank(""); setMobileRef(""); setBillReceived("");
    setReceipt(null); setPending(false);
  };

  const closePay = () => setPayObj(null);

  const total = payObj?.amount || 0;

  const cashUsdN = parseFloat(cashUsd) || 0;
  const mobileBsN = parseFloat(mobileBs) || 0;
  const cashBsN = parseFloat(cashBs) || 0;
  const mobileUsd = rate > 0 ? mobileBsN / rate : 0;
  const cashBsUsd = rate > 0 ? cashBsN / rate : 0;
  const paid = method === "full" ? total : cashUsdN + mobileUsd + cashBsUsd;
  const remaining = total - paid;
  
  const resolvedCashUsd = method === "full" ? (fullPayMode === "cash" ? total : 0) : cashUsdN;
  const resolvedMobileBs = method === "full" ? (fullPayMode === "mobile" ? total * rate : 0) : mobileBsN;
  const resolvedCashBs = method === "full" ? (fullPayMode === "cash_bs" ? total * rate : 0) : cashBsN;
  const finalMethod = method === "full" && fullPayMode === "cash_bs" ? "cash_bs" : method;

  const billN = parseFloat(billReceived) || 0;
  const cashTarget = method === "full" && fullPayMode === "cash" ? total : method === "mixed" ? cashUsdN : 0;
  const rawChange = billN - cashTarget;
  const showBill = (method === "full" && fullPayMode === "cash") || (method === "mixed" && cashTarget > 0);
  const changeDisplay = rawChange < 1 ? "$0" : fmtUsd(rawChange);

  // 👈 REGLA DE BLOQUEO CONTABLE
  const needsRef = (method === "full" && fullPayMode === "mobile") || (method === "mixed" && mobileBsN > 0);
  const isValidRef = !needsRef || (mobileBank !== "" && mobileRef.length >= 4);

  const submit = () => {
    if (!payObj) return;
    if (method === "mixed" && remaining > 0.01) return;
    if (!isValidRef) return;
    
    setReceipt({
      ts: Date.now(), rate, minutes: 0, timeAmount: 0,
      items: [{ name: `Abono de Deuda: ${payObj.customer}`, qty: 1, price: total }],
      total, method: finalMethod, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, cashBs: resolvedCashBs,
      customer: { name: payObj.customer }
    });
    setPending(true);
  };

  const handleReceiptClose = () => {
    setReceipt(null);
    if (pending && payObj) {
      payCredit(payObj.id, {
        method: finalMethod, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs,
        mobileBank: needsRef ? mobileBank : undefined, mobileRef: needsRef ? mobileRef : undefined,
        amount: total
      });
      setPending(false);
      closePay();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 w-full max-w-md bg-secondary/20 rounded-md px-3 py-1.5 border border-border/40">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Buscar por cliente o nota..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent border-0 text-sm focus:outline-none w-full text-foreground placeholder:text-muted-foreground" />
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-display tracking-wider border-b border-border">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Nota</th>
              <th className="p-3 text-right">Deuda</th>
              <th className="p-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-8 text-muted-foreground">No hay cuentas por cobrar.</td></tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20">
                  <td className="p-3 text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("es-VE")}</td>
                  <td className="p-3 font-semibold text-foreground">{c.customer}</td>
                  <td className="p-3 text-muted-foreground text-xs">{c.note || "—"}</td>
                  <td className="p-3 text-right font-display text-destructive">{fmtUsd(c.amount)}</td>
                  <td className="p-3 text-center">
                    <Button size="sm" onClick={() => openPay(c)} className="bg-gradient-to-r from-primary to-accent text-white"><ReceiptIcon className="h-4 w-4 mr-1" /> Cobrar</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!payObj && !receipt} onOpenChange={(o) => { if (!o) closePay(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Cobrar Deuda</DialogTitle></DialogHeader>
          {payObj && (
            <div className="space-y-3">
              <Card className="p-3 bg-secondary/40">
                <div className="text-xs uppercase text-muted-foreground mb-1">Cliente: {payObj.customer}</div>
                <div className="flex justify-between font-display text-lg"><span>TOTAL DEUDA</span><span className="text-destructive">{fmtUsd(total)}</span></div>
                <div className="flex justify-between text-sm text-accent"><span>En Bs</span><span>{fmtBs(total, rate)}</span></div>
              </Card>

              <div className="grid grid-cols-2 gap-2"><Button variant={method === "full" ? "default" : "outline"} onClick={() => setMethod("full")}>Completo</Button><Button variant={method === "mixed" ? "default" : "outline"} onClick={() => setMethod("mixed")}>Mixto</Button></div>
              
              {method === "full" && (
                <div className="space-y-2 border border-border rounded-md p-3 bg-background/40">
                  <Label className="text-xs uppercase tracking-wider text-accent font-semibold">¿Cómo pagó?</Label>
                  <RadioGroup value={fullPayMode} onValueChange={(v) => setFullPayMode(v as any)} className="grid grid-cols-1 gap-2">
                    <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="cash" /><div><p className="text-sm font-semibold">Efectivo $</p></div></label>
                    <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "mobile" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="mobile" /><div><p className="text-sm font-semibold">Pago Móvil Bs</p></div></label>
                    <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash_bs" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="cash_bs" /><div><p className="text-sm font-semibold">Efectivo Bs 💵</p></div></label>
                  </RadioGroup>
                  
                  {/* 👈 CELDAS DE AUDITORÍA */}
                  {fullPayMode === "mobile" && (
                    <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-primary/10 rounded-md border border-primary/20">
                      <div><Label className="text-[10px] uppercase font-bold text-primary tracking-wider">Banco *</Label><select className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary" value={mobileBank} onChange={(e) => setMobileBank(e.target.value)}><option value="">Seleccione...</option><option value="Banesco">Banesco</option><option value="Mercantil">Mercantil</option><option value="Venezuela">Venezuela</option><option value="Provincial">Provincial</option><option value="BNC">BNC</option><option value="Bancamiga">Bancamiga</option><option value="Tesoro">Tesoro</option><option value="Otro">Otro</option></select></div>
                      <div><Label className="text-[10px] uppercase font-bold text-primary tracking-wider">Referencia *</Label><Input type="text" maxLength={8} value={mobileRef} onChange={(e) => setMobileRef(e.target.value.replace(/\D/g, ''))} className="h-9 text-xs font-display tracking-widest bg-background" placeholder="Ej: 1234" /></div>
                    </div>
                  )}
                </div>
              )}

              {method === "mixed" && (
                <MixedPaymentInputs total={total} cashUsd={cashUsd} mobileBs={mobileBs} cashBs={cashBs} mobileBank={mobileBank} mobileRef={mobileRef} setCashUsd={setCashUsd} setMobileBs={setMobileBs} setCashBs={setCashBs} setMobileBank={setMobileBank} setMobileRef={setMobileRef} />
              )}
              
              {showBill && cashTarget > 0 && (<div className="space-y-1 border border-border rounded-md p-3 bg-background/40"><Label className="text-xs">Billete recibido ($)</Label><Input type="number" step="0.01" value={billReceived} onChange={(e) => setBillReceived(e.target.value)} placeholder={cashTarget.toFixed(2)} />{billN > 0 && ( <p className={`text-sm ${rawChange < 1 ? "text-muted-foreground" : "text-accent"}`}> Vuelto a entregar: <span className="font-display">{changeDisplay}</span> </p> )}</div>)}
              
              {!isValidRef && <p className="text-xs text-destructive animate-pulse text-center font-bold mt-2">⚠️ REQUERIDO: Selecciona el Banco y escribe la Referencia</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closePay}>Cancelar</Button>
            <Button onClick={submit} disabled={(method === "mixed" && remaining > 0.01) || !isValidRef} className="bg-gradient-to-r from-primary to-accent"><ReceiptIcon className="h-4 w-4 mr-1" />Confirmar Pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ReceiptDialog open={!!receipt} onClose={handleReceiptClose} data={receipt} />
    </div>
  );
}