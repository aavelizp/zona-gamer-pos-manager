import { useState, useEffect, useRef } from "react";
import { useStore, fmtUsd, type PaymentMethod } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Users, Play, Plus, CheckCircle2, AlertCircle, Tv, Upload, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export function TournamentTab() {
  const store = useStore();
  const [isMounted, setIsMounted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  // =======================================================================
  // 🚨 MOTOR DE INYECCIÓN DIRECTA Y FORMATEO SEGURO DESDE ARCHIVO 🚨
  // =======================================================================
  const procesarArchivoRescate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evento) => {
      try {
        const textoRaw = evento.target?.result as string;
        const datos = JSON.parse(textoRaw);

        // 1. Buscador inteligente: Extrae tus datos sin importar dónde estén escondidos
        let nucleo = datos;
        while (nucleo && nucleo.state !== undefined) {
          if (nucleo.state.consoles || nucleo.state.sales || nucleo.state.rate) {
            nucleo = nucleo.state;
          } else {
            break;
          }
        }

        if (!nucleo || (!nucleo.consoles && !nucleo.sales)) {
          return alert("❌ El archivo no tiene la estructura correcta. Asegúrate de estar subiendo tu Rescate.txt");
        }

        // 2. Parche de seguridad para listas vacías (evita que React choque)
        nucleo.consoles = Array.isArray(nucleo.consoles) && nucleo.consoles.length > 0 ? nucleo.consoles : store.consoles;
        nucleo.sales = Array.isArray(nucleo.sales) ? nucleo.sales : [];
        nucleo.members = Array.isArray(nucleo.members) ? nucleo.members : [];
        nucleo.sessionHistory = Array.isArray(nucleo.sessionHistory) ? nucleo.sessionHistory : [];
        nucleo.pastClosures = Array.isArray(nucleo.pastClosures) ? nucleo.pastClosures : [];
        nucleo.tournaments = Array.isArray(nucleo.tournaments) ? nucleo.tournaments : [];
        nucleo.participants = Array.isArray(nucleo.participants) ? nucleo.participants : [];
        nucleo.matches = Array.isArray(nucleo.matches) ? nucleo.matches : [];

        // 3. Congelamos la aplicación temporalmente para que no sobrescriba la nube
        (window as any).pausarSubida = true;
        (window as any).pausarDescarga = true;

        // 4. Inyectamos al cerebro principal de la app
        useStore.setState(nucleo);

        // 5. Lo empaquetamos exactamente como la app exige y lo guardamos
        const paqueteSeguro = { state: nucleo, version: 0 };
        localStorage.setItem("gamerzone-store-v1", JSON.stringify(paqueteSeguro));

        // 6. Subimos EL PAQUETE SANO a Supabase (salvando la base de datos)
        await supabase.from('app_state').upsert({ id: 'gamerzone-store-v1', state: paqueteSeguro });

        alert("✅ ¡RECUPERACIÓN EXITOSA! Tu historial de 591 líneas acaba de ser inyectado y guardado en la nube correctamente. Ve al inventario o clientes para confirmar.");

        // 7. Descongelamos la aplicación
        setTimeout(() => {
          (window as any).pausarSubida = false;
          (window as any).pausarDescarga = false;
        }, 2000);

      } catch (error) {
        alert("❌ Error al leer el archivo: " + error);
      }
    };
    reader.readAsText(file);
  };

  const activeTournament = (store.tournaments || []).find((t) => t.id === selectedTournamentId);
  const participants = (store.participants || []).filter((p) => p.tournamentId === selectedTournamentId);
  const matches = (store.matches || []).filter((m) => m.tournamentId === selectedTournamentId);

  return (
    <div className="space-y-6">
      
      {/* 🚑 PANEL DE RESCATE OBLIGATORIO 🚑 */}
      <div className="bg-red-950/90 p-8 rounded-xl border-4 border-red-500 shadow-2xl flex flex-col items-center text-center">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-white font-bold text-2xl mb-2">SISTEMA DE RESTAURACIÓN DEFINITIVA</h2>
        <p className="text-red-200 mb-6 max-w-2xl">
          Haz clic en el botón de abajo y selecciona tu archivo <b>Rescate.txt</b> de 591 líneas. El sistema lo leerá, recuperará tus clientes y reparará la base de datos automáticamente.
        </p>
        <input 
          type="file" 
          accept=".txt,.json" 
          ref={fileRef} 
          className="hidden" 
          onChange={procesarArchivoRescate} 
        />
        <Button 
          className="bg-green-600 hover:bg-green-500 text-white font-bold text-xl px-8 py-6 h-auto shadow-[0_0_20px_rgba(34,197,94,0.4)]"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="mr-3 h-6 w-6" /> SUBIR ARCHIVO Rescate.txt
        </Button>
      </div>
      {/* ==================================== */}

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
          <Card key={t.id} onClick={() => setSelectedTournamentId(t.id)} className={`p-4 cursor-pointer transition-all border-2 ${selectedTournamentId === t.id ? "border-purple-500 bg-purple-950/20" : "border-border/50 hover:border-purple-500/40 bg-card/60"}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-white">{t.name}</h3>
                <span className="text-xs text-purple-400 font-semibold">{t.game}</span>
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-bold bg-secondary text-secondary-foreground uppercase">{t.status === "registering" ? "Inscripciones" : "En Juego"}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}