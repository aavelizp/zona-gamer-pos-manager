import { useState, useMemo, useRef, useEffect } from "react";
import { useStore, fmtUsd, fmtBs, type Tournament, type TournamentParticipant, type Member, type TournamentMatch } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MixedPaymentInputs } from "@/components/MixedPaymentInputs";
import { ReceiptDialog, type ReceiptData } from "@/components/Receipt";
import { Trophy, Users, CheckCircle, Receipt, Swords, ArrowLeft, Trash2, Plus, Play, UserPlus, Gift, FileText, Settings, Edit2, MessageCircle, X, Search, Table2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

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
      <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-wider text-accent font-semibold">Jugador / Cliente</p>{(selected || creating || name) && (<Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clear}><X className="h-3 w-3 mr-1" />Limpiar</Button>)}</div>
      {!creating && (
        <div ref={wrapRef} className="relative">
          <div className="flex gap-1">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); if (selected) setSelected(null); }} onFocus={() => setOpen(true)} placeholder="Buscar jugador..." className="pl-7" />
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
                  <p className="text-[11px] text-muted-foreground">{m.phone || "sin tel"} · {Math.round((m.totalMinutes||0) / 60)}h jugadas</p>
                </button>
              ))}
            </div>
          )}
          {selected && (<p className="text-[10px] text-success mt-1">✓ {selected.name} · Ya es miembro del club</p>)}
        </div>
      )}
      {(creating || selected) && (
        <div className="space-y-2">
          {creating && (<div><Label className="text-xs">Nombre / Gamertag *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Faker99" autoFocus /></div>)}
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Teléfono (WhatsApp)</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04141234567" /></div>
            <div><Label className="text-xs">Cédula (Opcional)</Label><Input value={idDoc} onChange={(e) => setIdDoc(e.target.value)} placeholder="V-12345678" /></div>
          </div>
          {creating && name.trim() && (<p className="text-[10px] text-success mt-1">✓ Se añadirá al Club Gamer al inscribirse</p>)}
        </div>
      )}
    </div>
  );
}

