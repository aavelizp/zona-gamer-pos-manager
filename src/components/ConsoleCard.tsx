import { useState, useEffect } from "react";
import { useStore, fmtUsd, fmtBs, computeTimeAmount, type ConsoleState, type PaymentMethod } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MixedPaymentInputs } from "@/components/MixedPaymentInputs";
import { Play, Pause, Square, Plus, Clock, Gamepad2 } from "lucide-react";
import { toast } from "sonner";

export function ConsoleCard({ console: c }: { console: ConsoleState }) {
  const store = useStore();
  
  // ESCUDO CONTRA ERROR REACT #419 (HYDRATION MISMATCH)
  const [isMounted, setIsMounted] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Si React no ha terminado de montar, devolvemos una tarjeta limpia sin cálculos que choquen
  if (!isMounted || !c) {
    return (
      <Card className="p-4 border-2 border-border/50 bg-secondary/10 min-h-[160px] flex items-center justify-center">
        <span className="text-xs text-muted-foreground animate-pulse">Cargando consola...</span>
      </Card>
    );
  }

  const { minutes, amount } = computeTimeAmount(c, now);
  const isPrepaid = !!c.session?.prepaid;
  const isTournament = !!(c.session as any)?.isTournament;

  // Estados de Modales
  const [action, setAction] = useState<"start" | "prepay" | "extend" | "finalize" | null>(null);
  
  // Estados de Formularios
  const [inputMins, setInputMins] = useState("60");
  const [customerName, setCustomerName] = useState("");
  
  // Estados de Pago
  const [method, setMethod] = useState<"full" | "mixed">("full");
  const [fullPayMode, setFullPayMode] = useState<"cash" | "mobile" | "cash_bs">("mobile");
  const [cashUsd, setCashUsd] = useState("");
  const [mobileBs, setMobileBs] = useState("");
  const [cashBs, setCashBs] = useState("");
  const [mobileBank, setMobileBank] = useState("Banesco");

  const resetForm = () => {
    setInputMins("60");
    setCustomerName("");
    setMethod("full");
    setFullPayMode("mobile");
    setCashUsd("");
    setMobileBs("");
    setCashBs("");
    setMobileBank("Banesco");
  };

  const processPayment = (totalAmount: number) => {
    const cashUsdN = parseFloat(cashUsd) || 0;
    const mobileBsN = parseFloat(mobileBs) || 0;
    const cashBsN = parseFloat(cashBs) || 0;

    const resolvedCashUsd = method === "full" ? (fullPayMode === "cash" ? totalAmount : 0) : cashUsdN;
    const resolvedMobileBs = method === "full" ? (fullPayMode === "mobile" ? totalAmount * store.rate : 0) : mobileBsN;
    const resolvedCashBs = method === "full" ? (fullPayMode === "cash_bs" ? totalAmount * store.rate : 0) : cashBsN;
    
    const finalMethod: PaymentMethod = method === "full" && fullPayMode === "cash_bs" ? "cash_bs" : (method === "mixed" ? "mixed" : fullPayMode as PaymentMethod);

    return {
      total: totalAmount,
      method: finalMethod,
      cashUsd: resolvedCashUsd,
      mobileBs: resolvedMobileBs,
      cashBs: resolvedCashBs,
      mobileBank: mobileBank || undefined,
    };
  };

  const handleStartFree = () => {
    store.startSession(c.id, undefined, customerName);
    setAction(null); resetForm();
    toast.success("Sesión libre iniciada");
  };

  const handleStartFixed = () => {
    const m = parseInt(inputMins);
    if (!m || m <= 0) return toast.error("Minutos inválidos");
    store.startSession(c.id, m, customerName);
    setAction(null); resetForm();
    toast.success("Sesión por tiempo iniciada");
  };

  const handlePrepay = () => {
    const m = parseInt(inputMins);
    if (!m || m <= 0) return toast.error("Minutos inválidos");
    const total = (m / 60) * c.ratePerHour;
    const payload = processPayment(total);
    store.prepaySession(c.id, m, { ...payload, customerInfo: { name: customerName } });
    setAction(null); resetForm();
    toast.success("Sesión prepagada registrada");
  };

  const handleExtend = () => {
    const m = parseInt(inputMins);
    if (!m || m <= 0) return toast.error("Minutos inválidos");
    
    if (isPrepaid) {
      const total = (m / 60) * c.ratePerHour;
      const payload = processPayment(total);
      store.extendPaidSession(c.id, m, { ...payload, customer: c.session?.customerName });
      toast.success("Tiempo extendido y cobrado");
    } else {
      store.extendSession(c.id, m);
      toast.success("Tiempo extendido");
    }
    setAction(null); resetForm();
  };

  const handleFinalize = () => {
    if (isPrepaid) {
      store.releaseConsole(c.id);
      toast.success("Consola liberada");
    } else {
      const payload = processPayment(amount);
      store.finalizeConsole(c.id, {
        ...payload,
        timeAmount: amount,
        extrasAmount: 0,
        minutes,
        customerInfo: { name: c.session?.customerName }
      });
      toast.success("Sesión finalizada y cobrada");
    }
    setAction(null); resetForm();
  };

  const handleCancel = () => {
    if (confirm("¿Seguro que deseas cancelar esta sesión? No se registrarán cobros.")) {
      store.cancelSession(c.id);
      toast.success("Sesión cancelada");
    }
  };

  const renderPaymentForm = (totalAmount: number) => {
    const cashUsdN = parseFloat(cashUsd) || 0;
    const mobileBsN = parseFloat(mobileBs) || 0;
    const cashBsN = parseFloat(cashBs) || 0;
    
    const mobileUsd = store.rate > 0 ? mobileBsN / store.rate : 0;
    const cashBsUsd = store.rate > 0 ? cashBsN / store.rate : 0;
    const paid = method === "full" ? totalAmount : cashUsdN + mobileUsd + cashBsUsd;
    const remaining = totalAmount - paid;
    
    const needsRef = (method === "full" && fullPayMode === "mobile") || (method === "mixed" && mobileBsN > 0);
    const isValidRef = !needsRef || mobileBank !== "";

    return (
      <div className="space-y-4 mt-4">
        <Card className="p-3 bg-secondary/40">
          <div className="flex justify-between font-display text-lg">
            <span>TOTAL A PAGAR</span>
            <span className="text-green-400">{fmtUsd(totalAmount)}</span>
          </div>
        </Card>
        
        <div className="grid grid-cols-2 gap-2">
          <Button variant={method === "full" ? "default" : "outline"} onClick={() => setMethod("full")}>Completo</Button>
          <Button variant={method === "mixed" ? "default" : "outline"} onClick={() => setMethod("mixed")}>Mixto</Button>
        </div>

        {method === "full" && (
          <div className="space-y-2 border border-border rounded-md p-3 bg-background/40">
            <Label className="text-xs uppercase tracking-wider text-accent font-semibold">¿Cómo paga?</Label>
            <RadioGroup value={fullPayMode} onValueChange={(v:any) => setFullPayMode(v)} className="grid grid-cols-1 gap-2">
              <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash" ? "border-primary bg-primary/10" : "border-border"}`}>
                <RadioGroupItem value="cash" />
                <p className="text-sm font-semibold">Efectivo $</p>
              </label>
              <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "mobile" ? "border-primary bg-primary/10" : "border-border"}`}>
                <RadioGroupItem value="mobile" />
                <p className="text-sm font-semibold">Pago Móvil Bs</p>
              </label>
              <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash_bs" ? "border-primary bg-primary/10" : "border-border"}`}>
                <RadioGroupItem value="cash_bs" />
                <p className="text-sm font-semibold">Efectivo Bs 💵</p>
              </label>
            </RadioGroup>

            {fullPayMode === "mobile" && (
              <div className="mt-3 p-4 bg-primary/10 rounded-md border border-primary/20">
                <Label className="text-[10px] uppercase font-bold text-primary tracking-wider block mb-1">Banco Emisor *</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary" value={mobileBank} onChange={(e) => setMobileBank(e.target.value)}>
                  <option value="Banesco">Banesco</option>
                  <option value="Mercantil">Mercantil</option>
                  <option value="Venezuela">Venezuela</option>
                  <option value="Provincial">Provincial</option>
                  <option value="BNC">BNC</option>
                  <option value="Bancamiga">Bancamiga</option>
                </select>
              </div>
            )}
          </div>
        )}

        {method === "mixed" && (
          <MixedPaymentInputs total={totalAmount} cashUsd={cashUsd} mobileBs={mobileBs} cashBs={cashBs} mobileBank={mobileBank} setCashUsd={setCashUsd} setMobileBs={setMobileBs} setCashBs={setCashBs} setMobileBank={setMobileBank} />
        )}

        <div className="flex justify-end pt-2">
          <Button 
             className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 text-white" 
             disabled={(method === "mixed" && remaining > 0.01) || !isValidRef} 
             onClick={action === "prepay" ? handlePrepay : action === "extend" ? handleExtend : handleFinalize}
          >
            Confirmar Pago
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className={`p-4 border-2 transition-all duration-200 flex flex-col justify-between ${!c.session ? 'border-green-500/50 bg-green-950/10' : c.session.pausedAt ? 'border-yellow-500/50 bg-yellow-950/10' : 'border-blue-500/50 bg-blue-950/10'}`}>
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2"><Gamepad2 className="h-5 w-5" /> {c.name}</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-secondary text-muted-foreground">{c.type}</span>
            </div>
            <span className="text-sm font-bold text-primary">{fmtUsd(c.ratePerHour)}/h</span>
          </div>

          {!c.session ? (
            <div className="my-6 text-center"><span className="text-sm font-medium text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">• Disponible</span></div>
          ) : (
            <div className="my-3 space-y-1 bg-black/40 p-3 rounded-lg border border-white/5">
              <div className="flex justify-between text-xs text-muted-foreground"><span>Cliente:</span><span className="font-medium text-white truncate max-w-[120px]">{c.session.customerName || "General"}</span></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Tiempo Jugado:</span><span className="text-white font-medium">{minutes} min</span></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Monto:</span><span className={isPrepaid ? "text-green-400 font-bold" : "text-amber-400 font-bold"}>{isPrepaid ? "PREPAGADO" : fmtUsd(amount)}</span></div>

              {isTournament && <div className="mt-2 text-center text-xs font-bold text-purple-400 bg-purple-500/10 rounded py-1 border border-purple-500/20">🏆 MODO TORNEO</div>}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {!c.session ? (
            <>
              <Button className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50" onClick={() => setAction("start")}><Play className="h-4 w-4 mr-1" /> Libre</Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => setAction("prepay")}><Clock className="h-4 w-4 mr-1" /> Prepago</Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => c.session?.pausedAt ? store.resumeSession(c.id) : store.pauseSession(c.id)}>
                {c.session?.pausedAt ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              {!isTournament && <Button variant="outline" size="sm" className="flex-1 text-blue-400 border-blue-500/30" onClick={() => setAction("extend")}><Plus className="h-4 w-4 mr-1" /> Extender</Button>}
              <Button size="sm" className={`w-full ${isPrepaid ? 'bg-primary hover:bg-primary/90' : 'bg-amber-600 hover:bg-amber-700'} text-white font-bold`} onClick={() => isPrepaid ? handleFinalize() : setAction("finalize")}>
                <Square className="h-4 w-4 mr-1" /> {isPrepaid ? "Liberar Consola" : `Cobrar ${fmtUsd(amount)}`}
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-xs text-red-400 hover:bg-red-500/10 mt-1" onClick={handleCancel}>Cancelar Sesión (Anular)</Button>
            </>
          )}
        </div>
      </Card>

      <Dialog open={!!action} onOpenChange={(open) => { if(!open){ setAction(null); resetForm(); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">
              {action === "start" ? "Iniciar Tiempo Libre" : action === "prepay" ? "Iniciar Prepago" : action === "extend" ? "Extender Tiempo" : "Finalizar y Cobrar"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {(action === "start" || action === "prepay") && (
              <div><Label>Nombre del Cliente</Label><Input placeholder="Ej: Juan Pérez" value={customerName} onChange={e => setCustomerName(e.target.value)} /></div>
            )}
            
            {(action === "prepay" || action === "extend") && (
              <div>
                <Label>Minutos a jugar/extender</Label>
                <div className="grid grid-cols-4 gap-2 mt-2 mb-2">
                  <Button variant="outline" type="button" onClick={() => setInputMins("30")}>30m</Button>
                  <Button variant="outline" type="button" onClick={() => setInputMins("60")}>1h</Button>
                  <Button variant="outline" type="button" onClick={() => setInputMins("120")}>2h</Button>
                  <Button variant="outline" type="button" onClick={() => setInputMins("180")}>3h</Button>
                </div>
                <Input type="number" min="5" step="5" value={inputMins} onChange={e => setInputMins(e.target.value)} />
              </div>
            )}

            {action === "start" && <Button className="w-full h-12" onClick={inputMins ? handleStartFixed : handleStartFree}>Comenzar a Jugar</Button>}
            
            {(action === "prepay") && renderPaymentForm((parseInt(inputMins||"0") / 60) * c.ratePerHour)}
            {(action === "extend" && isPrepaid) && renderPaymentForm((parseInt(inputMins||"0") / 60) * c.ratePerHour)}
            {(action === "extend" && !isPrepaid) && <Button className="w-full h-12 mt-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleExtend}>Añadir Tiempo a la Cuenta</Button>}
            {(action === "finalize" && !isPrepaid) && renderPaymentForm(amount)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}