import { useState, useEffect } from "react";
import { useStore, fmtUsd, fmtBs, type Tournament, type PaymentMethod } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Users, Play, Plus, CheckCircle2, AlertCircle, Tv } from "lucide-react";
import { toast } from "sonner";

export function TournamentTab() {
  const store = useStore();
  
  // Escudo contra el error de hidratación #419
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [isNewTournamentOpen, setIsNewTournamentOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);

  const [name, setName] = useState("");
  const [game, setGame] = useState("FC 25 (FIFA)");
  const [entryFee, setEntryFee] = useState("5");
  const [maxPlayers, setMaxPlayers] = useState("16");

  const [playerName, setPlayerName] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [isPaidNow, setIsPaidNow] = useState(true);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("mobile");
  const [mobileRef, setMobileRef] = useState("");

  if (!isMounted) return null;

  const activeTournament = (store.tournaments || []).find((t) => t.id === selectedTournamentId);
  const participants = (store.participants || []).filter((p) => p.tournamentId === selectedTournamentId);
  const matches = (store.matches || []).filter((m) => m.tournamentId === selectedTournamentId);

  const handleCreateTournament = () => {
    if (!name.trim()) return toast.error("Por favor ingresa un nombre para el torneo");
    store.createTournament({
      name: name.trim(),
      game,
      entryFee: parseFloat(entryFee) || 0,
      maxPlayers: parseInt(maxPlayers) || 16,
      prizePercentage: 70,
      format: "Eliminación Directa",
      dateRange: "Hoy",
      status: "registering"
    });
    setName("");
    setIsNewTournamentOpen(false);
    toast.success("🏆 Torneo creado con éxito");
  };

  const handleEnroll = () => {
    if (!activeTournament) return;
    if (!playerName.trim()) return toast.error("Ingresa el nombre del jugador");
    
    let paymentPayload = undefined;
    if (isPaidNow && activeTournament.entryFee > 0) {
      paymentPayload = {
        total: activeTournament.entryFee,
        method: payMethod,
        cashUsd: payMethod === "full" ? activeTournament.entryFee : 0,
        mobileBs: payMethod === "mobile" ? activeTournament.entryFee * store.rate : 0,
        mobileBank: payMethod === "mobile" ? "Banesco" : undefined,
        mobileRef: payMethod === "mobile" ? mobileRef : undefined
      };
    }

    store.enrollParticipant(
      activeTournament.id,
      playerName.trim(),
      playerPhone.trim() || undefined,
      isPaidNow,
      paymentPayload
    );

    setPlayerName("");
    setPlayerPhone("");
    setMobileRef("");
    setIsEnrollOpen(false);
    toast.success("✅ Jugador inscrito");
  };

  const handleGenerateBracket = () => {
    if (!activeTournament) return;
    if (participants.length < 2) return toast.error("Se necesitan al menos 2 jugadores");
    store.generateBracket(activeTournament.id);
    toast.success("⚔️ ¡Llaves de partidos generadas!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-wide text-white flex items-center gap-2">
            <Trophy className="h-7 w-7 text-yellow-500" /> GESTIÓN DE TORNEOS
          </h1>
          <p className="text-sm text-muted-foreground">Crea torneos, inscribe miembros y organiza partidos</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold" onClick={() => setIsNewTournamentOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo Torneo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(store.tournaments || []).map((t) => (
          <Card
            key={t.id}
            onClick={() => setSelectedTournamentId(t.id)}
            className={`p-4 cursor-pointer transition-all border-2 ${
              selectedTournamentId === t.id
                ? "border-purple-500 bg-purple-950/20"
                : "border-border/50 hover:border-purple-500/40 bg-card/60"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-white">{t.name}</h3>
                <span className="text-xs text-purple-400 font-semibold">{t.game}</span>
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-bold bg-secondary text-secondary-foreground uppercase">
                {t.status === "registering" ? "Inscripciones" : "En Juego"}
              </span>
            </div>
            <div className="mt-4 flex justify-between text-sm text-muted-foreground border-t border-white/5 pt-2">
              <span>Inscripción: <b className="text-green-400">{fmtUsd(t.entryFee)}</b></span>
              <span>Jugadores: <b>{(store.participants || []).filter((p) => p.tournamentId === t.id).length} / {t.maxPlayers}</b></span>
            </div>
          </Card>
        ))}
      </div>

      {activeTournament && (
        <Card className="p-6 border-purple-500/30 bg-card/80 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-4 gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">🏆 {activeTournament.name}</h2>
              <p className="text-xs text-muted-foreground">Juego: {activeTournament.game} | Formato: Eliminación Directa</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/10" onClick={() => setIsEnrollOpen(true)}>
                <Users className="h-4 w-4 mr-1" /> Inscribir Jugador
              </Button>
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold" onClick={handleGenerateBracket}>
                <Play className="h-4 w-4 mr-1" /> Generar Partidos
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-sm text-muted-foreground uppercase mb-3">Jugadores Inscritos ({participants.length})</h3>
            {participants.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No hay jugadores inscritos en este torneo aún.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {participants.map((p) => (
                  <div key={p.id} className="p-3 rounded-lg border border-white/5 bg-secondary/30 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white text-sm">{p.memberName}</p>
                      <p className="text-xs text-muted-foreground">{p.phone || "Sin teléfono"}</p>
                    </div>
                    {p.paymentStatus === "paid" ? (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Pagado
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Deuda
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {matches.length > 0 && (
            <div className="border-t border-white/10 pt-4">
              <h3 className="font-bold text-sm text-yellow-500 uppercase mb-3">⚔️ Llaves de Partidos - Ronda 1</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((m) => {
                  const p1 = participants.find((p) => p.id === m.player1Id);
                  const p2 = participants.find((p) => p.id === m.player2Id);
                  return (
                    <Card key={m.id} className="p-4 bg-background/50 border border-purple-500/20 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-purple-400">Partido #{m.matchIndex}</span>
                        <div className="flex items-center gap-1">
                          <Tv className="h-4 w-4 text-muted-foreground" />
                          <select
                            className="bg-secondary text-xs rounded px-2 py-1 border border-white/10 text-white"
                            value={m.assignedConsoleId || ""}
                            onChange={(e) => {
                              store.assignConsoleToMatch(m.id, e.target.value || undefined);
                              toast.success("🎮 Consola asignada y encendida");
                            }}
                          >
                            <option value="">Sin consola</option>
                            {(store.consoles || []).map((c) => (
                              <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className={`p-2 rounded ${m.winnerId === p1?.id ? "bg-green-600/20 border border-green-500/40" : "bg-secondary/40"}`}>
                          <p className="font-bold text-white">{p1?.memberName || "N/A"}</p>
                        </div>
                        <div className={`p-2 rounded ${m.winnerId === p2?.id ? "bg-green-600/20 border border-green-500/40" : "bg-secondary/40"}`}>
                          <p className="font-bold text-white">{p2?.memberName || "Pase Libre"}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* MODALES CON ARIA-DESCRIBEDBY PARA EVITAR EL WARNING DE LA CONSOLA */}
      <Dialog open={isNewTournamentOpen} onOpenChange={setIsNewTournamentOpen}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Nuevo Torneo Gamer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nombre del Torneo *</Label><Input placeholder="Ej: Copa Relámpago" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div>
              <Label>Juego</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={game} onChange={(e) => setGame(e.target.value)}>
                <option value="FC 25 (FIFA)">FC 25 (FIFA)</option>
                <option value="Mortal Kombat 1">Mortal Kombat 1</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Costo Inscripción ($)</Label><Input type="number" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} /></div>
              <div><Label>Máx. Jugadores</Label><Input type="number" value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} /></div>
            </div>
            <Button className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-bold" onClick={handleCreateTournament}>Crear Torneo</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Inscribir Jugador</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nombre / Gamertag *</Label><Input placeholder="Ej: Carlos 'Sniper'" value={playerName} onChange={(e) => setPlayerName(e.target.value)} /></div>
            <div><Label>Teléfono (Opcional)</Label><Input placeholder="Ej: 0414-1234567" value={playerPhone} onChange={(e) => setPlayerPhone(e.target.value)} /></div>
            
            {activeTournament && activeTournament.entryFee > 0 && (
              <div className="p-3 rounded-md bg-secondary/40 border border-white/5 space-y-3">
                <div className="flex justify-between items-center font-bold text-sm">
                  <span>Pagar Ahora ({fmtUsd(activeTournament.entryFee)})</span>
                  <input type="checkbox" checked={isPaidNow} onChange={(e) => setIsPaidNow(e.target.checked)} className="w-4 h-4" />
                </div>
              </div>
            )}
            <Button className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold" onClick={handleEnroll}>Confirmar Inscripción</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}