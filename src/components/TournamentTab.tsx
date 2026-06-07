import { useState } from "react";
import { useStore, fmtUsd, fmtBs, type Tournament, type TournamentParticipant } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MixedPaymentInputs } from "@/components/MixedPaymentInputs";
import { Trophy, Users, Plus, Trash2, CheckCircle2, AlertTriangle, Receipt } from "lucide-react";
import { toast } from "sonner";

export function TournamentTab() {
  const tournaments = useStore((s) => s.tournaments || []);
  const participants = useStore((s) => s.participants || []);
  const createTournament = useStore((s) => (s as any).createTournament);
  const deleteTournament = useStore((s) => (s as any).deleteTournament);
  const enrollParticipant = useStore((s) => (s as any).enrollParticipant);
  const removeParticipant = useStore((s) => (s as any).removeParticipant);
  const payEnrollment = useStore((s) => (s as any).payEnrollment);
  const rate = useStore((s) => s.rate);

  // Estados Formulario Crear Torneo
  const [tName, setTName] = useState("");
  const [tGame, setTGame] = useState("");
  const [tMax, setTMax] = useState(16);
  const [tFee, setTFee] = useState(5);

  // Estados Modal Inscribir/Pagar
  const [enrollModal, setEnrollModal] = useState<{ open: boolean; tId: string | null; participantId?: string }>({ open: false, tId: null });
  const [playerName, setPlayerName] = useState("");
  const [paymentType, setPaymentType] = useState<"pending" | "pay_now">("pending");
  const [method, setMethod] = useState<"full" | "mixed">("full");
  const [fullPayMode, setFullPayMode] = useState<"cash" | "mobile" | "cash_bs">("cash");
  const [cashUsd, setCashUsd] = useState("");
  const [mobileBs, setMobileBs] = useState("");
  const [cashBs, setCashBs] = useState("");
  const [mobileBank, setMobileBank] = useState("");
  const [mobileRef, setMobileRef] = useState("");

  const handleCreate = () => {
    if (!tName || !tGame || tMax < 2) return;
    createTournament({ name: tName, game: tGame, maxPlayers: tMax, entryFee: tFee });
    setTName(""); setTGame(""); setTMax(16); setTFee(5);
    toast.success("Torneo creado exitosamente");
  };

  // Cálculos para el pago
  const activeT = enrollModal.tId ? tournaments.find(t => t.id === enrollModal.tId) : null;
  const total = activeT ? activeT.entryFee : 0;
  const cashUsdN = parseFloat(cashUsd) || 0; const mobileBsN = parseFloat(mobileBs) || 0; const cashBsN = parseFloat(cashBs) || 0;
  const mobileUsd = rate > 0 ? mobileBsN / rate : 0; const cashBsUsd = rate > 0 ? cashBsN / rate : 0;
  const paid = method === "full" ? total : cashUsdN + mobileUsd + cashBsUsd; const remaining = total - paid;
  
  const resolvedCashUsd = method === "full" ? (fullPayMode === "cash" ? total : 0) : method === "mixed" ? cashUsdN : 0;
  const resolvedMobileBs = method === "full" ? (fullPayMode === "mobile" ? total * rate : 0) : method === "mixed" ? mobileBsN : 0;
  const resolvedCashBs = method === "full" ? (fullPayMode === "cash_bs" ? total * rate : 0) : method === "mixed" ? cashBsN : 0;
  const finalMethod = method === "full" && fullPayMode === "cash_bs" ? "cash_bs" : method as any;

  const needsRef = (method === "full" && fullPayMode === "mobile") || (method === "mixed" && mobileBsN > 0);
  const isValidRef = !needsRef || (mobileBank !== "" && mobileRef.length >= 4);

  const submitEnrollment = () => {
    if (!activeT) return;
    if (paymentType === "pay_now") {
      if (method === "mixed" && remaining > 0.01) return;
      if (!isValidRef) return;
    }

    if (enrollModal.participantId) {
      // Es un cobro de alguien que estaba "pending"
      payEnrollment(enrollModal.participantId, {
        method: finalMethod, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, mobileBank: needsRef ? mobileBank : undefined, mobileRef: needsRef ? mobileRef : undefined, cashBs: resolvedCashBs, total
      });
      toast.success("Pago de inscripción registrado.");
    } else {
      // Es una inscripción nueva
      if (!playerName.trim()) return;
      const isPaid = paymentType === "pay_now";
      const payload = isPaid ? {
        method: finalMethod, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, mobileBank: needsRef ? mobileBank : undefined, mobileRef: needsRef ? mobileRef : undefined, cashBs: resolvedCashBs, total
      } : undefined;
      enrollParticipant(activeT.id, playerName.trim(), isPaid, payload);
      toast.success("Jugador inscrito exitosamente.");
    }
    
    setEnrollModal({ open: false, tId: null });
    setPlayerName(""); setPaymentType("pending"); setCashUsd(""); setMobileBs(""); setCashBs(""); setMobileBank(""); setMobileRef("");
  };

  if (tournaments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <Trophy className="h-24 w-24 text-muted-foreground/30" />
        <div>
          <h2 className="font-display text-2xl text-foreground">No hay torneos activos</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">Crea tu primer torneo para empezar a vender inscripciones y organizar los enfrentamientos de tu local.</p>
        </div>
        <Card className="p-6 bg-card border-primary/20 w-full max-w-md text-left shadow-[0_0_30px_rgba(158,84,255,0.1)]">
          <h3 className="font-semibold text-lg text-primary mb-4 flex items-center gap-2"><Plus className="h-5 w-5" /> Crear Nuevo Torneo</h3>
          <div className="space-y-4">
            <div><Label className="text-xs uppercase">Nombre del Evento</Label><Input value={tName} onChange={(e)=>setTName(e.target.value)} placeholder="Ej: Torneo Relámpago FIFA 26" /></div>
            <div><Label className="text-xs uppercase">Juego</Label><Input value={tGame} onChange={(e)=>setTGame(e.target.value)} placeholder="Ej: EA FC 26, Smash Bros..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs uppercase">Cupo (Jugadores)</Label><Input type="number" min={2} value={tMax} onChange={(e)=>setTMax(parseInt(e.target.value)||16)} /></div>
              <div><Label className="text-xs uppercase">Inscripción ($)</Label><Input type="number" min={0} value={tFee} onChange={(e)=>setTFee(parseFloat(e.target.value)||0)} /></div>
            </div>
            <Button className="w-full bg-gradient-to-r from-primary to-accent" disabled={!tName || !tGame} onClick={handleCreate}>Iniciar Fase de Inscripción</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {tournaments.map(t => {
        const tParts = participants.filter(p => p.tournamentId === t.id);
        const fillPercent = Math.min(100, (tParts.length / t.maxPlayers) * 100);
        const isFull = tParts.length >= t.maxPlayers;
        const prizePool = tParts.filter(p => p.paymentStatus === 'paid').length * t.entryFee;

        return (
          <div key={t.id} className="space-y-4">
            {/* Dashboard del Torneo (HYPE) */}
            <Card className="p-6 bg-[#131022] border-[#9E54FF]/40 shadow-[0_0_30px_rgba(158,84,255,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy className="h-32 w-32" /></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-primary/20 text-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-widest">{t.game}</span>
                    <span className="bg-green-500/20 text-green-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-widest">Inscripciones Abiertas</span>
                  </div>
                  <h2 className="font-display text-3xl text-white tracking-wide uppercase">{t.name}</h2>
                  <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                    <Users className="h-4 w-4" /> Modalidad: 1 vs 1 (Eliminación Directa)
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-[10px] text-[#00E5FF] uppercase font-bold tracking-widest">Prize Pool Acumulado</p>
                  <p className="font-display text-4xl text-white drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">{fmtUsd(prizePool)}</p>
                  <p className="text-xs text-muted-foreground">Inscripción: {fmtUsd(t.entryFee)}</p>
                </div>
              </div>

              {/* Barra de Progreso de Cupos (NEÓN) */}
              <div className="mt-8 relative z-10">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-white">CUPOS OCUPADOS: {tParts.length}</span>
                  <span className="text-muted-foreground">MÁXIMO: {t.maxPlayers} JUGADORES</span>
                </div>
                <div className="h-4 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-[#9E54FF] to-[#00E5FF] transition-all duration-1000 shadow-[0_0_10px_#9E54FF]"
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 relative z-10">
                <Button 
                  className="bg-white text-black hover:bg-zinc-200 font-display" 
                  disabled={isFull}
                  onClick={() => { setPlayerName(""); setPaymentType("pending"); setEnrollModal({ open: true, tId: t.id }); }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Inscribir Jugador
                </Button>
                <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => { if(confirm(`¿Seguro que deseas eliminar el torneo ${t.name} y vaciar la lista de participantes?`)) deleteTournament(t.id); }}>
                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar Torneo
                </Button>
              </div>
            </Card>

            {/* Lista de Inscritos */}
            <div className="rounded-md border border-border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-display tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">Gamer (Participante)</th>
                    <th className="p-3 text-center">Estado del Pago</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tParts.length === 0 ? (
                    <tr><td colSpan={4} className="text-center p-8 text-muted-foreground italic">Aún no hay jugadores inscritos. ¡Asegura los cupos!</td></tr>
                  ) : (
                    tParts.map((p, i) => (
                      <tr key={p.id} className="hover:bg-muted/20">
                        <td className="p-3 text-center text-muted-foreground font-mono">{i + 1}</td>
                        <td className="p-3 font-semibold text-white text-base">{p.memberName}</td>
                        <td className="p-3 text-center">
                          {p.paymentStatus === 'paid' ? (
                            <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 font-bold px-2 py-0.5 rounded text-[10px] uppercase border border-green-500/30"><CheckCircle2 className="h-3 w-3" /> Pagado</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-500 font-bold px-2 py-0.5 rounded text-[10px] uppercase border border-yellow-500/30 animate-pulse"><AlertTriangle className="h-3 w-3" /> Reservado (Debe)</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            {p.paymentStatus === 'pending' && (
                              <Button size="sm" variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/10" onClick={() => { setPlayerName(p.memberName); setPaymentType("pay_now"); setEnrollModal({ open: true, tId: t.id, participantId: p.id }); }}>
                                <Receipt className="h-4 w-4 mr-1" /> Cobrar
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10" onClick={() => { if(confirm(`¿Quitar a ${p.memberName} del torneo?`)) removeParticipant(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Modal de Inscripción / Cobro */}
      <Dialog open={enrollModal.open} onOpenChange={(o) => { if (!o) setEnrollModal({ open: false, tId: null }); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{enrollModal.participantId ? "Cobrar Inscripción" : "Inscribir al Torneo"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            
            <Card className="p-3 bg-secondary/40">
              <div className="flex justify-between font-display text-lg"><span>TOTAL INSCRIPCIÓN</span><span className="text-primary">{fmtUsd(total)}</span></div>
              <div className="flex justify-between text-sm text-accent"><span>En Bs</span><span>{fmtBs(total, rate)}</span></div>
            </Card>

            {!enrollModal.participantId && (
              <div>
                <Label className="text-xs uppercase font-semibold text-muted-foreground">Nombre del Jugador</Label>
                <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Ej: ShadowNinja99" className="mt-1" />
              </div>
            )}

            {!enrollModal.participantId && (
              <div className="space-y-2 border border-border rounded-md p-3 bg-background/40">
                <Label className="text-xs uppercase font-semibold text-muted-foreground">Estatus de Inscripción</Label>
                <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as any)} className="grid grid-cols-2 gap-2 mt-1">
                  <label className={`flex flex-col items-center justify-center gap-1 border rounded-md p-3 cursor-pointer text-center ${paymentType === "pay_now" ? "border-green-500 bg-green-500/10" : "border-border"}`}><RadioGroupItem value="pay_now" className="sr-only" /><Receipt className={`h-5 w-5 ${paymentType === "pay_now" ? "text-green-500" : "text-muted-foreground"}`} /><span className="text-xs font-semibold">Va a Pagar Ahora</span></label>
                  <label className={`flex flex-col items-center justify-center gap-1 border rounded-md p-3 cursor-pointer text-center ${paymentType === "pending" ? "border-yellow-500 bg-yellow-500/10" : "border-border"}`}><RadioGroupItem value="pending" className="sr-only" /><AlertTriangle className={`h-5 w-5 ${paymentType === "pending" ? "text-yellow-500" : "text-muted-foreground"}`} /><span className="text-xs font-semibold">Reservar (Paga el día del evento)</span></label>
                </RadioGroup>
              </div>
            )}

            {paymentType === "pay_now" && (
              <>
                <div className="grid grid-cols-2 gap-2"><Button variant={method === "full" ? "default" : "outline"} onClick={() => setMethod("full")}>Completo</Button><Button variant={method === "mixed" ? "default" : "outline"} onClick={() => setMethod("mixed")}>Mixto</Button></div>
                {method === "full" && (
                  <div className="space-y-2 border border-border rounded-md p-3 bg-background/40">
                    <Label className="text-xs uppercase tracking-wider text-accent font-semibold">¿Cómo pagó?</Label>
                    <RadioGroup value={fullPayMode} onValueChange={(v) => setFullPayMode(v as any)} className="grid grid-cols-1 gap-2"><label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="cash" /><div><p className="text-sm font-semibold">Efectivo $</p></div></label><label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "mobile" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="mobile" /><div><p className="text-sm font-semibold">Pago Móvil Bs</p></div></label><label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash_bs" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="cash_bs" /><div><p className="text-sm font-semibold">Efectivo Bs 💵</p></div></label></RadioGroup>
                    {fullPayMode === "mobile" && ( <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-primary/10 rounded-md border border-primary/20"><div><Label className="text-[10px] uppercase font-bold text-primary tracking-wider">Banco *</Label><select className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary" value={mobileBank} onChange={(e) => setMobileBank(e.target.value)}><option value="">Seleccione...</option><option value="Banesco">Banesco</option><option value="Mercantil">Mercantil</option><option value="Venezuela">Venezuela</option><option value="Provincial">Provincial</option><option value="BNC">BNC</option><option value="Bancamiga">Bancamiga</option><option value="Tesoro">Tesoro</option><option value="Otro">Otro</option></select></div><div><Label className="text-[10px] uppercase font-bold text-primary tracking-wider">Referencia *</Label><Input type="text" maxLength={8} value={mobileRef} onChange={(e) => setMobileRef(e.target.value.replace(/\D/g, ''))} className="h-9 text-xs font-display tracking-widest bg-background" placeholder="Ej: 1234" /></div></div> )}
                  </div>
                )}
                {method === "mixed" && (<MixedPaymentInputs total={total} cashUsd={cashUsd} mobileBs={mobileBs} cashBs={cashBs} mobileBank={mobileBank} mobileRef={mobileRef} setCashUsd={setCashUsd} setMobileBs={setMobileBs} setCashBs={setCashBs} setMobileBank={setMobileBank} setMobileRef={setMobileRef} />)}
                {!isValidRef && <p className="text-xs text-destructive animate-pulse text-center font-bold mt-2">⚠️ REQUERIDO: Selecciona el Banco y escribe la Referencia</p>}
              </>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setEnrollModal({ open: false, tId: null })}>Cancelar</Button>
            <Button onClick={submitEnrollment} disabled={(!enrollModal.participantId && !playerName.trim()) || (paymentType === "pay_now" && method === "mixed" && remaining > 0.01) || (paymentType === "pay_now" && !isValidRef)} className="bg-gradient-to-r from-primary to-accent">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}