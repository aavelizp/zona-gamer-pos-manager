import { useEffect, useState } from "react";
import { useStore, fmtUsd } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Settings2, Gamepad2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function BusinessConfigTab() {
  const consoles = useStore((s) => s.consoles);
  const setConsoleRate = useStore((s) => s.setConsoleRate);

  const ps4Current = consoles.find((c) => c.type === "PS4")?.ratePerHour ?? 0;
  const ps5Current = consoles.find((c) => c.type === "PS5")?.ratePerHour ?? 0;

  const [ps4, setPs4] = useState(String(ps4Current));
  const [ps5, setPs5] = useState(String(ps5Current));

  // resync if external change
  useEffect(() => { setPs4(String(ps4Current)); }, [ps4Current]);
  useEffect(() => { setPs5(String(ps5Current)); }, [ps5Current]);

  const ps4N = parseFloat(ps4) || 0;
  const ps5N = parseFloat(ps5) || 0;
  const dirty = ps4N !== ps4Current || ps5N !== ps5Current;

  const save = () => {
    if (ps4N <= 0 || ps5N <= 0) {
      toast.error("Los precios deben ser mayores a 0");
      return;
    }
    setConsoleRate("PS4", ps4N);
    setConsoleRate("PS5", ps5N);
    toast.success("Configuración guardada. Los nuevos precios aplican a todas las consolas, prepagos y combos.");
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg">Configuración de Negocio · Tarifas</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Estos valores se guardan permanentemente y se usan en cronómetros, prepagos y combos.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="border border-border rounded-lg p-4 bg-secondary/20 space-y-2">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              <Label className="text-sm font-display">Precio por Hora · PS4 ($)</Label>
            </div>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={ps4}
              onChange={(e) => setPs4(e.target.value)}
              className="text-2xl h-14 font-display"
            />
            <p className="text-[11px] text-muted-foreground">
              Aplicará a {consoles.filter((c) => c.type === "PS4").length} consolas PS4.
              Actual: {fmtUsd(ps4Current)}/h
            </p>
          </div>

          <div className="border border-gold/40 rounded-lg p-4 bg-gold/5 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" />
              <Label className="text-sm font-display">Precio por Hora · PS5 ($)</Label>
            </div>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={ps5}
              onChange={(e) => setPs5(e.target.value)}
              className="text-2xl h-14 font-display"
            />
            <p className="text-[11px] text-muted-foreground">
              Aplicará a {consoles.filter((c) => c.type === "PS5").length} consolas PS5.
              Actual: {fmtUsd(ps5Current)}/h
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          {dirty && (
            <Button variant="ghost" onClick={() => { setPs4(String(ps4Current)); setPs5(String(ps5Current)); }}>
              Cancelar cambios
            </Button>
          )}
          <Button onClick={save} disabled={!dirty} className="bg-gradient-to-r from-primary to-accent">
            <Save className="h-4 w-4 mr-1" /> Guardar Configuración
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-3">
          Tarifas activas por consola
        </h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {consoles.map((c) => (
            <div key={c.id} className="flex items-center justify-between border border-border rounded-md p-2">
              <div className="flex items-center gap-2">
                {c.type === "PS5" ? <Sparkles className="h-4 w-4 text-gold" /> : <Gamepad2 className="h-4 w-4 text-primary" />}
                <span className="text-sm">{c.name}</span>
              </div>
              <span className="font-display text-sm">{fmtUsd(c.ratePerHour)}/h</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
