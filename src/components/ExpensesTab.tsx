import { useMemo, useState } from "react";
import { useStore, fmtUsd, EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Wallet, Plus, Filter } from "lucide-react";
import { toast } from "sonner";

function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function tsToInputDate(ts: number) {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function inputDateToTs(s: string): number {
  // local midday to avoid TZ shifts
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0).getTime();
}

export function ExpensesTab() {
  const rate = useStore((s) => s.rate);
  const expenses = useStore((s) => s.expenses);
  const addExpense = useStore((s) => s.addExpense);
  const removeExpense = useStore((s) => s.removeExpense);

  // Form
  const [description, setDescription] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [amountBs, setAmountBs] = useState("");
  const [method, setMethod] = useState<"cash" | "mobile">("cash");
  const [category, setCategory] = useState<ExpenseCategory>("Servicios");
  const [date, setDate] = useState(todayStr());

  // Filters
  const [filterMonth, setFilterMonth] = useState<string>(""); // YYYY-MM
  const [filterDate, setFilterDate] = useState<string>("");   // YYYY-MM-DD
  const [filterCat, setFilterCat] = useState<string>("__all");

  // When user types USD, autocalc Bs (and vice versa) only when one is empty
  const onUsdChange = (v: string) => {
    setAmountUsd(v);
    if (v && rate > 0) setAmountBs(((parseFloat(v) || 0) * rate).toFixed(2));
  };
  const onBsChange = (v: string) => {
    setAmountBs(v);
    if (v && rate > 0) setAmountUsd(((parseFloat(v) || 0) / rate).toFixed(2));
  };

  const submit = () => {
    const usd = parseFloat(amountUsd) || 0;
    const bs = parseFloat(amountBs) || 0;
    if (!description.trim() || usd <= 0) {
      toast.error("Completa descripción y monto válido");
      return;
    }
    addExpense({
      description: description.trim(),
      amount: usd,
      amountBs: method === "mobile" ? bs : undefined,
      method,
      category,
      ts: inputDateToTs(date),
    });
    setDescription(""); setAmountUsd(""); setAmountBs("");
    toast.success("Gasto registrado");
  };

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => {
        if (filterCat !== "__all" && e.category !== filterCat) return false;
        if (filterDate) {
          if (tsToInputDate(e.ts) !== filterDate) return false;
        } else if (filterMonth) {
          if (tsToInputDate(e.ts).slice(0, 7) !== filterMonth) return false;
        }
        return true;
      })
      .sort((a, b) => b.ts - a.ts);
  }, [expenses, filterCat, filterDate, filterMonth]);

  const totalFiltered = filtered.reduce((a, e) => a + e.amount, 0);

  // Stats
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
  const totalToday = expenses.filter((e) => e.ts >= startOfToday.getTime()).reduce((a, e) => a + e.amount, 0);
  const totalMonth = expenses.filter((e) => e.ts >= startOfMonth.getTime()).reduce((a, e) => a + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="p-3 border-destructive/40 bg-destructive/5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Gastos Hoy</p>
          <p className="font-display text-2xl text-destructive">{fmtUsd(totalToday)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Gastos del Mes</p>
          <p className="font-display text-2xl">{fmtUsd(totalMonth)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Histórico</p>
          <p className="font-display text-2xl">{fmtUsd(expenses.reduce((a, e) => a + e.amount, 0))}</p>
        </Card>
      </div>

      {/* Form */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg">Registrar Gasto</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label className="text-xs">Descripción *</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Pago de Internet, Compra de hielo" />
          </div>
          <div>
            <Label className="text-xs">Categoría</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Monto ($)</Label>
            <Input type="number" step="0.01" value={amountUsd} onChange={(e) => onUsdChange(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Monto (Bs)</Label>
            <Input type="number" step="0.01" value={amountBs} onChange={(e) => onBsChange(e.target.value)} />
            <p className="text-[10px] text-muted-foreground">Tasa: {rate} Bs/$</p>
          </div>
          <div className="sm:col-span-2 grid grid-cols-2 gap-2">
            <Button size="sm" variant={method === "cash" ? "default" : "outline"} onClick={() => setMethod("cash")}>💵 Efectivo $</Button>
            <Button size="sm" variant={method === "mobile" ? "default" : "outline"} onClick={() => setMethod("mobile")}>📱 Pago Móvil Bs</Button>
          </div>
        </div>
        <Button onClick={submit} className="w-full mt-3 bg-gradient-to-r from-primary to-accent">
          <Wallet className="h-4 w-4 mr-1" /> Registrar Gasto
        </Button>
      </Card>

      {/* Filters + history */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-5 w-5 text-accent" />
          <h3 className="font-display text-lg">Historial de Gastos</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-2 mb-3">
          <div>
            <Label className="text-[11px]">Filtrar por mes</Label>
            <Input type="month" value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setFilterDate(""); }} />
          </div>
          <div>
            <Label className="text-[11px]">Filtrar por día</Label>
            <Input type="date" value={filterDate} onChange={(e) => { setFilterDate(e.target.value); setFilterMonth(""); }} />
          </div>
          <div>
            <Label className="text-[11px]">Categoría</Label>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todas</SelectItem>
                {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        {(filterMonth || filterDate || filterCat !== "__all") && (
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">{filtered.length} resultado(s) · Total: <span className="font-display text-destructive">{fmtUsd(totalFiltered)}</span></p>
            <Button size="sm" variant="ghost" onClick={() => { setFilterMonth(""); setFilterDate(""); setFilterCat("__all"); }}>Limpiar filtros</Button>
          </div>
        )}

        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-2">Fecha</th>
                <th className="text-left p-2">Descripción</th>
                <th className="text-left p-2 hidden sm:table-cell">Categoría</th>
                <th className="text-left p-2">Método</th>
                <th className="text-right p-2">Monto</th>
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center text-xs text-muted-foreground p-4 italic">Sin gastos en este filtro.</td></tr>
              )}
              {filtered.map((e) => (
                <tr key={e.id} className="border-t border-border/50">
                  <td className="p-2 whitespace-nowrap text-xs">{new Date(e.ts).toLocaleDateString("es-VE")}</td>
                  <td className="p-2">{e.description}</td>
                  <td className="p-2 hidden sm:table-cell text-xs">{e.category || "—"}</td>
                  <td className="p-2 text-xs">
                    {e.method === "cash"
                      ? `💵 ${fmtUsd(e.amount)}`
                      : `📱 Bs ${(e.amountBs || 0).toLocaleString("es-VE")}`}
                  </td>
                  <td className="p-2 text-right font-display">{fmtUsd(e.amount)}</td>
                  <td className="p-2">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { removeExpense(e.id); toast.success("Gasto eliminado"); }}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
