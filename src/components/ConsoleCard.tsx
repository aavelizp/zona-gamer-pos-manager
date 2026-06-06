import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useStore, fmtUsd, fmtBs, computeTimeAmount, type ConsoleState, type Member, type Combo } from "@/lib/store";
import { playAlert, playPreAlert } from "@/lib/sound";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Gamepad2, Sparkles, Package, Coins, ShoppingBag, Receipt, Plus, Search, X, User, AlertTriangle, Pause, Play, Trash2, ArrowRightLeft } from "lucide-react";
import { ReceiptDialog, type ReceiptData } from "@/components/Receipt";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ExtendCheckoutDialog } from "@/components/ExtendCheckoutDialog";
import { MixedPaymentInputs } from "@/components/MixedPaymentInputs";

interface CustomerSearchProps {
  name: string; idDoc: string; phone: string;
  setName: (v: string) => void; setIdDoc: (v: string) => void; setPhone: (v: string) => void;
}
function CustomerSearch({ name, idDoc, phone, setName, setIdDoc, setPhone }: CustomerSearchProps) {
  const members = useStore((s) => s.members);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members.slice(0, 8);
    return members.filter((m) =>
      m.name.toLowerCase().includes(q) ||
      (m.phone || "").includes(q) ||
      (m.idDoc || "").toLowerCase().includes(q)
    ).slice(0, 8);
  }, [members, query]);

  const pick = (m: Member) => {
    setSelected(m); setName(m.name); setIdDoc(m.idDoc || ""); setPhone(m.phone || "");
    setQuery(m.name); setOpen(false); setCreating(false);
  };

  const clear = () => {
    setSelected(null); setName(""); setIdDoc(""); setPhone(""); setQuery(""); setCreating(false);
  };

  return (
    <div className="space-y-2 border border-border rounded-md p-3 bg-background/40">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-accent font-semibold">Cliente</p>
        {(selected || creating || name) && (
          <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clear}>
            <X className="h-3 w-3 mr-1" />Limpiar
          </Button>
        )}
      </div>

      {!creating && (
        <div ref={wrapRef} className="relative">
          <div className="flex gap-1">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); if (selected) setSelected(null); }}
                onFocus={() => setOpen(true)}
                placeholder="Buscar cliente por nombre, teléfono o cédula..."
                className="pl-7"
              />
            </div>
            <Button type="button" size="icon" variant="outline" title="Cliente nuevo"
              onClick={() => { setCreating(true); setOpen(false); setSelected(null); setName(query); setIdDoc(""); setPhone(""); }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {open && (
            <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-56 overflow-auto">
              {results.length === 0 ? (
                <div className="p-2 text-xs text-muted-foreground">
                  Sin coincidencias.{" "}
                  <button type="button" className="text-primary underline"
                    onClick={() => { setCreating(true); setOpen(false); setName(query); }}>
                    Crear "{query}"
                  </button>
                </div>
              ) : results.map((m) => (
                <button key={m.id} type="button" onClick={() => pick(m)}
                  className="w-full text-left px-3 py-2 hover:bg-accent/30 border-b border-border/40 last:border-0">
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.phone || "sin tel"} · {Math.round(m.totalMinutes / 60)}h
                    {m.pendingRewards > 0 && <span className="text-gold"> · 🎁 {m.pendingRewards}</span>}
                  </p>
                </button>
              ))}
            </div>
          )}
          {selected && (
            <p className="text-[10px] text-success mt-1">
              ✓ {selected.name} · {Math.round(selected.totalMinutes / 60)}h en Club Gamer
            </p>
          )}
        </div>
      )}

      {(creating || selected) && (
        <div className="space-y-2">
          {creating && (
            <div>
              <Label className="text-xs">Nombre y Apellido *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Pérez" autoFocus />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Cédula/RIF</Label>
              <Input value={idDoc} onChange={(e) => setIdDoc(e.target.value)} placeholder="V-12345678" />
            </div>
            <div>
              <Label className="text-xs">Teléfono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04141234567" />
            </div>
          </div>
          {creating && name.trim() && phone.trim() && (
            <p className="text-[10px] text-success">✓ Se creará en el Club Gamer al cobrar</p>
          )}
        </div>
      )}
    </div>
  );
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function formatDuration(ms: number) {
  const sign = ms < 0 ? "-" : "";
  const abs = Math.abs(ms);
  const total = Math.floor(abs / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${sign}${pad(h)}:${pad(m)}:${pad(s)}`;
}

interface SnackPickerProps { consoleId: string; open: boolean; onClose: () => void; }
function SnackPicker({ consoleId, open, onClose }: SnackPickerProps) {
  const products = useStore((s) => s.products);
  const rate = useStore((s) => s.rate);
  const addSnack = useStore((s) => s.addSnackToConsole);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Añadir Snack</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-auto">
          {products.map((p) => (
            <Button key={p.id} variant="secondary" className="h-auto py-3 flex flex-col items-start"
              disabled={p.stock <= 0} onClick={() => { addSnack(consoleId, p.id, 1); onClose(); }}>
              <span className="font-semibold">{p.name}</span>
              <span className="text-xs text-muted-foreground">{fmtUsd(p.price)} · {fmtBs(p.price, rate)}</span>
              <span className={`text-xs ${p.stock <= 0 ? "text-destructive" : "text-muted-foreground"}`}>{p.stock <= 0 ? "Agotado" : `Stock: ${p.stock}`}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ComboPicker({ consoleId, open, onClose }: SnackPickerProps) {
  const combos = useStore((s) => s.combos);
  const products = useStore((s) => s.products);
  const rate = useStore((s) => s.rate);
  const apply = useStore((s) => s.applyComboToConsole);
  const canApply = (cId: string) => {
    const c = combos.find((x) => x.id === cId)!;
    return c.items.every((it) => (products.find((p) => p.id === it.productId)?.stock ?? 0) >= it.qty);
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Aplicar Combo</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-96 overflow-auto">
          {combos.map((c) => (
            <Card key={c.id} className="p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.hours}h · {c.items.length} producto(s)</p>
                <p className="text-sm">{fmtUsd(c.price)} <span className="text-muted-foreground">· {fmtBs(c.price, rate)}</span></p>
              </div>
              <Button size="sm" disabled={!canApply(c.id)} onClick={() => { apply(consoleId, c.id); onClose(); }}>{canApply(c.id) ? "Aplicar" : "Sin stock"}</Button>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 👈 NUEVA PANTALLA DE TRANSFERENCIA
function TransferDialog({ consoleId, open, onClose }: { consoleId: string; open: boolean; onClose: () => void }) {
  const consoles = useStore((s) => s.consoles);
  const transferSession = useStore((s) => (s as any).transferSession);
  
  // Mostrar solo consolas desocupadas que no sean la misma
  const available = consoles.filter((c) => !c.session && c.id !== consoleId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs">
        <DialogHeader><DialogTitle className="font-display">Mover a otra consola</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">El tiempo jugado y los snacks se sumarán automáticamente a la nueva consola.</p>
          <div className="grid grid-cols-2 gap-2">
            {available.map((c) => (
              <Button key={c.id} variant="outline" className={c.type === "PS5" ? "border-gold/50 text-gold hover:bg-gold/10" : "border-primary/50 text-primary hover:bg-primary/10"} 
                onClick={() => {
                  if (confirm(`¿Estás seguro de mover la sesión a la ${c.name}?`)) {
                    transferSession(consoleId, c.id);
                    toast.success(`Sesión movida exitosamente a ${c.name}`);
                    onClose();
                  }
              }}>
                {c.name}
              </Button>
            ))}
            {available.length === 0 && <p className="col-span-2 text-sm text-center text-muted-foreground mt-4">Todas las demás consolas están ocupadas.</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CheckoutProps { open: boolean; onClose: () => void; consoleObj: ConsoleState; }
function Checkout({ open, onClose, consoleObj }: CheckoutProps) {
  const rate = useStore((s) => s.rate);
  const finalize = useStore((s) => s.finalizeConsole);
  const now = useNow();
  const { minutes, amount: timeAmount } = useMemo(() => computeTimeAmount(consoleObj, now), [consoleObj, now]);
  const extrasAmount = consoleObj.charges.reduce((a, c) => a + c.amount, 0);
  const total = timeAmount + extrasAmount;

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
      setMethod("full"); setFullPayMode("cash"); setCashUsd(""); setMobileBs(""); setCashBs(""); setBillReceived("");
      setName(""); setIdDoc(""); setPhone(""); setReceipt(null); setPendingFinalize(false);
    }
  }, [open]);

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

  const billN = parseFloat(billReceived) || 0;
  const cashTarget = method === "full" && fullPayMode === "cash" ? total : method === "mixed" ? cashUsdN : 0;
  const rawChange = billN - cashTarget;
  const showBill = (method === "full" && fullPayMode === "cash") || (method === "mixed" && cashTarget > 0);
  const changeDisplay = rawChange < 1 ? "$0" : fmtUsd(rawChange);

  const finalMethod = method === "full" && fullPayMode === "cash_bs" ? "cash_bs" : method;

  const buildReceipt = (): ReceiptData => ({
    ts: Date.now(), rate, consoleName: consoleObj.name, minutes,
    timeAmount,
    items: [
      ...(timeAmount > 0 ? [{ name: `Tiempo ${consoleObj.name} (${minutes} min)`, qty: 1, price: timeAmount }] : []),
      ...consoleObj.charges.map((ch) => ({ name: ch.label, qty: 1, price: ch.amount })),
    ],
    total, method: finalMethod,
    cashUsd: resolvedCashUsd,
    mobileBs: resolvedMobileBs,
    cashBs: resolvedCashBs,
    customer: { name: name.trim() || "Consumidor Final", idDoc: idDoc.trim() || undefined, phone: phone.trim() || undefined },
  });

  const doFinalize = () => {
    finalize(consoleObj.id, {
      method: finalMethod,
      cashUsd: resolvedCashUsd,
      mobileBs: resolvedMobileBs,
      cashBs: resolvedCashBs,
      customer: method === "credit" ? name.trim() : undefined,
      customerInfo: name.trim() ? { name: name.trim(), idDoc: idDoc.trim() || undefined, phone: phone.trim() || undefined } : undefined,
      total, timeAmount, extrasAmount, minutes,
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
    if (pendingFinalize) {
      doFinalize();
      setPendingFinalize(false);
      onClose();
    }
  };

  return (
    <>
    <Dialog open={open && !receipt} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">Cobrar · {consoleObj.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Card className="p-3 bg-secondary/40">
            <div className="flex justify-between text-sm"><span>Tiempo ({minutes} min)</span><span>{fmtUsd(timeAmount)}</span></div>
            <div className="flex justify-between text-sm"><span>Extras</span><span>{fmtUsd(extrasAmount)}</span></div>
            <div className="border-t border-border my-2" />
            <div className="flex justify-between font-display text-lg"><span>TOTAL</span><span>{fmtUsd(total)}</span></div>
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
                <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash" ? "border-primary bg-primary/10" : "border-border"}`}>
                  <RadioGroupItem value="cash" />
                  <div><p className="text-sm font-semibold">Efectivo $</p></div>
                </label>
                <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "mobile" ? "border-primary bg-primary/10" : "border-border"}`}>
                  <RadioGroupItem value="mobile" />
                  <div><p className="text-sm font-semibold">Pago Móvil Bs</p></div>
                </label>
                <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash_bs" ? "border-primary bg-primary/10" : "border-border"}`}>
                  <RadioGroupItem value="cash_bs" />
                  <div><p className="text-sm font-semibold">Efectivo Bs 💵</p></div>
                </label>
              </RadioGroup>
            </div>
          )}

          {method === "mixed" && (
            <div className="space-y-2">
              <MixedPaymentInputs total={total} cashUsd={cashUsd} mobileBs={mobileBs} cashBs={cashBs} setCashUsd={setCashUsd} setMobileBs={setMobileBs} setCashBs={setCashBs} />
            </div>
          )}
          {showBill && cashTarget > 0 && (
            <div className="space-y-1 border border-border rounded-md p-3 bg-background/40">
              <Label className="text-xs">Billete recibido ($)</Label>
              <Input type="number" step="0.01" value={billReceived} onChange={(e) => setBillReceived(e.target.value)} placeholder={cashTarget.toFixed(2)} />
              {billN > 0 && ( <p className={`text-sm ${rawChange < 1 ? "text-muted-foreground" : "text-accent"}`}> Vuelto a entregar: <span className="font-display">{changeDisplay}</span> </p> )}
            </div>
          )}
          {method === "credit" && total > 10 && <p className="text-xs text-warning">⚠ Supera el límite sugerido de $10</p>}
          {method === "credit" && !name.trim() && <p className="text-xs text-destructive">Debes seleccionar o crear un cliente para fiar.</p>}
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={(method === "mixed" && remaining > 0.01) || (method === "credit" && !name.trim())} className="bg-gradient-to-r from-primary to-accent">
            <Receipt className="h-4 w-4 mr-1" />Confirmar Pago
          </Button>
        </DialogFooter>
        <p className="text-[10px] text-muted-foreground text-center">La consola se liberará al cerrar el recibo digital.</p>
      </DialogContent>
    </Dialog>
    <ReceiptDialog open={!!receipt} onClose={handleReceiptClose} data={receipt} />
    </>
  );
}

