import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, X } from "lucide-react";

export function WaitQueue() {
  const queue = useStore((s) => s.queue);
  const enqueue = useStore((s) => s.enqueue);
  const dequeue = useStore((s) => s.dequeue);
  const [name, setName] = useState("");
  const [pref, setPref] = useState<"PS4" | "PS5" | "Cualquiera">("Cualquiera");
  const [error, setError] = useState("");

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
            <Button size="sm" onClick={() => { dequeue(q.id); toast.success(`${q.name} asignado`); }}>Asignar</Button>
            <Button size="icon" variant="ghost" onClick={() => dequeue(q.id)}><X className="h-3 w-3" /></Button>
          </div>
        ))}
        {queue.length === 0 && <p className="text-sm text-muted-foreground">Sin clientes en espera.</p>}
      </div>
    </Card>
  );
}
