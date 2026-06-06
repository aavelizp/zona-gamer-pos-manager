import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Login } from "@/components/Login";
import { useStore, fmtBs, fmtUsd } from "@/lib/store";
import { exportData } from "@/lib/excel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsoleCard } from "@/components/ConsoleCard";
import { InventoryTab, CombosTab } from "@/components/InventoryCombos";
import { CreditsTab } from "@/components/CreditsTab";
import { WaitQueue } from "@/components/WaitQueue";
import { CloseDayDialog } from "@/components/CloseDayDialog";
import { MembersTab } from "@/components/MembersTab"; 
import { ClientsTab } from "@/components/ClientsTab"; 
import { MaintenanceTab } from "@/components/MaintenanceTab";
import { ExpenseDialog } from "@/components/ExpenseDialog";
import { ExpensesTab } from "@/components/ExpensesTab";
import { BusinessConfigTab } from "@/components/BusinessConfigTab";
import { DirectSaleDialog } from "@/components/DirectSaleDialog";
import { Volume2, VolumeX, FileSpreadsheet, Receipt, Wallet, LogOut, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GamerZone POS · Control de Tiempos" },
      { name: "description", content: "Sistema POS y gestión de consolas." },
      { name: "theme-color", content: "#1a0b2e" }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Hind:wght@400;500;600;700&display=swap" },
      { rel: "icon", type: "image/png", href: "/logo.png" },
      { rel: "apple-touch-icon", href: "/logo.png" } 
    ],
  }),
  component: Index,
});

const CORREOS_AUTORIZADOS = ["aavelizp0107@gmail.com", "tu_segundo_correo@gmail.com"];