interface PrepayProps { open: boolean; onClose: () => void; consoleObj: ConsoleState; }
function PrepayCheckout({ open, onClose, consoleObj }: PrepayProps) {
  const rate = useStore((s) => s.rate); const combos = useStore((s) => s.combos); const products = useStore((s) => s.products); const prepay = useStore((s) => s.prepaySession);
  const [step, setStep] = useState<"type" | "time" | "combo" | "pay">("type");
  const [chosenMinutes, setChosenMinutes] = useState<number>(60); const [chosenCombo, setChosenCombo] = useState<Combo | null>(null);
  const [method, setMethod] = useState<"full" | "mixed">("full"); const [fullPayMode, setFullPayMode] = useState<"cash" | "mobile" | "cash_bs">("cash");
  const [cashUsd, setCashUsd] = useState(""); const [mobileBs, setMobileBs] = useState(""); const [cashBs, setCashBs] = useState("");
  const [billReceived, setBillReceived] = useState(""); const [name, setName] = useState(""); const [idDoc, setIdDoc] = useState(""); const [phone, setPhone] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null); const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) { setStep("type"); setChosenMinutes(60); setChosenCombo(null); setMethod("full"); setFullPayMode("cash"); setCashUsd(""); setMobileBs(""); setCashBs(""); setBillReceived(""); setName(""); setIdDoc(""); setPhone(""); setReceipt(null); setPending(false); }
  }, [open]);

  const isCombo = !!chosenCombo; const minutes = isCombo ? Math.round(chosenCombo!.hours * 60) : chosenMinutes; const total = isCombo ? chosenCombo!.price : +(consoleObj.ratePerHour * (chosenMinutes / 60)).toFixed(2);
  const cashUsdN = parseFloat(cashUsd) || 0; const mobileBsN = parseFloat(mobileBs) || 0; const cashBsN = parseFloat(cashBs) || 0;
  const mobileUsd = rate > 0 ? mobileBsN / rate : 0; const cashBsUsd = rate > 0 ? cashBsN / rate : 0;
  
  const paid = method === "full" ? total : cashUsdN + mobileUsd + cashBsUsd; const remaining = total - paid;
  const resolvedCashUsd = method === "full" ? (fullPayMode === "cash" ? total : 0) : cashUsdN;
  const resolvedMobileBs = method === "full" ? (fullPayMode === "mobile" ? total * rate : 0) : mobileBsN;
  const resolvedCashBs = method === "full" ? (fullPayMode === "cash_bs" ? total * rate : 0) : cashBsN;

  const billN = parseFloat(billReceived) || 0; const cashTarget = method === "full" && fullPayMode === "cash" ? total : method === "mixed" ? cashUsdN : 0;
  const rawChange = billN - cashTarget; const showBill = (method === "full" && fullPayMode === "cash") || (method === "mixed" && cashTarget > 0);
  const changeDisplay = rawChange < 1 ? "$0" : fmtUsd(rawChange);

  const finalMethod = method === "full" && fullPayMode === "cash_bs" ? "cash_bs" : method;
  const canApplyCombo = (c: Combo) => c.items.every((it) => (products.find((p) => p.id === it.productId)?.stock ?? 0) >= it.qty);

  const submit = () => {
    if (method === "mixed" && remaining > 0.01) return;
    const items: ReceiptData["items"] = isCombo ? [ { name: `Combo: ${chosenCombo!.name} - ${consoleObj.name} (${minutes} min)`, qty: 1, price: total }, ...chosenCombo!.items.map((it) => { const p = products.find((pp) => pp.id === it.productId); return { name: `  · ${p?.name || "Item"}`, qty: it.qty, price: 0 }; }), ] : [{ name: `Prepago ${consoleObj.name} (${minutes} min)`, qty: 1, price: total }];
    setReceipt({ ts: Date.now(), rate, consoleName: consoleObj.name, minutes, timeAmount: total, items, total, method: finalMethod, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, cashBs: resolvedCashBs, customer: { name: name.trim() || "Consumidor Final", idDoc: idDoc.trim() || undefined, phone: phone.trim() || undefined } }); setPending(true);
  };

  const handleReceiptClose = () => {
    setReceipt(null);
    if (pending) { prepay(consoleObj.id, minutes, { method: finalMethod, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, cashBs: resolvedCashBs, total, customerInfo: name.trim() ? { name: name.trim(), idDoc: idDoc.trim() || undefined, phone: phone.trim() || undefined } : undefined, comboId: chosenCombo?.id, }); setPending(false); onClose(); }
  };

  return (
    <>
      <Dialog open={open && !receipt} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Prepago · {consoleObj.name}</DialogTitle></DialogHeader>
          {step === "type" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">¿Qué quieres cobrar?</p>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="h-auto py-4 flex-col items-start" onClick={() => { setChosenCombo(null); setStep("time"); }}><span className="font-semibold">Tiempo Libre / Manual</span><span className="text-xs text-muted-foreground">Define minutos y precio por hora</span></Button>
                <Button variant="outline" className="h-auto py-4 flex-col items-start" onClick={() => setStep("combo")} disabled={combos.length === 0}><span className="font-semibold">Seleccionar un Combo</span><span className="text-xs text-muted-foreground">{combos.length === 0 ? "No hay combos creados" : `${combos.length} combo(s) disponibles`}</span></Button>
              </div>
              <DialogFooter><Button variant="ghost" onClick={onClose}>Cancelar</Button></DialogFooter>
            </div>
          )}
          {step === "combo" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Elige un combo:</p>
              <div className="space-y-2 max-h-96 overflow-auto">
                {combos.map((c) => {
                  const ok = canApplyCombo(c);
                  return (
                    <Card key={c.id} className={`p-3 flex items-center justify-between ${chosenCombo?.id === c.id ? "border-primary" : ""}`}>
                      <div><p className="font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">{c.hours}h · {c.items.length} producto(s)</p><p className="text-sm">{fmtUsd(c.price)} · {fmtBs(c.price, rate)}</p></div>
                      <Button size="sm" disabled={!ok} onClick={() => { setChosenCombo(c); setStep("pay"); }}>{ok ? "Elegir" : "Sin stock"}</Button>
                    </Card>
                  );
                })}
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setStep("type")}>← Atrás</Button></DialogFooter>
            </div>
          )}
          {step === "time" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">¿Cuánto tiempo va a jugar?</p>
              <div className="grid grid-cols-2 gap-2">
                {[30, 60, 90, 120].map((m) => ( <Button key={m} variant={chosenMinutes === m ? "default" : "outline"} onClick={() => setChosenMinutes(m)}>{m >= 60 ? `${m / 60}h` : `${m} min`} · {fmtUsd(+(consoleObj.ratePerHour * (m / 60)).toFixed(2))}</Button> ))}
              </div>
              <div><Label className="text-xs">Otro (minutos)</Label><Input type="number" min={5} step={5} value={chosenMinutes} onChange={(e) => setChosenMinutes(Math.max(5, parseInt(e.target.value) || 0))} /></div>
              <Card className="p-3 bg-secondary/40"><div className="flex justify-between font-display text-lg"><span>TOTAL</span><span>{fmtUsd(total)}</span></div><div className="flex justify-between text-sm text-accent"><span>En Bs</span><span>{fmtBs(total, rate)}</span></div></Card>
              <DialogFooter><Button variant="ghost" onClick={() => setStep("type")}>← Atrás</Button><Button onClick={() => setStep("pay")} disabled={chosenMinutes < 5 || total <= 0}>Continuar al pago</Button></DialogFooter>
            </div>
          )}
          {step === "pay" && (
            <div className="space-y-3">
              <Card className="p-3 bg-secondary/40">
                {isCombo && <div className="text-xs text-accent font-semibold mb-1">🎁 Combo: {chosenCombo!.name}</div>}
                <div className="flex justify-between text-sm"><span>Tiempo prepago</span><span>{minutes} min</span></div>
                <div className="flex justify-between font-display text-lg"><span>TOTAL</span><span>{fmtUsd(total)}</span></div>
                <div className="flex justify-between text-sm text-accent"><span>En Bs</span><span>{fmtBs(total, rate)}</span></div>
              </Card>
              <CustomerSearch name={name} idDoc={idDoc} phone={phone} setName={setName} setIdDoc={setIdDoc} setPhone={setPhone} />
              <div className="grid grid-cols-2 gap-2">
                <Button variant={method === "full" ? "default" : "outline"} onClick={() => setMethod("full")}>Completo</Button>
                <Button variant={method === "mixed" ? "default" : "outline"} onClick={() => setMethod("mixed")}>Mixto</Button>
              </div>
              {method === "full" && (
                <div className="grid grid-cols-3 gap-2">
                  <Button size="sm" variant={fullPayMode === "cash" ? "default" : "outline"} onClick={() => setFullPayMode("cash")}>Efectivo $</Button>
                  <Button size="sm" variant={fullPayMode === "mobile" ? "default" : "outline"} onClick={() => setFullPayMode("mobile")}>Pago Móvil</Button>
                  <Button size="sm" variant={fullPayMode === "cash_bs" ? "default" : "outline"} onClick={() => setFullPayMode("cash_bs")}>Efectivo Bs</Button>
                </div>
              )}
              {method === "mixed" && (
                <div className="space-y-2">
                  <MixedPaymentInputs total={total} cashUsd={cashUsd} mobileBs={mobileBs} cashBs={cashBs} setCashUsd={setCashUsd} setMobileBs={setMobileBs} setCashBs={setCashBs} />
                </div>
              )}
              {showBill && cashTarget > 0 && (
                <div className="space-y-1 border border-border rounded-md p-3 bg-background/40"><Label className="text-xs">Billete recibido ($)</Label><Input type="number" step="0.01" value={billReceived} onChange={(e) => setBillReceived(e.target.value)} placeholder={cashTarget.toFixed(2)} />{billN > 0 && ( <p className={`text-sm ${rawChange < 1 ? "text-muted-foreground" : "text-accent"}`}> Vuelto a entregar: <span className="font-display">{changeDisplay}</span> </p> )}</div>
              )}
              <DialogFooter><Button variant="ghost" onClick={() => setStep(isCombo ? "combo" : "time")}>← Atrás</Button><Button onClick={submit} disabled={method === "mixed" && remaining > 0.01} className="bg-gradient-to-r from-primary to-accent"><Receipt className="h-4 w-4 mr-1" /> Cobrar y arrancar</Button></DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ReceiptDialog open={!!receipt} onClose={handleReceiptClose} data={receipt} />
    </>
  );
}

