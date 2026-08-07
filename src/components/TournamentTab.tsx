import { useState, useEffect } from "react";
import { useStore, fmtUsd, type PaymentMethod } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export function TournamentTab() {
  const store = useStore();
  const [isMounted, setIsMounted] = useState(false);
  const [rescueText, setRescueText] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const inyectarDatos = () => {
    if (!rescueText.trim()) {
      alert("Por favor, pega el texto de tu Bloc de Notas primero.");
      return;
    }
    
    try {
      const datosParseados = JSON.parse(rescueText);
      
      // Extraemos la información sin importar cómo venga envuelta
      const estadoLimpio = datosParseados.state ? datosParseados.state : datosParseados;
      
      // 🚨 INYECCIÓN DIRECTA Y FORZADA A LA BÓVEDA CORRECTA (v1) 🚨
      useStore.setState(estadoLimpio);
      localStorage.setItem("gamerzone-store-v1", JSON.stringify({ state: estadoLimpio }));
      
      alert("✅ ¡INYECCIÓN EXITOSA! Cambia a la pestaña del Club Gamer o Ventas, ¡tus datos ya están ahí!");
      setRescueText(""); // Limpiamos la caja
      
    } catch (e) {
      alert("❌ Error: El texto está incompleto. Asegúrate de copiar TODO desde tu archivo Rescate.txt, desde la primera llave { hasta la última }.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================= */}
      {/* 🚑 CAJA DE RESCATE EXTREMA 🚑 */}
      {/* ========================================================= */}
      <div className="bg-red-950/90 p-8 rounded-xl border-4 border-red-500 mb-8 shadow-2xl">
        <h2 className="text-white font-bold text-2xl mb-4">
          🚑 MÓDULO DE INYECCIÓN MANUAL DE DATOS
        </h2>
        <p className="text-red-200 text-base mb-6 font-medium">
          Pega aquí TODO el texto gigante que guardaste en tu Bloc de Notas (Rescate.txt):
        </p>
        <textarea
          className="w-full h-48 p-4 text-black rounded-lg mb-6 font-mono text-sm border-2 border-red-400 focus:outline-none focus:ring-4 focus:ring-green-500"
          value={rescueText}
          onChange={(e) => setRescueText(e.target.value)}
          placeholder='Pega tu historial aquí... (Ejemplo: {"state": {"consoles": [...], "members": [...]}})'
        />
        <Button
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold text-xl h-16 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
          onClick={inyectarDatos}
        >
          INYECTAR HISTORIAL AL SISTEMA
        </Button>
      </div>
      {/* ========================================================= */}

      <div>
        <h1 className="text-2xl font-bold font-display tracking-wide text-white flex items-center gap-2">
          <Trophy className="h-7 w-7 text-yellow-500" /> GESTIÓN DE TORNEOS
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          (Las funciones de torneo están pausadas temporalmente mientras rescatamos tus datos).
        </p>
      </div>

    </div>
  );
}