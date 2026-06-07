import { useState, useMemo } from "react";
import { useStore, fmtBs } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, ArrowRightLeft } from "lucide-react";

interface BankRecord { id: string; ref: string; amount: number; originalLine: string; matched: boolean; }

export function ReconciliationTab() {
  const sales = useStore((s) => s.sales);
  const [bankText, setBankText] = useState("");
  const [hasProcessed, setHasProcessed] = useState(false);
  const [bankRecords, setBankRecords] = useState<BankRecord[]>([]);

  // 1. Obtenemos solo las ventas del POS del TURNO ACTUAL
  const posMobileSales = useMemo(() => {
    // Configuramos el inicio del turno a las 6:00 AM
    // Esto evita que las ventas hechas a la 1:00 AM pasen al "día siguiente" en medio del trabajo.
    const shiftStart = new Date();
    if (shiftStart.getHours() < 6) {
      shiftStart.setDate(shiftStart.getDate() - 1);
    }
    shiftStart.setHours(6, 0, 0, 0);

    const currentShiftSales = sales.filter(s => 
      s.mobileBs && 
      s.mobileBs > 0 &&
      s.mobileRef && // Ignoramos ventas viejas de prueba que no tienen referencia
      s.ts >= shiftStart.getTime() // Filtro estricto: Solo desde el inicio del turno
    );

    return currentShiftSales.map(s => ({ ...s, matched: false }));
  }, [sales]);

  const [posRecords, setPosRecords] = useState(posMobileSales);

  const processBankText = () => {
    const lines = bankText.split('\n').filter(l => l.trim().length > 0);
    const parsedRecords: BankRecord[] = [];

    lines.forEach((line, index) => {
      const refMatch = line.match(/\b\d{4,15}\b/g);
      const ref = refMatch ? refMatch[refMatch.length - 1] : "";

      let cleanStr = line.replace(/[^\d,\.-]/g, ' ');
      const numMatches = cleanStr.match(/-?[\d\.,]+/g);
      let amount = 0;

      if (numMatches) {
        let numStr = numMatches[numMatches.length - 1];
        if (numStr.includes(',') && numStr.includes('.')) {
            if (numStr.indexOf(',') > numStr.indexOf('.')) { numStr = numStr.replace(/\./g, '').replace(',', '.'); } else { numStr = numStr.replace(/,/g, ''); }
        } else if (numStr.includes(',')) { numStr = numStr.replace(',', '.'); }
        amount = parseFloat(numStr) || 0;
      }

      if (ref && amount > 0) { parsedRecords.push({ id: `bank-${index}`, ref, amount, originalLine: line, matched: false }); }
    });

    const newPos = [...posMobileSales];
    
    parsedRecords.forEach(bank => {
      const matchIndex = newPos.findIndex(pos => !pos.matched && pos.mobileRef && (bank.ref.endsWith(pos.mobileRef) || pos.mobileRef.endsWith(bank.ref)) && Math.abs(bank.amount - pos.mobileBs) <= 1 );
      if (matchIndex !== -1) { bank.matched = true; newPos[matchIndex].matched = true; }
    });

    setBankRecords(parsedRecords); setPosRecords(newPos); setHasProcessed(true);
  };

  const clearAll = () => { setBankText(""); setHasProcessed(false); setBankRecords([]); setPosRecords(posMobileSales); };

  const matches = posRecords.filter(p => p.matched).length;
  const faltantes = posRecords.filter(p => !p.matched).length;
  const sobrantes = bankRecords.filter(b => !b.matched).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-2"><div><h2 className="font-display text-xl text-primary flex items-center gap-2"><ShieldCheck className="h-6 w-6" /> Conciliación Bancaria</h2><p className="text-sm text-muted-foreground mt-1">Cruza los pagos móviles registrados HOY en el sistema contra el estado de cuenta real de tu banco.</p></div></div>

      {!hasProcessed ? (
        <Card className="p-6 border-primary/30 bg-secondary/10">
          <h3 className="font-semibold mb-2">Instrucciones:</h3>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 mb-4">
            <li>Abre la página web de tu banco (Banesco, Mercantil, BDV, etc.).</li><li>Sombrea y copia (Ctrl+C) las filas de los movimientos / abonos de HOY.</li><li>Pega (Ctrl+V) el texto aquí abajo y el sistema extraerá las referencias y los montos.</li>
          </ol>
          <textarea 
            placeholder="Pega aquí los movimientos de tu banco..." 
            className="w-full min-h-[200px] p-3 rounded-md border border-input bg-background/50 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            value={bankText}
            onChange={(e) => setBankText(e.target.value)}
          />
          <div className="flex justify-end mt-4"><Button onClick={processBankText} disabled={!bankText.trim()} className="bg-gradient-to-r from-primary to-accent"><ArrowRightLeft className="h-4 w-4 mr-2" /> Iniciar Conciliación</Button></div>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-green-500/10 border-green-500/30"><div className="flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-green-500" /><div><p className="text-sm font-semibold text-green-500">Conciliados (Match)</p><p className="text-2xl font-display">{matches}</p></div></div></Card>
            <Card className="p-4 bg-red-500/10 border-red-500/30"><div className="flex items-center gap-3"><XCircle className="h-8 w-8 text-red-500" /><div><p className="text-sm font-semibold text-red-500">Faltantes en Banco</p><p className="text-2xl font-display">{faltantes}</p></div></div></Card>
            <Card className="p-4 bg-yellow-500/10 border-yellow-500/30"><div className="flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-yellow-500" /><div><p className="text-sm font-semibold text-yellow-500">Sobrantes en Banco</p><p className="text-2xl font-display">{sobrantes}</p></div></div></Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-3"><h3 className="font-display text-lg px-2 border-b border-border pb-2">Registros del Sistema (HOY)</h3><div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">{posRecords.map(pos => (<div key={pos.id} className={`p-3 rounded-md border text-sm flex justify-between items-center ${pos.matched ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/10 border-red-500/40 shadow-[0_0_10px_rgba(255,0,0,0.1)]'}`}><div><p className="font-semibold">{pos.concept} <span className="text-muted-foreground font-normal">({new Date(pos.ts).toLocaleTimeString("es-VE", {hour:'2-digit', minute:'2-digit'})})</span></p><p className="text-xs text-muted-foreground">Ref: <span className="text-foreground font-mono">{pos.mobileRef || "SIN REF"}</span> | Banco: {pos.mobileBank || "—"}</p></div><div className="text-right"><p className="font-display">{fmtBs(pos.mobileBs / (pos.rate || 1), pos.rate || 1)}</p>{pos.matched ? <span className="text-[10px] text-green-500 font-bold">✓ OK</span> : <span className="text-[10px] text-red-500 font-bold animate-pulse">❌ FALTANTE</span>}</div></div>))}</div></div>
            <div className="space-y-3"><h3 className="font-display text-lg px-2 border-b border-border pb-2">Estado de Cuenta (Banco)</h3><div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">{bankRecords.map(bank => (<div key={bank.id} className={`p-3 rounded-md border text-sm flex justify-between items-center ${bank.matched ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/40'}`}><div className="truncate pr-4 max-w-[250px]"><p className="font-semibold text-xs truncate text-muted-foreground" title={bank.originalLine}>{bank.originalLine}</p><p className="text-xs mt-1">Ref extraída: <span className="text-foreground font-mono">{bank.ref}</span></p></div><div className="text-right shrink-0"><p className="font-display text-accent">Bs {bank.amount.toLocaleString("es-VE", {minimumFractionDigits: 2})}</p>{bank.matched ? <span className="text-[10px] text-green-500 font-bold">✓ MATCH</span> : <span className="text-[10px] text-yellow-500 font-bold">⚠️ NO REGISTRADO</span>}</div></div>))}</div></div>
          </div>
          <div className="flex justify-center pt-4 border-t border-border"><Button variant="outline" onClick={clearAll}>Realizar Nueva Conciliación</Button></div>
        </div>
      )}
    </div>
  );
}