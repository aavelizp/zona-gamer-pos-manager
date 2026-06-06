import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Mail } from "lucide-react";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Iniciar sesión con correo y contraseña
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast.error("Acceso denegado: Revisa tu correo o contraseña.");
    } else {
      toast.success("¡Bienvenido a Twins Gamer!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0914] flex flex-col items-center justify-center p-4 relative overflow-hidden bg-grid">
      
      {/* 👈 MARCA DE AGUA GIGANTE DE FONDO EN EL LOGIN */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <img src="/logo.png" alt="Fondo" className="w-[800px] h-[800px] object-contain opacity-[0.03]" />
      </div>
      
      {/* TARJETA DE LOGIN */}
      <div className="w-full max-w-md bg-[#131022]/80 backdrop-blur-xl border border-[#9E54FF]/30 p-8 rounded-2xl shadow-[0_0_40px_rgba(158,84,255,0.15)] relative z-10">
        <div className="flex flex-col items-center mb-8">
          {/* 👈 TU LOGO BRILLANTE EN EL CENTRO */}
          <img 
            src="/logo.png" 
            alt="Twins Gamer" 
            className="w-32 h-32 object-contain drop-shadow-[0_0_20px_rgba(158,84,255,0.6)] mb-4" 
          />
          <h1 className="font-display text-3xl tracking-wider text-white">TWINS GAMER</h1>
          <p className="text-[#9E54FF] text-xs uppercase tracking-widest mt-1 font-semibold">Sistema POS Integrado</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input 
                type="email" 
                placeholder="Correo administrador" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="pl-10 h-12 bg-black/40 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-[#9E54FF]" 
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input 
                type="password" 
                placeholder="Contraseña secreta" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="pl-10 h-12 bg-black/40 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-[#9E54FF]" 
                required 
              />
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-12 bg-gradient-to-r from-[#9E54FF] to-[#00E5FF] text-white font-display tracking-widest text-sm hover:opacity-90 transition-opacity mt-2"
          >
            {loading ? "CONECTANDO..." : "ENTRAR AL SISTEMA"}
          </Button>
        </form>
      </div>
    </div>
  );
}