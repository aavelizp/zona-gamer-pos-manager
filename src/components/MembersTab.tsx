import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Gift, Search } from "lucide-react";

export function MembersTab() {
  const members = useStore((s) => s.members);
  const redeemReward = useStore((s) => s.redeemReward);

  const [search, setSearch] = useState("");

  // Filtramos por búsqueda y ordenamos a los jugadores con más horas de primero
  const filtered = members
    .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  return (
    <div className="space-y-4">
      {/* Barra de Búsqueda Minimalista */}
      <div className="flex items-center gap-2 w-full max-w-md bg-secondary/20 rounded-md px-3 py-1.5 border border-border/40">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar gamer por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-0 text-sm focus:outline-none w-full text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Salón de la Fama / Club Gamer */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-display tracking-wider border-b border-border">
            <tr>
              <th className="p-3">Gamer</th>
              <th className="p-3 text-center">Tiempo Jugado</th>
              <th className="p-3 text-center">Horas de Regalo (Disponibles)</th>
              <th className="p-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center p-8 text-muted-foreground">
                  No se encontraron gamers con ese nombre.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-semibold text-foreground text-base">
                    {m.name}
                  </td>
                  <td className="p-3 text-center font-display text-primary">
                    {Math.floor(m.totalMinutes / 60)}h {m.totalMinutes % 60}m
                  </td>
                  <td className="p-3 text-center">
                    {m.pendingRewards > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 font-display px-3 py-1 rounded-full text-sm border border-green-500/20">
                        <Gift className="h-4 w-4" /> {m.pendingRewards} Disp.
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Aún no alcanza premio</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {m.pendingRewards > 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10 border-green-500/30"
                        onClick={() => {
                          if (confirm(`¿Canjear 1 hora de premio para ${m.name}?`)) {
                            redeemReward(m.id);
                          }
                        }}
                      >
                        <Gift className="h-4 w-4 mr-1" /> Canjear
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">Acumulando...</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}