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
  const [isMounted, setIsMounted] = useState(false);
  
  // 🔥 VARIABLE PARA LA CAJA DE RESCATE 🔥
  const [rescueText, setRescueText] = useState("");

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

  return (
    <div className="space-y-6">
      
      {/* ========================================================= */}
      {/* 🚨 CAJA DE RESCATE DE EMERGENCIA (MÉTODO DEFINITIVO) 🚨 */}
      {/* ========================================================= */}
      <div className="bg-red-950/80 p-6 rounded-lg border-2 border-red-500 mb-6 shadow-xl">
        <h2 className="text-white font-bold text-xl mb-2 flex items-center gap-2">
          🚨 MÓDULO DE RECUPERACIÓN DE HISTORIAL
        </h2>
        <p className="text-red-200 text-sm mb-4">
          1. Ve a Supabase y copia todo el texto gigante de tu historial.<br/>
          2. Pégalo en el cuadro blanco de abajo.<br/>
          3. Presiona el botón verde.
        </p>
        <textarea
          className="w-full h-32 p-3 text-black rounded mb-4 font-mono text-xs border-2 border-red-400 focus:outline-none focus:ring-4 focus:ring-green-500"
          value={rescueText}
          onChange={(e) => setRescueText(e.target.value)}
          placeholder='Pega aquí todo el texto de Supabase. Ejemplo: {"state": {"consoles": [...], "members": [...]}}'
        />
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg h-14"
          onClick={() => {
            if (!rescueText.trim()) return alert("Por favor, pega el texto de Supabase primero.");
            try {
              const data = JSON.parse(rescueText);
              // Extraemos el estado dependiendo de cómo lo haya guardado Supabase
              const stateToRestore = data.state ? data.state : data;
              
              // INYECCIÓN DIRECTA AL CEREBRO DE LA APP (A prueba de fallos)
              useStore.setState(stateToRestore);
              
              alert("✅ ¡DATOS INYECTADOS CON ÉXITO! Ve a la pestaña del Club Gamer o Ventas para ver tu historial de vuelta.");
              setRescueText(""); // Limpia el cuadro
            } catch(err) {
              alert("❌ Error: El texto pegado está incompleto o dañado. Asegúrate de haberlo copiado TODO desde el inicio '{' hasta el final '}'.");
            }
          }}
        >
          INYECTAR HISTORIAL Y RECUPERAR DATOS
        </Button>
      </div>
      {/* ========================================================= */}


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
          </Card>
        ))}
      </div>
    </div>
  );
}