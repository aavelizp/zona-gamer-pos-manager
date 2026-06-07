import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useStore, fmtUsd, fmtBs, computeTimeAmount, type ConsoleState, type Member, type Combo } from "@/lib/store";
import { playAlert, playPreAlert } from "@/lib/sound";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Gamepad2, Sparkles, Package, Coins, ShoppingBag, Receipt, Plus, Search, X, User, AlertTriangle, Pause, Play, Trash2, ArrowRightLeft, Trophy } from "lucide-react";
import { ReceiptDialog, type ReceiptData } from "@/components/Receipt";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ExtendCheckoutDialog } from "@/components/ExtendCheckoutDialog";
import { MixedPaymentInputs } from "@/components/MixedPaymentInputs";

function CustomerSearch({ name, idDoc, phone, setName, setIdDoc, setPhone }: any) {
  const members = useStore((s) => s.members || []); const [query, setQuery] = useState(""); const [open, setOpen] = useState(false); const [creating, setCreating] = useState(false); const [selected, setSelected] = useState<Member | null>(null); const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const onClick = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", onClick); return () => document.removeEventListener("mousedown", onClick); }, []);
  const results = useMemo(() => { const q = (query || "").trim().toLowerCase(); const safeMembers = Array.isArray(members) ? members : []; if (!q) return safeMembers.slice(0, 8); return safeMembers.filter((m) => (m?.name || "").toLowerCase().includes(q) || (m?.phone || "").includes(q) || (m?.idDoc || "").toLowerCase().includes(q)).slice(0, 8); }, [members, query]);
  const pick = (m: Member) => { setSelected(m); setName(m.name || ""); setIdDoc(m.idDoc || ""); setPhone(m.phone || ""); setQuery(m.name || ""); setOpen(false); setCreating(false); }; const clear = () => { setSelected(null); setName(""); setIdDoc(""); setPhone(""); setQuery(""); setCreating(false); };
  return (
    <div className="space-y-2 border border-border rounded-md p-3 bg-background/40">
      <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-wider text-accent font-semibold">Cliente</p>{(selected || creating || name) && (<Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clear}><X className="h-3 w-3 mr-1" />Limpiar</Button>)}</div>
      {!creating && ( <div ref={wrapRef} className="relative"> <div className="flex gap-1"><div className="relative flex-1"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); if (selected) setSelected(null); }} onFocus={() => setOpen(true)} placeholder="Buscar cliente..." className="pl-7" /></div><Button type="button" size="icon" variant="outline" onClick={() => { setCreating(true); setOpen(false); setSelected(null); setName(query); setIdDoc(""); setPhone(""); }}><Plus className="h-4 w-4" /></Button></div> {open && (<div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-56 overflow-auto">{results.length === 0 ? (<div className="p-2 text-xs text-muted-foreground">Sin coincidencias. <button type="button" className="text-primary underline" onClick={() => { setCreating(true); setOpen(false); setName(query); }}>Crear "{query}"</button></div>) : results.map((m) => (<button key={m.id} type="button" onClick={() => pick(m)} className="w-full text-left px-3 py-2 hover:bg-accent/30 border-b border-border/40 last:border-0"><p className="text-sm font-semibold">{m.name}</p><p className="text-[11px] text-muted-foreground">{m.phone || "sin tel"} · {Math.round((m.totalMinutes||0) / 60)}h</p></button>))}</div>)} {selected && (<p className="text-[10px] text-success mt-1">✓ {selected.name} · {Math.round((selected.totalMinutes||0) / 60)}h en Club Gamer</p>)} </div> )}
      {(creating || selected) && ( <div className="space-y-2"> {creating && (<div><Label className="text-xs">Nombre y Apellido *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Pérez" autoFocus /></div>)} <div className="grid grid-cols-2 gap-2"><div><Label className="text-xs">Cédula/RIF</Label><Input value={idDoc} onChange={(e) => setIdDoc(e.target.value)} placeholder="V-12345678" /></div><div><Label className="text-xs">Teléfono</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04141234567" /></div></div> {creating && name.trim() && phone.trim() && (<p className="text-[10px] text-success">✓ Se creará en el Club Gamer al cobrar</p>)} </div> )}
    </div>
  );
}

function useNow(intervalMs = 1000) { const [now, setNow] = useState(Date.now()); useEffect(() => { const id = setInterval(() => setNow(Date.now()), intervalMs); return () => clearInterval(id); }, [intervalMs]); return now; }
function formatDuration(ms: number) { const sign = ms < 0 ? "-" : ""; const abs = Math.abs(ms); const total = Math.floor(abs / 1000); const h = Math.floor(total / 3600); const m = Math.floor((total % 3600) / 60); const s = total % 60; const pad = (n: number) => n.toString().padStart(2, "0"); return `${sign}${pad(h)}:${pad(m)}:${pad(s)}`; }

function SnackPicker({ consoleId, open, onClose }: any) { const products = useStore((s) => s.products || []); const rate = useStore((s) => s.rate); const addSnack = useStore((s) => s.addSnackToConsole); return ( <Dialog open={open} onOpenChange={onClose}> <DialogContent><DialogHeader><DialogTitle className="font-display">Añadir Snack</DialogTitle></DialogHeader><div className="grid grid-cols-2 gap-2 max-h-80 overflow-auto">{products.map((p) => (<Button key={p.id} variant="secondary" className="h-auto py-3 flex flex-col items-start" disabled={p.stock <= 0} onClick={() => { addSnack(consoleId, p.id, 1); onClose(); }}><span className="font-semibold">{p.name}</span><span className="text-xs text-muted-foreground">{fmtUsd(p.price)} · {fmtBs(p.price, rate)}</span><span className={`text-xs ${p.stock <= 0 ? "text-destructive" : "text-muted-foreground"}`}>{p.stock <= 0 ? "Agotado" : `Stock: ${p.stock}`}</span></Button>))}</div></DialogContent> </Dialog> ); }

function ComboPicker({ consoleId, open, onClose }: any) { const combos = useStore((s) => s.combos || []); const products = useStore((s) => s.products || []); const rate = useStore((s) => s.rate); const apply = useStore((s) => s.applyComboToConsole); const canApply = (cId: string) => { const c = combos.find((x) => x.id === cId); if (!c) return false; return (c.items||[]).every((it) => (products.find((p) => p.id === it.productId)?.stock ?? 0) >= it.qty); }; return ( <Dialog open={open} onOpenChange={onClose}> <DialogContent><DialogHeader><DialogTitle className="font-display">Aplicar Combo</DialogTitle></DialogHeader><div className="space-y-2 max-h-96 overflow-auto">{combos.map((c) => (<Card key={c.id} className="p-3 flex items-center justify-between"><div><p className="font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">{c.hours}h · {(c.items||[]).length} producto(s)</p><p className="text-sm">{fmtUsd(c.price)} <span className="text-muted-foreground">· {fmtBs(c.price, rate)}</span></p></div><Button size="sm" disabled={!canApply(c.id)} onClick={() => { apply(consoleId, c.id); onClose(); }}>{canApply(c.id) ? "Aplicar" : "Sin stock"}</Button></Card>))}</div></DialogContent> </Dialog> ); }

function TransferDialog({ consoleId, open, onClose }: any) { const consoles = useStore((s) => s.consoles || []); const transferSession = useStore((s) => s.transferSession); const available = consoles.filter((c) => c && !c.session && c.id !== consoleId); return ( <Dialog open={open} onOpenChange={onClose}> <DialogContent className="max-w-xs"><DialogHeader><DialogTitle className="font-display">Mover a otra consola</DialogTitle></DialogHeader><div className="space-y-3"><p className="text-sm text-muted-foreground">El tiempo jugado y los snacks se sumarán automáticamente a la nueva consola.</p><div className="grid grid-cols-2 gap-2">{available.map((c) => (<Button key={c.id} variant="outline" className={c.type === "PS5" ? "border-gold/50 text-gold hover:bg-gold/10" : "border-primary/50 text-primary hover:bg-primary/10"} onClick={() => { if (confirm(`¿Estás seguro de mover la sesión a la ${c.name}?`)) { transferSession(consoleId, c.id); toast.success(`Sesión movida exitosamente a ${c.name}`); onClose(); } }}>{c.name}</Button>))}{available.length === 0 && <p className="col-span-2 text-sm text-center text-muted-foreground mt-4">Todas las demás consolas están ocupadas.</p>}</div></div></DialogContent> </Dialog> ); }

function Checkout({ open, onClose, consoleObj, now }: any) {
  const rate = useStore((s) => s.rate); const finalize = useStore((s) => s.finalizeConsole); 
  const { minutes, amount: timeAmount } = useMemo(() => computeTimeAmount(consoleObj, now), [consoleObj, now]);
  const extrasAmount = (consoleObj?.charges || []).reduce((a: number, c: any) => a + (c?.amount||0), 0); const total = timeAmount + extrasAmount;
  const [method, setMethod] = useState<"full" | "mixed" | "credit">("full"); const [fullPayMode, setFullPayMode] = useState<"cash" | "mobile" | "cash_bs">("cash"); const [cashUsd, setCashUsd] = useState(""); const [mobileBs, setMobileBs] = useState(""); const [cashBs, setCashBs] = useState(""); const [mobileBank, setMobileBank] = useState(""); const [mobileRef, setMobileRef] = useState(""); const [billReceived, setBillReceived] = useState(""); const [name, setName] = useState(""); const [idDoc, setIdDoc] = useState(""); const [phone, setPhone] = useState(""); const [receipt, setReceipt] = useState<ReceiptData | null>(null); const [pendingFinalize, setPendingFinalize] = useState(false);
  useEffect(() => { if (open) { setMethod("full"); setFullPayMode("cash"); setCashUsd(""); setMobileBs(""); setCashBs(""); setMobileBank(""); setMobileRef(""); setBillReceived(""); setName(""); setIdDoc(""); setPhone(""); setReceipt(null); setPendingFinalize(false); } }, [open]);
  const cashUsdN = parseFloat(cashUsd) || 0; const mobileBsN = parseFloat(mobileBs) || 0; const cashBsN = parseFloat(cashBs) || 0; const mobileUsd = rate > 0 ? mobileBsN / rate : 0; const cashBsUsd = rate > 0 ? cashBsN / rate : 0; const paid = method === "full" ? total : method === "mixed" ? (cashUsdN + mobileUsd + cashBsUsd) : 0; const remaining = total - paid;
  const resolvedCashUsd = method === "full" ? (fullPayMode === "cash" ? total : 0) : method === "mixed" ? cashUsdN : 0; const resolvedMobileBs = method === "full" ? (fullPayMode === "mobile" ? total * rate : 0) : method === "mixed" ? mobileBsN : 0; const resolvedCashBs = method === "full" ? (fullPayMode === "cash_bs" ? total * rate : 0) : method === "mixed" ? cashBsN : 0; const finalMethod = method === "full" && fullPayMode === "cash_bs" ? "cash_bs" : method;
  const billN = parseFloat(billReceived) || 0; const cashTarget = method === "full" && fullPayMode === "cash" ? total : method === "mixed" ? cashUsdN : 0; const rawChange = billN - cashTarget; const showBill = (method === "full" && fullPayMode === "cash") || (method === "mixed" && cashTarget > 0); const changeDisplay = rawChange < 1 ? "$0" : fmtUsd(rawChange);
  const needsRef = (method === "full" && fullPayMode === "mobile") || (method === "mixed" && mobileBsN > 0); const isValidRef = !needsRef || (mobileBank !== "" && mobileRef.length >= 4);
  const buildReceipt = (): ReceiptData => ({ ts: Date.now(), rate, consoleName: consoleObj?.name || "Consola", minutes, timeAmount, items: [ ...(timeAmount > 0 ? [{ name: `Tiempo ${consoleObj?.name || "Consola"} (${minutes} min)`, qty: 1, price: timeAmount }] : []), ...(consoleObj?.charges || []).map((ch: any) => ({ name: ch.label, qty: 1, price: ch.amount })) ], total, method: finalMethod as any, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, cashBs: resolvedCashBs, customer: { name: name.trim() || "Consumidor Final", idDoc: idDoc.trim() || undefined, phone: phone.trim() || undefined } });
  const doFinalize = () => { finalize(consoleObj.id, { method: finalMethod as any, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, cashBs: resolvedCashBs, mobileBank: needsRef ? mobileBank : undefined, mobileRef: needsRef ? mobileRef : undefined, customer: method === "credit" ? name.trim() : undefined, customerInfo: name.trim() ? { name: name.trim(), idDoc: idDoc.trim() || undefined, phone: phone.trim() || undefined } : undefined, total, timeAmount, extrasAmount, minutes }); };
  const submit = () => { if (method === "credit" && !name.trim()) return; if (method === "mixed" && remaining > 0.01) return; if (!isValidRef) return; setReceipt(buildReceipt()); setPendingFinalize(true); };
  const handleReceiptClose = () => { setReceipt(null); if (pendingFinalize) { doFinalize(); setPendingFinalize(false); onClose(); } };

  return (
    <>
    <Dialog open={open && !receipt} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">Cobrar · {consoleObj?.name || "Consola"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Card className="p-3 bg-secondary/40"><div className="flex justify-between text-sm"><span>Tiempo ({minutes} min)</span><span>{fmtUsd(timeAmount)}</span></div><div className="flex justify-between text-sm"><span>Extras</span><span>{fmtUsd(extrasAmount)}</span></div><div className="border-t border-border my-2" /><div className="flex justify-between font-display text-lg"><span>TOTAL</span><span>{fmtUsd(total)}</span></div><div className="flex justify-between text-sm text-accent"><span>En Bs</span><span>{fmtBs(total, rate)}</span></div></Card>
          <CustomerSearch name={name} idDoc={idDoc} phone={phone} setName={setName} setIdDoc={setIdDoc} setPhone={setPhone} />
          {total === 0 ? (
            <div className="text-center p-4 bg-green-500/10 text-green-400 font-bold border border-green-500/30 rounded-md"><p>Monto a cobrar: $0.00</p><p className="text-xs text-muted-foreground font-normal">Pulsa "Confirmar Pago" para liberar la consola.</p></div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2"><Button variant={method === "full" ? "default" : "outline"} onClick={() => setMethod("full")}>Completo</Button><Button variant={method === "mixed" ? "default" : "outline"} onClick={() => setMethod("mixed")}>Mixto</Button><Button variant={method === "credit" ? "default" : "outline"} onClick={() => setMethod("credit")}>Fiado</Button></div>
              {method === "full" && (
                <div className="space-y-2 border border-border rounded-md p-3 bg-background/40">
                  <Label className="text-xs uppercase tracking-wider text-accent font-semibold">¿Cómo pagó?</Label>
                  <RadioGroup value={fullPayMode} onValueChange={(v) => setFullPayMode(v as any)} className="grid grid-cols-1 gap-2"><label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="cash" /><div><p className="text-sm font-semibold">Efectivo $</p></div></label><label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "mobile" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="mobile" /><div><p className="text-sm font-semibold">Pago Móvil Bs</p></div></label><label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash_bs" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="cash_bs" /><div><p className="text-sm font-semibold">Efectivo Bs 💵</p></div></label></RadioGroup>
                  {fullPayMode === "mobile" && ( <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-primary/10 rounded-md border border-primary/20"><div><Label className="text-[10px] uppercase font-bold text-primary tracking-wider">Banco *</Label><select className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary" value={mobileBank} onChange={(e) => setMobileBank(e.target.value)}><option value="">Seleccione...</option><option value="Banesco">Banesco</option><option value="Mercantil">Mercantil</option><option value="Venezuela">Venezuela</option><option value="Provincial">Provincial</option><option value="BNC">BNC</option><option value="Bancamiga">Bancamiga</option><option value="Tesoro">Tesoro</option><option value="Otro">Otro</option></select></div><div><Label className="text-[10px] uppercase font-bold text-primary tracking-wider">Referencia *</Label><Input type="text" maxLength={8} value={mobileRef} onChange={(e) => setMobileRef(e.target.value.replace(/\D/g, ''))} className="h-9 text-xs font-display tracking-widest bg-background" placeholder="Ej: 1234" /></div></div> )}
                </div>
              )}
              {method === "mixed" && ( <MixedPaymentInputs total={total} cashUsd={cashUsd} mobileBs={mobileBs} cashBs={cashBs} mobileBank={mobileBank} mobileRef={mobileRef} setCashUsd={setCashUsd} setMobileBs={setMobileBs} setCashBs={setCashBs} setMobileBank={setMobileBank} setMobileRef={setMobileRef} /> )}
              {showBill && cashTarget > 0 && (<div className="space-y-1 border border-border rounded-md p-3 bg-background/40"><Label className="text-xs">Billete recibido ($)</Label><Input type="number" step="0.01" value={billReceived} onChange={(e) => setBillReceived(e.target.value)} placeholder={cashTarget.toFixed(2)} />{billN > 0 && ( <p className={`text-sm ${rawChange < 1 ? "text-muted-foreground" : "text-accent"}`}> Vuelto a entregar: <span className="font-display">{changeDisplay}</span> </p> )}</div>)}
            </>
          )}
          {method === "credit" && !name.trim() && <p className="text-xs text-destructive">Debes seleccionar un cliente para fiar.</p>}
          {!isValidRef && total > 0 && <p className="text-xs text-destructive animate-pulse text-center font-bold mt-2">⚠️ REQUERIDO: Selecciona el Banco y escribe la Referencia</p>}
        </div>
        <DialogFooter className="flex-wrap gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={submit} disabled={(total > 0 && method === "mixed" && remaining > 0.01) || (total > 0 && method === "credit" && !name.trim()) || (total > 0 && !isValidRef)} className="bg-gradient-to-r from-primary to-accent"><Receipt className="h-4 w-4 mr-1" />Confirmar Pago</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <ReceiptDialog open={!!receipt} onClose={handleReceiptClose} data={receipt} />
    </>
  );
}

function PrepayCheckout({ open, onClose, consoleObj }: any) {
  const rate = useStore((s) => s.rate); const combos = useStore((s) => s.combos || []); const products = useStore((s) => s.products || []); const prepay = useStore((s) => s.prepaySession);
  const [step, setStep] = useState<"type" | "time" | "combo" | "pay">("type"); const [chosenMinutes, setChosenMinutes] = useState<number>(60); const [chosenCombo, setChosenCombo] = useState<Combo | null>(null); const [method, setMethod] = useState<"full" | "mixed">("full"); const [fullPayMode, setFullPayMode] = useState<"cash" | "mobile" | "cash_bs">("cash"); const [cashUsd, setCashUsd] = useState(""); const [mobileBs, setMobileBs] = useState(""); const [cashBs, setCashBs] = useState(""); const [mobileBank, setMobileBank] = useState(""); const [mobileRef, setMobileRef] = useState(""); const [name, setName] = useState(""); const [idDoc, setIdDoc] = useState(""); const [phone, setPhone] = useState(""); const [receipt, setReceipt] = useState<ReceiptData | null>(null); const [pending, setPending] = useState(false);
  useEffect(() => { if (open) { setStep("type"); setChosenMinutes(60); setChosenCombo(null); setMethod("full"); setFullPayMode("cash"); setCashUsd(""); setMobileBs(""); setCashBs(""); setMobileBank(""); setMobileRef(""); setName(""); setIdDoc(""); setPhone(""); setReceipt(null); setPending(false); } }, [open]);
  const isCombo = !!chosenCombo; const minutes = isCombo ? Math.round((chosenCombo?.hours||0) * 60) : chosenMinutes; const total = isCombo ? (chosenCombo?.price||0) : +((consoleObj?.ratePerHour||0) * (chosenMinutes / 60)).toFixed(2);
  const cashUsdN = parseFloat(cashUsd) || 0; const mobileBsN = parseFloat(mobileBs) || 0; const cashBsN = parseFloat(cashBs) || 0; const mobileUsd = rate > 0 ? mobileBsN / rate : 0; const cashBsUsd = rate > 0 ? cashBsN / rate : 0; const paid = method === "full" ? total : cashUsdN + mobileUsd + cashBsUsd; const remaining = total - paid;
  const resolvedCashUsd = method === "full" ? (fullPayMode === "cash" ? total : 0) : cashUsdN; const resolvedMobileBs = method === "full" ? (fullPayMode === "mobile" ? total * rate : 0) : mobileBsN; const resolvedCashBs = method === "full" ? (fullPayMode === "cash_bs" ? total * rate : 0) : cashBsN; const finalMethod = method === "full" && fullPayMode === "cash_bs" ? "cash_bs" : method;
  const needsRef = (method === "full" && fullPayMode === "mobile") || (method === "mixed" && mobileBsN > 0); const isValidRef = !needsRef || (mobileBank !== "" && mobileRef.length >= 4);
  const buildReceipt = () => { const items = isCombo ? [ { name: `Combo: ${chosenCombo!.name}`, qty: 1, price: total }, ...(chosenCombo?.items||[]).map((it) => { const p = products.find((pp) => pp.id === it.productId); return { name: `  · ${p?.name || "Item"}`, qty: it.qty, price: 0 }; }) ] : [{ name: `Prepago ${consoleObj?.name || "Consola"} (${minutes} min)`, qty: 1, price: total }]; return { ts: Date.now(), rate, consoleName: consoleObj?.name || "Consola", minutes, timeAmount: total, items, total, method: finalMethod, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, cashBs: resolvedCashBs, customer: { name: name.trim() || "Consumidor Final", idDoc: idDoc.trim() || undefined, phone: phone.trim() || undefined } }; };
  const doPrepay = () => { prepay(consoleObj.id, minutes, { method: finalMethod as any, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, cashBs: resolvedCashBs, mobileBank: needsRef ? mobileBank : undefined, mobileRef: needsRef ? mobileRef : undefined, total, customerInfo: name.trim() ? { name: name.trim(), idDoc: idDoc.trim() || undefined, phone: phone.trim() || undefined } : undefined, comboId: chosenCombo?.id }); };
  const submit = () => { if (method === "mixed" && remaining > 0.01) return; if (!isValidRef) return; setReceipt(buildReceipt() as any); setPending(true); };
  const handleReceiptClose = () => { setReceipt(null); if (pending) { doPrepay(); setPending(false); onClose(); } };
  return (
    <>
      <Dialog open={open && !receipt} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Prepago · {consoleObj?.name || "Consola"}</DialogTitle></DialogHeader>
          {step === "type" && (<div className="space-y-3"><div className="grid grid-cols-1 gap-2"><Button variant="outline" className="h-auto py-4 flex-col items-start" onClick={() => { setChosenCombo(null); setStep("time"); }}><span className="font-semibold">Tiempo Libre / Manual</span></Button><Button variant="outline" className="h-auto py-4 flex-col items-start" onClick={() => setStep("combo")} disabled={combos.length === 0}><span className="font-semibold">Seleccionar un Combo</span></Button></div></div>)}
          {step === "combo" && (<div className="space-y-2"><div className="space-y-2 max-h-96 overflow-auto">{combos.map((c) => { const ok = (c.items||[]).every((it) => (products.find((p) => p.id === it.productId)?.stock ?? 0) >= it.qty); return (<Card key={c.id} className="p-3 flex justify-between"><div><p className="font-semibold">{c.name}</p><p className="text-sm">{fmtUsd(c.price)}</p></div><Button size="sm" disabled={!ok} onClick={() => { setChosenCombo(c); setStep("pay"); }}>{ok ? "Elegir" : "Sin stock"}</Button></Card>); })}</div></div>)}
          {step === "time" && (<div className="space-y-3"><div className="grid grid-cols-2 gap-2">{[30, 60, 90, 120].map((m) => ( <Button key={m} variant={chosenMinutes === m ? "default" : "outline"} onClick={() => setChosenMinutes(m)}>{m >= 60 ? `${m / 60}h` : `${m} min`} · {fmtUsd(+((consoleObj?.ratePerHour||0) * (m / 60)).toFixed(2))}</Button> ))}</div><div><Label>Otro (minutos)</Label><Input type="number" min={5} step={5} value={chosenMinutes} onChange={(e) => setChosenMinutes(Math.max(5, parseInt(e.target.value) || 0))} /></div><Button className="w-full" onClick={() => setStep("pay")} disabled={chosenMinutes < 5}>Continuar al pago</Button></div>)}
          {step === "pay" && (
            <div className="space-y-3">
              <Card className="p-3 bg-secondary/40"><div className="flex justify-between font-display text-lg"><span>TOTAL</span><span>{fmtUsd(total)}</span></div></Card>
              <CustomerSearch name={name} idDoc={idDoc} phone={phone} setName={setName} setIdDoc={setIdDoc} setPhone={setPhone} />
              <div className="grid grid-cols-2 gap-2"><Button variant={method === "full" ? "default" : "outline"} onClick={() => setMethod("full")}>Completo</Button><Button variant={method === "mixed" ? "default" : "outline"} onClick={() => setMethod("mixed")}>Mixto</Button></div>
              {method === "full" && ( <> <div className="grid grid-cols-3 gap-2"><Button size="sm" variant={fullPayMode === "cash" ? "default" : "outline"} onClick={() => setFullPayMode("cash")}>Efectivo $</Button><Button size="sm" variant={fullPayMode === "mobile" ? "default" : "outline"} onClick={() => setFullPayMode("mobile")}>Pago Móvil</Button><Button size="sm" variant={fullPayMode === "cash_bs" ? "default" : "outline"} onClick={() => setFullPayMode("cash_bs")}>Efectivo Bs</Button></div> {fullPayMode === "mobile" && (<div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-primary/10 rounded-md border border-primary/20"><div><Label className="text-[10px] uppercase font-bold text-primary tracking-wider">Banco *</Label><select className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary" value={mobileBank} onChange={(e) => setMobileBank(e.target.value)}><option value="">Seleccione...</option><option value="Banesco">Banesco</option><option value="Mercantil">Mercantil</option><option value="Venezuela">Venezuela</option><option value="Provincial">Provincial</option><option value="BNC">BNC</option><option value="Bancamiga">Bancamiga</option><option value="Tesoro">Tesoro</option><option value="Otro">Otro</option></select></div><div><Label className="text-[10px] uppercase font-bold text-primary tracking-wider">Referencia *</Label><Input type="text" maxLength={8} value={mobileRef} onChange={(e) => setMobileRef(e.target.value.replace(/\D/g, ''))} className="h-9 text-xs font-display tracking-widest bg-background" placeholder="Ej: 1234" /></div></div>)} </> )}
              {method === "mixed" && (<MixedPaymentInputs total={total} cashUsd={cashUsd} mobileBs={mobileBs} cashBs={cashBs} mobileBank={mobileBank} mobileRef={mobileRef} setCashUsd={setCashUsd} setMobileBs={setMobileBs} setCashBs={setCashBs} setMobileBank={setMobileBank} setMobileRef={setMobileRef} />)}
              {!isValidRef && <p className="text-xs text-destructive animate-pulse text-center font-bold mt-2">⚠️ REQUERIDO: Selecciona el Banco y escribe la Referencia</p>}
              <DialogFooter><Button onClick={submit} disabled={method === "mixed" && remaining > 0.01 || !isValidRef} className="bg-gradient-to-r from-primary to-accent"><Receipt className="h-4 w-4 mr-1" /> Cobrar y arrancar</Button></DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ReceiptDialog open={!!receipt} onClose={handleReceiptClose} data={receipt} />
    </>
  );
}

function PayExtrasDialog({ open, onClose, consoleObj }: any) {
  const rate = useStore((s) => s.rate); const payExtras = useStore((s) => s.payExtras); const total = (consoleObj?.charges || []).reduce((a: number, c: any) => a + (c?.amount||0), 0);
  const [method, setMethod] = useState<"full" | "mixed" | "credit">("full"); const [fullPayMode, setFullPayMode] = useState<"cash" | "mobile" | "cash_bs">("cash"); const [cashUsd, setCashUsd] = useState(""); const [mobileBs, setMobileBs] = useState(""); const [cashBs, setCashBs] = useState(""); const [mobileBank, setMobileBank] = useState(""); const [mobileRef, setMobileRef] = useState(""); const [name, setName] = useState(""); const [receipt, setReceipt] = useState<ReceiptData | null>(null); const [pending, setPending] = useState(false);
  useEffect(() => { if (open) { setMethod("full"); setFullPayMode("cash"); setCashUsd(""); setMobileBs(""); setCashBs(""); setMobileBank(""); setMobileRef(""); setName(consoleObj?.session?.customerName || ""); setReceipt(null); setPending(false); } }, [open, consoleObj?.session?.customerName]);
  const cashUsdN = parseFloat(cashUsd) || 0; const mobileBsN = parseFloat(mobileBs) || 0; const cashBsN = parseFloat(cashBs) || 0; const mobileUsd = rate > 0 ? mobileBsN / rate : 0; const cashBsUsd = rate > 0 ? cashBsN / rate : 0; const paid = method === "full" ? total : method === "mixed" ? (cashUsdN + mobileUsd + cashBsUsd) : 0; const remaining = total - paid;
  const resolvedCashUsd = method === "full" ? (fullPayMode === "cash" ? total : 0) : method === "mixed" ? cashUsdN : 0; const resolvedMobileBs = method === "full" ? (fullPayMode === "mobile" ? total * rate : 0) : method === "mixed" ? mobileBsN : 0; const finalMethod = method === "full" && fullPayMode === "cash_bs" ? "cash_bs" : method;
  const needsRef = (method === "full" && fullPayMode === "mobile") || (method === "mixed" && mobileBsN > 0); const isValidRef = !needsRef || (mobileBank !== "" && mobileRef.length >= 4);
  const submit = () => { if (method === "mixed" && remaining > 0.01) return; if (method === "credit" && !name.trim()) return; if (!isValidRef) return; setReceipt({ ts: Date.now(), rate, consoleName: consoleObj?.name || "Consola", minutes: 0, timeAmount: 0, items: (consoleObj?.charges || []).map((ch: any) => ({ name: ch.label, qty: 1, price: ch.amount })), total, method: finalMethod as any, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, cashBs: 0, customer: { name: name.trim() || "Consumidor Final" } }); setPending(true); };
  const handleReceiptClose = () => { setReceipt(null); if (pending) { payExtras(consoleObj.id, { method: finalMethod as any, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, mobileBank: needsRef ? mobileBank : undefined, mobileRef: needsRef ? mobileRef : undefined, total, customer: name.trim() || undefined }); setPending(false); onClose(); toast.success("Adicionales cobrados."); } };

  return (
    <>
      <Dialog open={open && !receipt} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Cobrar Adicional</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Card className="p-3 bg-secondary/40"><div className="flex justify-between font-display text-lg"><span>TOTAL</span><span>{fmtUsd(total)}</span></div></Card>
            <div><Label className="text-xs">Cliente</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-2"> <Button variant={method === "full" ? "default" : "outline"} onClick={() => setMethod("full")}>Completo</Button> <Button variant={method === "mixed" ? "default" : "outline"} onClick={() => setMethod("mixed")}>Mixto</Button> <Button variant={method === "credit" ? "default" : "outline"} onClick={() => setMethod("credit")}>Fiado</Button> </div>
            {method === "full" && ( <> <div className="grid grid-cols-3 gap-2"><Button size="sm" variant={fullPayMode === "cash" ? "default" : "outline"} onClick={() => setFullPayMode("cash")}>Efectivo $</Button><Button size="sm" variant={fullPayMode === "mobile" ? "default" : "outline"} onClick={() => setFullPayMode("mobile")}>Pago Móvil</Button><Button size="sm" variant={fullPayMode === "cash_bs" ? "default" : "outline"} onClick={() => setFullPayMode("cash_bs")}>Efectivo Bs</Button></div> {fullPayMode === "mobile" && (<div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-primary/10 rounded-md border border-primary/20"><div><Label className="text-[10px] uppercase font-bold text-primary tracking-wider">Banco *</Label><select className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary" value={mobileBank} onChange={(e) => setMobileBank(e.target.value)}><option value="">Seleccione...</option><option value="Banesco">Banesco</option><option value="Mercantil">Mercantil</option><option value="Venezuela">Venezuela</option><option value="Provincial">Provincial</option><option value="BNC">BNC</option><option value="Bancamiga">Bancamiga</option><option value="Tesoro">Tesoro</option><option value="Otro">Otro</option></select></div><div><Label className="text-[10px] uppercase font-bold text-primary tracking-wider">Referencia *</Label><Input type="text" maxLength={8} value={mobileRef} onChange={(e) => setMobileRef(e.target.value.replace(/\D/g, ''))} className="h-9 text-xs font-display tracking-widest bg-background" placeholder="Ej: 1234" /></div></div>)} </> )}
            {method === "mixed" && (<MixedPaymentInputs total={total} cashUsd={cashUsd} mobileBs={mobileBs} cashBs={cashBs} mobileBank={mobileBank} mobileRef={mobileRef} setCashUsd={setCashUsd} setMobileBs={setMobileBs} setCashBs={setCashBs} setMobileBank={setMobileBank} setMobileRef={setMobileRef} />)}
            {!isValidRef && <p className="text-xs text-destructive animate-pulse text-center font-bold mt-2">⚠️ REQUERIDO: Selecciona el Banco y escribe la Referencia</p>}
          </div>
          <DialogFooter><Button onClick={submit} disabled={(method === "mixed" && remaining > 0.01) || !isValidRef} className="bg-gradient-to-r from-primary to-accent"><Receipt className="h-4 w-4 mr-1" />Confirmar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ReceiptDialog open={!!receipt} onClose={handleReceiptClose} data={receipt} />
    </>
  );
}

export function ConsoleCard({ consoleObj, suggested }: { consoleObj: ConsoleState; suggested: boolean; }) {
  const rate = useStore((s) => s.rate); 
  const soundOn = useStore((s) => s.soundOn); 
  const startSession = useStore((s) => s.startSession); 
  const extendSession = useStore((s) => s.extendSession); 
  const markAlerted = useStore((s) => s.markAlerted); 
  const markPreAlerted = useStore((s) => s.markPreAlerted); 
  const pauseSession = useStore((s) => s.pauseSession); 
  const resumeSession = useStore((s) => s.resumeSession); 
  const cancelSession = useStore((s) => (s as any).cancelSession); 
  const addExtraController = useStore((s) => (s as any).addExtraController); 
  const releaseConsole = useStore((s) => s.releaseConsole);

  const now = useNow();

  const [snackOpen, setSnackOpen] = useState(false); 
  const [comboOpen, setComboOpen] = useState(false); 
  const [checkoutOpen, setCheckoutOpen] = useState(false); 
  const [prepayOpen, setPrepayOpen] = useState(false); 
  const [extendOpen, setExtendOpen] = useState<null | number>(null); 
  const [transferOpen, setTransferOpen] = useState(false); 
  const [payExtrasOpen, setPayExtrasOpen] = useState(false);

  // Todo esto ocurre ANTES del return condicional (100% legal en React)
  const isPS5 = consoleObj?.type === "PS5"; 
  const session = consoleObj?.session; 
  const occupied = !!session; 
  const paused = !!session?.pausedAt; 
  const isFixed = session?.mode === "fixed"; 
  const refNow = paused ? session!.pausedAt! : now; 
  const remainingMs = session?.endsAt ? session.endsAt - refNow : 0; 
  const expired = isFixed && remainingMs <= 0 && !paused; 
  const elapsedMs = session ? refNow - (session.startedAt || refNow) : 0; 
  const preAlertActive = isFixed && !paused && !expired && remainingMs > 0 && remainingMs <= 5 * 60_000;

  useEffect(() => { 
     if (expired && session && !session.alerted && consoleObj?.id) { 
        if (soundOn) playAlert(); 
        markAlerted(consoleObj.id); 
     } 
  }, [expired, session, soundOn, markAlerted, consoleObj?.id]);

  useEffect(() => { 
     if (preAlertActive && session && !session.preAlerted && consoleObj?.id) { 
        if (soundOn) playPreAlert(); 
        markPreAlerted(consoleObj.id); 
     } 
  }, [preAlertActive, session, soundOn, markPreAlerted, consoleObj?.id]);

  if (!consoleObj) return null; // 👈 AHORA SÍ: El return está seguro y no rompe los hooks.

  const { amount: timeAmount, minutes } = computeTimeAmount(consoleObj, now); 
  const extras = (consoleObj.charges || []).reduce((a, c) => a + (c?.amount||0), 0); 
  const total = timeAmount + extras;

  const statusBg = !occupied ? "border-success/50" : paused ? "border-warning animate-pulse" : expired ? "border-destructive animate-blink" : preAlertActive ? "border-warning animate-blink" : "border-primary/60";
  const statusDot = !occupied ? "bg-success" : paused ? "bg-warning" : expired ? "bg-destructive" : preAlertActive ? "bg-warning" : "bg-primary";
  const statusText = !occupied ? "LIBRE" : paused ? "EN PAUSA" : expired ? "TIEMPO AGOTADO" : preAlertActive ? "ÚLTIMOS 5 MIN" : "OCUPADO";
  const customerName = session?.customerName?.trim(); 
  const pendingExtras = (consoleObj.charges || []).reduce((a, c) => a + (c?.amount||0), 0); 
  const isPrepaid = !!session?.prepaid; 
  const blockedRelease = isPrepaid && expired && pendingExtras > 0.001; 
  const isTournament = !!session?.isTournament;

  const tryRelease = () => { const ok = releaseConsole(consoleObj.id); if (!ok) toast.error("Hay saldo adicional pendiente. Cóbralo antes de liberar."); };

  return (
    <Card className={`relative p-4 border-2 ${statusBg} ${isPS5 ? "border-gold/70 ring-1 ring-gold/30" : ""} bg-card transition-all flex flex-col h-full`}>
      {isPS5 && <div className="absolute inset-0 rounded-xl pointer-events-none glow-gold opacity-30" />}
      <div className="relative space-y-3 flex-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {isPS5 ? <Sparkles className="h-5 w-5 text-gold" /> : <Gamepad2 className="h-5 w-5 text-primary" />}
            <div><h3 className={`font-display text-lg leading-tight ${isPS5 ? "text-gold" : ""}`}>{consoleObj.name}</h3><p className="text-xs text-muted-foreground">{fmtUsd(consoleObj.ratePerHour)}/h</p></div>
          </div>
          <div className="flex flex-col items-end gap-1"><Badge className={`${statusDot} text-foreground`}>{statusText}</Badge>{suggested && <Badge variant="outline" className="border-gold text-gold"><Star className="h-3 w-3 mr-1 fill-current" /> Sugerida</Badge>}</div>
        </div>

        <div className={`flex items-center gap-2 rounded-md px-3 py-2 border ${occupied && customerName ? "bg-primary/15 border-primary/40" : "bg-secondary/30 border-border/40"}`}>
          <User className={`h-4 w-4 ${occupied && customerName ? "text-primary" : "text-muted-foreground"}`} /><span className={`text-sm font-semibold truncate ${occupied && customerName ? "text-foreground" : "text-muted-foreground italic"}`}>{!occupied ? "Disponible" : customerName || "Cliente sin registrar"}</span>
        </div>

        <div className={`rounded-lg p-3 text-center ${isTournament ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-secondary/40'}`}>
          {!occupied ? ( <p className="text-sm text-muted-foreground">Sin sesión</p> ) : isFixed ? ( <><p className="text-xs text-muted-foreground">Restante</p><p className={`font-display text-3xl tabular-nums ${expired ? "text-destructive" : ""}`}>{formatDuration(remainingMs)}</p></> ) : ( <><p className="text-xs text-muted-foreground">Tiempo libre</p><p className="font-display text-3xl tabular-nums">{formatDuration(elapsedMs)}</p></> )}
          {occupied && !isPrepaid && !isTournament && <p className="text-sm mt-1"><span className="text-accent font-semibold">{fmtUsd(total)}</span> · {fmtBs(total, rate)}</p>}
          {occupied && isTournament && <p className="text-sm mt-1 text-purple-400 font-bold uppercase tracking-widest animate-pulse flex items-center justify-center gap-1"><Trophy className="h-4 w-4"/> Partida de Torneo</p>}
        </div>

        {occupied && ( <div className={`rounded-md p-2 border ${pendingExtras > 0 ? "bg-warning/10 border-warning/40" : "bg-secondary/20 border-border/40"}`}><div className="flex justify-between items-center"><span className="text-xs uppercase tracking-wider text-muted-foreground">Adicional Pendiente</span><span className={`font-display text-base ${pendingExtras > 0 ? "text-warning" : "text-muted-foreground"}`}>{fmtUsd(pendingExtras)}</span></div></div> )}
        {blockedRelease && ( <div className="rounded-md p-2 border border-destructive bg-destructive/10 flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" /><p className="text-xs text-destructive">Tiempo agotado con saldo pendiente.</p></div> )}

        {!occupied ? (
          <div className="space-y-2 mt-auto">
            <div className="grid grid-cols-3 gap-2"><Button size="sm" variant="outline" onClick={() => startSession(consoleObj.id)}>Libre</Button><Button size="sm" onClick={() => startSession(consoleObj.id, 30)}>30 min</Button><Button size="sm" onClick={() => startSession(consoleObj.id, 60)}>1 hora</Button></div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" className="bg-gradient-to-r from-accent to-primary" onClick={() => setPrepayOpen(true)}><Coins className="h-4 w-4 mr-1" /> Prepago</Button>
              <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10" onClick={() => { 
                const p1 = prompt("Escribe el nombre del Jugador 1 (Opcional):"); 
                if (p1 === null) return; 
                const p2 = prompt("Escribe el nombre del Jugador 2 (Opcional):"); 
                const title = (p1 && p2) ? `${p1} vs ${p2}` : (p1 || p2 || "Partida de Torneo");
                startSession(consoleObj.id, undefined, title, true); 
                toast.success("Consola iniciada en Modo Torneo (Costo $0)");
              }}><Trophy className="h-4 w-4 mr-1" /> Torneo</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 mt-auto">
            <div className="grid grid-cols-2 gap-2">
              {isPrepaid ? ( <><Button size="sm" variant="secondary" onClick={() => setExtendOpen(15)}>+15 min (cobrar)</Button><Button size="sm" variant="secondary" onClick={() => setExtendOpen(30)}>+30 min (cobrar)</Button></> ) : ( <><Button size="sm" variant="secondary" onClick={() => extendSession(consoleObj.id, 15)}>+15 min</Button><Button size="sm" variant="secondary" onClick={() => extendSession(consoleObj.id, 30)}>+30 min</Button></> )}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" onClick={() => setSnackOpen(true)}><ShoppingBag className="h-4 w-4 mr-1" />Snack</Button>
              <Button size="sm" variant="outline" onClick={() => setComboOpen(true)}><Package className="h-4 w-4 mr-1" />Combo</Button>
              <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 px-1" onClick={() => { if (confirm(`¿Añadir 1 Control Adicional por $1 a ${consoleObj.name}?`)) { addExtraController(consoleObj.id); toast.success("Control añadido"); } }}><Gamepad2 className="h-4 w-4 mr-1" />Ctrl +$1</Button>
              <Button size="sm" variant="outline" onClick={() => setTransferOpen(true)} className="border-white/20 hover:bg-white/10"><ArrowRightLeft className="h-4 w-4 mr-1" />Mover</Button>
              {paused ? ( <Button size="sm" variant="default" className="col-span-2 bg-warning text-foreground hover:bg-warning/90" onClick={() => resumeSession(consoleObj.id)}><Play className="h-4 w-4 mr-1" />Reanudar</Button> ) : ( <Button size="sm" variant="outline" className="col-span-2" onClick={() => pauseSession(consoleObj.id)}><Pause className="h-4 w-4 mr-1" />Pausar</Button> )}
            </div>

            {isPrepaid && pendingExtras > 0.001 && ( <Button className="w-full" variant="default" onClick={() => setPayExtrasOpen(true)}><Coins className="h-4 w-4 mr-2" /> Cobrar Adicional {fmtUsd(pendingExtras)}</Button> )}
            <div className="flex gap-2">
              {isPrepaid ? ( <Button className="flex-1" variant="secondary" onClick={tryRelease} disabled={pendingExtras > 0.001}><Coins className="h-4 w-4 mr-2" /> Liberar</Button> ) : ( 
                <Button className="flex-1 glow-primary" onClick={() => { 
                  if (!paused) pauseSession(consoleObj.id); 
                  setCheckoutOpen(true); 
                }}><Coins className="h-4 w-4 mr-2" /> Cobrar {fmtUsd(total)}</Button> 
              )}
              <Button variant="outline" className="px-3 border-red-500/40 text-red-400 hover:bg-red-500/15" onClick={() => { if (confirm(`⚠️ ¿CANCELAR sesión sin cobrar?`)) cancelSession(consoleObj.id); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>

      <SnackPicker consoleId={consoleObj.id} open={snackOpen} onClose={() => setSnackOpen(false)} />
      <ComboPicker consoleId={consoleObj.id} open={comboOpen} onClose={() => setComboOpen(false)} />
      {checkoutOpen && <Checkout open={checkoutOpen} onClose={() => setCheckoutOpen(false)} consoleObj={consoleObj} now={now} />}
      <PrepayCheckout open={prepayOpen} onClose={() => setPrepayOpen(false)} consoleObj={consoleObj} />
      <PayExtrasDialog open={payExtrasOpen} onClose={() => setPayExtrasOpen(false)} consoleObj={consoleObj} />
      <TransferDialog consoleId={consoleObj.id} open={transferOpen} onClose={() => setTransferOpen(false)} />
      {extendOpen !== null && ( <ExtendCheckoutDialog open={true} onClose={() => setExtendOpen(null)} consoleObj={consoleObj} addMinutes={extendOpen} /> )}
    </Card>
  );
}

export { useNow, formatDuration };