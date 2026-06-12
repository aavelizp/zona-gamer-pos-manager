import { useState } from "react";
import { useStore, fmtUsd } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Save, X, Package } from "lucide-react";

export function InventoryTab() {
  const products = useStore((s) => s.products || []);
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const removeProduct = useStore((s) => s.removeProduct);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", price: 0, stock: 0 });

  const handleAdd = () => {
    if (!name.trim() || !price || !stock) return;
    addProduct({ name, price: parseFloat(price), stock: parseInt(stock, 10) });
    setName(""); setPrice(""); setStock("");
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6 border-primary/20">
        <h3 className="font-display text-lg mb-4 flex items-center gap-2 text-primary">
          <Package className="h-5 w-5" /> Añadir Nuevo Producto
        </h3>
        {/* 👇 Móvil: 1 columna, PC: 4 columnas 👇 */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <Label className="text-xs sm:text-sm mb-1 block">Nombre del Producto</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Doritos" className="h-10 sm:h-9" />
          </div>
          <div>
            <Label className="text-xs sm:text-sm mb-1 block">Precio ($)</Label>
            <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1.50" className="h-10 sm:h-9" />
          </div>
          <div>
            <Label className="text-xs sm:text-sm mb-1 block">Stock Inicial</Label>
            <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="24" className="h-10 sm:h-9" />
          </div>
          <Button onClick={handleAdd} disabled={!name || !price || !stock} className="h-10 sm:h-9 w-full">
            <Plus className="h-4 w-4 mr-2" /> Añadir
          </Button>
        </div>
      </Card>

      <Card className="border-border/40 overflow-hidden">
        {/* 👇 Contenedor clave para deslizar con el dedo en móviles 👇 */}
        <div className="overflow-x-auto">
          {/* Se fuerza un ancho mínimo (min-w-[600px]) para que no se aplaste */}
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs tracking-wider">
              <tr>
                <th className="p-3 sm:p-4">Producto</th>
                <th className="p-3 sm:p-4">Precio ($)</th>
                <th className="p-3 sm:p-4">Stock</th>
                <th className="p-3 sm:p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {products.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No hay productos registrados.</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-3 sm:p-4 font-medium">
                      {editingId === p.id ? <Input value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="h-8" /> : p.name}
                    </td>
                    <td className="p-3 sm:p-4">
                      {editingId === p.id ? <Input type="number" step="0.01" value={editData.price} onChange={(e) => setEditData({...editData, price: parseFloat(e.target.value) || 0})} className="h-8 w-24" /> : fmtUsd(p.price)}
                    </td>
                    <td className="p-3 sm:p-4">
                      {editingId === p.id ? <Input type="number" value={editData.stock} onChange={(e) => setEditData({...editData, stock: parseInt(e.target.value) || 0})} className="h-8 w-24" /> : (
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${p.stock <= 5 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{p.stock} unid.</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-4 flex justify-center gap-2">
                      {editingId === p.id ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400 hover:bg-green-500/20" onClick={() => { updateProduct(p.id, editData); setEditingId(null); }}><Save className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-secondary" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary hover:bg-primary/20" onClick={() => { setEditingId(p.id); setEditData({ name: p.name, price: p.price, stock: p.stock }); }}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20" onClick={() => { if(confirm("¿Eliminar producto?")) removeProduct(p.id); }}><Trash2 className="h-4 w-4" /></Button>
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

export function CombosTab() {
  const combos = useStore((s) => s.combos || []);
  const products = useStore((s) => s.products || []);
  const addCombo = useStore((s) => s.addCombo);
  const removeCombo = useStore((s) => s.removeCombo);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState("");
  const [items, setItems] = useState<{ productId: string; qty: number }[]>([]);
  const [selProd, setSelProd] = useState("");
  const [selQty, setSelQty] = useState("1");

  const handleAdd = () => {
    if (!name.trim() || !price) return;
    addCombo({ name, price: parseFloat(price), hours: parseFloat(hours) || 0, items });
    setName(""); setPrice(""); setHours(""); setItems([]);
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6 border-accent/20">
        <h3 className="font-display text-lg mb-4 text-accent">Crear Nuevo Combo</h3>
        
        {/* Móvil: Columna única, PC: Varias columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div><Label className="text-xs sm:text-sm mb-1 block">Nombre del Combo</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Promo Nocturna" className="h-10 sm:h-9" /></div>
          <div><Label className="text-xs sm:text-sm mb-1 block">Precio Total ($)</Label><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="5.00" className="h-10 sm:h-9" /></div>
          <div><Label className="text-xs sm:text-sm mb-1 block">Horas de Juego incluidas</Label><Input type="number" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="2" className="h-10 sm:h-9" /></div>
        </div>

        <div className="p-3 sm:p-4 bg-secondary/30 rounded-md border border-border/50 mb-4">
          <Label className="text-xs uppercase tracking-wider mb-2 block text-muted-foreground">Productos incluidos en el combo</Label>
          <div className="flex flex-col sm:flex-row gap-2 items-end mb-3">
            <div className="flex-1 w-full">
              <select className="w-full h-10 sm:h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary" value={selProd} onChange={(e) => setSelProd(e.target.value)}>
                <option value="">Seleccione producto...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
              </select>
            </div>
            <div className="w-full sm:w-24 shrink-0">
              <Input type="number" min="1" value={selQty} onChange={(e) => setSelQty(e.target.value)} className="h-10 sm:h-9" placeholder="Cant." />
            </div>
            <Button type="button" variant="secondary" className="w-full sm:w-auto h-10 sm:h-9" onClick={() => { if(selProd && selQty) { setItems([...items, { productId: selProd, qty: parseInt(selQty) }]); setSelProd(""); setSelQty("1"); } }}>Añadir al Combo</Button>
          </div>
          
          {items.length > 0 && (
            <ul className="space-y-1">
              {items.map((it, i) => {
                const p = products.find(x => x.id === it.productId);
                return (
                  <li key={i} className="text-sm flex justify-between items-center bg-background px-3 py-2 rounded-md border border-border/40">
                    <span>{it.qty}x {p?.name || "Desconocido"}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400" onClick={() => setItems(items.filter((_, idx) => idx !== i))}><X className="h-4 w-4" /></Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Button onClick={handleAdd} disabled={!name || !price} className="w-full h-10 sm:h-9 bg-accent hover:bg-accent/80 text-white">
          <Save className="h-4 w-4 mr-2" /> Guardar Combo Definitivo
        </Button>
      </Card>

      <Card className="border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs tracking-wider">
              <tr>
                <th className="p-3 sm:p-4">Combo</th>
                <th className="p-3 sm:p-4">Precio</th>
                <th className="p-3 sm:p-4">Incluye</th>
                <th className="p-3 sm:p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {combos.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No hay combos registrados.</td></tr>
              ) : (
                combos.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/10">
                    <td className="p-3 sm:p-4 font-bold text-accent">{c.name}</td>
                    <td className="p-3 sm:p-4 font-display text-lg">{fmtUsd(c.price)}</td>
                    <td className="p-3 sm:p-4">
                      <p className="text-xs text-primary font-semibold mb-1">🎮 {c.hours} Horas de Juego</p>
                      {(c.items || []).map((it, idx) => {
                        const p = products.find(x => x.id === it.productId);
                        return <p key={idx} className="text-xs text-muted-foreground">🍟 {it.qty}x {p?.name || "Item borrado"}</p>
                      })}
                    </td>
                    <td className="p-3 sm:p-4 text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-500/20" onClick={() => { if(confirm("¿Eliminar combo?")) removeCombo(c.id); }}><Trash2 className="h-4 w-4" /></Button>
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