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

  // 👇 AQUÍ HACEMOS EL RANKING DE MAYOR A MENOR SEGÚN SUS HORAS 👇
  const sortedMembers = useMemo(() => {
    let filtered = members;
    
    // Si el usuario escribe algo en el buscador, filtramos primero
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(m => (m.name||"").toLowerCase().includes(q) || (m.phone||"").includes(q) || (m.idDoc||"").toLowerCase().includes(q));
    }
    
    // Finalmente ordenamos a todos de mayor cantidad de horas a menor cantidad
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
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs tracking-wider">
              <tr>
                <th className="p-3 sm:p-4 text-center w-16">Rank</th>
                <th className="p-3 sm:p-4">Cliente</th>
                <th className="p-3 sm:p-4 text-center">Horas Acumuladas</th>
                <th className="p-3 sm:p-4 text-center">Recompensas Gratis</th>
                <th className="p-3 sm:p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sortedMembers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground italic">No hay clientes registrados o que coincidan con la búsqueda.</td></tr>
              ) : (
                sortedMembers.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-3 sm:p-4 text-center font-display text-lg text-muted-foreground">
                      {/* Le ponemos un trofeo doradito al Top 1, plata al Top 2, bronce al Top 3 */}
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </td>
                    <td className="p-3 sm:p-4">
                      <p className="font-bold text-base">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground">{m.phone ? `📱 ${m.phone}` : "Sin teléfono registrado"} {m.idDoc ? `· 💳 ${m.idDoc}` : ""}</p>
                    </td>
                    <td className="p-3 sm:p-4 text-center font-display text-2xl text-primary">
                      {Math.floor((m.totalMinutes || 0) / 60)}<span className="text-sm">h</span>
                    </td>
                    <td className="p-3 sm:p-4 text-center">
                      {m.pendingRewards > 0 ? (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8" onClick={() => { if(confirm(`¿Deseas canjear 1 hora gratis para ${m.name}?`)) { redeemReward(m.id); toast.success("Hora gratis canjeada"); }}}>
                          <Gift className="h-4 w-4 mr-1" /> Canjear ({m.pendingRewards})
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center justify-center gap-1"><CheckCircle className="h-3 w-3" /> Jugando para ganar</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-4 flex justify-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 text-primary" onClick={() => { setEditName(m.name); setEditPhone(m.phone || ""); setEditDoc(m.idDoc || ""); setEditOpen(m); }}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-500/10" onClick={() => { if(confirm(`⚠️ ¿Estás seguro de eliminar a ${m.name}? Perderá todas sus horas.`)) removeMember(m.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))
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