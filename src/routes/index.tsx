import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { Volume2, VolumeX, FileSpreadsheet, Gamepad2, Receipt } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GamerZone POS · Control de Tiempos" },
      { name: "description", content: "Sistema POS y gestión de consolas para zona gamer en Venezuela. Cobros mixtos $/Bs, fiados, inventario y combos." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Hind:wght@400;500;600;700&display=swap" },
    ],
  }),
  component: Index,
});

function Index() {
  const rate = useStore((s) => s.rate);
  const setRate = useStore((s) => s.setRate);
  const soundOn = useStore((s) => s.soundOn);
  const toggleSound = useStore((s) => s.toggleSound);
  const consoles = useStore((s) => s.consoles);
  const sales = useStore((s) => s.sales);
  const products = useStore((s) => s.products);
  const credits = useStore((s) => s.credits);
  const [closeOpen, setCloseOpen] = useState(false);

  const today = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return sales.filter((s) => s.ts >= start.getTime()).reduce((a, s) => a + s.total, 0);
  }, [sales]);

  // Suggested consoles (least used per type)
  const suggested = useMemo(() => {
    const ps4 = consoles.filter((c) => c.type === "PS4").sort((a, b) => a.totalMinutes - b.totalMinutes)[0]?.id;
    const ps5 = consoles.filter((c) => c.type === "PS5").sort((a, b) => a.totalMinutes - b.totalMinutes)[0]?.id;
    return new Set([ps4, ps5].filter(Boolean) as string[]);
  }, [consoles]);

  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/20 grid place-items-center glow-primary">
              <Gamepad2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl leading-none">GAMERZONE</h1>
              <p className="text-[10px] uppercase tracking-widest text-accent">POS · Venezuela</p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <div className="flex items-center gap-2 bg-secondary/40 rounded-md px-3 py-1.5">
              <span className="text-xs text-muted-foreground">Tasa Bs/$</span>
              <Input
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                className="h-7 w-24 bg-transparent border-0 font-display text-base focus-visible:ring-1"
              />
            </div>
            <div className="hidden md:flex flex-col text-right text-xs">
              <span className="text-muted-foreground">Caja Hoy</span>
              <span className="font-display text-base">{fmtUsd(today)} <span className="text-accent">· {fmtBs(today, rate)}</span></span>
            </div>
            <Button variant="outline" size="sm" onClick={() => exportData({ sales, products, credits, rate })}>
              <FileSpreadsheet className="h-4 w-4 mr-1" />Excel
            </Button>
            <Button size="sm" onClick={() => setCloseOpen(true)} className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-display tracking-wider">
              <Receipt className="h-4 w-4 mr-1" />Cerrar Caja
            </Button>
            <Button variant={soundOn ? "default" : "outline"} size="icon" onClick={toggleSound}>
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="bg-card border border-border flex-wrap h-auto">
            <TabsTrigger value="dashboard">Consolas</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="combos">Combos</TabsTrigger>
            <TabsTrigger value="credits">Fiados {credits.length > 0 && <span className="ml-1 text-accent">({credits.length})</span>}</TabsTrigger>
            <TabsTrigger value="club">🏆 Club Gamer</TabsTrigger>
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
        </Tabs>
      </main>

      <footer className="text-center py-6 text-xs text-muted-foreground">
        💾 Datos guardados localmente · Exporta a Excel para respaldo
      </footer>
      <CloseDayDialog open={closeOpen} onOpenChange={setCloseOpen} />
    </div>
  );
}
