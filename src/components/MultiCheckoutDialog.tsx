import { useEffect, useMemo, useRef, useState } from "react";
import { useStore, fmtUsd, fmtBs, computeTimeAmount, type Member } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MixedPaymentInputs } from "@/components/MixedPaymentInputs";
import { ReceiptDialog, type ReceiptData } from "@/components/Receipt";
import { Search, X, Plus, Layers, Receipt } from "lucide-react";
import { useNow } from "@/components/ConsoleCard";

function CustomerSearch({ name, idDoc, phone, setName, setIdDoc, setPhone }: any) {
  const members = useStore((s) => s.members);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members.slice(0, 8);
    return members.filter((m) => m.name.toLowerCase().includes(q) || (m.phone || "").includes(q) || (m.idDoc || "").toLowerCase().includes(q)).slice(0, 8);
  }, [members, query]);

  const pick = (m: Member) => { setSelected(m); setName(m.name); setIdDoc(m.idDoc || ""); setPhone(m.phone || ""); setQuery(m.name); setOpen(false); setCreating(false); };
  const clear = () => { setSelected(null); setName(""); setIdDoc(""); setPhone(""); setQuery(""); setCreating(false); };

  return (
    <div className="space-y-2 border border-border rounded-md p-3 bg-background/40">
      <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-wider text-accent font-semibold">Cliente</p>{(selected || creating || name) && (<Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clear}><X className="h-3 w-3 mr-1" />Limpiar</Button>)}</div>
      {!creating && (
        <div ref={wrapRef} className="relative">
          <div className="flex gap-1"><div className="relative flex-1"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); if (selected) setSelected(null); }} onFocus={() => setOpen(true)} placeholder="Buscar cliente..." className="pl-7" /></div><Button type="button" size="icon" variant="outline" onClick={() => { setCreating(true); setOpen(false); setSelected(null); setName(query); setIdDoc(""); setPhone(""); }}><Plus className="h-4 w-4" /></Button></div>
          {open && (<div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-56 overflow-auto">{results.length === 0 ? (<div className="p-2 text-xs text-muted-foreground">Sin coincidencias. <button type="button" className="text-primary underline" onClick={() => { setCreating(true); setOpen(false); setName(query); }}>Crear "{query}"</button></div>) : results.map((m) => (<button key={m.id} type="button" onClick={() => pick(m)} className="w-full text-left px-3 py-2 hover:bg-accent/30 border-b border-border/40 last:border-0"><p className="text-sm font-semibold">{m.name}</p><p className="text-[11px] text-muted-foreground">{m.phone || "sin tel"} · {Math.round(m.totalMinutes / 60)}h</p></button>))}</div>)}
          {selected && (<p className="text-[10px] text-success mt-1">✓ {selected.name} · {Math.round(selected.totalMinutes / 60)}h en Club Gamer</p>)}
        </div>
      )}
      {(creating || selected) && (
        <div className="space-y-2">
          {creating && (<div><Label className="text-xs">Nombre y Apellido *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Pérez" autoFocus /></div>)}
          <div className="grid grid-cols-2 gap-2"><div><Label className="text-xs">Cédula/RIF</Label><Input value={idDoc} onChange={(e) => setIdDoc(e.target.value)} placeholder="V-12345678" /></div><div><Label className="text-xs">Teléfono</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04141234567" /></div></div>
          {creating && name.trim() && phone.trim() && (<p className="text-[10px] text-success">✓ Se creará en el Club Gamer al cobrar</p>)}
        </div>
      )}
    </div>
  );
}

