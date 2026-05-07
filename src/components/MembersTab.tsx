import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Trophy, Trash2, Phone } from "lucide-react";

export function MembersTab() {
  const members = useStore((s) => s.members);
  const redeem = useStore((s) => s.redeemReward);
  const remove = useStore((s) => s.removeMember);

  const sorted = [...members].sort((a, b) => b.totalMinutes - a.totalMinutes);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-5 w-5 text-gold" />
        <h3 className="font-display text-lg">Club Gamer · Fidelización ({members.length})</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Por cada 10 horas acumuladas, el cliente gana <span className="text-gold font-semibold">1 HORA GRATIS</span>.
      </p>
      <div className="space-y-2">
        {sorted.map((m, i) => {
          const hours = Math.floor(m.totalMinutes / 60);
          const minutes = m.totalMinutes % 60;
          const progress = Math.min(100, (m.rewardMinutes / 600) * 100);
          return (
            <div key={m.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center p-3 rounded-md bg-secondary/40">
              <div className="font-display text-2xl text-muted-foreground w-8 text-center">#{i + 1}</div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{m.name}</p>
                  {m.pendingRewards > 0 && (
                    <Badge className="bg-gold text-background animate-pulse">
                      <Gift className="h-3 w-3 mr-1" />REGALO: {m.pendingRewards}H GRATIS
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  {m.phone && <><Phone className="h-3 w-3" />{m.phone}</>}
                  {m.idDoc && <span>· {m.idDoc}</span>}
                </p>
                <div className="mt-1 h-1.5 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {Math.floor(m.rewardMinutes / 60)}h {m.rewardMinutes % 60}m / 10h para próximo regalo
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg">{hours}h {minutes}m</p>
                <p className="text-xs text-accent">Histórico</p>
              </div>
              <div className="flex flex-col gap-1">
                {m.pendingRewards > 0 && (
                  <Button size="sm" className="bg-gold text-background hover:bg-gold/80" onClick={() => redeem(m.id)}>
                    <Gift className="h-4 w-4 mr-1" />Canjear
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => { if (confirm(`¿Eliminar a ${m.name}?`)) remove(m.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
        {members.length === 0 && (
          <p className="text-sm text-muted-foreground">Aún no hay miembros. Se crean automáticamente al cobrar con nombre + teléfono.</p>
        )}
      </div>
    </Card>
  );
}
