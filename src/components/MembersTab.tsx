import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Trophy, Gift, Edit2, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function MembersTab() {
  const members = useStore((s) => s.members || []);
  const updateMember = useStore((s) => s.updateMember);
  const removeMember = useStore((s) => s.removeMember);
  const redeemReward = useStore((s) => s.redeemReward);

  const [query, setQuery] = useState("");
  const [editOpen, setEditOpen] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDoc, setEditDoc] = useState("");

  const sortedMembers = useMemo(() => {
    let filtered = members;
    
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(m => (m.name|| "").toLowerCase().includes(q) || (m.phone|| "").includes(q) || (m.idDoc|| "").toLowerCase().includes(q));
    }
    
    return [...filtered].sort((a, b) => (b.totalMinutes || 0) - (a.totalMinutes || 0));
  }, [members, query]);

  const handleEditSubmit = () => {
    if (!editOpen || !editName.trim()) return;
    updateMember(editOpen.id, { name: editName.trim(), phone: editPhone.trim(), idDoc: editDoc.trim() });
    setEditOpen(null);
    toast.success("Cliente actualizado exitosamente");
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-5 border-border/40 bg-secondary/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-base sm:text-lg">Ranking Club Gamer</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Clientes ordenados por sus horas de juego acumuladas.</p>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." value={query} onChange={e => setQuery(e.target.value)} className="pl-9" />
        </div>
      </Card>

      <Card className="border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs tracking-wider">
              <tr>
                <th className="p-3 sm:p-4 text-center w-16">Rank</th>
                <th className="p-3 sm:p-4 w-64">Cliente</th>
                {/* 👇 LA BARRA AHORA TIENE MÁS ESPACIO LIBRE 👇 */}
                <th className="p-3 sm:p-4">Progreso (10h)</th>
                <th className="p-3 sm:p-4 text-center">Recompensas Gratis</th>
                <th className="p-3 sm:p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sortedMembers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground italic">No hay clientes registrados o que coincidan con la búsqueda.</td></tr>
              ) : (
                sortedMembers.map((m, idx) => {
                  const progressPct = Math.min(100, ((m.rewardMinutes || 0) / 600) * 100);
                  const progressHours = ((m.rewardMinutes || 0) / 60).toFixed(1);

                  return (
                    <tr key={m.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-3 sm:p-4 text-center font-display text-lg text-muted-foreground align-middle">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </td>
                      <td className="p-3 sm:p-4 align-middle">
                        <p className="font-bold text-base">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground">{m.phone ? `📱 ${m.phone}` : "Sin teléfono registrado"} {m.idDoc ? `· 💳 ${m.idDoc}` : ""}</p>
                      </td>
                      
                      <td className="p-3 sm:p-4 align-middle pr-8">
                        <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden border border-border/30">
                          <div 
                            className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
                          <span>{progressHours}h / 10h</span>
                          <span className="font-bold text-accent">{Math.round(progressPct)}%</span>
                        </div>
                      </td>

                      <td className="p-3 sm:p-4 text-center align-middle">
                        {m.pendingRewards > 0 ? (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 animation-pulse shadow-md shadow-green-500/10" onClick={() => { if(confirm(`¿Deseas canjear 1 hora gratis para ${m.name}?`)) { redeemReward(m.id); toast.success("Hora gratis canjeada"); }}}>
                            <Gift className="h-4 w-4 mr-1" /> Canjear ({m.pendingRewards})
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center justify-center gap-1"><CheckCircle className="h-3 w-3 text-muted-foreground/70" /> Acumulando</span>
                        )}
                      </td>
                      <td className="p-3 sm:p-4 flex justify-center gap-2 align-middle">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 text-primary" onClick={() => { setEditName(m.name); setEditPhone(m.phone || ""); setEditDoc(m.idDoc || ""); setEditOpen(m); }}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-500/10" onClick={() => { if(confirm(`⚠️ ¿Estás seguro de eliminar a ${m.name}? Perderá todas sus horas.`)) removeMember(m.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!editOpen} onOpenChange={(o) => !o && setEditOpen(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="font-display">Editar Cliente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre y Apellido</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div><Label>Teléfono</Label><Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="04141234567" /></div>
            <div><Label>Cédula o ID</Label><Input value={editDoc} onChange={e => setEditDoc(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleEditSubmit} className="w-full mt-2">Guardar Cambios</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}