import { useStore, fmtUsd, fmtBs } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface Props {
  total: number;
  cashUsd: string;
  mobileBs: string;
  setCashUsd: (v: string) => void;
  setMobileBs: (v: string) => void;
}

/**
 * Pago Mixto compartido. Muestra:
 *  - Total a pagar en $ y Bs
 *  - Inputs Efectivo $ y Pago Móvil Bs
 *  - Diferencia restante destacada en Bs (calculada en tiempo real)
 *
 * Fórmula: faltanteUSD = max(0, total - efectivoUSD - mobileBs/tasa)
 *          faltanteBs  = faltanteUSD * tasa
 */
export function MixedPaymentInputs({ total, cashUsd, mobileBs, setCashUsd, setMobileBs }: Props) {
  const rate = useStore((s) => s.rate);
  const cashUsdN = parseFloat(cashUsd) || 0;
  const mobileBsN = parseFloat(mobileBs) || 0;
  const mobileUsd = rate > 0 ? mobileBsN / rate : 0;

  // Diferencia restante en USD luego de aplicar lo ingresado en $
  const remainingAfterCashUsd = Math.max(0, total - cashUsdN);
  const remainingAfterCashBs = remainingAfterCashUsd * rate;

  const totalPaid = cashUsdN + mobileUsd;
  const remaining = total - totalPaid;
  const covered = totalPaid + 0.01 >= total;
  const overpay = totalPaid - total;

  return (
    <div className="space-y-3">
      {/* Total destacado en $ y Bs */}
      <Card className="p-3 bg-secondary/40">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total a Pagar</div>
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl">{fmtUsd(total)}</span>
          <span className="font-display text-base text-accent">{fmtBs(total, rate)}</span>
        </div>
      </Card>

      {/* Efectivo $ */}
      <div>
        <Label>Efectivo $</Label>
        <Input
          type="number"
          step="0.01"
          inputMode="decimal"
          value={cashUsd}
          onChange={(e) => setCashUsd(e.target.value)}
          placeholder="0.00"
        />
      </div>

      {/* Diferencia restante en Bs (destacada) */}
      <div className={`rounded-md p-3 border-2 ${remainingAfterCashUsd <= 0.01 ? "border-success bg-success/10" : "border-accent bg-accent/10"}`}>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Diferencia Restante (a cobrar en Bs)
        </div>
        <div className="flex items-baseline justify-between">
          <span className={`font-display text-2xl ${remainingAfterCashUsd <= 0.01 ? "text-success" : "text-accent"}`}>
            {remainingAfterCashUsd <= 0.01
              ? "Bs 0"
              : `Bs ${remainingAfterCashBs.toLocaleString("es-VE", { maximumFractionDigits: 2 })}`}
          </span>
          <span className="text-xs text-muted-foreground">
            ≈ {fmtUsd(remainingAfterCashUsd)}
          </span>
        </div>
      </div>

      {/* Pago Móvil Bs */}
      <div>
        <Label>Pago Móvil Bs</Label>
        <Input
          type="number"
          step="0.01"
          inputMode="decimal"
          value={mobileBs}
          onChange={(e) => setMobileBs(e.target.value)}
          placeholder={remainingAfterCashBs > 0 ? remainingAfterCashBs.toFixed(2) : "0.00"}
        />
        <p className="text-[11px] text-muted-foreground">≈ {fmtUsd(mobileUsd)}</p>
      </div>

      {/* Estado del pago */}
      <div
        className={`text-sm rounded-md p-2 ${
          covered
            ? overpay > 0.01
              ? "bg-warning/10 text-warning"
              : "bg-success/10 text-success"
            : "bg-muted/30 text-muted-foreground"
        }`}
      >
        {covered
          ? overpay > 0.01
            ? `✓ Cubre el total · Vuelto: ${fmtUsd(overpay)} (≈ Bs ${(overpay * rate).toLocaleString("es-VE", { maximumFractionDigits: 2 })})`
            : "✓ Pago exacto. Listo para confirmar."
          : `Pagado: ${fmtUsd(totalPaid)} / ${fmtUsd(total)} · Falta ${fmtUsd(Math.max(0, remaining))}`}
      </div>
    </div>
  );
}

/**
 * Helper: indica si el pago mixto cubre el total (con tolerancia de 1 céntimo).
 */
export function isMixedCovered(total: number, cashUsd: string, mobileBs: string, rate: number) {
  const cashUsdN = parseFloat(cashUsd) || 0;
  const mobileBsN = parseFloat(mobileBs) || 0;
  const mobileUsd = rate > 0 ? mobileBsN / rate : 0;
  return cashUsdN + mobileUsd + 0.01 >= total;
}