export function TournamentTab() {
  const rate = useStore((s) => s.rate);
  const tournaments = useStore((s) => s.tournaments || []);
  const participants = useStore((s) => s.participants || []);
  const matches = useStore((s) => s.matches || []);
  const sales = useStore((s) => s.sales || []); 
  
  const members = useStore((s) => s.members || []);
  const addMember = useStore((s) => s.addMember);
  const updateMember = useStore((s) => s.updateMember);

  const createTournament = useStore((s) => s.createTournament);
  const updateTournament = useStore((s) => s.updateTournament);
  const deleteTournament = useStore((s) => s.deleteTournament);
  const enrollParticipant = useStore((s) => s.enrollParticipant);
  const updateParticipant = useStore((s) => s.updateParticipant);
  const removeParticipant = useStore((s) => s.removeParticipant);
  const payEnrollment = useStore((s) => s.payEnrollment);
  const generateBracket = useStore((s) => s.generateBracket);
  const generateKnockoutFromGroups = useStore((s) => s.generateKnockoutFromGroups);
  
  // 👉 Traemos la nueva función de resultados exactos
  const setMatchScore = useStore((s) => s.setMatchScore);
  const revertMatchWinner = useStore((s) => s.revertMatchWinner);
  const revertTournamentToRegistering = useStore((s) => s.revertTournamentToRegistering);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  
  const [enrollOpen, setEnrollOpen] = useState<Tournament | null>(null);
  const [payOpen, setPayOpen] = useState<TournamentParticipant | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  
  const [editTourneyOpen, setEditTourneyOpen] = useState(false);
  const [editTFee, setEditTFee] = useState("");
  const [editTPrize, setEditTPrize] = useState("");

  const [editPartOpen, setEditPartOpen] = useState<TournamentParticipant | null>(null);
  const [editPName, setEditPName] = useState("");
  const [editPPhone, setEditPPhone] = useState("");

  // 👉 Estados para el Modal de Goles
  const [scoreMatch, setScoreMatch] = useState<TournamentMatch | null>(null);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  
  const [playerName, setPlayerName] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [playerIdDoc, setPlayerIdDoc] = useState(""); 
  
  const [method, setMethod] = useState<"full" | "mixed">("full");
  const [fullPayMode, setFullPayMode] = useState<"cash" | "mobile" | "cash_bs">("cash");
  const [cashUsd, setCashUsd] = useState("");
  const [mobileBs, setMobileBs] = useState("");
  const [cashBs, setCashBs] = useState("");
  const [mobileBank, setMobileBank] = useState("");

  const activeTourney = useMemo(() => tournaments.find(t => t.id === activeId), [tournaments, activeId]);
  const activeParts = useMemo(() => participants.filter(p => p.tournamentId === activeId), [participants, activeId]);
  const activeMatches = useMemo(() => matches.filter(m => m.tournamentId === activeId), [matches, activeId]);

  const isGroups = activeTourney?.format === "groups";
  const gMatches = isGroups ? activeMatches.filter(m => m.phase === "groups") : activeMatches;
  const kMatches = isGroups ? activeMatches.filter(m => m.phase === "knockout") : activeMatches;

  const [tName, setTName] = useState("");
  const [tGame, setTGame] = useState("");
  const [tFormat, setTFormat] = useState<"single_elimination" | "league" | "groups">("league"); 
  const [tMax, setTMax] = useState("999"); 
  const [tGroupCount, setTGroupCount] = useState("2");
  const [tFee, setTFee] = useState("5");
  const [tPrize, setTPrize] = useState("50");

  const handleCreate = () => {
    if (!tName.trim() || !tGame.trim()) return;
    createTournament({
      name: tName.trim(), game: tGame.trim(), maxPlayers: parseInt(tMax) || 999,
      entryFee: parseFloat(tFee) || 0, prizePercentage: parseFloat(tPrize) || 50,
      format: tFormat, groupCount: tFormat === "groups" ? parseInt(tGroupCount) : undefined,
      dateRange: new Date().toLocaleDateString('es-VE')
    });
    setCreateOpen(false); setTName(""); setTGame(""); setTFormat("league"); setTMax("999"); setTGroupCount("2"); setTFee("5"); setTPrize("50");
    toast.success("Torneo creado exitosamente");
  };

  const handleEditTourneySubmit = () => {
    if (!activeId) return;
    updateTournament(activeId, { entryFee: parseFloat(editTFee) || 0, prizePercentage: parseFloat(editTPrize) || 0 });
    setEditTourneyOpen(false); toast.success("Torneo actualizado");
  };

  const handleEditPartSubmit = () => {
    if (!editPartOpen || !editPName.trim()) return;
    updateParticipant(editPartOpen.id, { memberName: editPName.trim(), phone: editPPhone.trim() || undefined });
    setEditPartOpen(null); toast.success("Participante actualizado");
  };

  // 👇 GUARDA LOS GOLES EXACTOS 👇
  const handleSaveScore = () => {
    if (!scoreMatch) return;
    const s1 = parseInt(score1);
    const s2 = parseInt(score2);
    if (isNaN(s1) || isNaN(s2)) {
      toast.error("Por favor ingresa números válidos.");
      return;
    }

    // Validación: No empates en fase eliminatoria
    if (scoreMatch.phase === "knockout" || activeTourney?.format === "single_elimination") {
       if (s1 === s2) {
          toast.error("En fase eliminatoria debe haber un ganador (incluye los penales en el resultado).");
          return;
       }
    }
    
    setMatchScore(scoreMatch.id, s1, s2);
    setScoreMatch(null);
    setScore1("");
    setScore2("");
  };

  const resetPayForm = () => { setPlayerName(""); setPlayerPhone(""); setPlayerIdDoc(""); setMethod("full"); setFullPayMode("cash"); setCashUsd(""); setMobileBs(""); setCashBs(""); setMobileBank(""); };

  const processPayment = (totalAmount: number) => {
    const cashUsdN = parseFloat(cashUsd) || 0; const mobileBsN = parseFloat(mobileBs) || 0; const cashBsN = parseFloat(cashBs) || 0;
    const resolvedCashUsd = method === "full" ? (fullPayMode === "cash" ? totalAmount : 0) : cashUsdN;
    const resolvedMobileBs = method === "full" ? (fullPayMode === "mobile" ? totalAmount * rate : 0) : mobileBsN;
    const resolvedCashBs = method === "full" ? (fullPayMode === "cash_bs" ? totalAmount * rate : 0) : cashBsN;
    const finalMethod = method === "full" && fullPayMode === "cash_bs" ? "cash_bs" : method;
    return { total: totalAmount, method: finalMethod, cashUsd: resolvedCashUsd, mobileBs: resolvedMobileBs, cashBs: resolvedCashBs, mobileBank: mobileBank || undefined };
  };

  const handleEnroll = (isPaid: boolean) => {
    if (!enrollOpen || !playerName.trim()) return;
    const totalAmount = enrollOpen.entryFee;
    const finalPhone = playerPhone.trim() || undefined;
    const finalDoc = playerIdDoc.trim() || undefined;
    
    const existingMember = members.find(m => m.name.toLowerCase() === playerName.trim().toLowerCase() || (finalPhone && m.phone === finalPhone) || (finalDoc && m.idDoc === finalDoc));
    if (!existingMember) addMember({ name: playerName.trim(), phone: finalPhone, idDoc: finalDoc });
    else if ((finalPhone && !existingMember.phone) || (finalDoc && !existingMember.idDoc)) updateMember(existingMember.id, { phone: existingMember.phone || finalPhone, idDoc: existingMember.idDoc || finalDoc });

    if (isPaid && totalAmount > 0) {
      const payload = processPayment(totalAmount);
      enrollParticipant(enrollOpen.id, playerName.trim(), finalPhone, true, payload);
      setReceipt({ ts: Date.now(), rate, consoleName: `Torneo: ${enrollOpen.name}`, minutes: 0, timeAmount: 0, items: [{ name: `Inscripción: ${enrollOpen.name}`, qty: 1, price: totalAmount }], total: totalAmount, method: payload.method as any, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, cashBs: payload.cashBs, customer: { name: playerName.trim(), phone: finalPhone, idDoc: finalDoc } });
    } else {
      enrollParticipant(enrollOpen.id, playerName.trim(), finalPhone, false);
    }
    setEnrollOpen(null); resetPayForm(); toast.success("Participante inscrito con éxito.");
  };

  const handlePay = () => {
    if (!payOpen) return; const t = tournaments.find(x => x.id === payOpen.tournamentId); if (!t) return;
    const payload = processPayment(t.entryFee); payEnrollment(payOpen.id, payload);
    setReceipt({ ts: Date.now(), rate, consoleName: `Torneo: ${t.name}`, minutes: 0, timeAmount: 0, items: [{ name: `Inscripción: ${payOpen.memberName}`, qty: 1, price: t.entryFee }], total: t.entryFee, method: payload.method as any, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, cashBs: payload.cashBs, customer: { name: payOpen.memberName, phone: payOpen.phone } });
    setPayOpen(null); resetPayForm(); toast.success("Inscripción cobrada");
  };

  const showPastReceipt = (p: TournamentParticipant) => {
    if (!p.enrollSaleId) return; const sale = sales.find(s => s.id === p.enrollSaleId);
    if (!sale) { toast.error("El recibo original ya no se encuentra en el registro de hoy."); return; }
    setReceipt({ ts: sale.ts, rate: sale.rate, consoleName: sale.concept, minutes: 0, timeAmount: 0, items: sale.items, total: sale.total, method: sale.method, cashUsd: sale.cashUsd, mobileBs: sale.mobileBs, cashBs: sale.cashBs || 0, customer: { name: sale.customer || "Participante", phone: p.phone } });
  };

  const renderPaymentForm = (totalAmount: number) => {
    const cashUsdN = parseFloat(cashUsd) || 0; const mobileBsN = parseFloat(mobileBs) || 0; const cashBsN = parseFloat(cashBs) || 0;
    const mobileUsd = rate > 0 ? mobileBsN / rate : 0; const cashBsUsd = rate > 0 ? cashBsN / rate : 0;
    const paid = method === "full" ? totalAmount : cashUsdN + mobileUsd + cashBsUsd; const remaining = totalAmount - paid;
    const needsRef = (method === "full" && fullPayMode === "mobile") || (method === "mixed" && mobileBsN > 0); const isValidRef = !needsRef || mobileBank !== ""; 

    return (
      <div className="space-y-4">
        <Card className="p-3 bg-secondary/40"><div className="flex justify-between font-display text-lg"><span>TOTAL A PAGAR</span><span className="text-green-400">{fmtUsd(totalAmount)}</span></div></Card>
        <div className="grid grid-cols-2 gap-2"><Button variant={method === "full" ? "default" : "outline"} onClick={() => setMethod("full")}>Completo</Button><Button variant={method === "mixed" ? "default" : "outline"} onClick={() => setMethod("mixed")}>Mixto</Button></div>
        {method === "full" && ( <div className="space-y-2 border border-border rounded-md p-3 bg-background/40"><Label className="text-xs uppercase tracking-wider text-accent font-semibold">¿Cómo paga?</Label><RadioGroup value={fullPayMode} onValueChange={(v:any) => setFullPayMode(v)} className="grid grid-cols-1 gap-2"><label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="cash" /><div><p className="text-sm font-semibold">Efectivo $</p></div></label><label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "mobile" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="mobile" /><div><p className="text-sm font-semibold">Pago Móvil Bs</p></div></label><label className={`flex items-center gap-2 border rounded-md p-2 cursor-pointer ${fullPayMode === "cash_bs" ? "border-primary bg-primary/10" : "border-border"}`}><RadioGroupItem value="cash_bs" /><div><p className="text-sm font-semibold">Efectivo Bs 💵</p></div></label></RadioGroup>{fullPayMode === "mobile" && ( <div className="mt-3 p-4 bg-primary/10 rounded-md border border-primary/20"><Label className="text-[10px] uppercase font-bold text-primary tracking-wider block mb-1">Banco Emisor *</Label><select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary" value={mobileBank} onChange={(e) => setMobileBank(e.target.value)}><option value="">Seleccione banco...</option><option value="Banesco">Banesco</option><option value="Mercantil">Mercantil</option><option value="Venezuela">Venezuela</option><option value="Provincial">Provincial</option><option value="BNC">BNC</option><option value="Bancamiga">Bancamiga</option><option value="Tesoro">Tesoro</option><option value="Otro">Otro</option></select></div> )}</div> )}
        {method === "mixed" && (<MixedPaymentInputs total={totalAmount} cashUsd={cashUsd} mobileBs={mobileBs} cashBs={cashBs} mobileBank={mobileBank} setCashUsd={setCashUsd} setMobileBs={setMobileBs} setCashBs={setCashBs} setMobileBank={setMobileBank} />)}
        {!isValidRef && <p className="text-xs text-destructive animate-pulse text-center font-bold mt-2">⚠️ REQUERIDO: Selecciona el Banco</p>}
        <div className="flex justify-end gap-2 mt-4"><Button type="button" variant="outline" onClick={() => { setEnrollOpen(null); setPayOpen(null); resetPayForm(); }}>Cancelar</Button><Button type="button" onClick={payOpen ? handlePay : () => handleEnroll(true)} disabled={(method === "mixed" && remaining > 0.01) || !isValidRef} className="bg-gradient-to-r from-primary to-accent"><Receipt className="h-4 w-4 mr-1" /> Procesar Pago</Button></div>
      </div>
    );
  };

  // 👇 CÁLCULO DE TABLA CON GOLES Y DIFERENCIA 👇
  const leaderboards = useMemo(() => {
    if (activeTourney?.format !== "league" && activeTourney?.format !== "groups") return {};
    
    const groups = activeTourney.format === "groups" 
      ? Array.from(new Set(activeParts.map(p => p.groupName).filter(Boolean))) as string[] 
      : ["General"];

    const boards: Record<string, any[]> = {};
    
    groups.forEach(g => {
      const gParts = activeTourney.format === "groups" ? activeParts.filter(p => p.groupName === g) : activeParts;
      const stats: Record<string, any> = {};
      
      // Agregamos las variables GF (Goles a Favor), GC (Goles en Contra) y DG (Diferencia)
      gParts.forEach(p => stats[p.id] = { ...p, pj: 0, w: 0, d: 0, l: 0, gf: 0, gc: 0, dg: 0, pts: 0 });

      const matchSource = activeTourney.format === "groups" ? gMatches.filter(m => m.groupName === g) : activeMatches;
      
      matchSource.forEach(m => {
        if (m.winnerId || m.isDraw) {
          const p1 = stats[m.player1Id!];
          const p2 = stats[m.player2Id!];
          if (p1 && p2) {
            p1.pj++; p2.pj++;
            
            // Sumamos los goles a cada jugador
            p1.gf += m.score1 || 0; p1.gc += m.score2 || 0;
            p2.gf += m.score2 || 0; p2.gc += m.score1 || 0;

            if (m.winnerId === m.player1Id) { p1.w++; p1.pts += 3; p2.l++; }
            else if (m.winnerId === m.player2Id) { p2.w++; p2.pts += 3; p1.l++; }
            else { p1.d++; p2.d++; p1.pts += 1; p2.pts += 1; }
          }
        }
      });

      // Calculamos la Diferencia de Goles Final
      Object.values(stats).forEach((s: any) => s.dg = s.gf - s.gc);

      // Ordenamos: Puntos > Diferencia de Goles > Goles a Favor > Alfabeto
      boards[g] = Object.values(stats).sort((a: any, b: any) => 
        b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.memberName.localeCompare(b.memberName)
      );
    });

    return boards;
  }, [gMatches, activeMatches, activeParts, activeTourney]);

  if (!activeId) {
    return (
      <div className="space-y-6">
        <Card className="p-4 sm:p-5 border-purple-500/30 bg-purple-500/5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div><h3 className="font-display text-lg text-purple-400 flex items-center gap-2"><Trophy className="h-5 w-5" /> Gestión de Torneos</h3><p className="text-xs sm:text-sm text-muted-foreground mt-1">Organiza Ligas o Eliminatorias, cobra inscripciones y registra resultados exactos.</p></div>
          <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"><Plus className="h-4 w-4 mr-2" /> Crear Torneo</Button>
        </Card>

        {tournaments.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-border rounded-xl text-muted-foreground italic">No hay torneos creados.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map(t => {
              const enrolled = participants.filter(p => p.tournamentId === t.id).length;
              return (
                <Card key={t.id} className="p-4 border-border/40 hover:border-purple-500/50 transition-colors cursor-pointer" onClick={() => setActiveId(t.id)}>
                  <div className="flex justify-between items-start mb-2"><h4 className="font-display text-base text-foreground">{t.name}</h4><Badge variant="outline" className={t.status === "active" ? "border-green-500 text-green-400" : t.status === "completed" ? "border-muted text-muted-foreground" : "border-purple-500 text-purple-400"}>{t.status === "active" ? "EN CURSO" : t.status === "completed" ? "FINALIZADO" : "REGISTRO"}</Badge></div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2"><Swords className="h-3 w-3" /> {t.game} ({t.format === "league" ? "Liga" : t.format === "groups" ? "Fase de Grupos" : "Eliminatoria"})</p>
                  <div className="flex justify-between items-center text-sm bg-secondary/30 p-2 rounded-md"><span className="flex items-center gap-1"><Users className="h-4 w-4 text-accent" /> {enrolled} / {t.maxPlayers === 999 ? "∞" : t.maxPlayers}</span><span className="font-bold text-green-400">Inscripción: {fmtUsd(t.entryFee)}</span></div>
                </Card>
              )
            })}
          </div>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Trophy className="h-5 w-5 text-purple-400" /> Nuevo Torneo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nombre del Torneo</Label><Input value={tName} onChange={e => setTName(e.target.value)} placeholder="Ej: Liga de FIFA" /></div>
              <div><Label>Videojuego</Label><Input value={tGame} onChange={e => setTGame(e.target.value)} placeholder="Ej: FC 24" /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Formato</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary" value={tFormat} onChange={e => setTFormat(e.target.value as any)}>
                    <option value="league">Liga (Todos vs Todos)</option>
                    <option value="groups">Fase de Grupos + Llaves</option>
                    <option value="single_elimination">Eliminatoria Directa</option>
                  </select>
                </div>
                <div><Label>Máx. Jugadores</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary" value={tMax} onChange={e => setTMax(e.target.value)}>
                    <option value="999">Sin Límite</option>
                    <option value="4">4 Jugadores</option>
                    <option value="8">8 Jugadores</option>
                    <option value="16">16 Jugadores</option>
                    <option value="32">32 Jugadores</option>
                  </select>
                </div>
              </div>

              {tFormat === "groups" && (
                <div><Label>Cantidad de Grupos</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary" value={tGroupCount} onChange={e => setTGroupCount(e.target.value)}>
                    <option value="2">2 Grupos (A, B)</option>
                    <option value="4">4 Grupos (A, B, C, D)</option>
                    <option value="8">8 Grupos</option>
                  </select>
                </div>
              )}

              <div><Label>Precio Inscripción ($)</Label><Input type="number" min="0" step="0.5" value={tFee} onChange={e => setTFee(e.target.value)} /></div>
              <div>
                <Label className="flex justify-between"><span>Porcentaje para el Pozo</span><span className="text-accent">{tPrize}%</span></Label>
                <input type="range" min="0" max="100" step="5" value={tPrize} onChange={e => setTPrize(e.target.value)} className="w-full mt-2 accent-purple-500" />
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
            <p className="text-sm text-muted-foreground">{activeTourney.game} · {activeParts.length}{activeTourney.maxPlayers !== 999 ? `/${activeTourney.maxPlayers}` : ""} Inscritos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setEditTFee(activeTourney.entryFee.toString()); setEditTPrize(activeTourney.prizePercentage.toString()); setEditTourneyOpen(true); }} variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 h-9"><Settings className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Ajustes</span></Button>
          {activeTourney.status === "registering" && (<Button onClick={() => { if(confirm("¿Eliminar torneo por completo?")) { deleteTournament(activeId); setActiveId(null); } }} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-9"><Trash2 className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Eliminar</span></Button>)}
          {activeTourney.status === "active" && (<Button onClick={() => { if(confirm("¿Devolver el torneo a fase de registro? (Se borrará todo el progreso)")) revertTournamentToRegistering(activeId); }} variant="outline" className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 h-9">Reiniciar a Registro</Button>)}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-secondary/20 border-border/40"><p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Inscripción</p><p className="font-display text-2xl text-green-400">{fmtUsd(activeTourney.entryFee)}</p></Card>
        <Card className="p-4 bg-secondary/20 border-border/40"><p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total Recaudado Bruto</p><p className="font-display text-2xl text-white">{fmtUsd(activeParts.length * activeTourney.entryFee)}</p></Card>
        <Card className="p-4 bg-purple-500/10 border-purple-500/30"><p className="text-xs uppercase tracking-widest text-purple-300 mb-1 flex items-center gap-1"><Gift className="h-3 w-3" /> Pozo Ganador ({activeTourney.prizePercentage}%)</p><p className="font-display text-2xl text-purple-400">{fmtUsd(totalPrizePool)}</p></Card>
      </div>

      {activeTourney.status !== "registering" && (
        <div className={activeTourney.format !== "single_elimination" ? "space-y-6" : ""}>
          
          {/* 👇 TABLAS DE POSICIONES CON GOLES 👇 */}
          {activeTourney.format !== "single_elimination" && (
            <div className={`grid grid-cols-1 ${activeTourney.format === "groups" && Object.keys(leaderboards).length > 1 ? "lg:grid-cols-2" : ""} gap-6`}>
              {Object.keys(leaderboards).sort().map(gName => (
                <Card key={gName} className="border-border/40 overflow-hidden h-fit">
                  <div className="bg-primary/20 p-3 sm:p-4 border-b border-primary/30 flex justify-between items-center">
                    <h3 className="font-display text-sm sm:text-base tracking-wider flex items-center gap-2"><Table2 className="h-4 w-4 text-primary" /> {activeTourney.format === "groups" ? `Grupo ${gName}` : "Tabla de Posiciones"}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/50 text-muted-foreground uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-2 pl-4 w-8">#</th>
                          <th className="p-2">Jugador</th>
                          <th className="p-2 text-center" title="Partidos Jugados">PJ</th>
                          <th className="p-2 text-center" title="Victorias">G</th>
                          <th className="p-2 text-center" title="Empates">E</th>
                          <th className="p-2 text-center" title="Derrotas">P</th>
                          {/* Nuevas columnas de goles */}
                          <th className="p-2 text-center text-green-400/70" title="Goles a Favor">GF</th>
                          <th className="p-2 text-center text-red-400/70" title="Goles en Contra">GC</th>
                          <th className="p-2 text-center text-blue-400/70" title="Diferencia de Goles">DG</th>
                          <th className="p-2 text-center font-bold text-white">PTS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {leaderboards[gName].map((p, idx) => (
                          <tr key={p.id} className={idx === 0 ? "bg-amber-500/10" : (activeTourney.format === "groups" && idx < 2) ? "bg-green-500/10" : "hover:bg-secondary/10"}>
                            <td className="p-2 pl-4 font-bold text-muted-foreground">{idx + 1}</td>
                            <td className="p-2 font-bold flex items-center gap-2">{idx === 0 && "🏆"} {p.memberName}</td>
                            <td className="p-2 text-center">{p.pj}</td>
                            <td className="p-2 text-center text-green-400">{p.w}</td>
                            <td className="p-2 text-center text-yellow-400">{p.d}</td>
                            <td className="p-2 text-center text-red-400">{p.l}</td>
                            <td className="p-2 text-center">{p.gf}</td>
                            <td className="p-2 text-center">{p.gc}</td>
                            <td className="p-2 text-center font-bold">{p.dg > 0 ? `+${p.dg}` : p.dg}</td>
                            <td className="p-2 text-center font-display text-lg text-primary">{p.pts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* 👇 PARTIDOS DE GRUPOS/LIGA CON INGRESO DE GOLES 👇 */}
          {activeTourney.format !== "single_elimination" && (
            <Card className="p-4 sm:p-6 border-border/40 overflow-x-auto bg-secondary/10">
              <h3 className="font-display text-sm sm:text-base tracking-wider flex items-center gap-2 mb-4"><Swords className="h-4 w-4 text-accent" /> Partidos (Fase Regular)</h3>
               <div className="space-y-6">
                 {Array.from(new Set(gMatches.map(m => m.round))).sort((a,b) => a - b).map(round => {
                    const rMatches = gMatches.filter(m => m.round === round).sort((a,b) => a.matchIndex - b.matchIndex);
                    return (
                      <div key={round} className="space-y-3">
                        <h4 className="text-center font-bold text-accent uppercase tracking-widest text-xs mb-2">Jornada {round}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {rMatches.map(m => {
                            const p1 = activeParts.find(x => x.id === m.player1Id); const p2 = activeParts.find(x => x.id === m.player2Id);
                            if (!p1 || !p2) return null;
                            return (
                              <div key={m.id} className="border border-border/60 bg-background rounded-md p-3 relative">
                                {activeTourney.format === "groups" && <span className="absolute -top-2 -right-2 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">Grupo {m.groupName}</span>}
                                
                                <div className="flex justify-between items-center text-sm mb-3 mt-1">
                                  <span className={`font-bold ${m.winnerId === p1.id ? 'text-green-400' : ''}`}>{p1.memberName}</span>
                                  <span className="text-[10px] text-muted-foreground mx-2">vs</span>
                                  <span className={`font-bold ${m.winnerId === p2.id ? 'text-green-400' : ''}`}>{p2.memberName}</span>
                                </div>
                                
                                {m.winnerId || m.isDraw ? (
                                  <div className="flex justify-between items-center bg-secondary/40 p-2 rounded text-xs border border-border/50">
                                    <span className="font-bold text-primary text-sm flex gap-2 items-center">
                                      {m.score1} - {m.score2} {m.isDraw ? <span className="text-[10px] text-yellow-500 font-normal uppercase tracking-widest">(Empate)</span> : ""}
                                    </span>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors rounded-full" onClick={() => revertMatchWinner(m.id)} title="Corregir Resultado"><RotateCcw className="h-3 w-3" /></Button>
                                  </div>
                                ) : (
                                  <div className="flex justify-center">
                                    <Button size="sm" variant="outline" className="h-8 w-full text-xs bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary" onClick={() => { setScoreMatch(m); setScore1(""); setScore2(""); }}>
                                      Registrar Resultado
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                 })}
               </div>
            </Card>
          )}

          {/* BOTÓN PARA AVANZAR DE GRUPOS A ELIMINATORIAS */}
          {activeTourney.format === "groups" && kMatches.length === 0 && gMatches.every(m => m.winnerId || m.isDraw) && (
             <div className="p-6 bg-primary/10 border border-primary/30 rounded-xl text-center shadow-lg">
                <h3 className="font-display text-xl text-primary mb-2">¡Fase de Grupos Completada!</h3>
                <p className="text-sm text-muted-foreground mb-4">Los 2 mejores de cada grupo clasificarán a la fase final.</p>
                <Button onClick={() => { if(confirm("¿Generar llaves finales? Esto es irreversible.")) generateKnockoutFromGroups(activeId); }} className="h-12 px-8 text-lg bg-gradient-to-r from-accent to-primary shadow-xl">
                  🏆 Generar Llaves Finales
                </Button>
             </div>
          )}

          {/* 👇 LLAVES ELIMINATORIAS CON GOLES 👇 */}
          {(activeTourney.format === "single_elimination" || kMatches.length > 0) && (
            <Card className="p-4 sm:p-6 border-border/40 overflow-x-auto bg-secondary/10 mt-6">
              <h3 className="font-display text-sm sm:text-base tracking-wider flex items-center gap-2 mb-4"><Trophy className="h-4 w-4 text-gold" /> {activeTourney.format === "groups" ? "Fase Final (Llaves)" : "Bracket de Eliminación"}</h3>
              <div className="min-w-[800px] flex gap-8">
                {Array.from(new Set(kMatches.map(m => m.round))).sort((a,b) => a - b).map(round => {
                    const rMatches = kMatches.filter(m => m.round === round).sort((a,b) => a.matchIndex - b.matchIndex);
                    return (
                      <div key={round} className="flex-1 space-y-4">
                        <h4 className="text-center font-bold text-accent uppercase tracking-widest text-xs mb-4">Ronda {round}</h4>
                        {rMatches.map(m => {
                          const p1 = m.player1Id ? activeParts.find(x => x.id === m.player1Id)?.memberName : "---";
                          const p2 = m.player2Id ? activeParts.find(x => x.id === m.player2Id)?.memberName : "---";
                          return (
                            <div key={m.id} className={`border rounded-md p-2 flex flex-col gap-1 relative shadow-sm ${m.winnerId ? 'border-primary/50 bg-primary/5' : 'border-border/60 bg-background'}`}>
                              
                              <div className={`text-sm p-1 rounded flex justify-between items-center cursor-pointer ${m.winnerId === m.player1Id ? 'bg-green-500/20 text-green-400 font-bold' : 'hover:bg-secondary/40 transition-colors'}`} onClick={() => { if(!m.winnerId && m.player1Id && m.player2Id) { setScoreMatch(m); setScore1(""); setScore2(""); } }}>
                                <span>{p1}</span>
                                {m.score1 !== undefined && <span className="font-bold">{m.score1}</span>}
                              </div>
                              
                              <div className="border-t border-border/40" />
                              
                              <div className={`text-sm p-1 rounded flex justify-between items-center cursor-pointer ${m.winnerId === m.player2Id ? 'bg-green-500/20 text-green-400 font-bold' : 'hover:bg-secondary/40 transition-colors'}`} onClick={() => { if(!m.winnerId && m.player1Id && m.player2Id) { setScoreMatch(m); setScore1(""); setScore2(""); } }}>
                                <span>{p2}</span>
                                {m.score2 !== undefined && <span className="font-bold">{m.score2}</span>}
                              </div>
                              
                              {m.winnerId && (
                                <Button variant="secondary" size="icon" className="absolute -right-2 -top-2 h-6 w-6 rounded-full border border-border shadow-md hover:bg-destructive hover:text-destructive-foreground transition-all" onClick={() => revertMatchWinner(m.id)} title="Corregir Resultado">
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
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

        </div>
      )}

      {/* TABLA PERMANENTE DE PARTICIPANTES */}
      <Card className="border-border/40 overflow-hidden mt-6">
        <div className="bg-secondary/30 p-3 sm:p-4 border-b border-border/50 flex justify-between items-center">
          <h3 className="font-display text-sm sm:text-base tracking-wider flex items-center gap-2"><Users className="h-4 w-4 text-accent" /> Base de Participantes</h3>
          {activeTourney.status === "registering" && (
            <Button size="sm" onClick={() => { setPlayerName(""); setPlayerPhone(""); setPlayerIdDoc(""); setEnrollOpen(activeTourney); }} disabled={activeParts.length >= activeTourney.maxPlayers} className="bg-purple-600 hover:bg-purple-700 text-white h-8"><UserPlus className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Inscribir</span></Button>
          )}
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
                    <td className="p-3 sm:p-4 font-bold">
                      {p.memberName}
                      {p.phone && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-muted-foreground font-normal">📱 {p.phone}</span>
                          <a href={`https://wa.me/${p.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-green-500 hover:text-green-400 flex items-center gap-1 text-[10px] border border-green-500/30 px-1.5 py-0.5 rounded-full bg-green-500/10"><MessageCircle className="h-3 w-3" /> WhatsApp</a>
                        </div>
                      )}
                    </td>
                    <td className="p-3 sm:p-4">{p.paymentStatus === "paid" ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Pagado</Badge> : <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pendiente</Badge>}</td>
                    <td className="p-3 sm:p-4 flex justify-center gap-2">
                      {p.paymentStatus === "pending" ? ( <Button size="sm" variant="outline" className="border-green-500/40 text-green-400 hover:bg-green-500/10 h-8" onClick={() => setPayOpen(p)}><Receipt className="h-3 w-3 mr-1" /> Cobrar</Button> ) : ( <Button size="sm" variant="outline" className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 h-8" onClick={() => showPastReceipt(p)}><FileText className="h-3 w-3 mr-1" /> Recibo</Button> )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 text-primary" onClick={() => { setEditPName(p.memberName); setEditPPhone(p.phone || ""); setEditPartOpen(p); }} title="Editar Nombre/WhatsApp"><Edit2 className="h-4 w-4" /></Button>
                      
                      {activeTourney.status === "registering" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:bg-red-500/10" onClick={() => { if(confirm(`¿Remover a ${p.memberName}?`)) removeParticipant(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {activeTourney.status === "registering" && activeParts.length >= 2 && (
          <div className="p-4 bg-secondary/30 border-t border-border/50 text-center">
            <Button onClick={() => { const unpaids = activeParts.filter(x => x.paymentStatus === "pending").length; if (unpaids > 0 && !confirm(`Hay ${unpaids} participantes sin pagar. ¿Arrancar de todas formas?`)) return; generateBracket(activeId); toast.success("¡El Torneo ha comenzado!"); }} className="w-full sm:w-auto bg-gradient-to-r from-accent to-primary shadow-lg text-lg h-12 px-8"><Play className="h-5 w-5 mr-2" /> GENERAR FIXTURE Y COMENZAR</Button>
          </div>
        )}
      </Card>

      {/* 👇 MODAL PARA REGISTRAR LOS GOLES EXACTOS 👇 */}
      <Dialog open={!!scoreMatch} onOpenChange={(o) => !o && setScoreMatch(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-center">Registrar Marcador</DialogTitle></DialogHeader>
          <div className="flex items-center justify-between gap-2 py-4">
             <div className="flex-1 text-center font-bold text-sm leading-tight text-primary">
               {scoreMatch?.player1Id ? activeParts.find(p => p.id === scoreMatch.player1Id)?.memberName : "Jugador 1"}
             </div>
             
             <Input type="number" min="0" className="w-16 text-center text-2xl h-14 font-bold border-2" value={score1} onChange={e=>setScore1(e.target.value)} autoFocus />
             <span className="font-bold text-xl text-muted-foreground">-</span>
             <Input type="number" min="0" className="w-16 text-center text-2xl h-14 font-bold border-2" value={score2} onChange={e=>setScore2(e.target.value)} />
             
             <div className="flex-1 text-center font-bold text-sm leading-tight text-primary">
               {scoreMatch?.player2Id ? activeParts.find(p => p.id === scoreMatch.player2Id)?.memberName : "Jugador 2"}
             </div>
          </div>
          <DialogFooter><Button onClick={handleSaveScore} className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg">Guardar Resultado</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OTROS MODALES */}
      <Dialog open={editTourneyOpen} onOpenChange={setEditTourneyOpen}>
        <DialogContent className="max-w-xs"><DialogHeader><DialogTitle className="font-display">Ajustar Torneo</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>Precio ($)</Label><Input type="number" step="0.5" value={editTFee} onChange={e => setEditTFee(e.target.value)} /></div><div><Label>Pozo ({editTPrize}%)</Label><input type="range" min="0" max="100" step="5" value={editTPrize} onChange={e => setEditTPrize(e.target.value)} className="w-full mt-2 accent-blue-500" /></div></div><DialogFooter><Button onClick={handleEditTourneySubmit} className="w-full">Guardar</Button></DialogFooter></DialogContent>
      </Dialog>
      <Dialog open={!!editPartOpen} onOpenChange={(o) => !o && setEditPartOpen(null)}>
        <DialogContent className="max-w-xs"><DialogHeader><DialogTitle className="font-display">Editar Jugador</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>Nombre</Label><Input value={editPName} onChange={e => setEditPName(e.target.value)} /></div><div><Label>Teléfono</Label><Input value={editPPhone} onChange={e => setEditPPhone(e.target.value)} /></div></div><DialogFooter><Button onClick={handleEditPartSubmit} className="w-full mt-2">Guardar Datos</Button></DialogFooter></DialogContent>
      </Dialog>
      <Dialog open={!!enrollOpen} onOpenChange={(o) => !o && setEnrollOpen(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle className="font-display flex items-center gap-2"><UserPlus className="h-5 w-5 text-accent" /> Inscribir Jugador</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <CustomerSearch name={playerName} idDoc={playerIdDoc} phone={playerPhone} setName={setPlayerName} setIdDoc={setPlayerIdDoc} setPhone={setPlayerPhone} />
            {enrollOpen && enrollOpen.entryFee > 0 && (<div className="bg-secondary/20 p-4 rounded-lg border border-border/40"><Label className="text-xs uppercase font-bold mb-3 block">¿Paga la inscripción ahora?</Label><div className="grid grid-cols-2 gap-2 mb-4"><Button variant="outline" onClick={() => handleEnroll(false)}>No, fiar</Button><Button onClick={() => handleEnroll(true)} disabled={!playerName.trim()}>Sí, pagar</Button></div>{playerName.trim() && renderPaymentForm(enrollOpen.entryFee)}</div>)}
            {enrollOpen && enrollOpen.entryFee === 0 && (<Button onClick={() => handleEnroll(false)} disabled={!playerName.trim()} className="w-full">Inscribir (Gratis)</Button>)}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!payOpen} onOpenChange={(o) => !o && setPayOpen(null)}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle className="font-display">Cobrar Inscripción</DialogTitle></DialogHeader><div className="py-2"><p className="text-sm mb-4">Jugador: <span className="font-bold">{payOpen?.memberName}</span></p>{activeTourney && renderPaymentForm(activeTourney.entryFee)}</div></DialogContent>
      </Dialog>
      <ReceiptDialog open={!!receipt} onClose={() => setReceipt(null)} data={receipt} />
    </div>
  );
}