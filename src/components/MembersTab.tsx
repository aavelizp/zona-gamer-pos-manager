import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trophy, Gift, Star } from "lucide-react";

export function MembersTab() {
  const members = useStore((s) => s.members || []);
  const redeemReward = useStore((s) => s.redeemReward);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...members].sort((a, b) => (b.pendingRewards || 0) - (a.pendingRewards || 0));
    if (!q) return list;
    return list.filter((m) => m.name.toLowerCase().includes(q) || (m.phone || "").includes(q));
  }, [members, query]);

  return (
    <div className="space-y-6">
      
      {/* TARJETA SUPERIOR: Responsiva (Columna en móvil, fila en PC) */}
      <Card className="p-4 sm:p-5 border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h3 className="font-display text-lg text-amber-500 flex items-center gap-2">
            <Trophy className="h-5 w-5" /> Club Gamer (Fidelidad)
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Por cada 10 horas acumuladas, el cliente gana 1 hora gratis.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Buscar por nombre o celular..." 
            className="pl-9 h-10 w-full bg-background/50 border-amber-500/30 focus-visible:ring-amber-500" 
          />
        </div>
      </Card>

      {/* TABLA: Deslizable en celular */}
      <Card className="border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          {/* min-w-[700px] protege que las columnas no se compriman en el celular */}
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs tracking-wider">
              <tr>
                <th className="p-3 sm:p-4">Cliente</th>
                <th className="p-3 sm:p-4">Horas Totales</th>
                <th className="p-3 sm:p-4 w-48">Progreso Próxima</th>
                <th className="p-3 sm:p-4 text-center">Premios Disp.</th>
                <th className="p-3 sm:p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                 <tr><td colSpan={5} className="p-6 text-center text-muted-foreground italic">No hay miembros en el club gamer.</td></tr>
              ) : (
                filtered.map(m => {
                  const totalH = Math.floor((m.totalMinutes||0)/60);
                  const totalM = (m.totalMinutes||0)%60;
                  const progress = Math.min(100, Math.round(((m.rewardMinutes||0)/600)*100));
                  return (
                    <tr key={m.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 sm:p-4">
                        <p className="font-bold text-sm sm:text-base">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.phone || "Sin teléfono"}</p>
                      </td>
                      <td className="p-3 sm:p-4 font-medium">{totalH}h {totalM}m</td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 sm:h-2.5 bg-secondary rounded-full overflow-hidden w-full">
                            <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400" style={{width: `${progress}%`}} />
                          </div>
                          <span className="text-xs text-muted-foreground font-bold">{progress}%</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        {(m.pendingRewards||0) > 0 ? (
                          <span className="inline-flex items-center justify-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-500 px-2 py-1 rounded-md font-bold text-xs sm:text-sm">
                            <Gift className="h-3 w-3 sm:h-4 sm:w-4" /> {(m.pendingRewards||0)}
                          </span>
                        ) : <span className="text-muted-foreground text-xs font-semibold">0</span>}
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        <Button 
                          size="sm" 
                          variant={(m.pendingRewards||0) > 0 ? "default" : "outline"} 
                          className={`h-8 sm:h-9 ${((m.pendingRewards||0) > 0) ? "bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]" : ""}`}
                          disabled={(m.pendingRewards||0) <= 0}
                          onClick={() => { if(confirm(`¿Canjear 1 hora gratis para ${m.name}? El cliente podrá reclamar esta hora libre en cualquier consola.`)) redeemReward(m.id); }}
                        >
                          <Star className="h-4 w-4 mr-1" /> Canjear
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}