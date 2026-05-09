import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore, type QueueEntry } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, X } from "lucide-react";

export function WaitQueue() {
  const queue = useStore((s) => s.queue);
  const consoles = useStore((s) => s.consoles);
  const enqueue = useStore((s) => s.enqueue);
  const dequeue = useStore((s) => s.dequeue);
  const startSession = useStore((s) => s.startSession);
  const [name, setName] = useState("");
  const [pref, setPref] = useState<"PS4" | "PS5" | "Cualquiera">("Cualquiera");
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState<{ entry: QueueEntry; consoleId: string; consoleName: string } | null>(null);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("El nombre es obligatorio");
      toast.error("Falta el nombre del cliente");
      return;
    }
    enqueue({ name: trimmed, preference: pref });
    toast.success("Cliente agregado a la espera");
    setName("");
    setPref("Cualquiera");
    setError("");
  };

  const findSuggested = (preference: QueueEntry["preference"]) => {
    const free = consoles.filter((c) => !c.session);
    let pool = free;
    if (preference !== "Cualquiera") pool = free.filter((c) => c.type === preference);
    return [...pool].sort((a, b) => a.totalMinutes - b.totalMinutes)[0];
  };

  const handleAssign = (entry: QueueEntry) => {
    const target = findSuggested(entry.preference);
    if (!target) {
      toast.error(`No hay consolas ${entry.preference} libres`);
      return;
    }
    setAssigning({ entry, consoleId: target.id, consoleName: target.name });
  };

  const startWith = (minutes?: number) => {
    if (!assigning) return;
    startSession(assigning.consoleId, minutes);
    dequeue(assigning.entry.id);
    toast.success(`${assigning.entry.name} → ${assigning.consoleName}`);
    setAssigning(null);
  };

  return (
    <Card className="p-4 sticky top-4 h-fit">
      <h3 className="font-display text-lg mb-3 flex items-center gap-2"><Users className="h-5 w-5 text-accent" />Lista de Espera</h3>
      <div className="space-y-2">
        <Input
          placeholder="Nombre"
          value={name}
          onChange={(e) => { setName(e.target.value); if (error) setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          aria-invalid={!!error}
          className={error ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="grid grid-cols-3 gap-1">
          {(["PS4", "PS5", "Cualquiera"] as const).map((p) => (
            <Button key={p} size="sm" variant={pref === p ? "default" : "outline"} onClick={() => setPref(p)}>{p}</Button>
          ))}
        </div>
        <Button onClick={submit} className="w-full">Añadir</Button>
      </div>
      <div className="mt-4 space-y-2">
        {queue.map((q, i) => (
          <div key={q.id} className="flex items-center gap-2 bg-secondary/40 rounded-md p-2">
            <span className="font-display text-accent">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{q.name}</p>
              <p className="text-xs text-muted-foreground">{q.preference}</p>
            </div>
            <Button size="sm" onClick={() => handleAssign(q)}>Asignar</Button>
            <Button size="icon" variant="ghost" onClick={() => dequeue(q.id)}><X className="h-3 w-3" /></Button>
          </div>
        ))}
        {queue.length === 0 && <p className="text-sm text-muted-foreground">Sin clientes en espera.</p>}
      </div>

      <Dialog open={!!assigning} onOpenChange={(o) => !o && setAssigning(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">¿Cuánto tiempo va a jugar?</DialogTitle>
          </DialogHeader>
          {assigning && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Asignando a <span className="text-foreground font-semibold">{assigning.entry.name}</span> →{" "}
                <span className="text-accent font-semibold">{assigning.consoleName}</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button onClick={() => startWith(30)}>30 min</Button>
                <Button onClick={() => startWith(60)}>1 Hora</Button>
                <Button variant="outline" onClick={() => startWith(undefined)}>Tiempo Libre</Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssigning(null)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
