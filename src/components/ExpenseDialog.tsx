import { useState } from "react";
import { useStore, fmtUsd, fmtBs } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export function ExpenseDialog({ open, onOpenChange }: Props) {
  const rate = useStore((s) => s.rate);
  const expenses = useStore((s) => s.expenses);
  const addExpense = useStore((s) => s.addExpense);
  const removeExpense = useStore((s) => s.removeExpense);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "mobile">("cash");

  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const todayExpenses = expenses.filter((e) => e.ts >= startOfToday.getTime());

  const submit = () => {
    const n = parseFloat(amount);
    if (!description.trim() || !n || n <= 0) {
      toast.error("Completa descripción y monto válido");
      return;
    }
    if (method === "mobile") {
      const usd = rate > 0 ? n / rate : 0;
      addExpense({ description: description.trim(), amount: usd, method, amountBs: n });
    } else {
      addExpense({ description: description.trim(), amount: n, method });
    }
    setDescription(""); setAmount("");
    toast.success("Gasto registrado");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">Caja Chica · Registrar Gasto</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Descripción</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Comprar hielo" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant={method === "cash" ? "default" : "outline"} onClick={() => setMethod("cash")}>Efectivo $</Button>
            <Button size="sm" variant={method === "mobile" ? "default" : "outline"} onClick={() => setMethod("mobile")}>Pago Móvil Bs</Button>
          </div>
          <div>
            <Label className="text-xs">{method === "cash" ? "Monto ($)" : "Monto (Bs)"}</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            {method === "mobile" && amount && (
              <p className="text-[11px] text-muted-foreground">≈ {fmtUsd((parseFloat(amount) || 0) / (rate || 1))}</p>
            )}
          </div>
          <Button onClick={submit} className="w-full">Registrar Gasto</Button>

          <div className="border-t border-border pt-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Gastos de hoy ({todayExpenses.length})</p>
            <div className="space-y-1 max-h-56 overflow-auto">
              {todayExpenses.length === 0 && <p className="text-xs text-muted-foreground italic">Sin gastos registrados.</p>}
              {todayExpenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm border border-border/40 rounded p-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{e.description}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {e.method === "cash" ? `💵 ${fmtUsd(e.amount)}` : `📱 Bs ${(e.amountBs || 0).toLocaleString("es-VE")} (≈ ${fmtUsd(e.amount)})`}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeExpense(e.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            {todayExpenses.length > 0 && (
              <div className="mt-2 text-sm flex justify-between font-display border-t border-border pt-2">
                <span>Total Gastos Hoy:</span>
                <span className="text-destructive">{fmtUsd(todayExpenses.reduce((a, e) => a + e.amount, 0))}</span>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