interface PayExtrasProps { open: boolean; onClose: () => void; consoleObj: ConsoleState; }
function PayExtrasDialog({ open, onClose, consoleObj }: PayExtrasProps) {
  const rate = useStore((s) => s.rate); const payExtras = useStore((s) => s.payExtras); const total = consoleObj.charges.reduce((a, c) => a + c.amount, 0);
  const [method, setMethod] = useState<"full" | "mixed" | "credit">("full"); const [fullPayMode, setFullPayMode] = useState<"cash" | "mobile" | "cash_bs">("cash");
  const [cashUsd, setCashUsd] = useState(""); const [mobileBs, setMobileBs] = useState(""); const [cashBs, setCashBs] = useState("");
  const [name, setName] = useState(""); const [receipt, setReceipt] = useState<ReceiptData | null>(null); const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) { setMethod("full"); setFullPayMode("cash"); setCashUsd(""); setMobileBs(""); setCashBs(""); setName(consoleObj.session?.customerName || ""); setReceipt(null); setPending(false); }
  }, [open, consoleObj.session?.customerName]);

  const cashUsdN = parseFloat(cashUsd) || 0; const mobileBsN = parseFloat(mobileBs) || 0; const cashBsN = parseFloat(cashBs) || 0;
  const mobileUsd = rate > 0 ? mobileBsN / rate : 0; const cashBsUsd = rate > 0 ? cashBsN / rate : 0;
  const paid = method === "full" ? total : method === "mixed" ? (cashUsdN + mobileUsd + cashBsUsd) : 0; const remaining = total - paid;
  
  const resolvedCashUsd = method === "full" ? (fullPayMode === "cash" ? total : 0) : method === "mixed" ? cashUsdN : 0;
  const resolvedMobileBs = method === "full" ? (fullPayMode === "mobile" ? total * rate : 0) : method === "mixed" ? mobileBsN : 0;
  const resolvedCashBs = method === "full" ? (fullPayMode === "cash_bs" ? total * rate : 0) : method === "mixed" ? cashBsN : 0;
  const finalMethod = method === "full" && fullPayMode === "cash_bs" ? "cash_bs" : method;

  const submit = () => {
    if (method === "mixed" && remaining > 0.01) return; if (method === "credit" && !name.trim()) return;
    setReceipt({ ts: Date.now(), rate, consoleName: consoleObj.name, minutes: 0, timeAmount: 0, items: consoleObj.charges.map((ch) => ({ name: ch.label, qty: 1, price: ch.amount })), total, method: finalMethod, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, cashBs: resolvedCashBs, customer: { name: name.trim() || "Consumidor Final" } }); setPending(true);
  };

  const handleReceiptClose = () => {
    setReceipt(null);
    if (pending) { payExtras(consoleObj.id, { method: finalMethod, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, cashBs: resolvedCashBs, total, customer: name.trim() || undefined }); setPending(false); onClose(); toast.success("Adicionales cobrados."); }
  };

  return (
    <>
      <Dialog open={open && !receipt} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Cobrar Adicional</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Card className="p-3 bg-secondary/40">
              <div className="flex justify-between font-display text-lg"><span>TOTAL</span><span>{fmtUsd(total)}</span></div>
            </Card>
            <div><Label className="text-xs">Cliente</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-2"> <Button variant={method === "full" ? "default" : "outline"} onClick={() => setMethod("full")}>Completo</Button> <Button variant={method === "mixed" ? "default" : "outline"} onClick={() => setMethod("mixed")}>Mixto</Button> <Button variant={method === "credit" ? "default" : "outline"} onClick={() => setMethod("credit")}>Fiado</Button> </div>
            {method === "full" && (
              <div className="grid grid-cols-3 gap-2"><Button size="sm" variant={fullPayMode === "cash" ? "default" : "outline"} onClick={() => setFullPayMode("cash")}>Efectivo $</Button><Button size="sm" variant={fullPayMode === "mobile" ? "default" : "outline"} onClick={() => setFullPayMode("mobile")}>Pago Móvil</Button><Button size="sm" variant={fullPayMode === "cash_bs" ? "default" : "outline"} onClick={() => setFullPayMode("cash_bs")}>Efectivo Bs</Button></div>
            )}
            {method === "mixed" && (
              <div className="space-y-2">
                <MixedPaymentInputs total={total} cashUsd={cashUsd} mobileBs={mobileBs} cashBs={cashBs} setCashUsd={setCashUsd} setMobileBs={setMobileBs} setCashBs={setCashBs} />
              </div>
            )}
          </div>
          <DialogFooter> <Button variant="outline" onClick={onClose}>Cancelar</Button> <Button onClick={submit} disabled={(method === "mixed" && remaining > 0.01)} className="bg-gradient-to-r from-primary to-accent"><Receipt className="h-4 w-4 mr-1" />Confirmar</Button> </DialogFooter>
        </DialogContent>
      </Dialog>
      <ReceiptDialog open={!!receipt} onClose={handleReceiptClose} data={receipt} />
    </>
  );
}

