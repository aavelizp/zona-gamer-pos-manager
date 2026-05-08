import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Wrench, Gamepad2 } from "lucide-react";
import { toast } from "sonner";

const THRESHOLD_MIN = 60_000; // 1000h

function fmtHours(min: number) {
  return `${(min / 60).toFixed(1)} h`;
}

function MaintenanceDialog({ consoleId, consoleName }: { consoleId: string; consoleName: string }) {
  const register = useStore((s) => s.registerMaintenance);
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const submit = () => {
    if (!desc.trim()) {
      toast.error("Describe el servicio realizado");
      return;
    }
    const ts = new Date(date).getTime() || Date.now();
    register(consoleId, desc.trim(), ts);
    toast.success(`Mantenimiento registrado · ${consoleName}`);
    setDesc("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full">
          <Wrench className="h-4 w-4 mr-1" /> Registrar Mantenimiento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mantenimiento · {consoleName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Descripción del servicio</Label>
            <Textarea
              placeholder="Ej: Limpieza profunda, cambio de pasta térmica, reparación de Joy-con..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MaintenanceTab() {
  const consoles = useStore((s) => s.consoles);
  const logs = useStore((s) => s.maintenanceLogs);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {consoles.map((c) => {
          const maint = c.maintenanceMinutes || 0;
          const pct = Math.min(100, (maint / THRESHOLD_MIN) * 100);
          const needs = maint >= THRESHOLD_MIN;
          const remaining = Math.max(0, THRESHOLD_MIN - maint);
          return (
            <Card key={c.id} className={needs ? "border-destructive" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-display">
                  <Gamepad2 className="h-4 w-4 text-primary" />
                  {c.name}
                </CardTitle>
                <Badge variant={c.type === "PS5" ? "default" : "secondary"}>{c.type}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {needs && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/15 border border-destructive/40 px-2 py-1.5 text-destructive text-xs font-semibold">
                    <AlertTriangle className="h-4 w-4" /> MANTENIMIENTO REQUERIDO
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Próximo mantenimiento</span>
                    <span className="font-mono">{fmtHours(maint)} / 1000 h</span>
                  </div>
                  <Progress value={pct} className={needs ? "[&>div]:bg-destructive" : ""} />
                  <div className="text-[10px] text-muted-foreground">
                    Faltan {fmtHours(remaining)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded bg-secondary/40 p-2">
                    <div className="text-muted-foreground text-[10px] uppercase">Vida total</div>
                    <div className="font-display text-base">{fmtHours(c.totalMinutes)}</div>
                  </div>
                  <div className="rounded bg-secondary/40 p-2">
                    <div className="text-muted-foreground text-[10px] uppercase">Desde último</div>
                    <div className="font-display text-base">{fmtHours(maint)}</div>
                  </div>
                </div>
                <MaintenanceDialog consoleId={c.id} consoleName={c.name} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">Bitácora técnica</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay mantenimientos registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Consola</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Horas vida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{new Date(l.date).toLocaleDateString("es-VE")}</TableCell>
                    <TableCell>{l.consoleName}</TableCell>
                    <TableCell className="max-w-md whitespace-pre-wrap">{l.description}</TableCell>
                    <TableCell className="text-right font-mono">{fmtHours(l.minutesAtService)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
