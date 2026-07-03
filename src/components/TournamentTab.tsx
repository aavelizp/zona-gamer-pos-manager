import { useState, useMemo } from "react";
import { useStore, fmtUsd, fmtBs, type Tournament, type TournamentParticipant } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge"; // 👈 Importación restaurada
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MixedPaymentInputs } from "@/components/MixedPaymentInputs"; // 👈 CORREGIDO: Importación agregada
import { ReceiptDialog, type ReceiptData } from "@/components/Receipt";
import { Trophy, Users, CheckCircle, Receipt, Swords, ArrowLeft, Trash2, Plus, Play, UserPlus, Gift, FileText } from "lucide-react";
import { toast } from "sonner";

export function TournamentTab() {
  const rate = useStore((s) => s.rate);
  const tournaments = useStore((s) => s.tournaments || []);
  const participants = useStore((s) => s.participants || []);
  const matches = useStore((s) => s.matches || []);
  const sales = useStore((s) => s.sales || []); 
  
  const createTournament = useStore((s) => s.createTournament);
  const deleteTournament = useStore((s) => s.deleteTournament);
  const enrollParticipant = useStore((s) => s.enrollParticipant);
  const removeParticipant = useStore((s) => s.removeParticipant);
  const payEnrollment = useStore((s) => s.payEnrollment);
  const generateBracket = useStore((s) => s.generateBracket);
  const setMatchWinner = useStore((s) => s.setMatchWinner);
  const revertMatchWinner = useStore((s) => s.revertMatchWinner);
  const revertTournamentToRegistering = useStore((s) => s.revertTournamentToRegistering);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  
  const [enrollOpen, setEnrollOpen] = useState<Tournament | null>(null);
  const [payOpen, setPayOpen] = useState<TournamentParticipant | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  
  const [playerName, setPlayerName] = useState("");
  const [method, setMethod] = useState<"full" | "mixed">("full");
  const [fullPayMode, setFullPayMode] = useState<"cash" | "mobile" | "cash_bs">("cash");
  const [cashUsd, setCashUsd] = useState("");
  const [mobileBs, setMobileBs] = useState("");
  const [cashBs, setCashBs] = useState("");
  const [mobileBank, setMobileBank] = useState("");

  const activeTourney = useMemo(() => tournaments.find(t => t.id === activeId), [tournaments, activeId]);
  const activeParts = useMemo(() => participants.filter(p => p.tournamentId === activeId), [participants, activeId]);
  const activeMatches = useMemo(() => matches.filter(m => m.tournamentId === activeId), [matches, activeId]);

  const [tName, setTName] = useState("");
  const [tGame, setTGame] = useState("");
  const [tMax, setTMax] = useState("16");
  const [tFee, setTFee] = useState("5");
  const [tPrize, setTPrize] = useState("50");

  const handleCreate = () => {
    if (!tName.trim() || !tGame.trim()) return;
    createTournament({
      name: tName.trim(), game: tGame.trim(), maxPlayers: parseInt(tMax) || 16,
      entryFee: parseFloat(tFee) || 0, prizePercentage: parseFloat(tPrize) || 50,
      format: "single_elimination", dateRange: new Date().toLocaleDateString('es-VE')
    });
    setCreateOpen(false); setTName(""); setTGame(""); setTMax("16"); setTFee("5"); setTPrize("50");
    toast.success("Torneo creado exitosamente");
  };

  const resetPayForm = () => {
    setPlayerName(""); setMethod("full"); setFullPayMode("cash"); 
    setCashUsd(""); setMobileBs(""); setCashBs(""); setMobileBank("");
  };

  const processPayment = (totalAmount: number) => {
    const cashUsdN = parseFloat(cashUsd) || 0;
    const mobileBsN = parseFloat(mobileBs) || 0;
    const cashBsN = parseFloat(cashBs) || 0;
    
    const resolvedCashUsd = method === "full" ? (fullPayMode === "cash" ? totalAmount : 0) : cashUsdN;
    const resolvedMobileBs = method === "full" ? (fullPayMode === "mobile" ? totalAmount * rate : 0) : mobileBsN;
    const resolvedCashBs = method === "full" ? (fullPayMode === "cash_bs" ? totalAmount * rate : 0) : cashBsN;
    const finalMethod = method === "full" && fullPayMode === "cash_bs" ? "cash_bs" : method;

    return {
      total: totalAmount, method: finalMethod, cashUsd: resolvedCashUsd,
      mobileBs: resolvedMobileBs, cashBs: resolvedCashBs, mobileBank: mobileBank || undefined
    };
  };

  const handleEnroll = (isPaid: boolean) => {
    if (!enrollOpen || !playerName.trim()) return;
    const totalAmount = enrollOpen.entryFee;
    
    if (isPaid && totalAmount > 0) {
      const payload = processPayment(totalAmount);
      enrollParticipant(enrollOpen.id, playerName.trim(), true, payload);
      
      setReceipt({
        ts: Date.now(),
        rate,
        consoleName: `Torneo: ${enrollOpen.name}`,
        minutes: 0,
        timeAmount: 0,
        items: [{ name: `Inscripción: ${enrollOpen.name}`, qty: 1, price: totalAmount }],
        total: totalAmount,
        method: payload.method as any,
        cashUsd: payload.cashUsd,
        mobileBs: payload.mobileBs,
        cashBs: payload.cashBs,
        customer: { name: playerName.trim() }
      });
    } else {
      enrollParticipant(enrollOpen.id, playerName.trim(), false);
    }
    setEnrollOpen(null); resetPayForm(); toast.success("Participante inscrito");
  };

  const handlePay = () => {
    if (!payOpen) return;
    const t = tournaments.find(x => x.id === payOpen.tournamentId);
    if (!t) return;
    
    const payload = processPayment(t.entryFee);
    payEnrollment(payOpen.id, payload);
    
    setReceipt({
      ts: Date.now(),
      rate,
      consoleName: `Torneo: ${t.name}`,
      minutes: 0,
      timeAmount: 0,
      items: [{ name: `Inscripción: ${payOpen.memberName}`, qty: 1, price: t.entryFee }],
      total: t.entryFee,
      method: payload.method as any,
      cashUsd: payload.cashUsd,
      mobileBs: payload.mobileBs,
      cashBs: payload.cashBs,
      customer: { name: payOpen.memberName }
    });
    
    setPayOpen(null); resetPayForm(); toast.success("Inscripción cobrada");
  };

  const showPastReceipt = (enrollSaleId: string | undefined) => {
    if (!enrollSaleId) return;
    const sale = sales.find(s => s.id === enrollSaleId);
    if (!sale) {
       toast.error("El recibo original ya no se encuentra en el registro de hoy.");
       return;
    }
    setReceipt({
      ts: sale.ts,
      rate: sale.rate,
      consoleName: sale.concept,
      minutes: 0,
      timeAmount: 0,
      items: sale.items,
      total: sale.total,
      method: sale.method,
      cashUsd: sale.cashUsd,
      mobileBs: sale.mobileBs,
      cashBs: sale.cashBs || 0,
      customer: { name: sale.customer || "Participante" }
    });
  };

  const renderPaymentForm = (totalAmount: number) => {
    const cashUsdN = parseFloat(cashUsd) || 0; const mobileBsN = parseFloat(mobileBs) || 0; const cashBsN = parseFloat(cashBs) || 0;
    const mobileUsd = rate > 0 ? mobileBsN / rate : 0; const cashBsUsd = rate > 0 ? cashBsN / rate : 0;
    const paid = method === "full" ? totalAmount : cashUsdN + mobileUsd + cashBsUsd;
    const remaining = totalAmount - paid;
    const needsRef = (method === "full" && fullPayMode === "mobile") || (method === "mixed" && mobileBsN > 0);
    const isValidRef = !needsRef || mobileBank !== ""; 

    return (
      <div className="space-y-4">
        <Card className="p-3 bg-secondary/40">
          <div className="flex justify-between font-display text-lg"><span>TOTAL A PAGAR</span><span className="text-green-400">{fmtUsd(totalAmount)}</span></div>
        </Card>
        
        <div className="grid grid-cols-2 gap-2"><Button variant={method === "full" ? "default" : "outline"} onClick={() => setMethod("full")}>Completo</Button><Button variant={method === "mixed" ? "default" : "outline"} onClick={() => setMethod("mixed")}>Mixto</Button></div>
        
        {method === "full" && (
          <div className="space-y-2 border border-border rounded-md p-3 bg-background/40">
            <Label className="text-xs uppercase tracking-wider text-accent font-semibold">¿Cómo paga?</Label>
            <RadioGroup value={fullPayMode} onValueChange={(v:any) => setFullPayMode(v)} className="grid grid-cols-1 gap-2">
              <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="cash" /><div><p className="text-sm font-semibold">Efectivo $</p></div></label>
              <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "mobile" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="mobile" /><div><p className="text-sm font-semibold">Pago Móvil Bs</p></div></label>
              <label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash_bs" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="cash_bs" /><div><p className="text-sm font-semibold">Efectivo Bs 💵</p></div></label>
            </RadioGroup>
            {fullPayMode === "mobile" && ( 
              <div className="mt-3 p-4 bg-primary/10 rounded-md border border-primary/20">
                <Label className="text-[10px] uppercase font-bold text-primary tracking-wider block mb-1">Banco Emisor *</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary" value={mobileBank} onChange={(e) => setMobileBank(e.target.value)}>
                  <option value="">Seleccione banco...</option><option value="Banesco">Banesco</option><option value="Mercantil">Mercantil</option><option value="Venezuela">Venezuela</option><option value="Provincial">Provincial</option><option value="BNC">BNC</option><option value="Bancamiga">Bancamiga</option><option value="Tesoro">Tesoro</option><option value="Otro">Otro</option>
                </select>
              </div> 
            )}
          </div>
        )}
        
        {method === "mixed" && (<MixedPaymentInputs total={totalAmount} cashUsd={cashUsd} mobileBs={mobileBs} cashBs={cashBs} mobileBank={mobileBank} setCashUsd={setCashUsd} setMobileBs={setMobileBs} setCashBs={setCashBs} setMobileBank={setMobileBank} />)}
        
        {!isValidRef && <p className="text-xs text-destructive animate-pulse text-center font-bold mt-2">⚠️ REQUERIDO: Selecciona el Banco</p>}
        
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={() => { setEnrollOpen(null); setPayOpen(null); resetPayForm(); }}>Cancelar</Button>
          <Button type="button" onClick={payOpen ? handlePay : () => handleEnroll(true)} disabled={(method === "mixed" && remaining > 0.01) || !isValidRef} className="bg-gradient-to-r from-primary to-accent">
            <Receipt className="h-4 w-4 mr-1" /> Procesar Pago
          </Button>
        </div>
      </div>
    );
  };

  if (!activeId) {
    return (
      <div className="space-y-6">
        <Card className="p-4 sm:p-5 border-purple-500/30 bg-purple-500/5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h3 className="font-display text-lg text-purple-400 flex items-center gap-2">
              <Trophy className="h-5 w-5" /> Gestión de Torneos
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Organiza competiciones, cobra inscripciones y genera los brackets automáticamente.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20">
            <Plus className="h-4 w-4 mr-2" /> Crear Torneo
          </Button>
        </Card>

        {tournaments.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-border rounded-xl text-muted-foreground italic">No hay torneos creados.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map(t => {
              const enrolled = participants.filter(p => p.tournamentId === t.id).length;
              return (
                <Card key={t.id} className="p-4 border-border/40 hover:border-purple-500/50 transition-colors cursor-pointer" onClick={() => setActiveId(t.id)}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-display text-base text-foreground">{t.name}</h4>
                    <Badge variant="outline" className={t.status === "active" ? "border-green-500 text-green-400" : t.status === "completed" ? "border-muted text-muted-foreground" : "border-purple-500 text-purple-400"}>
                      {t.status === "active" ? "EN CURSO" : t.status === "completed" ? "FINALIZADO" : "REGISTRO"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-4"><Swords className="h-3 w-3" /> {t.game}</p>
                  <div className="flex justify-between items-center text-sm bg-secondary/30 p-2 rounded-md">
                    <span className="flex items-center gap-1"><Users className="h-4 w-4 text-accent" /> {enrolled} / {t.maxPlayers}</span>
                    <span className="font-bold text-green-400">Inscripción: {fmtUsd(t.entryFee)}</span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Trophy className="h-5 w-5 text-purple-400" /> Nuevo Torneo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nombre del Torneo</Label><Input value={tName} onChange={e => setTName(e.target.value)} placeholder="Ej: Copa Mortal Kombat" /></div>
              <div><Label>Videojuego</Label><Input value={tGame} onChange={e => setTGame(e.target.value)} placeholder="Ej: Mortal Kombat 1" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Máx. Jugadores</Label><select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={tMax} onChange={e => setTMax(e.target.value)}><option value="4">4 Jugadores</option><option value="8">8 Jugadores</option><option value="16">16 Jugadores</option><option value="32">32 Jugadores</option></select></div>
                <div><Label>Inscripción ($)</Label><Input type="number" min="0" step="0.5" value={tFee} onChange={e => setTFee(e.target.value)} /></div>
              </div>
              <div>
                <Label className="flex justify-between"><span>Porcentaje para el Pozo</span><span className="text-accent">{tPrize}%</span></Label>
                <input type="range" min="0" max="100" step="5" value={tPrize} onChange={e => setTPrize(e.target.value)} className="w-full mt-2 accent-purple-500" />
                <p className="text-[10px] text-muted-foreground mt-1 text-center">De los {fmtUsd(parseFloat(tFee)||0)} de inscripción, {fmtUsd(((parseFloat(tFee)||0) * (parseFloat(tPrize)||0)) / 100)} irán al pozo del ganador.</p>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button onClick={handleCreate} disabled={!tName || !tGame} className="bg-purple-600 hover:bg-purple-700 text-white">Crear Torneo</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (!activeTourney) return null;
  const totalPrizePool = activeParts.length * (activeTourney.entryFee * (activeTourney.prizePercentage / 100));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setActiveId(null)} className="h-8 w-8 hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h2 className="font-display text-xl sm:text-2xl text-foreground flex items-center gap-2">{activeTourney.name} <Badge variant="outline" className={activeTourney.status === "active" ? "border-green-500 text-green-400" : activeTourney.status === "completed" ? "border-muted text-muted-foreground" : "border-purple-500 text-purple-400"}>{activeTourney.status === "active" ? "EN CURSO" : activeTourney.status === "completed" ? "FINALIZADO" : "REGISTRO"}</Badge></h2>
            <p className="text-sm text-muted-foreground">{activeTourney.game} · {activeParts.length}/{activeTourney.maxPlayers} Inscritos</p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeTourney.status === "registering" && (
            <Button onClick={() => { if(confirm("¿Eliminar torneo por completo?")) { deleteTournament(activeId); setActiveId(null); } }} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-9">
              <Trash2 className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Eliminar</span>
            </Button>
          )}
          {activeTourney.status === "active" && (
             <Button onClick={() => { if(confirm("¿Devolver el torneo a fase de registro? (Se borrará el bracket actual)")) revertTournamentToRegistering(activeId); }} variant="outline" className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 h-9">
               Reiniciar a Registro
             </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-secondary/20 border-border/40"><p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Inscripción</p><p className="font-display text-2xl text-green-400">{fmtUsd(activeTourney.entryFee)}</p></Card>
        <Card className="p-4 bg-secondary/20 border-border/40"><p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total Recaudado Bruto</p><p className="font-display text-2xl text-white">{fmtUsd(activeParts.length * activeTourney.entryFee)}</p></Card>
        <Card className="p-4 bg-purple-500/10 border-purple-500/30"><p className="text-xs uppercase tracking-widest text-purple-300 mb-1 flex items-center gap-1"><Gift className="h-3 w-3" /> Pozo Ganador ({activeTourney.prizePercentage}%)</p><p className="font-display text-2xl text-purple-400">{fmtUsd(totalPrizePool)}</p></Card>
      </div>

      {activeTourney.status === "registering" ? (
        <Card className="border-border/40 overflow-hidden">
          <div className="bg-secondary/30 p-3 sm:p-4 border-b border-border/50 flex justify-between items-center">
            <h3 className="font-display text-sm sm:text-base tracking-wider flex items-center gap-2"><Users className="h-4 w-4 text-accent" /> Lista de Participantes</h3>
            <Button size="sm" onClick={() => { setPlayerName(""); setEnrollOpen(activeTourney); }} disabled={activeParts.length >= activeTourney.maxPlayers} className="bg-purple-600 hover:bg-purple-700 text-white h-8"><UserPlus className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Inscribir</span></Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs tracking-wider">
                <tr><th className="p-3 sm:p-4">Jugador</th><th className="p-3 sm:p-4">Estado de Pago</th><th className="p-3 sm:p-4 text-center">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {activeParts.length === 0 ? ( <tr><td colSpan={3} className="p-6 text-center text-muted-foreground italic">Nadie inscrito todavía.</td></tr> ) : (
                  activeParts.map(p => (
                    <tr key={p.id} className="hover:bg-secondary/10">
                      <td className="p-3 sm:p-4 font-bold">{p.memberName}</td>
                      <td className="p-3 sm:p-4">
                        {p.paymentStatus === "paid" ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Pagado</Badge> : <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pendiente</Badge>}
                      </td>
                      <td className="p-3 sm:p-4 flex justify-center gap-2">
                        {p.paymentStatus === "pending" ? ( 
                          <Button size="sm" variant="outline" className="border-green-500/40 text-green-400 hover:bg-green-500/10 h-8" onClick={() => setPayOpen(p)}>
                            <Receipt className="h-3 w-3 mr-1" /> Cobrar
                          </Button> 
                        ) : (
                          <Button size="sm" variant="outline" className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 h-8" onClick={() => showPastReceipt(p.enrollSaleId)}>
                            <FileText className="h-3 w-3 mr-1" /> Recibo
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-500/10" onClick={() => { if(confirm(`¿Remover a ${p.memberName}?`)) removeParticipant(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {activeParts.length >= 2 && (
            <div className="p-4 bg-secondary/30 border-t border-border/50 text-center">
              <Button onClick={() => {
                const unpaids = activeParts.filter(x => x.paymentStatus === "pending").length;
                if (unpaids > 0 && !confirm(`Hay ${unpaids} participantes sin pagar. ¿Arrancar de todas formas?`)) return;
                generateBracket(activeId); toast.success("¡El Torneo ha comenzado!");
              }} className="w-full sm:w-auto bg-gradient-to-r from-accent to-primary shadow-lg text-lg h-12 px-8">
                <Play className="h-5 w-5 mr-2" /> GENERAR BRACKET Y COMENZAR
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-6 border-border/40 overflow-x-auto">
           <div className="min-w-[800px] flex gap-8">
             {Array.from(new Set(activeMatches.map(m => m.round))).sort().map(round => {
                const rMatches = activeMatches.filter(m => m.round === round).sort((a,b) => a.matchIndex - b.matchIndex);
                return (
                  <div key={round} className="flex-1 space-y-4">
                    <h4 className="text-center font-bold text-accent uppercase tracking-widest text-xs mb-4">Ronda {round}</h4>
                    {rMatches.map(m => {
                      const p1 = m.player1Id ? activeParts.find(x => x.id === m.player1Id)?.memberName : "---";
                      const p2 = m.player2Id ? activeParts.find(x => x.id === m.player2Id)?.memberName : "---";
                      return (
                        <div key={m.id} className={`border rounded-md p-2 flex flex-col gap-1 relative ${m.winnerId ? 'border-primary/50 bg-primary/5' : 'border-border/60 bg-background'}`}>
                          <div className={`text-sm p-1 rounded cursor-pointer ${m.winnerId === m.player1Id ? 'bg-green-500/20 text-green-400 font-bold' : 'hover:bg-secondary/40'}`} onClick={() => { if(!m.winnerId && m.player1Id && m.player2Id) setMatchWinner(m.id, m.player1Id!); }}>
                            {p1}
                          </div>
                          <div className="border-t border-border/40" />
                          <div className={`text-sm p-1 rounded cursor-pointer ${m.winnerId === m.player2Id ? 'bg-green-500/20 text-green-400 font-bold' : 'hover:bg-secondary/40'}`} onClick={() => { if(!m.winnerId && m.player1Id && m.player2Id) setMatchWinner(m.id, m.player2Id!); }}>
                            {p2}
                          </div>
                          {m.winnerId && (
                            <Button variant="ghost" size="icon" className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-secondary border border-border/50" onClick={() => revertMatchWinner(m.id)} title="Revertir Ganador"><ArrowLeft className="h-3 w-3" /></Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
             })}
           </div>
        </Card>
      )}

      <Dialog open={!!enrollOpen} onOpenChange={(o) => !o && setEnrollOpen(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><UserPlus className="h-5 w-5 text-accent" /> Inscribir Jugador</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nombre / Gamertag del Jugador *</Label><Input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Ej: Faker99" className="mt-1" autoFocus /></div>
            {enrollOpen && enrollOpen.entryFee > 0 && (
              <div className="bg-secondary/20 p-4 rounded-lg border border-border/40">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-3 block">¿Pagará la inscripción ahora mismo?</Label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Button variant="outline" className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10" onClick={() => handleEnroll(false)}>No, cobrar después</Button>
                  <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleEnroll(true)} disabled={!playerName.trim()}>Sí, pagar ahora</Button>
                </div>
                {playerName.trim() && renderPaymentForm(enrollOpen.entryFee)}
              </div>
            )}
            {enrollOpen && enrollOpen.entryFee === 0 && (
              <Button onClick={() => handleEnroll(false)} disabled={!playerName.trim()} className="w-full">Inscribir (Torneo Gratuito)</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payOpen} onOpenChange={(o) => !o && setPayOpen(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Receipt className="h-5 w-5 text-green-400" /> Cobrar Inscripción</DialogTitle></DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-4">Jugador: <span className="font-bold text-foreground">{payOpen?.memberName}</span></p>
            {activeTourney && renderPaymentForm(activeTourney.entryFee)}
          </div>
        </DialogContent>
      </Dialog>

      <ReceiptDialog open={!!receipt} onClose={() => setReceipt(null)} data={receipt} />
    </div>
  );
}