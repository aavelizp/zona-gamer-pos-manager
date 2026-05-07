import { useEffect, useMemo, useState } from "react";
import { useStore, fmtUsd, fmtBs, computeTimeAmount, type ConsoleState } from "@/lib/store";
import { playAlert } from "@/lib/sound";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Gamepad2, Sparkles, Package, Coins, ShoppingBag, Receipt } from "lucide-react";
import { ReceiptDialog, type ReceiptData } from "@/components/Receipt";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface SnackPickerProps {
  consoleId: string;
  open: boolean;
  onClose: () => void;
}
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
              disabled={p.stock <= 0}
              onClick={() => { addSnack(consoleId, p.id, 1); onClose(); }}>
              <span className="font-semibold">{p.name}</span>
              <span className="text-xs text-muted-foreground">{fmtUsd(p.price)} · {fmtBs(p.price, rate)}</span>
              <span className={`text-xs ${p.stock <= 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {p.stock <= 0 ? "Agotado" : `Stock: ${p.stock}`}
              </span>
            </Button>
          ))}
          {products.length === 0 && <p className="col-span-2 text-sm text-muted-foreground">No hay productos. Agrégalos en Inventario.</p>}
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
              <Button size="sm" disabled={!canApply(c.id)}
                onClick={() => { apply(consoleId, c.id); onClose(); }}>
                {canApply(c.id) ? "Aplicar" : "Sin stock"}
              </Button>
            </Card>
          ))}
          {combos.length === 0 && <p className="text-sm text-muted-foreground">No hay combos. Crea uno en la pestaña Combos.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CheckoutProps {
  open: boolean;
  onClose: () => void;
  consoleObj: ConsoleState;
}
function Checkout({ open, onClose, consoleObj }: CheckoutProps) {
  const rate = useStore((s) => s.rate);
  const finalize = useStore((s) => s.finalizeConsole);
  const now = useNow();
  const { minutes, amount: timeAmount } = useMemo(() => computeTimeAmount(consoleObj, now), [consoleObj, now]);
  const extrasAmount = consoleObj.charges.reduce((a, c) => a + c.amount, 0);
  const total = timeAmount + extrasAmount;

  const [method, setMethod] = useState<"full" | "mixed" | "credit">("full");
  const [cashUsd, setCashUsd] = useState("");
  const [mobileBs, setMobileBs] = useState("");
  const [name, setName] = useState("");
  const [idDoc, setIdDoc] = useState("");
  const [phone, setPhone] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    if (open) {
      setMethod("full"); setCashUsd(""); setMobileBs("");
      setName(""); setIdDoc(""); setPhone(""); setReceipt(null);
    }
  }, [open]);

  const cashUsdN = parseFloat(cashUsd) || 0;
  const mobileBsN = parseFloat(mobileBs) || 0;
  const mobileUsd = rate > 0 ? mobileBsN / rate : 0;
  const paid = method === "full" ? total : method === "mixed" ? cashUsdN + mobileUsd : 0;
  const remaining = total - paid;

  const buildReceipt = (): ReceiptData => ({
    ts: Date.now(), rate, consoleName: consoleObj.name, minutes,
    timeAmount,
    items: [
      ...(timeAmount > 0 ? [{ name: `Tiempo ${consoleObj.name} (${minutes} min)`, qty: 1, price: timeAmount }] : []),
      ...consoleObj.charges.map((ch) => ({ name: ch.label, qty: 1, price: ch.amount })),
    ],
    total, method,
    cashUsd: method === "full" ? total : method === "mixed" ? cashUsdN : 0,
    mobileBs: method === "mixed" ? mobileBsN : 0,
    customer: { name: name.trim() || "Consumidor Final", idDoc: idDoc.trim() || undefined, phone: phone.trim() || undefined },
  });

  const submit = (alsoReceipt: boolean) => {
    if (method === "credit" && !name.trim()) return;
    if (method === "mixed" && remaining > 0.01) return;
    const r = buildReceipt();
    finalize(consoleObj.id, {
      method,
      cashUsd: method === "full" ? total : method === "mixed" ? cashUsdN : 0,
      mobileBs: method === "mixed" ? mobileBsN : 0,
      customer: method === "credit" ? name.trim() : undefined,
      customerInfo: name.trim() ? { name: name.trim(), idDoc: idDoc.trim() || undefined, phone: phone.trim() || undefined } : undefined,
      total, timeAmount, extrasAmount, minutes,
    });
    if (alsoReceipt) setReceipt(r); else onClose();
  };

  return (
    <>
    <Dialog open={open && !receipt} onOpenChange={onClose}>
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

          <div className="space-y-2 border border-border rounded-md p-3 bg-background/40">
            <p className="text-xs uppercase tracking-wider text-accent font-semibold">Datos del Cliente</p>
            <div>
              <Label className="text-xs">Nombre y Apellido</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Pérez" />
            </div>
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
            {name.trim() && phone.trim() && <p className="text-[10px] text-success">✓ Cliente se sumará al Club Gamer</p>}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant={method === "full" ? "default" : "outline"} onClick={() => setMethod("full")}>Completo</Button>
            <Button variant={method === "mixed" ? "default" : "outline"} onClick={() => setMethod("mixed")}>Mixto</Button>
            <Button variant={method === "credit" ? "default" : "outline"} onClick={() => setMethod("credit")}>Fiado</Button>
          </div>
          {method === "mixed" && (
            <div className="space-y-2">
              <div>
                <Label>Efectivo $</Label>
                <Input type="number" step="0.01" value={cashUsd} onChange={(e) => setCashUsd(e.target.value)} />
              </div>
              <div>
                <Label>Pago Móvil Bs</Label>
                <Input type="number" step="0.01" value={mobileBs} onChange={(e) => setMobileBs(e.target.value)} />
                <p className="text-xs text-muted-foreground">≈ {fmtUsd(mobileUsd)}</p>
              </div>
              <div className={`text-sm ${Math.abs(remaining) < 0.01 ? "text-success" : remaining > 0 ? "text-warning" : "text-accent"}`}>
                {remaining > 0.01 ? `Falta: ${fmtUsd(remaining)} (${fmtBs(remaining, rate)})` : remaining < -0.01 ? `Vuelto: ${fmtUsd(-remaining)}` : "Pago exacto ✓"}
              </div>
            </div>
          )}
          {method === "credit" && total > 10 && <p className="text-xs text-warning">⚠ Supera el límite sugerido de $10</p>}
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="secondary" onClick={() => submit(false)}>Confirmar</Button>
          <Button onClick={() => submit(true)} className="bg-gradient-to-r from-primary to-accent">
            <Receipt className="h-4 w-4 mr-1" />Generar Recibo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ReceiptDialog open={!!receipt} onClose={() => { setReceipt(null); onClose(); }} data={receipt} />
    </>
  );
}

interface ConsoleCardProps { consoleObj: ConsoleState; suggested: boolean; }
export function ConsoleCard({ consoleObj, suggested }: ConsoleCardProps) {
  const rate = useStore((s) => s.rate);
  const soundOn = useStore((s) => s.soundOn);
  const startSession = useStore((s) => s.startSession);
  const extendSession = useStore((s) => s.extendSession);
  const markAlerted = useStore((s) => s.markAlerted);
  const now = useNow();

  const [snackOpen, setSnackOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const isPS5 = consoleObj.type === "PS5";
  const session = consoleObj.session;
  const occupied = !!session;
  const isFixed = session?.mode === "fixed";
  const remainingMs = session?.endsAt ? session.endsAt - now : 0;
  const expired = isFixed && remainingMs <= 0;
  const elapsedMs = session ? now - session.startedAt : 0;
  const { amount: timeAmount, minutes } = computeTimeAmount(consoleObj, now);
  const extras = consoleObj.charges.reduce((a, c) => a + c.amount, 0);
  const total = timeAmount + extras;

  // Alert when expired
  useEffect(() => {
    if (expired && session && !session.alerted) {
      if (soundOn) playAlert();
      markAlerted(consoleObj.id);
    }
  }, [expired, session, soundOn, markAlerted, consoleObj.id]);

  const statusBg = !occupied ? "border-success/50" : expired ? "border-destructive animate-blink" : "border-primary/60";
  const statusDot = !occupied ? "bg-success" : expired ? "bg-destructive" : "bg-primary";
  const statusText = !occupied ? "LIBRE" : expired ? "TIEMPO AGOTADO" : "OCUPADO";

  return (
    <Card className={`relative p-4 border-2 ${statusBg} ${isPS5 ? "border-gold/70 ring-1 ring-gold/30" : ""} bg-card transition-all`}>
      {isPS5 && <div className="absolute inset-0 rounded-xl pointer-events-none glow-gold opacity-30" />}
      <div className="relative space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {isPS5 ? <Sparkles className="h-5 w-5 text-gold" /> : <Gamepad2 className="h-5 w-5 text-primary" />}
            <div>
              <h3 className={`font-display text-lg leading-tight ${isPS5 ? "text-gold" : ""}`}>{consoleObj.name}</h3>
              <p className="text-xs text-muted-foreground">{fmtUsd(consoleObj.ratePerHour)}/h · {Math.round(consoleObj.totalMinutes / 60)}h totales</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={`${statusDot} text-foreground`}>{statusText}</Badge>
            {suggested && (
              <Badge variant="outline" className="border-gold text-gold">
                <Star className="h-3 w-3 mr-1 fill-current" /> Sugerida
              </Badge>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-secondary/40 p-3 text-center">
          {!occupied ? (
            <p className="text-sm text-muted-foreground">Sin sesión activa</p>
          ) : isFixed ? (
            <>
              <p className="text-xs text-muted-foreground">Restante</p>
              <p className={`font-display text-3xl tabular-nums ${expired ? "text-destructive" : ""}`}>
                {formatDuration(remainingMs)}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Tiempo libre</p>
              <p className="font-display text-3xl tabular-nums">{formatDuration(elapsedMs)}</p>
            </>
          )}
          {occupied && (
            <p className="text-sm mt-1">
              <span className="text-accent font-semibold">{fmtUsd(total)}</span>
              <span className="text-muted-foreground"> · {fmtBs(total, rate)}</span>
            </p>
          )}
        </div>

        {!occupied ? (
          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" variant="outline" onClick={() => startSession(consoleObj.id)}>Libre</Button>
            <Button size="sm" onClick={() => startSession(consoleObj.id, 30)}>30 min</Button>
            <Button size="sm" onClick={() => startSession(consoleObj.id, 60)}>1 hora</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" onClick={() => extendSession(consoleObj.id, 15)}>+15 min</Button>
              <Button size="sm" variant="secondary" onClick={() => extendSession(consoleObj.id, 30)}>+30 min</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => setSnackOpen(true)}><ShoppingBag className="h-4 w-4 mr-1" />Snack</Button>
              <Button size="sm" variant="outline" onClick={() => setComboOpen(true)}><Package className="h-4 w-4 mr-1" />Combo</Button>
            </div>
            {consoleObj.charges.length > 0 && (
              <div className="text-xs text-muted-foreground space-y-0.5 max-h-16 overflow-auto">
                {consoleObj.charges.map((c, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{c.label}</span><span>{fmtUsd(c.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            <Button className="w-full glow-primary" onClick={() => setCheckoutOpen(true)}>
              <Coins className="h-4 w-4 mr-2" /> Cobrar {fmtUsd(total)}
            </Button>
          </>
        )}
      </div>

      <SnackPicker consoleId={consoleObj.id} open={snackOpen} onClose={() => setSnackOpen(false)} />
      <ComboPicker consoleId={consoleObj.id} open={comboOpen} onClose={() => setComboOpen(false)} />
      <Checkout open={checkoutOpen} onClose={() => setCheckoutOpen(false)} consoleObj={consoleObj} />
    </Card>
  );
}

// Re-exports used by other files
export { useNow, formatDuration };
