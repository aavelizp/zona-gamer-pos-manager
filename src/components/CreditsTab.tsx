import { useState, useEffect } from "react";
import { useStore, fmtUsd, fmtBs } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ReceiptDialog, type ReceiptData } from "@/components/Receipt";
import { MixedPaymentInputs } from "@/components/MixedPaymentInputs";
import { FileText, Receipt, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function CreditsTab() {
  const credits = useStore((s) => s.credits || []);
  const payCredit = useStore((s) => s.payCredit);
  const rate = useStore((s) => s.rate);
  const members = useStore((s) => s.members || []);
  
  const [payOpen, setPayOpen] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [payMode, setPayMode] = useState<"cash" | "mobile" | "cash_bs">("cash");
  const [mobileBank, setMobileBank] = useState("");
  
  // Estado para disparar el comprobante
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    if (payOpen) {
      setAmount(payOpen.amount.toString());
      setPayMode("cash");
      setMobileBank("");
    }
  }, [payOpen]);

  const handlePaySubmit = () => {
    if (!payOpen) return;
    const val = parseFloat(amount) || 0;
    if (val <= 0 || val > payOpen.amount) {
      toast.error("Monto inválido");
      return;
    }
    
    const cashUsdN = payMode === "cash" ? val : 0;
    const mobileBsN = payMode === "mobile" ? val * rate : 0;
    const cashBsN = payMode === "cash_bs" ? val * rate : 0;
    const finalMethod = payMode === "cash_bs" ? "cash_bs" : payMode;

    // Intentamos rastrear si este deudor de fiado tiene teléfono en el club gamer
    const matchedMember = members.find(m => m.name.toLowerCase() === payOpen.customer.toLowerCase() || m.phone === payOpen.phone);

    const payload: any = {
      amount: val,
      method: finalMethod,
      cashUsd: cashUsdN,
      mobileBs: mobileBsN,
      cashBs: cashBsN,
      mobileBank: payMode === "mobile" ? mobileBank : undefined,
      customerInfo: matchedMember ? { name: matchedMember.name, phone: matchedMember.phone, idDoc: matchedMember.idDoc } : { name: payOpen.customer }
    };

    // 1. Armamos el recibo visual antes de limpiar la deuda de la grilla
    setReceipt({
      ts: Date.now(),
      rate,
      consoleName: `Cobro Fiado: ${payOpen.note || "General"}`,
      minutes: 0,
      timeAmount: 0,
      items: [{ name: `Abono de Deuda - ${payOpen.customer}`, qty: 1, price: val }],
      total: val,
      method: payMode as any,
      cashUsd: cashUsdN,
      mobileBs: mobileBsN,
      cashBs: cashBsN,
      customer: { name: payOpen.customer, phone: payOpen.phone || undefined }
    });

    // 2. Ejecutamos la orden en el store
    payCredit(payOpen.id, payload);
    setPayOpen(null);
  };

  const fDate = (ts: number) => new Date(ts).toLocaleDateString("es-VE", {day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit"});

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-5 border-border/40 bg-secondary/10 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="h-10 w-10 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-yellow-500" />
        </div>
        <div>
          <h3 className="font-display text-base sm:text-lg">Cuentas por Cobrar (Fiados)</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Gestiona las deudas pendientes de tus clientes.</p>
        </div>
      </Card>

      <Card className="border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs tracking-wider">
              <tr>
                <th className="p-3 sm:p-4">Fecha / Hora</th>
                <th className="p-3 sm:p-4">Cliente Deudor</th>
                <th className="p-3 sm:p-4 w-64">Nota / Concepto</th>
                <th className="p-3 sm:p-4 font-bold text-yellow-500">Deuda Restante ($)</th>
                <th className="p-3 sm:p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {credits.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground italic">No hay cuentas por cobrar. 🎉</td></tr>
              ) : (
                credits.map(c => (
                  <tr key={c.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-3 sm:p-4 text-xs text-muted-foreground">{fDate(c.createdAt)}</td>
                    <td className="p-3 sm:p-4 font-semibold text-sm sm:text-base">{c.customer} {c.phone && <span className="text-[11px] text-muted-foreground block">📱 {c.phone}</span>}</td>
                    <td className="p-3 sm:p-4 text-muted-foreground text-xs">{c.note || "---"}</td>
                    <td className="p-3 sm:p-4 font-display text-lg text-yellow-500">{fmtUsd(c.amount)}</td>
                    <td className="p-3 sm:p-4 text-center">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 sm:h-9" onClick={() => setPayOpen(c)}>
                        <Receipt className="h-4 w-4 mr-1" /> Cobrar Deuda
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {payOpen && (
        <Dialog open={!!payOpen} onOpenChange={(o) => !o && setPayOpen(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">Registrar Cobro de Deuda</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="bg-secondary/30 p-3 sm:p-4 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Cliente</p>
                <p className="font-bold text-sm sm:text-base mb-2">{payOpen.customer}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Monto Adeudado</p>
                <p className="font-display text-xl sm:text-2xl text-yellow-500">{fmtUsd(payOpen.amount)}</p>
              </div>

              <div>
                <Label className="text-xs mb-1 block uppercase tracking-widest font-semibold">¿Cuánto va a abonar? ($)</Label>
                <Input type="number" step="0.01" max={payOpen.amount} value={amount} onChange={e => setAmount(e.target.value)} className="h-12 text-xl font-bold text-green-400 bg-background/50 border-green-500/30" />
              </div>

              <div className="space-y-3 border border-border rounded-md p-3 sm:p-4 bg-background/40">
                <Label className="text-xs uppercase tracking-wider text-accent font-semibold block mb-1">¿Cómo está pagando?</Label>
                <RadioGroup value={payMode} onValueChange={(v:any) => setPayMode(v)} className="grid grid-cols-1 gap-2">
                  <label className={`flex items-center gap-2 border rounded-md p-3 cursor-pointer transition-colors ${payMode === "cash" ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/20"}`}><RadioGroupItem value="cash" /><span className="text-sm font-semibold">Efectivo $</span></label>
                  <label className={`flex items-center gap-2 border rounded-md p-3 cursor-pointer transition-colors ${payMode === "mobile" ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/20"}`}><RadioGroupItem value="mobile" /><span className="text-sm font-semibold">Pago Móvil Bs</span></label>
                  <label className={`flex items-center gap-2 border rounded-md p-3 cursor-pointer transition-colors ${payMode === "cash_bs" ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/20"}`}><RadioGroupItem value="cash_bs" /><span className="text-sm font-semibold">Efectivo Bs 💵</span></label>
                </RadioGroup>

                {payMode === "mobile" && (
                  <div className="mt-4 p-3 sm:p-4 bg-primary/10 rounded-md border border-primary/20">
                    <Label className="text-[10px] uppercase font-bold text-primary block mb-1">Banco Emisor *</Label>
                    <select className="w-full h-10 sm:h-11 rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary" value={mobileBank} onChange={(e) => setMobileBank(e.target.value)}>
                      <option value="">Seleccione banco...</option><option value="Banesco">Banesco</option><option value="Mercantil">Mercantil</option><option value="Venezuela">Venezuela</option><option value="Provincial">Provincial</option><option value="BNC">BNC</option><option value="Bancamiga">Bancamiga</option><option value="Tesoro">Tesoro</option><option value="Otro">Otro</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="mt-2 gap-2">
              <Button variant="outline" onClick={() => setPayOpen(null)}>Cancelar</Button>
              <Button onClick={handlePaySubmit} disabled={!amount || (payMode==='mobile' && !mobileBank)} className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20">
                <CheckCircle className="h-4 w-4 mr-2" /> Procesar Pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 👇 MODAL INTERECTADO DEL RECIBO FLOTANTE 👇 */}
      <ReceiptDialog open={!!receipt} onClose={() => setReceipt(null)} data={receipt} />
    </div>
  );
}