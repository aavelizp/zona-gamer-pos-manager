import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Edit2, Trash2, Save, X, UserPlus, Users, Clock, CheckCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export function ClientsTab() {
  const members = useStore((s) => s.members || []);
  const addMember = useStore((s) => s.addMember);
  const updateMember = useStore((s) => s.updateMember);
  const removeMember = useStore((s) => s.removeMember);

  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [idDoc, setIdDoc] = useState("");
  const [phone, setPhone] = useState("");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", idDoc: "", phone: "" });

  // Estados para el Modal de Ajuste de Horas
  const [adjustMember, setAdjustMember] = useState<any>(null);
  const [adjustAction, setAdjustAction] = useState<"add" | "subtract">("add");
  const [adjustHours, setAdjustHours] = useState("");
  const [adjustMins, setAdjustMins] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => 
      (m.name || "").toLowerCase().includes(q) || 
      (m.phone || "").includes(q) || 
      (m.idDoc || "").toLowerCase().includes(q)
    );
  }, [members, query]);

  const handleAdd = () => {
    if (!name.trim()) return;
    addMember({ name: name.trim(), idDoc: idDoc.trim(), phone: phone.trim() });
    setName(""); setIdDoc(""); setPhone("");
    toast.success("Cliente registrado con éxito");
  };

  const handleAdjustSubmit = () => {
    if (!adjustMember) return;
    const h = parseInt(adjustHours) || 0;
    const m = parseInt(adjustMins) || 0;
    const totalDelta = (h * 60) + m;

    if (totalDelta === 0) {
      setAdjustMember(null);
      return;
    }

    let newTotal = adjustMember.totalMinutes || 0;
    let newReward = adjustMember.rewardMinutes || 0;
    let newPending = adjustMember.pendingRewards || 0;

    if (adjustAction === "add") {
      newTotal += totalDelta;
      newReward += totalDelta;
      // Calcula si ganó horas gratis con este ajuste
      const earned = Math.floor(newReward / 600);
      newReward -= earned * 600;
      newPending += earned;
    } else {
      // Restar horas
      newTotal = Math.max(0, newTotal - totalDelta);
      newReward -= totalDelta;
      // Ajustar premios pendientes si las horas de recompensa quedan en negativo
      while (newReward < 0 && newPending > 0) {
         newPending -= 1;
         newReward += 600;
      }
      if (newReward < 0) newReward = 0; // Tope en cero si ya no tiene premios que descontar
    }

    updateMember(adjustMember.id, {
      totalMinutes: newTotal,
      rewardMinutes: newReward,
      pendingRewards: newPending
    });

    toast.success(`Horas de ${adjustMember.name} actualizadas correctamente.`);
    setAdjustMember(null);
    setAdjustHours("");
    setAdjustMins("");
  };

  return (
    <div className="space-y-6">
      
      {/* SECCIÓN SUPERIOR: Agregar y Buscar (Apilado en móvil, al lado en PC) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 sm:p-5 border-primary/20 lg:col-span-2">
          <h3 className="font-display text-base sm:text-lg mb-3 flex items-center gap-2 text-primary">
            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" /> Registrar Cliente Manual
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div><Label className="text-xs sm:text-sm mb-1 block">Nombre *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Pérez" className="h-10 sm:h-9" /></div>
            <div><Label className="text-xs sm:text-sm mb-1 block">Cédula</Label><Input value={idDoc} onChange={(e) => setIdDoc(e.target.value)} placeholder="V-12345678" className="h-10 sm:h-9" /></div>
            <div><Label className="text-xs sm:text-sm mb-1 block">Teléfono</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0412..." className="h-10 sm:h-9" /></div>
          </div>
          <Button onClick={handleAdd} disabled={!name.trim()} className="w-full mt-4 h-10 sm:h-9">Añadir Cliente</Button>
        </Card>

        <Card className="p-4 sm:p-5 border-border/40 flex flex-col justify-center bg-secondary/10">
          <Label className="text-xs sm:text-sm mb-2 text-muted-foreground uppercase tracking-wider font-semibold">Buscar en la Base de Datos</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Buscar por nombre, cédula o teléfono..." 
              className="pl-9 h-10 sm:h-10 w-full bg-background border-primary/30 focus-visible:ring-primary" 
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-right">Total registrados: <span className="font-bold text-foreground">{members.length}</span></p>
        </Card>
      </div>

      {/* SECCIÓN DE LA TABLA */}
      <Card className="border-border/40 overflow-hidden">
        <div className="bg-secondary/30 p-3 sm:p-4 border-b border-border/50 flex items-center gap-2">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
          <h3 className="font-display text-sm sm:text-base tracking-wider">Directorio de Clientes</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[850px]">
            <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs tracking-wider">
              <tr>
                <th className="p-3 sm:p-4">Nombre</th>
                <th className="p-3 sm:p-4">Cédula</th>
                <th className="p-3 sm:p-4">Teléfono</th>
                <th className="p-3 sm:p-4">Horas Jugadas</th>
                <th className="p-3 sm:p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground italic">No se encontraron clientes.</td></tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-3 sm:p-4 font-medium">
                      {editingId === m.id ? <Input value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="h-8" /> : m.name}
                    </td>
                    <td className="p-3 sm:p-4 text-muted-foreground">
                      {editingId === m.id ? <Input value={editData.idDoc} onChange={(e) => setEditData({...editData, idDoc: e.target.value})} className="h-8" /> : (m.idDoc || "---")}
                    </td>
                    <td className="p-3 sm:p-4 text-muted-foreground">
                      {editingId === m.id ? <Input value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value})} className="h-8" /> : (m.phone || "---")}
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-bold">
                        {Math.floor((m.totalMinutes || 0) / 60)}h {(m.totalMinutes || 0) % 60}m
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 flex justify-center gap-1">
                      {editingId === m.id ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400 hover:bg-green-500/20" onClick={() => { updateMember(m.id, editData); setEditingId(null); toast.success("Datos guardados"); }}><Save className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-secondary" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <>
                          {/* 👇 Botón nuevo para ajustar horas 👇 */}
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-400 hover:bg-blue-500/20" title="Ajustar Horas Manualmente" onClick={() => { setAdjustMember(m); setAdjustAction("add"); setAdjustHours(""); setAdjustMins(""); }}>
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary hover:bg-primary/20" title="Editar Perfil" onClick={() => { setEditingId(m.id); setEditData({ name: m.name, idDoc: m.idDoc || "", phone: m.phone || "" }); }}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20" title="Eliminar Cliente" onClick={() => { if(confirm("¿Eliminar cliente? Perderá sus horas acumuladas.")) removeMember(m.id); }}><Trash2 className="h-4 w-4" /></Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL DE AJUSTE DE HORAS */}
      {adjustMember && (
        <Dialog open={!!adjustMember} onOpenChange={(o) => !o && setAdjustMember(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" /> Ajustar Horas de Juego
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="bg-secondary/30 p-3 rounded-lg border border-border/50 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Cliente</p>
                <p className="font-bold text-base mb-1 text-primary">{adjustMember.name}</p>
                <p className="text-sm">Horas actuales: <span className="font-display text-lg text-white ml-1">{Math.floor((adjustMember.totalMinutes || 0) / 60)}h {(adjustMember.totalMinutes || 0) % 60}m</span></p>
              </div>

              <RadioGroup value={adjustAction} onValueChange={(v:any) => setAdjustAction(v)} className="grid grid-cols-2 gap-2">
                <label className={`flex items-center justify-center gap-2 border rounded-md p-2 cursor-pointer transition-colors ${adjustAction === "add" ? "border-green-500 bg-green-500/10 text-green-400" : "border-border hover:bg-secondary/20"}`}>
                  <RadioGroupItem value="add" className="sr-only" />
                  <span className="text-sm font-bold">+ Añadir</span>
                </label>
                <label className={`flex items-center justify-center gap-2 border rounded-md p-2 cursor-pointer transition-colors ${adjustAction === "subtract" ? "border-red-500 bg-red-500/10 text-red-400" : "border-border hover:bg-secondary/20"}`}>
                  <RadioGroupItem value="subtract" className="sr-only" />
                  <span className="text-sm font-bold">- Restar</span>
                </label>
              </RadioGroup>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <Label className="text-xs uppercase tracking-widest font-semibold block mb-1">Horas</Label>
                  <Input type="number" min="0" value={adjustHours} onChange={e => setAdjustHours(e.target.value)} placeholder="0" className="h-12 text-center text-lg font-bold bg-background/50" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest font-semibold block mb-1">Minutos</Label>
                  <Input type="number" min="0" max="59" value={adjustMins} onChange={e => setAdjustMins(e.target.value)} placeholder="0" className="h-12 text-center text-lg font-bold bg-background/50" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                El sistema actualizará automáticamente el progreso de fidelidad (Club Gamer) al hacer este ajuste.
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button variant="outline" onClick={() => setAdjustMember(null)}>Cancelar</Button>
              <Button onClick={handleAdjustSubmit} disabled={!adjustHours && !adjustMins} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                <CheckCircle className="h-4 w-4 mr-2" /> Actualizar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}