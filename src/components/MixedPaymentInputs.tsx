import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MixedPaymentInputs({
  total, cashUsd, mobileBs, cashBs, mobileBank, setCashUsd, setMobileBs, setCashBs, setMobileBank
}: any) {
  return (
    <div className="space-y-4 p-4 border border-border rounded-md bg-background/40">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs uppercase text-green-400 font-bold block mb-1">Efectivo ($)</Label>
          <Input type="number" step="0.01" value={cashUsd} onChange={(e) => setCashUsd(e.target.value)} placeholder="0.00" className="h-10 text-base" />
        </div>
        <div>
          <Label className="text-xs uppercase text-blue-400 font-bold block mb-1">Pago Móvil (Bs)</Label>
          <Input type="number" step="0.01" value={mobileBs} onChange={(e) => setMobileBs(e.target.value)} placeholder="0.00" className="h-10 text-base" />
        </div>
        <div>
          <Label className="text-xs uppercase text-emerald-400 font-bold block mb-1">Efectivo (Bs)</Label>
          <Input type="number" step="0.01" value={cashBs} onChange={(e) => setCashBs(e.target.value)} placeholder="0.00" className="h-10 text-base" />
        </div>
      </div>
      
      {parseFloat(mobileBs) > 0 && (
        <div className="p-4 bg-primary/10 rounded-md border border-primary/20">
          <Label className="text-[10px] uppercase font-bold text-primary tracking-wider block mb-1">Banco Emisor *</Label>
          <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary" value={mobileBank} onChange={(e) => setMobileBank(e.target.value)}>
            <option value="">Seleccione banco...</option>
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
      )}
    </div>
  );
}