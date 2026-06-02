import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit, Gift, Trash2, Search, UserPlus, UserCheck } from "lucide-react";

export function MembersTab() {
  const members = useStore((s) => s.members);
  const addMember = useStore((s) => (s as any).addMember);
  const updateMember = useStore((s) => (s as any).updateMember);
  const redeemReward = useStore((s) => s.redeemReward);
  const removeMember = useStore((s) => s.removeMember);

  // Estados
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null); // null = Crear nuevo
  const [form, setForm] = useState({ name: "", idDoc: "", phone: "" });

  // Filtro de búsqueda
  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.idDoc && m.idDoc.includes(search)) ||
    (m.phone && m.phone.includes(search))
  );

  const handleOpenNew = () => {
    setEditingMember(null);
    setForm({ name: "", idDoc: "", phone: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: any) => {
    setEditingMember(m);
    setForm({ name: m.name, idDoc: m.idDoc || "", phone: m.phone || "" });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    
    if (editingMember) {
      // Actualizar cliente existente
      updateMember(editingMember.id, form);
    } else {
      // Crear cliente nuevo a mano
      addMember(form);
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Barra Superior: Búsqueda y Botón Nuevo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full max-w-md bg-secondary/20 rounded-md px-3 py-1.5 border border-border/40">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-0 text-sm focus:outline-none w-full text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <Button onClick={handleOpenNew} className="bg-primary hover:bg-primary/90 text-primary-foreground font-display tracking-wide">
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Tabla del Club Gamer */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-display tracking-wider border-b border-border">
            <tr>
              <th className="p-3">Cliente</th>
              <th className="p-3">Documento / CI</th>
              <th className="p-3">Teléfono</th>
              <th className="p-3 text-center">Tiempo Jugado</th>
              <th className="p-3 text-center">Recompensas</th>
              <th className="p-3 text-center">Última Visita</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-8 text-muted-foreground">
                  No se encontraron clientes registrados con esos criterios.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-semibold text-foreground">{m.name}</td>
                  <td className="p-3 text-muted-foreground">{m.idDoc || "—"}</td>
                  <td className="p-3 text-muted-foreground">{m.phone || "—"}</td>
                  <td className="p-3 text-center font-display text-primary">
                    {Math.floor(m.totalMinutes / 60)}h {m.totalMinutes % 60}m
                  </td>
                  <td className="p-3 text-center">
                    {m.pendingRewards > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 font-display px-2 py-0.5 rounded text-xs border border-green-500/20">
                        <Gift className="h-3 w-3" /> {m.pendingRewards} disp.
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">0 acumuladas</span>
                    )}
                  </td>
                  <td className="p-3 text-center text-xs text-muted-foreground">
                    {new Date(m.lastVisit).toLocaleDateString("es-VE")}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {m.pendingRewards > 0 && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                          onClick={() => redeemReward(m.id)}
                          title="Canjear Hora de Regalo"
                        >
                          <Gift className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        onClick={() => handleOpenEdit(m)}
                        title="Editar Datos"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => {
                          if (confirm(`¿Seguro que deseas eliminar el perfil de ${m.name}?`)) {
                            removeMember(m.id);
                          }
                        }}
                        title="Eliminar Cliente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal / Ventana Emergente para Crear o Editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              {editingMember ? <UserCheck className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
              {editingMember ? "Modificar Cliente" : "Registrar Nuevo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Nombre del Cliente *</label>
              <Input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Carlos Mendoza"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cédula de Identidad / RIF</label>
              <Input
                type="text"
                value={form.idDoc}
                onChange={(e) => setForm({ ...form, idDoc: e.target.value })}
                placeholder="Ej. V-25123456"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Número de Teléfono</label>
              <Input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Ej. 04125556677"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90" disabled={!form.name.trim()}>
              {editingMember ? "Guardar Cambios" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}