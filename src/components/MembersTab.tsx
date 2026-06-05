import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Gift, Search, Trophy } from "lucide-react";

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
      {/* Barra de Búsqueda */}
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

      {/* Salón de la Fama / Club Gamer con Línea de Llenado */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-display tracking-wider border-b border-border">
            <tr>
              <th className="p-3">Gamer</th>
              <th className="p-3 w-1/2">Línea de Participación (Meta: 10h)</th>
              <th className="p-3 text-right">Premios</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center p-8 text-muted-foreground">
                  No se encontraron gamers con ese nombre.
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                // Calculamos el porcentaje de llenado (0 a 100%) basado en 600 min (10 horas)
                const progressPercent = Math.min(100, (m.rewardMinutes / 600) * 100);

                return (
                  <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                    
                    {/* Nombre del Jugador */}
                    <td className="p-3 font-semibold text-foreground text-base">
                      {m.name}
                    </td>

                    {/* Línea de Llenado Visual */}
                    <td className="p-3 align-middle">
                      <div className="max-w-xs">
                        <div className="flex justify-between text-[11px] mb-1 font-medium">
                          <span className="text-primary">
                            {Math.floor(m.rewardMinutes / 60)}h {m.rewardMinutes % 60}m
                          </span>
                          <span className="text-muted-foreground">10h</span>
                        </div>
                        
                        <div className="h-2.5 w-full bg-secondary/60 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        
                        {m.pendingRewards === 0 && (
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            Faltan {600 - m.rewardMinutes} min para la hora gratis
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Botón de Canje o Estatus */}
                    <td className="p-3 text-right">
                      {m.pendingRewards > 0 ? (
                        <div className="flex flex-col items-end gap-2">
                          <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-500 font-display px-2 py-0.5 rounded text-xs border border-yellow-500/30 animate-pulse">
                            <Trophy className="h-3 w-3" /> {m.pendingRewards} Disp.
                          </span>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white shadow-md h-8"
                            onClick={() => {
                              if (confirm(`¿Canjear 1 hora de premio para ${m.name}?`)) {
                                redeemReward(m.id);
                              }
                            }}
                          >
                            <Gift className="h-3.5 w-3.5 mr-1" /> Canjear
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">Acumulando...</span>
                      )}
                    </td>
                    
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}