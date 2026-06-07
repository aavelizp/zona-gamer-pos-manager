import { useState } from "react";
import { useStore, fmtUsd, fmtBs, PaymentMethod } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import { MixedPaymentInputs } from "@/components/MixedPaymentInputs";
import { Label } from "@/components/ui/label";

export function DirectSaleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const products = useStore((s) => s.products);
  const rate = useStore((s) => s.rate);
  const directSale = useStore((s) => (s as any).directSale);

  const [cart, setCart] = useState<{ productId: string; name: string; price: number; qty: number }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState(1);

  // SEPARAMOS CASH Y MOBILE VISUALMENTE
  const [method, setMethod] = useState<"cash" | "mobile" | "cash_bs" | "mixed" | "credit">("cash");
  const [cashUsd, setCashUsd] = useState("");
  const [mobileBs, setMobileBs] = useState("");
  const [cashBs, setCashBs] = useState("");
  const [mobileBank, setMobileBank] = useState(""); // 👈 AUDITORÍA
  const [mobileRef, setMobileRef] = useState("");   // 👈 AUDITORÍA
  const [customer, setCustomer] = useState("");

  const totalUsd = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  const cashUsdN = parseFloat(cashUsd) || 0;
  const mobileBsN = parseFloat(mobileBs) || 0;
  const cashBsN = parseFloat(cashBs) || 0;
  
  // LÓGICA DE COBRO MATEMÁTICO
  const mobileUsd = rate > 0 ? mobileBsN / rate : 0;
  const cashBsUsd = rate > 0 ? cashBsN / rate : 0;
  
  const paid = (method === "cash" || method === "mobile" || method === "cash_bs") ? totalUsd : method === "mixed" ? (cashUsdN + mobileUsd + cashBsUsd) : 0;
  const remaining = totalUsd - paid;

  // LÓGICA DE AUDITORÍA: Si hay dinero por pago móvil, es obligatorio banco y referencia.
  const needsRef = method === "mobile" || (method === "mixed" && mobileBsN > 0);
  const isValidRef = !needsRef || (mobileBank !== "" && mobileRef.length >= 4);

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
    
    // Convertimos el método visual al método contable del Store
    const mappedMethod: PaymentMethod = (method === "cash" || method === "mobile") ? "full" : method === "cash_bs" ? "cash_bs" : method as PaymentMethod;
    
    directSale({
      method: mappedMethod,
      cashUsd: method === "cash" ? totalUsd : method === "mixed" ? cashUsdN : 0,
      mobileBs: method === "mobile" ? (totalUsd * rate) : method === "mixed" ? mobileBsN : 0,
      cashBs: method === "cash_bs" ? (totalUsd * rate) : method === "mixed" ? cashBsN : 0,
      mobileBank: needsRef ? mobileBank : undefined,
      mobileRef: needsRef ? mobileRef : undefined,
      total: totalUsd,
      customer,
      items: cart
    });
    
    setCart([]); setCustomer(""); setMethod("cash"); setCashUsd(""); setMobileBs(""); setCashBs(""); setMobileBank(""); setMobileRef(""); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <ShoppingCart className="h-5 w-5 text-green-500" /> Venta Rápida
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 items-end mt-2">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Producto</label>
            <select className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
              <option value="" disabled className="bg-card text-muted-foreground">Seleccione...</option>
              {products.map(p => ( <option key={p.id} value={p.id} disabled={p.stock < 1} className="bg-card">{p.name} - {fmtUsd(p.price)} (Stock: {p.stock})</option> ))}
            </select>
          </div>
          <div className="w-16 space-y-1">
            <label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Cant.</label>
            <Input type="number" min="1" value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 1)} className="h-9" />
          </div>
          <Button onClick={handleAdd} disabled={!selectedProduct || qty < 1} className="w-10 px-0 h-9 bg-primary/20 text-primary"><Plus className="h-4 w-4" /></Button>
        </div>

        <div className="min-h-[100px] border border-border/60 bg-secondary/10 rounded-md p-2 space-y-2 max-h-[150px] overflow-y-auto mt-2">
          {cart.length === 0 ? <p className="text-xs text-center text-muted-foreground mt-8">El carrito está vacío</p> : cart.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm bg-card p-2 rounded border shadow-sm">
              <span><span className="text-primary font-bold">{item.qty}x</span> {item.name}</span>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{fmtUsd(item.price * item.qty)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => handleRemove(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center bg-green-500/10 border p-3 rounded-md">
              <span className="font-display font-bold text-green-500">TOTAL</span>
              <div className="text-right">
                <div className="font-display text-xl font-black text-green-400">{fmtUsd(totalUsd)}</div>
                <div className="text-xs text-green-500/70">{fmtBs(totalUsd, rate)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Método de Pago</label>
                <select className="w-full h-9 rounded-md border px-3 text-sm bg-background" value={method} onChange={(e) => setMethod(e.target.value as any)}>
                  <option value="cash">Efectivo $</option>
                  <option value="mobile">Pago Móvil Bs</option>
                  <option value="cash_bs">Efectivo Bs 💵</option>
                  <option value="mixed">Mixto ($ y Bs)</option>
                  <option value="credit">Fiado (Crédito)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Cliente (Opcional)</label>
                <Input placeholder="Nombre" value={customer} onChange={(e) => setCustomer(e.target.value)} className="h-9" />
              </div>
            </div>

            {/* 👈 CELDAS DE AUDITORÍA SI ES PAGO MÓVIL COMPLETO */}
            {method === "mobile" && (
                <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-primary/10 rounded-md border border-primary/20">
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-primary tracking-wider">Banco *</Label>
                    <select className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary" value={mobileBank} onChange={(e) => setMobileBank(e.target.value)}>
                      <option value="">Seleccione...</option><option value="Banesco">Banesco</option><option value="Mercantil">Mercantil</option><option value="Venezuela">Venezuela</option><option value="Provincial">Provincial</option><option value="BNC">BNC</option><option value="Bancamiga">Bancamiga</option><option value="Tesoro">Tesoro</option><option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-primary tracking-wider">Referencia *</Label>
                    <Input type="text" maxLength={8} value={mobileRef} onChange={(e) => setMobileRef(e.target.value.replace(/\D/g, ''))} className="h-9 text-xs font-display tracking-widest bg-background" placeholder="Ej: 1234" />
                  </div>
                </div>
            )}

            {method === "mixed" && (
              <MixedPaymentInputs total={totalUsd} cashUsd={cashUsd} mobileBs={mobileBs} cashBs={cashBs} mobileBank={mobileBank} mobileRef={mobileRef} setCashUsd={setCashUsd} setMobileBs={setMobileBs} setCashBs={setCashBs} setMobileBank={setMobileBank} setMobileRef={setMobileRef} />
            )}
            
            {!isValidRef && <p className="text-xs text-destructive animate-pulse text-center font-bold mt-2">⚠️ REQUERIDO: Selecciona el Banco y escribe la Referencia</p>}
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSale} disabled={cart.length === 0 || (method === "mixed" && remaining > 0.01) || !isValidRef} className="bg-green-600 hover:bg-green-700 text-white font-display">Procesar Venta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}