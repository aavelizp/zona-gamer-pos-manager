import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Edit2, Trash2, Save, X, UserPlus, Users } from "lucide-react";
import { Label } from "@/components/ui/label";

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

      {/* SECCIÓN DE LA TABLA: Deslizable (Swipe) en móvil */}
      <Card className="border-border/40 overflow-hidden">
        <div className="bg-secondary/30 p-3 sm:p-4 border-b border-border/50 flex items-center gap-2">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
          <h3 className="font-display text-sm sm:text-base tracking-wider">Directorio de Clientes</h3>
        </div>
        
        {/* 👇 Contenedor clave para dispositivos móviles 👇 */}
        <div className="overflow-x-auto">
          {/* min-w-[800px] asegura que haya suficiente espacio para no cortar los textos */}
          <table className="w-full text-sm text-left min-w-[800px]">
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
                    <td className="p-3 sm:p-4 flex justify-center gap-2">
                      {editingId === m.id ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400 hover:bg-green-500/20" onClick={() => { updateMember(m.id, editData); setEditingId(null); }}><Save className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-secondary" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary hover:bg-primary/20" onClick={() => { setEditingId(m.id); setEditData({ name: m.name, idDoc: m.idDoc || "", phone: m.phone || "" }); }}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20" onClick={() => { if(confirm("¿Eliminar cliente? Perderá sus horas acumuladas.")) removeMember(m.id); }}><Trash2 className="h-4 w-4" /></Button>
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
    </div>
  );
}