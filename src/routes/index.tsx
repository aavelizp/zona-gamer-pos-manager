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
import { SalesTab } from "@/components/SalesTab"; 
import { MultiCheckoutDialog } from "@/components/MultiCheckoutDialog"; 
import { ReconciliationTab } from "@/components/ReconciliationTab"; 
import { TournamentTab } from "@/components/TournamentTab";
import { Volume2, VolumeX, FileSpreadsheet, Receipt, Wallet, LogOut, ShoppingCart, Layers } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GamerZone POS · Control de Tiempos" },
      { name: "description", content: "Sistema POS y gestión de consolas." },
      { name: "theme-color", content: "#1a0b2e" },
      { name: "google", content: "notranslate" }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { checkUser(session); });
    return () => subscription.unsubscribe();
  }, []);

  const rate = useStore((s) => s.rate);
  const setRate = useStore((s) => s.setRate);
  const soundOn = useStore((s) => s.soundOn);
  const toggleSound = useStore((s) => s.toggleSound);
  const consoles = useStore((s) => s.consoles || []);
  const sales = useStore((s) => s.sales || []);
  const products = useStore((s) => s.products || []);
  const credits = useStore((s) => s.credits || []);
  
  const [closeOpen, setCloseOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [multiCheckoutOpen, setMultiCheckoutOpen] = useState(false);

  const today = useMemo(() => { 
    const shiftStart = new Date();
    if (shiftStart.getHours() < 6) shiftStart.setDate(shiftStart.getDate() - 1);
    shiftStart.setHours(6, 0, 0, 0);
    return sales.filter(s => s && s.ts && s.ts >= shiftStart.getTime()).reduce((total, s) => total + (s?.total || 0), 0); 
  }, [sales]);

  const suggested = useMemo(() => {
    const free = consoles.filter((c) => c && !c.session);
    const ps4 = free.filter((c) => c.type === "PS4").sort((a, b) => (a.totalMinutes || 0) - (b.totalMinutes || 0))[0]?.id;
    const ps5 = free.filter((c) => c.type === "PS5").sort((a, b) => (a.totalMinutes || 0) - (b.totalMinutes || 0))[0]?.id;
    return new Set([ps4, ps5].filter(Boolean) as string[]);
  }, [consoles]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0B0914] flex flex-col items-center justify-center font-display relative overflow-hidden bg-grid">
        <img src="/logo.png" className="absolute w-[600px] h-[600px] opacity-[0.03] pointer-events-none" alt="bg" />
        <img src="/logo.png" className="h-28 w-28 animate-pulse drop-shadow-[0_0_20px_rgba(158,84,255,0.6)] mb-6 relative z-10" alt="Twins Gamer" />
        <p className="text-[#9E54FF] tracking-widest animate-pulse relative z-10">VERIFICANDO SEGURIDAD...</p>
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <div translate="no" className="notranslate min-h-screen bg-background bg-grid relative flex flex-col">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <img src="/logo.png" alt="Marca de agua" className="w-[800px] h-[800px] object-contain opacity-[0.30] drop-shadow-[0_0_50px_rgba(158,84,255,0.4)]" />
      </div>

      <header className="border-b border-border/60 bg-card/40 backdrop-blur sticky top-0 z-30 shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 py-2 sm:py-3 flex flex-col md:flex-row items-start md:items-center gap-2 sm:gap-3">
          
          <div className="flex items-center justify-between w-full md:w-auto shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 p-1 rounded-lg bg-primary/20 grid place-items-center glow-primary shrink-0">
                <img src="/logo.png" alt="Logo Header" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-display text-lg sm:text-xl leading-none">TWINS GAMER</h1>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-accent">POS · Venezuela</p>
              </div>
            </div>
            
            {/* Tasa y Caja rápida visible en móvil en la misma fila del logo */}
            <div className="flex md:hidden flex-col text-right text-xs shrink-0">
              <span className="text-muted-foreground">Caja Hoy</span>
              <span className="font-display text-sm">{fmtUsd(today)} <span className="text-accent text-[10px]">· {fmtBs(today, rate)}</span></span>
            </div>
          </div>

          {/* Menú de botones deslizable horizontalmente en móviles */}
          <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto overflow-x-auto pb-1 scrollbar-hide snap-x">
            <div className="flex items-center gap-2 bg-secondary/40 rounded-md px-2 py-1 border border-border/40 shrink-0 snap-start">
              <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">Tasa Bs/$</span>
              <Input type="number" step="0.01" value={rate} onChange={(e) => setRate(parseFloat(e.target.value) || 0)} className="h-6 sm:h-7 w-16 sm:w-20 bg-transparent border-0 font-display text-sm sm:text-base focus-visible:ring-1 text-accent px-1" />
            </div>
            
            <div className="hidden md:flex flex-col text-right text-xs mr-2 shrink-0">
              <span className="text-muted-foreground">Caja Hoy</span>
              <span className="font-display text-base">{fmtUsd(today)} <span className="text-accent">· {fmtBs(today, rate)}</span></span>
            </div>

            <Button variant="outline" size="sm" onClick={() => setSaleOpen(true)} className="border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300 shrink-0 snap-start"><ShoppingCart className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Venta Rápida</span></Button>
            <Button variant="outline" size="sm" onClick={() => exportData({ sales, products, credits, rate })} className="shrink-0 snap-start"><FileSpreadsheet className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Excel</span></Button>
            <Button variant="outline" size="sm" onClick={() => setExpenseOpen(true)} className="shrink-0 snap-start"><Wallet className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Gasto</span></Button>
            <Button size="sm" onClick={() => setCloseOpen(true)} className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-display tracking-wider shrink-0 snap-start"><Receipt className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Cerrar Caja</span></Button>
            
            <div className="flex items-center gap-1 shrink-0 snap-start ml-auto">
              <Button variant={soundOn ? "default" : "outline"} size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={toggleSound}>{soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</Button>
              <Button variant="ghost" size="icon" onClick={() => supabase.auth.signOut()} className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-red-500 hover:bg-red-500/10" title="Cerrar Sesión"><LogOut className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-2 sm:px-4 py-4 sm:py-6 relative z-10 flex flex-col min-h-0">
        <Tabs defaultValue="dashboard" className="flex-1 flex flex-col min-h-0">
          
          {/* Pestañas deslizables para celular */}
          <div className="w-full overflow-x-auto scrollbar-hide pb-2 sm:pb-0 mb-2 sm:mb-4 border-b border-border/40 sm:border-0 shrink-0">
            <TabsList className="bg-transparent sm:bg-card sm:border sm:border-border flex w-max h-auto sm:shadow-sm justify-start p-1 gap-1">
              <TabsTrigger value="dashboard" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-1.5">🎮 Consolas</TabsTrigger>
              <TabsTrigger value="club" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-1.5 text-amber-500 hover:text-amber-400">🏆 Club Gamer</TabsTrigger> 
              <TabsTrigger value="combos" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-1.5">🍔 Combos</TabsTrigger>
              <TabsTrigger value="tournaments" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-1.5 text-purple-400 hover:text-purple-300">🏆 Torneos</TabsTrigger> 
              <TabsTrigger value="clients" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-1.5">👥 Clientes</TabsTrigger>
              <TabsTrigger value="credits" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-1.5">📝 Fiados {credits.length > 0 && <span className="ml-1 text-accent font-bold">({credits.length})</span>}</TabsTrigger>
              <TabsTrigger value="expenses" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-1.5">💸 Gastos</TabsTrigger>
              <TabsTrigger value="inventory" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-1.5">📦 Inventario</TabsTrigger>
              <TabsTrigger value="maintenance" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-1.5">🔧 Mantenimiento</TabsTrigger>
              <TabsTrigger value="reconciliation" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-1.5 text-teal-400 hover:text-teal-300">🏦 Conciliación</TabsTrigger> 
              <TabsTrigger value="sales" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-1.5 text-blue-400 hover:text-blue-300">📊 Ventas Hoy</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="flex-1 overflow-y-auto pr-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 mt-2">
              <h2 className="font-display text-lg text-primary/80 uppercase tracking-widest hidden md:block">Estado en Vivo</h2>
              <Button size="sm" onClick={() => setMultiCheckoutOpen(true)} className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-primary text-white shadow-lg shadow-purple-500/20 sm:ml-auto shrink-0">
                <Layers className="h-4 w-4 mr-2" /> Cobro Múltiple (Unir Cuentas)
              </Button>
            </div>
            
            <div className="grid xl:grid-cols-[1fr_320px] gap-4">
              {/* Grilla principal de consolas: 1 en móviles muy chicos, 2 en tablets, 3 en compus grandes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-max">
                {consoles.map((c) => ( <ConsoleCard key={c.id} consoleObj={c} suggested={suggested.has(c.id)} /> ))}
              </div>
              <div className="hidden xl:block">
                <WaitQueue />
              </div>
            </div>
            {/* Cola de espera visible abajo en dispositivos móviles */}
            <div className="block xl:hidden mt-6">
              <WaitQueue />
            </div>
          </TabsContent>

          {/* Resto de los TabsContent quedan igual, solo ajustados al scroll */}
          <TabsContent value="club" className="flex-1 overflow-y-auto"><MembersTab /></TabsContent>
          <TabsContent value="combos" className="flex-1 overflow-y-auto"><CombosTab /></TabsContent>
          <TabsContent value="tournaments" className="flex-1 overflow-y-auto"><TournamentTab /></TabsContent>
          <TabsContent value="clients" className="flex-1 overflow-y-auto"><ClientsTab /></TabsContent> 
          <TabsContent value="credits" className="flex-1 overflow-y-auto"><CreditsTab /></TabsContent>
          <TabsContent value="expenses" className="flex-1 overflow-y-auto"><ExpensesTab /></TabsContent>
          <TabsContent value="inventory" className="flex-1 overflow-y-auto"><InventoryTab /></TabsContent>
          <TabsContent value="maintenance" className="flex-1 overflow-y-auto"><MaintenanceTab /></TabsContent>
          <TabsContent value="reconciliation" className="flex-1 overflow-y-auto"><ReconciliationTab /></TabsContent> 
          <TabsContent value="sales" className="flex-1 overflow-y-auto"><SalesTab /></TabsContent>
          <TabsContent value="config" className="flex-1 overflow-y-auto"><BusinessConfigTab /></TabsContent>
        </Tabs>
      </main>

      <footer className="text-center py-4 sm:py-6 text-[10px] sm:text-xs text-muted-foreground font-semibold tracking-wider bg-card/30 backdrop-blur border-t border-border/40 shrink-0 relative z-10">
        💾 SISTEMA HÍBRIDO: LOCAL + NUBE · TWINS GAMER POS
      </footer>
      
      <DirectSaleDialog open={saleOpen} onOpenChange={setSaleOpen} />
      <CloseDayDialog open={closeOpen} onOpenChange={setCloseOpen} />
      <ExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} />
      <MultiCheckoutDialog open={multiCheckoutOpen} onClose={() => setMultiCheckoutOpen(false)} />
    </div>
  );
}