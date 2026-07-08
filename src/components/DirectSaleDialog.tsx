import { useState, useMemo, useRef, useEffect } from "react";
import { useStore, fmtUsd, fmtBs, type Product, type Member } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MixedPaymentInputs } from "@/components/MixedPaymentInputs";
import { ReceiptDialog, type ReceiptData } from "@/components/Receipt";
import { ShoppingCart, Search, X, Plus, Minus, Trash2, Receipt as ReceiptIcon } from "lucide-react";
import { toast } from "sonner";

// 👇 BUSCADOR INTELIGENTE DE CLIENTES INYECTADO AQUÍ 👇
function CustomerSearch({ name, idDoc, phone, setName, setIdDoc, setPhone }: any) {
  const members = useStore((s) => s.members || []);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    let safeMembers = Array.isArray(members) ? [...members] : [];
    safeMembers.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
    if (!q) return safeMembers.slice(0, 8);
    return safeMembers.filter((m) => (m?.name || "").toLowerCase().includes(q) || (m?.phone || "").includes(q) || (m?.idDoc || "").toLowerCase().includes(q)).slice(0, 8);
  }, [members, query]);

  const pick = (m: Member) => { setSelected(m); setName(m.name || ""); setIdDoc(m.idDoc || ""); setPhone(m.phone || ""); setQuery(m.name || ""); setOpen(false); setCreating(false); };
  const clear = () => { setSelected(null); setName(""); setIdDoc(""); setPhone(""); setQuery(""); setCreating(false); };

  return (
    <div className="space-y-2 border border-border rounded-md p-3 bg-background/40">
      <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-wider text-accent font-semibold">Cliente</p>{(selected || creating || name) && (<Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clear}><X className="h-3 w-3 mr-1" />Limpiar</Button>)}</div>
      {!creating && (
        <div ref={wrapRef} className="relative">
          <div className="flex gap-1">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); if (selected) setSelected(null); }} onFocus={() => setOpen(true)} placeholder="Buscar cliente..." className="pl-7" />
            </div>
            <Button type="button" size="icon" variant="outline" onClick={() => { setCreating(true); setOpen(false); setSelected(null); setName(query); setIdDoc(""); setPhone(""); }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {open && (
            <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-56 overflow-auto">
              {results.length === 0 ? (
                <div className="p-2 text-xs text-muted-foreground">Sin coincidencias. <button type="button" className="text-primary underline" onClick={() => { setCreating(true); setOpen(false); setName(query); }}>Crear "{query}"</button></div>
              ) : results.map((m) => (
                <button key={m.id} type="button" onClick={() => pick(m)} className="w-full text-left px-3 py-2 hover:bg-accent/30 border-b border-border/40 last:border-0">
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground">{m.phone || "sin tel"} · {Math.round((m.totalMinutes||0) / 60)}h</p>
                </button>
              ))}
            </div>
          )}
          {selected && (<p className="text-[10px] text-success mt-1">✓ {selected.name} seleccionado</p>)}
        </div>
      )}
      {(creating || selected) && (
        <div className="space-y-2">
          {creating && (<div><Label className="text-xs">Nombre y Apellido *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Juan Pérez" autoFocus /></div>)}
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Teléfono</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04141234567" /></div>
            <div><Label className="text-xs">Cédula</Label><Input value={idDoc} onChange={(e) => setIdDoc(e.target.value)} placeholder="V-12345678" /></div>
          </div>
          {creating && name.trim() && (<p className="text-[10px] text-success mt-1">✓ Se añadirá al Club Gamer al cobrar</p>)}
        </div>
      )}
    </div>
  );
}

