import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit, Trash2, Search, UserPlus, UserCheck } from "lucide-react";

export function ClientsTab() {
  const members = useStore((s) => s.members);
  const addMember = useStore((s) => (s as any).addMember);
  const updateMember = useStore((s) => (s as any).updateMember);
  const removeMember = useStore((s) => s.removeMember);

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [form, setForm] = useState({ name: "", idDoc: "", phone: "" });

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.idDoc && m.idDoc.includes(search)) ||
    (m.phone && m.phone.includes(search))
  );

  const handleOpenNew = () => {
    setEditingClient(null);
    setForm({ name: "", idDoc: "", phone: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: any) => {
    setEditingClient(m);
    setForm({ name: m.name, idDoc: m.idDoc || "", phone: m.phone || "" });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingClient) {
      updateMember(editingClient.id, form);
    } else {
      addMember(form);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
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
        <Button onClick={handleOpenNew} className="bg-green-600 hover:bg-green-700 text-white font-display tracking-wide">
          <UserPlus className="h-4 w-4 mr-2" />
          Agregar Cliente
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-display tracking-wider border-b border-border">
            <tr>
              <th className="p-3">Nombre del Cliente</th>
              <th className="p-3">Cédula / Documento</th>
              <th className="p-3">Teléfono</th>
              <th className="p-3 text-center">Registro</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-muted-foreground">
                  No hay clientes registrados con este criterio.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-semibold text-foreground">{m.name}</td>
                  <td className="p-3 text-muted-foreground">{m.idDoc || "—"}</td>
                  <td className="p-3 text-muted-foreground">{m.phone || "—"}</td>
                  <td className="p-3 text-center text-xs text-muted-foreground">
                    {new Date(m.createdAt || m.lastVisit).toLocaleDateString("es-VE")}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
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
                          if (confirm(`¿Eliminar a ${m.name}?`)) removeMember(m.id);
                        }}
                        title="Eliminar"
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              {editingClient ? <UserCheck className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
              {editingClient ? "Editar Datos del Cliente" : "Registrar Cliente Manualmente"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Nombre Completo *</label>
              <Input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Juan Pérez" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cédula / RIF</label>
              <Input type="text" value={form.idDoc} onChange={(e) => setForm({ ...form, idDoc: e.target.value })} placeholder="Ej. V-12345678" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Número de Teléfono</label>
              <Input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Ej. 04125556677" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90" disabled={!form.name.trim()}>
              {editingClient ? "Guardar Cambios" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}