export function MultiCheckoutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const consoles = useStore(s => s.consoles);
  const activeConsoles = consoles.filter(c => c.session);
  const finalizeMulti = useStore(s => (s as any).finalizeMultipleConsoles);
  const rate = useStore(s => s.rate);
  const now = useNow();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [method, setMethod] = useState<"full" | "mixed" | "credit">("full");
  const [fullPayMode, setFullPayMode] = useState<"cash" | "mobile" | "cash_bs">("cash");
  const [cashUsd, setCashUsd] = useState("");
  const [mobileBs, setMobileBs] = useState("");
  const [cashBs, setCashBs] = useState("");
  const [billReceived, setBillReceived] = useState("");
  const [name, setName] = useState("");
  const [idDoc, setIdDoc] = useState("");
  const [phone, setPhone] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [pendingFinalize, setPendingFinalize] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedIds([]);
      setMethod("full"); setFullPayMode("cash"); setCashUsd(""); setMobileBs(""); setCashBs(""); setBillReceived("");
      setName(""); setIdDoc(""); setPhone(""); setReceipt(null); setPendingFinalize(false);
    }
  }, [open]);

  const toggle = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Cálculos agrupados
  let timeAmount = 0;
  let extrasAmount = 0;
  let totalMinutes = 0;
  let items: any[] = [];

  consoles.filter(c => selectedIds.includes(c.id)).forEach(c => {
     const { minutes, amount } = computeTimeAmount(c, now);
     const cTimeAmt = c.session?.prepaid ? 0 : amount;
     timeAmount += cTimeAmt;
     totalMinutes += minutes;

     if (cTimeAmt > 0) items.push({ name: `Tiempo ${c.name} (${minutes} min)`, qty: 1, price: cTimeAmt });
     
     const cExtras = c.charges.reduce((acc, ch) => acc + ch.amount, 0);
     extrasAmount += cExtras;
     c.charges.forEach(ch => items.push({ name: `${c.name}: ${ch.label}`, qty: 1, price: ch.amount }));
  });

  const total = timeAmount + extrasAmount;

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

  const billN = parseFloat(billReceived) || 0;
  const cashTarget = method === "full" && fullPayMode === "cash" ? total : method === "mixed" ? cashUsdN : 0;
  const rawChange = billN - cashTarget;
  const showBill = (method === "full" && fullPayMode === "cash") || (method === "mixed" && cashTarget > 0);

  const buildReceipt = (): ReceiptData => ({
    ts: Date.now(), rate, consoleName: consoles.filter(c => selectedIds.includes(c.id)).map(c => c.name).join(" + "), minutes: totalMinutes,
    timeAmount, items, total, method: finalMethod, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, cashBs: resolvedCashBs,
    customer: { name: name.trim() || "Consumidor Final", idDoc: idDoc.trim() || undefined, phone: phone.trim() || undefined },
  });

  const doFinalize = () => {
    finalizeMulti(selectedIds, {
      method: finalMethod, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, cashBs: resolvedCashBs,
      customer: method === "credit" ? name.trim() : undefined,
      customerInfo: name.trim() ? { name: name.trim(), idDoc: idDoc.trim() || undefined, phone: phone.trim() || undefined } : undefined,
      total, timeAmount, extrasAmount, totalMinutes, items
    });
  };

  const submit = () => {
    if (method === "credit" && !name.trim()) return;
    if (method === "mixed" && remaining > 0.01) return;
    setReceipt(buildReceipt());
    setPendingFinalize(true);
  };

  const handleReceiptClose = () => {
    setReceipt(null);
    if (pendingFinalize) { doFinalize(); setPendingFinalize(false); onClose(); }
  };

  return (
    <>
    <Dialog open={open && !receipt} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Layers className="h-5 w-5 text-purple-500" /> Cobro Múltiple</DialogTitle></DialogHeader>
        <div className="space-y-3">
          
          <div className="border border-border/40 rounded-md p-3 bg-secondary/10">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block font-semibold">Selecciona las consolas a unir:</Label>
            <div className="grid grid-cols-2 gap-2">
              {activeConsoles.map(c => (
                <label key={c.id} className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-colors ${selectedIds.includes(c.id) ? 'border-purple-500 bg-purple-500/10' : 'border-border bg-card hover:bg-muted/50'}`}>
                  <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggle(c.id)} className="accent-purple-500 w-4 h-4" />
                  <span className="text-sm font-semibold">{c.name}</span>
                </label>
              ))}
              {activeConsoles.length === 0 && <p className="text-xs text-muted-foreground col-span-2">No hay consolas ocupadas en este momento.</p>}
            </div>
          </div>

          {selectedIds.length > 0 && (
            <>
              <Card className="p-3 bg-secondary/40">
                <div className="flex justify-between text-sm"><span>Tiempos Unidos</span><span>{fmtUsd(timeAmount)}</span></div>
                <div className="flex justify-between text-sm"><span>Extras y Snacks</span><span>{fmtUsd(extrasAmount)}</span></div>
                <div className="border-t border-border my-2" />
                <div className="flex justify-between font-display text-lg"><span>TOTAL GLOBAL</span><span className="text-purple-400">{fmtUsd(total)}</span></div>
                <div className="flex justify-between text-sm text-accent"><span>En Bs</span><span>{fmtBs(total, rate)}</span></div>
              </Card>

              <CustomerSearch name={name} idDoc={idDoc} phone={phone} setName={setName} setIdDoc={setIdDoc} setPhone={setPhone} />

              <div className="grid grid-cols-3 gap-2">
                <Button variant={method === "full" ? "default" : "outline"} onClick={() => setMethod("full")}>Completo</Button>
                <Button variant={method === "mixed" ? "default" : "outline"} onClick={() => setMethod("mixed")}>Mixto</Button>
                <Button variant={method === "credit" ? "default" : "outline"} onClick={() => setMethod("credit")}>Fiado</Button>
              </div>

              {method === "full" && (
                <div className="space-y-2 border border-border rounded-md p-3 bg-background/40">
                  <Label className="text-xs uppercase tracking-wider text-accent font-semibold">¿Cómo pagó?</Label>
                  <RadioGroup value={fullPayMode} onValueChange={(v) => setFullPayMode(v as any)} className="grid grid-cols-1 gap-2">
                    <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="cash" /><div><p className="text-sm font-semibold">Efectivo $</p></div></label>
                    <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "mobile" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="mobile" /><div><p className="text-sm font-semibold">Pago Móvil Bs</p></div></label>
                    <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash_bs" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="cash_bs" /><div><p className="text-sm font-semibold">Efectivo Bs 💵</p></div></label>
                  </RadioGroup>
                </div>
              )}

              {method === "mixed" && (
                <MixedPaymentInputs total={total} cashUsd={cashUsd} mobileBs={mobileBs} cashBs={cashBs} setCashUsd={setCashUsd} setMobileBs={setMobileBs} setCashBs={setCashBs} />
              )}
              {showBill && cashTarget > 0 && (
                <div className="space-y-1 border border-border rounded-md p-3 bg-background/40"><Label className="text-xs">Billete recibido ($)</Label><Input type="number" step="0.01" value={billReceived} onChange={(e) => setBillReceived(e.target.value)} placeholder={cashTarget.toFixed(2)} />{billN > 0 && ( <p className={`text-sm ${rawChange < 1 ? "text-muted-foreground" : "text-accent"}`}> Vuelto: <span className="font-display">{rawChange < 1 ? "$0" : fmtUsd(rawChange)}</span> </p> )}</div>
              )}
            </>
          )}
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={selectedIds.length === 0 || (method === "mixed" && remaining > 0.01) || (method === "credit" && !name.trim())} className="bg-gradient-to-r from-purple-600 to-primary text-white">
            <Receipt className="h-4 w-4 mr-1" />Confirmar Cobro Global
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ReceiptDialog open={!!receipt} onClose={handleReceiptClose} data={receipt} />
    </>
  );
}