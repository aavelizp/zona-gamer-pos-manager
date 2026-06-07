import { useStore, fmtUsd, fmtBs } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface Props {
  total: number;
  cashUsd: string;
  mobileBs: string;
  cashBs: string;
  
  // 👈 NUEVAS PROPIEDADES PARA AUDITORÍA
  mobileBank: string;
  mobileRef: string;
  
  setCashUsd: (v: string) => void;
  setMobileBs: (v: string) => void;
  setCashBs: (v: string) => void;
  
  setMobileBank: (v: string) => void;
  setMobileRef: (v: string) => void;
}

export function MixedPaymentInputs({ 
  total, cashUsd, mobileBs, cashBs, 
  mobileBank, mobileRef, 
  setCashUsd, setMobileBs, setCashBs, 
  setMobileBank, setMobileRef 
}: Props) {
  
  const rate = useStore((s) => s.rate);
  const cashUsdN = parseFloat(cashUsd) || 0;
  const mobileBsN = parseFloat(mobileBs) || 0;
  const cashBsN = parseFloat(cashBs) || 0;
  
  const mobileUsd = rate > 0 ? mobileBsN / rate : 0;
  const cashBsUsd = rate > 0 ? cashBsN / rate : 0;

  const totalPaid = cashUsdN + mobileUsd + cashBsUsd;
  const remainingAfterCash = Math.max(0, total - (cashUsdN + cashBsUsd));
  const remainingAfterCashBsFormatted = remainingAfterCash * rate;

  const remaining = total - totalPaid;
  const covered = totalPaid + 0.01 >= total;
  const overpay = totalPaid - total;

  return (
    <div className="space-y-3">
      <Card className="p-3 bg-secondary/40">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total a Pagar</div>
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl">{fmtUsd(total)}</span>
          <span className="font-display text-base text-accent">{fmtBs(total, rate)}</span>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Efectivo $</Label>
          <Input type="number" step="0.01" inputMode="decimal" value={cashUsd} onChange={(e) => setCashUsd(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Efectivo Bs</Label>
          <Input type="number" step="1" inputMode="decimal" value={cashBs} onChange={(e) => setCashBs(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Pago Móvil</Label>
          <Input type="number" step="1" inputMode="decimal" value={mobileBs} onChange={(e) => setMobileBs(e.target.value)} placeholder={remainingAfterCashBsFormatted > 0 ? remainingAfterCashBsFormatted.toFixed(2) : "0.00"} />
        </div>
      </div>

      {/* 👈 NUEVA CAJA DE AUDITORÍA (APARECE SOLO SI HAY PAGO MÓVIL) */}
      {mobileBsN > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-primary/10 rounded-md border border-primary/20">
            <div>
                <Label className="text-[10px] uppercase font-bold text-primary tracking-wider">Banco Emisor *</Label>
                <select 
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary" 
                  value={mobileBank} 
                  onChange={(e) => setMobileBank(e.target.value)}
                >
                    <option value="">Seleccione...</option>
                    <option value="Banesco">Banesco</option>
                    <option value="Mercantil">Mercantil</option>
                    <option value="Venezuela">Venezuela</option>
                    <option value="Provincial">Provincial</option>
                    <option value="BNC">BNC</option>
                    <option value="Bancamiga">Bancamiga</option>
                    <option value="Tesoro">Tesoro</option>
                    <option value="Otro">Otro</option>
                </select>
            </div>
            <div>
                <Label className="text-[10px] uppercase font-bold text-primary tracking-wider">Referencia (Últ. 4/6) *</Label>
                <Input 
                  type="text" 
                  maxLength={8} 
                  value={mobileRef} 
                  onChange={(e) => setMobileRef(e.target.value.replace(/\D/g, ''))} // Bloquea letras, solo números
                  className="h-9 text-xs font-display tracking-widest bg-background" 
                  placeholder="Ej: 1234" 
                />
            </div>
        </div>
      )}

      <div className={`rounded-md p-3 border-2 ${remaining <= 0.01 ? "border-success bg-success/10" : "border-accent bg-accent/10"}`}>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Diferencia Restante (a cobrar)</div>
        <div className="flex items-baseline justify-between">
          <span className={`font-display text-2xl ${remaining <= 0.01 ? "text-success" : "text-accent"}`}>
            {remaining <= 0.01 ? "Bs 0" : `Bs ${(remaining * rate).toLocaleString("es-VE", { maximumFractionDigits: 2 })}`}
          </span>
          <span className="text-xs text-muted-foreground">≈ {fmtUsd(Math.max(0, remaining))}</span>
        </div>
      </div>

      <div className={`text-sm rounded-md p-2 ${covered ? overpay > 0.01 ? "bg-warning/10 text-warning" : "bg-success/10 text-success" : "bg-muted/30 text-muted-foreground"}`}>
        {covered
          ? overpay > 0.01
            ? `✓ Cubre el total · Vuelto: ${fmtUsd(overpay)} (≈ Bs ${(overpay * rate).toLocaleString("es-VE", { maximumFractionDigits: 2 })})`
            : "✓ Pago exacto. Listo para confirmar."
          : `Pagado: ${fmtUsd(totalPaid)} / ${fmtUsd(total)} · Falta ${fmtUsd(Math.max(0, remaining))}`}
      </div>
    </div>
  );
}

// 👈 ACTUALIZAMOS EL SUPERVISOR PARA QUE NO DEJE PASAR PAGOS SIN REFERENCIA
export function isMixedCovered(total: number, cashUsd: string, mobileBs: string, cashBs: string, rate: number, mobileBank: string, mobileRef: string) {
  const cashUsdN = parseFloat(cashUsd) || 0;
  const mobileBsN = parseFloat(mobileBs) || 0;
  const cashBsN = parseFloat(cashBs) || 0;
  const mobileUsd = rate > 0 ? mobileBsN / rate : 0;
  const cashBsUsd = rate > 0 ? cashBsN / rate : 0;
  
  // Si introdujo Pago Móvil, pero no puso el banco o la referencia, bloquéalo (Retorna falso).
  if (mobileBsN > 0 && (!mobileBank || mobileRef.length < 4)) return false;
  
  return cashUsdN + mobileUsd + cashBsUsd + 0.01 >= total;
}