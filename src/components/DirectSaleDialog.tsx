import { useState } from "react";
import { useStore, fmtUsd, fmtBs, PaymentMethod } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";

export function DirectSaleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const products = useStore((s) => s.products);
  const rate = useStore((s) => s.rate);
  const directSale = useStore((s) => (s as any).directSale);

  const [cart, setCart] = useState<{ productId: string; name: string; price: number; qty: number }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState(1);

  const [method, setMethod] = useState<PaymentMethod>("full");
  const [cashUsd, setCashUsd] = useState(0);
  const [customer, setCustomer] = useState("");

  const totalUsd = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalBs = totalUsd * rate;

  const mobileBs = method === "mixed" ? Math.max(0, totalUsd - cashUsd) * rate : method === "full" ? totalBs : 0;

  const handleAdd = () => {
    const p = products.find(x => x.id === selectedProduct);
    if (!p) return;
    setCart([...cart, { productId: p.id, name: p.name, price: p.price, qty }]);
    setSelectedProduct("");
    setQty(1);
  };

  const handleRemove = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSale = () => {
    if (cart.length === 0) return;
    directSale({
      method,
      cashUsd: method === "full" ? totalUsd : cashUsd,
      mobileBs: method === "credit" ? 0 : mobileBs,
      total: totalUsd,
      customer,
      items: cart
    });
    // Limpiar y cerrar
    setCart([]);
    setCustomer("");
    setMethod("full");
    setCashUsd(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <ShoppingCart className="h-5 w-5 text-green-500" /> Venta Rápida (Snacks y Bebidas)
          </DialogTitle>
        </DialogHeader>

        {/* Seleccionar Productos */}
        <div className="flex gap-2 items-end mt-2">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Producto</label>
            <select
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="" disabled className="bg-card text-muted-foreground">Seleccione un producto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id} disabled={p.stock < 1} className="bg-card">
                  {p.name} - {fmtUsd(p.price)} (Stock: {p.stock})
                </option>
              ))}
            </select>
          </div>
          <div className="w-16 space-y-1">
            <label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Cant.</label>
            <Input type="number" min="1" value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 1)} className="h-9" />
          </div>
          <Button onClick={handleAdd} disabled={!selectedProduct || qty < 1} className="w-10 px-0 h-9 bg-primary/20 text-primary hover:bg-primary/30">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Carrito de Compras */}
        <div className="min-h-[100px] border border-border/60 bg-secondary/10 rounded-md p-2 space-y-2 max-h-[180px] overflow-y-auto mt-2">
          {cart.length === 0 ? (
            <p className="text-xs text-center text-muted-foreground mt-8">El carrito está vacío</p>
          ) : (
            cart.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm bg-card p-2 rounded border border-border/40 shadow-sm">
                <span><span className="text-primary font-bold">{item.qty}x</span> {item.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{fmtUsd(item.price * item.qty)}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleRemove(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Resumen y Cobro */}
        {cart.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center bg-green-500/10 border border-green-500/20 p-3 rounded-md">
              <span className="font-display font-bold text-green-500">TOTAL A COBRAR</span>
              <div className="text-right">
                <div className="font-display text-xl font-black text-green-400">{fmtUsd(totalUsd)}</div>
                <div className="text-xs text-green-500/70">{fmtBs(totalUsd, rate)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Método de Pago</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                >
                  <option value="full" className="bg-card">Pago Completo</option>
                  <option value="mixed" className="bg-card">Mixto ($ y Bs)</option>
                  <option value="credit" className="bg-card">Fiado (Crédito)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Cliente (Opcional)</label>
                <Input placeholder="Nombre del cliente" value={customer} onChange={(e) => setCustomer(e.target.value)} className="h-9" />
              </div>
            </div>

            {method === "mixed" && (
              <div className="grid grid-cols-2 gap-2 bg-secondary/20 p-2 rounded-md border border-border/40">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-muted-foreground">Efectivo ($)</label>
                  <Input type="number" step="0.5" min="0" max={totalUsd} value={cashUsd || ""} onChange={(e) => setCashUsd(parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-muted-foreground">Pago Móvil (Bs)</label>
                  <Input disabled value={mobileBs.toFixed(2)} className="h-8 text-sm bg-muted/50 font-semibold" />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSale} disabled={cart.length === 0} className="bg-green-600 hover:bg-green-700 text-white font-display tracking-wide">
            Procesar Venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}