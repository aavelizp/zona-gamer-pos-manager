import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserPlus, Search, User, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

export function ClientsTab() {
  const members = useStore((s) => s.members || []);
  const addMember = useStore((s) => s.addMember);
  const updateMember = useStore((s) => s.updateMember);
  const removeMember = useStore((s) => s.removeMember);

  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<any>(null);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDoc, setNewDoc] = useState("");

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDoc, setEditDoc] = useState("");
  const [editHours, setEditHours] = useState(""); // 👇 Campo de horas restaurado

  const sortedAndFilteredClients = useMemo(() => {
    let result = Array.isArray(members) ? [...members] : [];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (c) =>
          (c?.name || "").toLowerCase().includes(q) ||
          (c?.phone || "").includes(q) ||
          (c?.idDoc || "").toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
  }, [members, query]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    if (newPhone.trim() && members.some(m => m?.phone === newPhone.trim())) {
      toast.error("Este número de teléfono ya está registrado");
      return;
    }
    addMember({
      name: newName.trim(),
      phone: newPhone.trim() || undefined,
      idDoc: newDoc.trim() || undefined,
    });
    setCreateOpen(false);
    setNewName(""); setNewPhone(""); setNewDoc("");
    toast.success("Cliente registrado exitosamente");
  };

  const handleEditSubmit = () => {
    if (!editOpen || !editName.trim()) return;
    
    // 👇 Modificación reactiva de horas restaurada 👇
    const hoursInMinutes = Math.max(0, parseFloat(editHours) || 0) * 60;

    updateMember(editOpen.id, {
      name: editName.trim(),
      phone: editPhone.trim() || undefined,
      idDoc: editDoc.trim() || undefined,
      totalMinutes: hoursInMinutes // Guarda las horas modificadas en minutos
    });

    setEditOpen(null);
    toast.success("Datos del cliente actualizados");
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-5 border-border/40 bg-secondary/10 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-base sm:text-lg">Directorio de Clientes</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Lista completa de clientes ordenados alfabéticamente.</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg">
          <UserPlus className="h-4 w-4 mr-2" /> Registrar Cliente
        </Button>
      </Card>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre, teléfono o cédula..." value={query} onChange={e => setQuery(e.target.value)} className="pl-9 h-11" />
      </div>

      <Card className="border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs tracking-wider">
              <tr>
                <th className="p-3 sm:p-4">Nombre y Apellido</th>
                <th className="p-3 sm:p-4">Teléfono</th>
                <th className="p-3 sm:p-4">Cédula / RIF</th>
                {/* 👇 COLUMNA RESTAURADA DE HORAS 👇 */}
                <th className="p-3 sm:p-4 text-center">Horas de Juego</th>
                <th className="p-3 sm:p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sortedAndFilteredClients.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground italic">No se encontraron clientes registrados.</td></tr>
              ) : (
                sortedAndFilteredClients.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-3 sm:p-4 font-bold text-sm sm:text-base text-foreground">{c.name}</td>
                    <td className="p-3 sm:p-4 text-muted-foreground font-mono">{c.phone || "---"}</td>
                    <td className="p-3 sm:p-4 text-muted-foreground">{c.idDoc || "---"}</td>
                    {/* 👇 CELDA RESTAURADA DE HORAS CONSUMIDAS 👇 */}
                    <td className="p-3 sm:p-4 text-center font-bold text-slate-700">{Math.floor((c.totalMinutes || 0) / 60)}h</td>
                    <td className="p-3 sm:p-4 flex justify-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/20" onClick={() => { setEditName(c.name); setEditPhone(c.phone || ""); setEditDoc(c.idDoc || ""); setEditHours(((c.totalMinutes || 0) / 60).toString()); setEditOpen(c); }}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-500/10" onClick={() => { if (confirm(`⚠️ ¿Eliminar por completo a ${c.name}?`)) removeMember(c.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL CREAR */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="font-display">Registrar Nuevo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Nombre y Apellido *</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Carlos Pérez" autoFocus /></div>
            <div><Label>Teléfono / WhatsApp</Label><Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Ej: 04241234567" /></div>
            <div><Label>Cédula o Identificación</Label><Input value={newDoc} onChange={e => setNewDoc(e.target.value)} placeholder="Ej: V-12345678" /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate} disabled={!newName.trim()} className="w-full mt-2">Guardar Cliente</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR CON CAMPO DE HORAS RESTAURADO */}
      <Dialog open={!!editOpen} onOpenChange={o => !o && setEditOpen(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="font-display">Modificar Datos</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Nombre y Apellido *</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div><Label>Teléfono / WhatsApp</Label><Input value={editPhone} onChange={e => setEditPhone(e.target.value)} /></div>
            <div><Label>Cédula o Identificación</Label><Input value={editDoc} onChange={e => setEditDoc(e.target.value)} /></div>
            {/* 👇 INPUT RESTAURADO PARA AJUSTAR LAS HORAS MANUALMENTE 👇 */}
            <div><Label className="text-primary font-bold">Horas de Juego Acumuladas</Label><Input type="number" step="0.1" value={editHours} onChange={e => setEditHours(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleEditSubmit} disabled={!editName.trim()} className="w-full mt-2">Actualizar Datos</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}