export function DirectSaleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const products = useStore((s) => s.products || []);
  const rate = useStore((s) => s.rate);
  const directSale = useStore((s) => s.directSale);
  
  const members = useStore((s) => s.members || []);
  const addMember = useStore((s) => s.addMember);
  const updateMember = useStore((s) => s.updateMember);

  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [method, setMethod] = useState<"full" | "mixed" | "credit">("full");
  const [fullPayMode, setFullPayMode] = useState<"cash" | "mobile" | "cash_bs">("cash");
  const [cashUsd, setCashUsd] = useState("");
  const [mobileBs, setMobileBs] = useState("");
  const [cashBs, setCashBs] = useState("");
  const [mobileBank, setMobileBank] = useState("");
  
  // Estados del cliente
  const [name, setName] = useState("");
  const [idDoc, setIdDoc] = useState("");
  const [phone, setPhone] = useState("");

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    if (open) {
      setCart([]); setMethod("full"); setFullPayMode("cash"); setCashUsd(""); setMobileBs(""); setCashBs(""); setMobileBank(""); setName(""); setIdDoc(""); setPhone(""); setReceipt(null);
    }
  }, [open]);

  const total = cart.reduce((acc, item) => acc + item.product.price * item.qty, 0);

  const cashUsdN = parseFloat(cashUsd) || 0; const mobileBsN = parseFloat(mobileBs) || 0; const cashBsN = parseFloat(cashBs) || 0;
  const mobileUsd = rate > 0 ? mobileBsN / rate : 0; const cashBsUsd = rate > 0 ? cashBsN / rate : 0;
  const paid = method === "full" ? total : method === "mixed" ? (cashUsdN + mobileUsd + cashBsUsd) : 0;
  const remaining = total - paid;
  
  const resolvedCashUsd = method === "full" ? (fullPayMode === "cash" ? total : 0) : method === "mixed" ? cashUsdN : 0;
  const resolvedMobileBs = method === "full" ? (fullPayMode === "mobile" ? total * rate : 0) : method === "mixed" ? mobileBsN : 0;
  const resolvedCashBs = method === "full" ? (fullPayMode === "cash_bs" ? total * rate : 0) : method === "mixed" ? cashBsN : 0;
  const finalMethod = method === "full" && fullPayMode === "cash_bs" ? "cash_bs" : method;
  
  const needsRef = (method === "full" && fullPayMode === "mobile") || (method === "mixed" && mobileBsN > 0);
  const isValidRef = !needsRef || mobileBank !== "";

  const addToCart = (p: Product) => {
    setCart(curr => {
      const existing = curr.find(item => item.product.id === p.id);
      if (existing) {
        if (existing.qty >= p.stock) { toast.error("Stock insuficiente"); return curr; }
        return curr.map(item => item.product.id === p.id ? { ...item, qty: item.qty + 1 } : item);
      }
      if (p.stock < 1) { toast.error("Agotado"); return curr; }
      return [...curr, { product: p, qty: 1 }];
    });
  };

  const removeFromCart = (pId: string) => {
    setCart(curr => {
      const existing = curr.find(item => item.product.id === pId);
      if (existing && existing.qty > 1) {
        return curr.map(item => item.product.id === pId ? { ...item, qty: item.qty - 1 } : item);
      }
      return curr.filter(item => item.product.id !== pId);
    });
  };

  const removeAllFromCart = (pId: string) => setCart(curr => curr.filter(item => item.product.id !== pId));

  const submit = () => {
    if (cart.length === 0) return;
    if (method === "mixed" && remaining > 0.01) return;
    if (method === "credit" && !name.trim()) return;
    if (!isValidRef) return;

    const finalPhone = phone.trim() || undefined;
    const finalDoc = idDoc.trim() || undefined;
    
    // Registrar/Actualizar cliente si no existe
    if (name.trim()) {
      const existingMember = members.find(m => m.name.toLowerCase() === name.trim().toLowerCase() || (finalPhone && m.phone === finalPhone) || (finalDoc && m.idDoc === finalDoc));
      if (!existingMember) addMember({ name: name.trim(), phone: finalPhone, idDoc: finalDoc });
      else if ((finalPhone && !existingMember.phone) || (finalDoc && !existingMember.idDoc)) updateMember(existingMember.id, { phone: existingMember.phone || finalPhone, idDoc: existingMember.idDoc || finalDoc });
    }

    const payload = {
      method: finalMethod as any, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, cashBs: resolvedCashBs, mobileBank: needsRef ? mobileBank : undefined, total, customer: name.trim() || "Consumidor Final",
      items: cart.map(item => ({ productId: item.product.id, name: item.product.name, qty: item.qty, price: item.product.price }))
    };

    setReceipt({ ts: Date.now(), rate, consoleName: "Venta Directa", minutes: 0, timeAmount: 0, items: cart.map(item => ({ name: item.product.name, qty: item.qty, price: item.product.price * item.qty })), total, method: finalMethod as any, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, cashBs: resolvedCashBs, customer: { name: name.trim() || "Consumidor Final", idDoc: finalDoc, phone: finalPhone } });
    
    directSale(payload);
  };

  const handleReceiptClose = () => { setReceipt(null); onClose(); toast.success("Venta completada"); };

  return (
    <>
      <Dialog open={open && !receipt} onOpenChange={o => !o && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-4 sm:p-6 pb-2 border-b border-border/40 shrink-0"><DialogTitle className="font-display flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" /> Ventas Rápidas</DialogTitle></DialogHeader>
          
          <div className="flex-1 overflow-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/40">
            {/* Lista de Productos */}
            <div className="p-4 sm:p-6 flex-1 overflow-auto">
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Catálogo de Productos</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {products.filter(p => p.stock > 0).map(p => (
                  <Button key={p.id} variant="outline" className="h-auto py-3 flex flex-col items-start gap-1 justify-start border-border/50 hover:border-primary/50" onClick={() => addToCart(p)}>
                    <span className="font-bold whitespace-normal text-left leading-tight">{p.name}</span>
                    <div className="w-full flex justify-between items-center text-[10px]"><span className="text-primary font-bold">{fmtUsd(p.price)}</span><span className="text-muted-foreground">Stock: {p.stock}</span></div>
                  </Button>
                ))}
                {products.filter(p => p.stock <= 0).length === products.length && (<p className="text-sm text-muted-foreground col-span-full italic">No hay productos con stock.</p>)}
              </div>
            </div>

            {/* Panel de Cobro */}
            <div className="p-4 sm:p-6 w-full md:w-80 shrink-0 bg-secondary/10 flex flex-col">
              <div className="flex-1 overflow-auto space-y-4">
                
                {/* Carrito */}
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Carrito</h4>
                  {cart.length === 0 ? (<p className="text-xs text-muted-foreground italic bg-background/40 p-3 rounded border border-dashed text-center">Selecciona productos de la izquierda</p>) : (
                    <div className="space-y-2">
                      {cart.map(item => (
                        <div key={item.product.id} className="flex items-center justify-between bg-background p-2 rounded-md border border-border/40 shadow-sm">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-xs font-bold truncate">{item.product.name}</p>
                            <p className="text-[10px] text-muted-foreground">{fmtUsd(item.product.price * item.qty)}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button size="icon" variant="outline" className="h-6 w-6 text-xs" onClick={() => removeFromCart(item.product.id)}><Minus className="h-3 w-3" /></Button>
                            <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                            <Button size="icon" variant="outline" className="h-6 w-6 text-xs" onClick={() => addToCart(item.product)} disabled={item.qty >= item.product.stock}><Plus className="h-3 w-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:bg-red-500/10 ml-1" onClick={() => removeAllFromCart(item.product.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-border/40 pt-4">
                  <div className="flex justify-between items-end mb-4"><span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total</span><span className="font-display text-2xl text-green-400 leading-none">{fmtUsd(total)}</span></div>
                  
                  {total > 0 && (
                    <div className="space-y-4">
                      {/* 👇 EL BUSCADOR INTEGRADO EN EL PAGO 👇 */}
                      <CustomerSearch name={name} idDoc={idDoc} phone={phone} setName={setName} setIdDoc={setIdDoc} setPhone={setPhone} />

                      <div className="grid grid-cols-3 gap-2"><Button size="sm" variant={method === "full" ? "default" : "outline"} onClick={() => setMethod("full")} className="text-xs">Total</Button><Button size="sm" variant={method === "mixed" ? "default" : "outline"} onClick={() => setMethod("mixed")} className="text-xs">Mixto</Button><Button size="sm" variant={method === "credit" ? "default" : "outline"} onClick={() => setMethod("credit")} className="text-xs">Fiado</Button></div>
                      
                      {method === "full" && (
                        <div className="space-y-2 border border-border rounded-md p-3 bg-background/40">
                          <Label className="text-[10px] uppercase tracking-wider text-accent font-semibold">Método de Pago</Label>
                          <div className="grid grid-cols-3 gap-1">
                            <Button size="sm" variant={fullPayMode === "cash" ? "default" : "outline"} onClick={() => setFullPayMode("cash")} className="h-8 text-[10px] px-1">Efectivo $</Button>
                            <Button size="sm" variant={fullPayMode === "mobile" ? "default" : "outline"} onClick={() => setFullPayMode("mobile")} className="h-8 text-[10px] px-1">Pago Móvil</Button>
                            <Button size="sm" variant={fullPayMode === "cash_bs" ? "default" : "outline"} onClick={() => setFullPayMode("cash_bs")} className="h-8 text-[10px] px-1">Efec. Bs</Button>
                          </div>
                          {fullPayMode === "mobile" && (
                            <div className="mt-2"><select className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary" value={mobileBank} onChange={(e) => setMobileBank(e.target.value)}><option value="">Seleccione banco...</option><option value="Banesco">Banesco</option><option value="Mercantil">Mercantil</option><option value="Venezuela">Venezuela</option><option value="Provincial">Provincial</option><option value="BNC">BNC</option><option value="Bancamiga">Bancamiga</option><option value="Tesoro">Tesoro</option><option value="Otro">Otro</option></select></div>
                          )}
                        </div>
                      )}
                      
                      {method === "mixed" && (<MixedPaymentInputs total={total} cashUsd={cashUsd} mobileBs={mobileBs} cashBs={cashBs} mobileBank={mobileBank} setCashUsd={setCashUsd} setMobileBs={setMobileBs} setCashBs={setCashBs} setMobileBank={setMobileBank} />)}
                      
                      {method === "credit" && !name.trim() && <p className="text-[10px] text-destructive font-bold text-center">Debes ingresar/seleccionar un cliente para fiar.</p>}
                      {!isValidRef && <p className="text-[10px] text-destructive font-bold text-center animate-pulse">Selecciona el banco del Pago Móvil</p>}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 mt-4 shrink-0">
                <Button onClick={submit} disabled={cart.length === 0 || (method === "mixed" && remaining > 0.01) || (method === "credit" && !name.trim()) || !isValidRef} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg h-12 text-lg font-bold">
                  <ReceiptIcon className="h-5 w-5 mr-2" /> Cobrar Venta
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ReceiptDialog open={!!receipt} onClose={handleReceiptClose} data={receipt} />
    </>
  );
}