function Index() {
  const [session, setSession] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkUser = async (sessionData: any) => {
      if (sessionData?.user?.email) {
        if (!CORREOS_AUTORIZADOS.includes(sessionData.user.email)) {
          alert(`🚨 Acceso Denegado: El correo ${sessionData.user.email} no tiene permisos para entrar al sistema.`);
          await supabase.auth.signOut();
          setSession(null);
        } else {
          setSession(sessionData);
        }
      } else {
        setSession(null);
      }
      setIsCheckingAuth(false);
    };

    supabase.auth.getSession().then(({ data }) => checkUser(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const rate = useStore((s) => s.rate);
  const setRate = useStore((s) => s.setRate);
  const soundOn = useStore((s) => s.soundOn);
  const toggleSound = useStore((s) => s.toggleSound);
  const consoles = useStore((s) => s.consoles);
  const sales = useStore((s) => s.sales);
  const products = useStore((s) => s.products);
  const credits = useStore((s) => s.credits);
  
  const [closeOpen, setCloseOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);

  const today = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return sales
      .filter((s) => {
        const saleDate = new Date(s.ts);
        return saleDate >= startOfToday;
      })
      .reduce((total, s) => total + s.total, 0);
  }, [sales]);

  const suggested = useMemo(() => {
    const free = consoles.filter((c) => !c.session);
    const ps4 = free.filter((c) => c.type === "PS4").sort((a, b) => a.totalMinutes - b.totalMinutes)[0]?.id;
    const ps5 = free.filter((c) => c.type === "PS5").sort((a, b) => a.totalMinutes - b.totalMinutes)[0]?.id;
    return new Set([ps4, ps5].filter(Boolean) as string[]);
  }, [consoles]);

  // PANTALLA DE CARGA (Con tu logo latiendo)
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0B0914] flex flex-col items-center justify-center font-display relative overflow-hidden bg-grid">
        <img src="/logo.png" className="absolute w-[600px] h-[600px] opacity-[0.03] pointer-events-none" alt="bg" />
        <img src="/logo.png" className="h-28 w-28 animate-pulse drop-shadow-[0_0_20px_rgba(158,84,255,0.6)] mb-6 relative z-10" alt="Twins Gamer" />
        <p className="text-[#9E54FF] tracking-widest animate-pulse relative z-10">VERIFICANDO SEGURIDAD...</p>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-background bg-grid relative">
      
      {/* 👈 MARCA DE AGUA EN TODA LA APLICACIÓN (INTOCABLE PARA EL USUARIO) */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <img 
          src="/logo.png" 
          alt="Marca de agua Twins Gamer" 
          className="w-[600px] h-[600px] object-contain opacity-[0.03]" 
        />
      </div>

      {/* CONTENIDO PRINCIPAL POR ENCIMA DE LA MARCA DE AGUA */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="border-b border-border/60 bg-card/40 backdrop-blur sticky top-0 z-30">
          <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
            
            {/* 👈 LOGO EN LA BARRA SUPERIOR SUSTITUYENDO AL GAMEPAD */}
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 p-1 rounded-lg bg-primary/20 grid place-items-center glow-primary">
                <img src="/logo.png" alt="Logo Header" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-display text-xl leading-none">TWINS GAMER</h1>
                <p className="text-[10px] uppercase tracking-widest text-accent">POS · Venezuela</p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <div className="flex items-center gap-2 bg-secondary/40 rounded-md px-3 py-1.5 border border-border/40">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Tasa Bs/$</span>
                <Input type="number" step="0.01" value={rate} onChange={(e) => setRate(parseFloat(e.target.value) || 0)} className="h-7 w-20 bg-transparent border-0 font-display text-base focus-visible:ring-1 text-accent px-1" />
              </div>
              <div className="hidden md:flex flex-col text-right text-xs mr-2">
                <span className="text-muted-foreground">Caja Hoy</span>
                <span className="font-display text-base">{fmtUsd(today)} <span className="text-accent">· {fmtBs(today, rate)}</span></span>
              </div>
              
              <Button variant="outline" size="sm" onClick={() => setSaleOpen(true)} className="border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300">
                <ShoppingCart className="h-4 w-4 mr-1" />Venta Rápida
              </Button>

              <Button variant="outline" size="sm" onClick={() => exportData({ sales, products, credits, rate })}>
                <FileSpreadsheet className="h-4 w-4 mr-1" />Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => setExpenseOpen(true)}>
                <Wallet className="h-4 w-4 mr-1" />Gasto
              </Button>
              <Button size="sm" onClick={() => setCloseOpen(true)} className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-display tracking-wider">
                <Receipt className="h-4 w-4 mr-1" />Cerrar Caja
              </Button>
              <Button variant={soundOn ? "default" : "outline"} size="icon" onClick={toggleSound}>
                {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => supabase.auth.signOut()} className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 ml-2" title="Cerrar Sesión">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6">
          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList className="bg-card border border-border flex-wrap h-auto shadow-sm">
              <TabsTrigger value="dashboard">Consolas</TabsTrigger>
              <TabsTrigger value="inventory">Inventario</TabsTrigger>
              <TabsTrigger value="combos">Combos</TabsTrigger>
              <TabsTrigger value="credits">Fiados {credits.length > 0 && <span className="ml-1 text-accent font-bold">({credits.length})</span>}</TabsTrigger>
              <TabsTrigger value="club" className="text-amber-500 hover:text-amber-400">🏆 Club Gamer</TabsTrigger> 
              <TabsTrigger value="clients">👥 Clientes</TabsTrigger>
              <TabsTrigger value="maintenance">🔧 Mantenimiento</TabsTrigger>
              <TabsTrigger value="expenses">💸 Gastos</TabsTrigger>
              <TabsTrigger value="config">⚙️ Configuración</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <div className="grid xl:grid-cols-[1fr_320px] gap-4">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {consoles.map((c) => (
                    <ConsoleCard key={c.id} consoleObj={c} suggested={suggested.has(c.id)} />
                  ))}
                </div>
                <WaitQueue />
              </div>
            </TabsContent>

            <TabsContent value="inventory"><InventoryTab /></TabsContent>
            <TabsContent value="combos"><CombosTab /></TabsContent>
            <TabsContent value="credits"><CreditsTab /></TabsContent>
            <TabsContent value="club"><MembersTab /></TabsContent>
            <TabsContent value="clients"><ClientsTab /></TabsContent> 
            <TabsContent value="maintenance"><MaintenanceTab /></TabsContent>
            <TabsContent value="expenses"><ExpensesTab /></TabsContent>
            <TabsContent value="config"><BusinessConfigTab /></TabsContent>
          </Tabs>
        </main>

        <footer className="text-center py-6 text-xs text-muted-foreground font-semibold tracking-wider bg-card/30 backdrop-blur border-t border-border/40 mt-auto">
          💾 SISTEMA HÍBRIDO: LOCAL + NUBE · TWINS GAMER POS
        </footer>
        
        <DirectSaleDialog open={saleOpen} onOpenChange={setSaleOpen} />
        <CloseDayDialog open={closeOpen} onOpenChange={setCloseOpen} />
        <ExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} />
      </div>
    </div>
  );
}