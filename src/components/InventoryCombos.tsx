import { useState } from "react";
import { useStore, fmtUsd, fmtBs } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";

export function InventoryTab() {
  const products = useStore((s) => s.products);
  const rate = useStore((s) => s.rate);
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const removeProduct = useStore((s) => s.removeProduct);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    addProduct({ name: name.trim(), price: parseFloat(price) || 0, stock: parseInt(stock) || 0 });
    setName(""); setPrice(""); setStock("");
  };

  return (
    <div className="grid lg:grid-cols-[1fr_2fr] gap-4">
      <Card className="p-4">
        <h3 className="font-display text-lg mb-3">Nuevo Producto</h3>
        <div className="space-y-2">
          <div><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Precio ($)</Label><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          <div><Label>Stock</Label><Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
          <Button onClick={submit} className="w-full"><Plus className="h-4 w-4 mr-1" />Agregar</Button>
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="font-display text-lg mb-3">Productos ({products.length})</h3>
        <div className="space-y-2 max-h-[60vh] overflow-auto">
          {products.map((p) => (
            <div key={p.id} className="grid grid-cols-[1fr_100px_100px_auto] gap-2 items-center bg-secondary/40 rounded-md p-2">
              <Input value={p.name} onChange={(e) => updateProduct(p.id, { name: e.target.value })} />
              <div>
                <Input type="number" step="0.01" value={p.price} onChange={(e) => updateProduct(p.id, { price: parseFloat(e.target.value) || 0 })} />
                <p className="text-[10px] text-muted-foreground mt-0.5">{fmtBs(p.price, rate)}</p>
              </div>
              <Input type="number" value={p.stock} onChange={(e) => updateProduct(p.id, { stock: parseInt(e.target.value) || 0 })}
                className={p.stock <= 0 ? "border-destructive" : ""} />
              <Button size="icon" variant="ghost" onClick={() => removeProduct(p.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {products.length === 0 && <p className="text-sm text-muted-foreground">Sin productos.</p>}
        </div>
      </Card>
    </div>
  );
}

export function CombosTab() {
  const combos = useStore((s) => s.combos);
  const products = useStore((s) => s.products);
  const rate = useStore((s) => s.rate);
  const addCombo = useStore((s) => s.addCombo);
  const removeCombo = useStore((s) => s.removeCombo);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState("");
  const [items, setItems] = useState<{ productId: string; qty: number }[]>([]);

  const addItem = () => products[0] && setItems([...items, { productId: products[0].id, qty: 1 }]);
  const submit = () => {
    if (!name.trim()) return;
    addCombo({ name: name.trim(), price: parseFloat(price) || 0, hours: parseFloat(hours) || 0, items });
    setName(""); setPrice(""); setHours(""); setItems([]);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_2fr] gap-4">
      <Card className="p-4">
        <h3 className="font-display text-lg mb-3">Nuevo Combo</h3>
        <div className="space-y-2">
          <div><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Combo Gamer 1" /></div>
          <div><Label>Precio ($)</Label><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          <div><Label>Horas de juego</Label><Input type="number" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} /></div>
          <div>
            <div className="flex items-center justify-between"><Label>Productos</Label>
              <Button size="sm" variant="ghost" onClick={addItem} disabled={!products.length}><Plus className="h-3 w-3" />Agregar</Button>
            </div>
            <div className="space-y-1">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_auto] gap-1">
                  <select className="bg-input text-foreground rounded-md px-2 text-sm"
                    value={it.productId}
                    onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, productId: e.target.value } : x))}>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <Input type="number" value={it.qty} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, qty: parseInt(e.target.value) || 1 } : x))} />
                  <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={submit} className="w-full">Crear Combo</Button>
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="font-display text-lg mb-3">Combos ({combos.length})</h3>
        <div className="space-y-2">
          {combos.map((c) => (
            <Card key={c.id} className="p-3 bg-secondary/40 flex items-start justify-between">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.hours}h · {c.items.length} producto(s)</p>
                <p className="text-sm">{fmtUsd(c.price)} · <span className="text-accent">{fmtBs(c.price, rate)}</span></p>
                <ul className="text-xs text-muted-foreground mt-1">
                  {c.items.map((it, i) => {
                    const p = products.find((x) => x.id === it.productId);
                    return <li key={i}>• {p?.name ?? "?"} x{it.qty}</li>;
                  })}
                </ul>
              </div>
              <Button size="icon" variant="ghost" onClick={() => removeCombo(c.id)}><Trash2 className="h-4 w-4" /></Button>
            </Card>
          ))}
          {combos.length === 0 && <p className="text-sm text-muted-foreground">Sin combos.</p>}
        </div>
      </Card>
    </div>
  );
}