interface ConsoleCardProps { consoleObj: ConsoleState; suggested: boolean; }
export function ConsoleCard({ consoleObj, suggested }: ConsoleCardProps) {
  const rate = useStore((s) => s.rate); const soundOn = useStore((s) => s.soundOn); const startSession = useStore((s) => s.startSession); const extendSession = useStore((s) => s.extendSession); const markAlerted = useStore((s) => s.markAlerted); const markPreAlerted = useStore((s) => s.markPreAlerted); const pauseSession = useStore((s) => s.pauseSession); const resumeSession = useStore((s) => s.resumeSession); const cancelSession = useStore((s) => (s as any).cancelSession); 
  const addExtraController = useStore((s) => (s as any).addExtraController); 
  const now = useNow();

  const [snackOpen, setSnackOpen] = useState(false); const [comboOpen, setComboOpen] = useState(false); const [checkoutOpen, setCheckoutOpen] = useState(false); const [prepayOpen, setPrepayOpen] = useState(false); const [extendOpen, setExtendOpen] = useState<null | number>(null); 
  const [transferOpen, setTransferOpen] = useState(false); // 👈 ESTADO PARA ABRIR MENÚ DE TRANSFERENCIA
  
  const releaseConsole = useStore((s) => s.releaseConsole);

  const isPS5 = consoleObj.type === "PS5"; const session = consoleObj.session; const occupied = !!session; const paused = !!session?.pausedAt; const isFixed = session?.mode === "fixed"; const refNow = paused ? session!.pausedAt! : now; const remainingMs = session?.endsAt ? session.endsAt - refNow : 0; const expired = isFixed && remainingMs <= 0 && !paused; const elapsedMs = session ? refNow - session.startedAt : 0; const { amount: timeAmount, minutes } = computeTimeAmount(consoleObj, now); const extras = consoleObj.charges.reduce((a, c) => a + c.amount, 0); const total = timeAmount + extras;

  useEffect(() => { if (expired && session && !session.alerted) { if (soundOn) playAlert(); markAlerted(consoleObj.id); } }, [expired, session, soundOn, markAlerted, consoleObj.id]);
  const preAlertActive = isFixed && !paused && !expired && remainingMs > 0 && remainingMs <= 5 * 60_000;
  useEffect(() => { if (preAlertActive && session && !session.preAlerted) { if (soundOn) playPreAlert(); markPreAlerted(consoleObj.id); } }, [preAlertActive, session, soundOn, markPreAlerted, consoleObj.id]);

  const statusBg = !occupied ? "border-success/50" : paused ? "border-warning animate-pulse" : expired ? "border-destructive animate-blink" : preAlertActive ? "border-warning animate-blink" : "border-primary/60";
  const statusDot = !occupied ? "bg-success" : paused ? "bg-warning" : expired ? "bg-destructive" : preAlertActive ? "bg-warning" : "bg-primary";
  const statusText = !occupied ? "LIBRE" : paused ? "EN PAUSA" : expired ? "TIEMPO AGOTADO" : preAlertActive ? "ÚLTIMOS 5 MIN" : "OCUPADO";
  const customerName = session?.customerName?.trim(); const pendingExtras = consoleObj.charges.reduce((a, c) => a + c.amount, 0); const isPrepaid = !!session?.prepaid; const blockedRelease = isPrepaid && expired && pendingExtras > 0.001; const [payExtrasOpen, setPayExtrasOpen] = useState(false);

  const tryRelease = () => { const ok = releaseConsole(consoleObj.id); if (!ok) toast.error("Hay saldo adicional pendiente. Cóbralo antes de liberar."); };

  return (
    <Card className={`relative p-4 border-2 ${statusBg} ${isPS5 ? "border-gold/70 ring-1 ring-gold/30" : ""} bg-card transition-all flex flex-col h-full`}>
      {isPS5 && <div className="absolute inset-0 rounded-xl pointer-events-none glow-gold opacity-30" />}
      <div className="relative space-y-3 flex-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {isPS5 ? <Sparkles className="h-5 w-5 text-gold" /> : <Gamepad2 className="h-5 w-5 text-primary" />}
            <div><h3 className={`font-display text-lg leading-tight ${isPS5 ? "text-gold" : ""}`}>{consoleObj.name}</h3><p className="text-xs text-muted-foreground">{fmtUsd(consoleObj.ratePerHour)}/h · {Math.round(consoleObj.totalMinutes / 60)}h</p></div>
          </div>
          <div className="flex flex-col items-end gap-1"><Badge className={`${statusDot} text-foreground`}>{statusText}</Badge>{suggested && <Badge variant="outline" className="border-gold text-gold"><Star className="h-3 w-3 mr-1 fill-current" /> Sugerida</Badge>}</div>
        </div>

        <div className={`flex items-center gap-2 rounded-md px-3 py-2 border ${occupied && customerName ? "bg-primary/15 border-primary/40" : "bg-secondary/30 border-border/40"}`}>
          <User className={`h-4 w-4 ${occupied && customerName ? "text-primary" : "text-muted-foreground"}`} /><span className={`text-sm font-semibold truncate ${occupied && customerName ? "text-foreground" : "text-muted-foreground italic"}`}>{!occupied ? "Disponible" : customerName || "Cliente sin registrar"}</span>
        </div>

        <div className="rounded-lg bg-secondary/40 p-3 text-center">
          {!occupied ? ( <p className="text-sm text-muted-foreground">Sin sesión</p> ) : isFixed ? ( <><p className="text-xs text-muted-foreground">Restante</p><p className={`font-display text-3xl tabular-nums ${expired ? "text-destructive" : ""}`}>{formatDuration(remainingMs)}</p></> ) : ( <><p className="text-xs text-muted-foreground">Tiempo libre</p><p className="font-display text-3xl tabular-nums">{formatDuration(elapsedMs)}</p></> )}
          {occupied && !isPrepaid && <p className="text-sm mt-1"><span className="text-accent font-semibold">{fmtUsd(total)}</span> · {fmtBs(total, rate)}</p>}
        </div>

        {occupied && ( <div className={`rounded-md p-2 border ${pendingExtras > 0 ? "bg-warning/10 border-warning/40" : "bg-secondary/20 border-border/40"}`}><div className="flex justify-between items-center"><span className="text-xs uppercase tracking-wider text-muted-foreground">Adicional Pendiente</span><span className={`font-display text-base ${pendingExtras > 0 ? "text-warning" : "text-muted-foreground"}`}>{fmtUsd(pendingExtras)}</span></div></div> )}
        {blockedRelease && ( <div className="rounded-md p-2 border border-destructive bg-destructive/10 flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" /><p className="text-xs text-destructive">Tiempo agotado con saldo pendiente.</p></div> )}

        {!occupied ? (
          <div className="space-y-2 mt-auto">
            <div className="grid grid-cols-3 gap-2"><Button size="sm" variant="outline" onClick={() => startSession(consoleObj.id)}>Libre</Button><Button size="sm" onClick={() => startSession(consoleObj.id, 30)}>30 min</Button><Button size="sm" onClick={() => startSession(consoleObj.id, 60)}>1 hora</Button></div>
            <Button size="sm" className="w-full bg-gradient-to-r from-accent to-primary" onClick={() => setPrepayOpen(true)}><Coins className="h-4 w-4 mr-1" /> Prepago</Button>
          </div>
        ) : (
          <div className="space-y-2 mt-auto">
            <div className="grid grid-cols-2 gap-2">
              {isPrepaid ? ( <><Button size="sm" variant="secondary" onClick={() => setExtendOpen(15)}>+15 min (cobrar)</Button><Button size="sm" variant="secondary" onClick={() => setExtendOpen(30)}>+30 min (cobrar)</Button></> ) : ( <><Button size="sm" variant="secondary" onClick={() => extendSession(consoleObj.id, 15)}>+15 min</Button><Button size="sm" variant="secondary" onClick={() => extendSession(consoleObj.id, 30)}>+30 min</Button></> )}
            </div>
            
            {/* 👈 AQUÍ INCLUIMOS EL BOTÓN PARA "MOVER" */}
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" onClick={() => setSnackOpen(true)}><ShoppingBag className="h-4 w-4 mr-1" />Snack</Button>
              <Button size="sm" variant="outline" onClick={() => setComboOpen(true)}><Package className="h-4 w-4 mr-1" />Combo</Button>
              <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 px-1" onClick={() => {
                if (confirm(`¿Añadir 1 Control Adicional por $1.00 a ${consoleObj.name}?`)) { addExtraController(consoleObj.id); toast.success("Control añadido al recibo"); }
              }}><Gamepad2 className="h-4 w-4 mr-1" />Ctrl +$1</Button>
              
              <Button size="sm" variant="outline" onClick={() => setTransferOpen(true)} className="border-white/20 hover:bg-white/10"><ArrowRightLeft className="h-4 w-4 mr-1" />Mover</Button>
              
              {paused ? ( <Button size="sm" variant="default" className="col-span-2 bg-warning text-foreground hover:bg-warning/90" onClick={() => resumeSession(consoleObj.id)}><Play className="h-4 w-4 mr-1" />Reanudar</Button> ) : ( <Button size="sm" variant="outline" className="col-span-2" onClick={() => pauseSession(consoleObj.id)}><Pause className="h-4 w-4 mr-1" />Pausar Tiempo</Button> )}
            </div>

            {consoleObj.charges.length > 0 && ( <div className="text-xs text-muted-foreground space-y-0.5 max-h-16 overflow-auto">{consoleObj.charges.map((c, i) => ( <div key={i} className="flex justify-between"><span>{c.label}</span><span>{fmtUsd(c.amount)}</span></div> ))}</div> )}
            {isPrepaid && pendingExtras > 0.001 && ( <Button className="w-full" variant="default" onClick={() => setPayExtrasOpen(true)}><Coins className="h-4 w-4 mr-2" /> Cobrar Adicional {fmtUsd(pendingExtras)}</Button> )}
            <div className="flex gap-2">
              {isPrepaid ? ( <Button className="flex-1" variant="secondary" onClick={tryRelease} disabled={pendingExtras > 0.001}><Coins className="h-4 w-4 mr-2" /> Liberar</Button> ) : ( <Button className="flex-1 glow-primary" onClick={() => setCheckoutOpen(true)}><Coins className="h-4 w-4 mr-2" /> Cobrar {fmtUsd(total)}</Button> )}
              <Button variant="outline" className="px-3 border-red-500/40 text-red-400 hover:bg-red-500/15" onClick={() => { if (confirm(`⚠️ ¿CANCELAR sesión de ${consoleObj.name} sin cobrar?`)) cancelSession(consoleObj.id); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>

      <SnackPicker consoleId={consoleObj.id} open={snackOpen} onClose={() => setSnackOpen(false)} />
      <ComboPicker consoleId={consoleObj.id} open={comboOpen} onClose={() => setComboOpen(false)} />
      <Checkout open={checkoutOpen} onClose={() => setCheckoutOpen(false)} consoleObj={consoleObj} />
      <PrepayCheckout open={prepayOpen} onClose={() => setPrepayOpen(false)} consoleObj={consoleObj} />
      <PayExtrasDialog open={payExtrasOpen} onClose={() => setPayExtrasOpen(false)} consoleObj={consoleObj} />
      <TransferDialog consoleId={consoleObj.id} open={transferOpen} onClose={() => setTransferOpen(false)} />
      {extendOpen !== null && ( <ExtendCheckoutDialog open={true} onClose={() => setExtendOpen(null)} consoleObj={consoleObj} addMinutes={extendOpen} /> )}
    </Card>
  );
}

export { useNow, formatDuration };