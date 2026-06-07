import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function MaintenanceTab() {
  const consoles = useStore((s) => s.consoles);
  const logs = useStore((s) => s.maintenanceLogs);
  const registerMaintenance = useStore((s) => s.registerMaintenance);
  const deleteMaintenanceLog = useStore((s) => (s as any).deleteMaintenanceLog);

  const [consoleId, setConsoleId] = useState("");
  const [desc, setDesc] = useState("");

  const handleRegister = () => {
    if (!consoleId || !desc.trim()) return;
    registerMaintenance(consoleId, desc.trim(), Date.now());
    setConsoleId("");
    setDesc("");
    toast.success("Mantenimiento registrado y horas reseteadas.");
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        
        <div className="space-y-4 border border-border bg-card p-4 rounded-md shadow-sm">
          <h3 className="font-display text-lg text-primary flex items-center gap-2">
            <Wrench className="h-5 w-5" /> Registrar Mantenimiento
          </h3>
          <p className="text-xs text-muted-foreground">Registrar un mantenimiento dejará en 0 el contador de suciedad de la consola seleccionada.</p>
          
          <div>
            <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Consola Atendida</Label>
            <select className="w-full h-10 rounded-md border bg-background px-3 text-sm mt-1 focus:ring-1 focus:ring-primary" value={consoleId} onChange={(e) => setConsoleId(e.target.value)}>
              <option value="">Seleccione una consola...</option>
              {consoles.map(c => <option key={c.id} value={c.id}>{c.name} (Suciedad Acumulada: {Math.round((c.maintenanceMinutes || 0)/60)}h)</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Descripción del Servicio</Label>
            <Input placeholder="Ej: Cambio de pasta térmica, limpieza general..." value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-1" />
          </div>
          <Button onClick={handleRegister} disabled={!consoleId || !desc.trim()} className="w-full bg-gradient-to-r from-primary to-accent text-white">
            Guardar y Resetear Cronómetro
          </Button>
        </div>

        <div className="space-y-3">
           <h3 className="font-display text-lg text-accent">Niveles de Suciedad (Uso desde el último mtto)</h3>
           <div className="grid grid-cols-2 gap-2">
             {consoles.map(c => {
               const hours = Math.round((c.maintenanceMinutes || 0) / 60);
               const isWarning = hours > 300; // Alerta roja si pasa de 300 horas sin abrirse
               return (
                 <div key={c.id} className={`p-3 rounded-md border transition-all ${isWarning ? 'bg-destructive/10 border-destructive/50 shadow-[0_0_15px_rgba(255,0,0,0.2)]' : 'bg-secondary/20 border-border/40'}`}>
                   <p className="font-semibold text-sm">{c.name}</p>
                   <p className={`text-3xl font-display ${isWarning ? 'text-destructive animate-pulse' : 'text-foreground'}`}>{hours}h</p>
                   {isWarning && <p className="text-[10px] text-destructive mt-1 font-bold">¡Requiere Mantenimiento!</p>}
                 </div>
               )
             })}
           </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden mt-8">
        <h3 className="font-display text-lg px-4 py-3 border-b border-border">Historial de Servicios</h3>
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-display tracking-wider border-b border-border">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Consola</th>
              <th className="p-3">Trabajo Realizado</th>
              <th className="p-3 text-center">Horas en el momento</th>
              <th className="p-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {logs.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-8 text-muted-foreground">No hay registros de mantenimiento guardados.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-muted/20">
                  <td className="p-3">{new Date(log.date).toLocaleDateString("es-VE")}</td>
                  <td className="p-3 font-semibold text-primary">{log.consoleName}</td>
                  <td className="p-3 text-muted-foreground">{log.description}</td>
                  <td className="p-3 text-center font-display text-accent">{Math.round(log.minutesAtService / 60)}h</td>
                  <td className="p-3 text-center">
                    {/* 👈 BOTÓN MÁGICO DE REVERSO */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors" 
                      title="Eliminar registro y deshacer el reseteo"
                      onClick={() => {
                        if(confirm("⚠️ ¿Eliminar este registro por error? Esto le DEVOLVERÁ a la consola las horas de uso que tenía antes de guardar este mantenimiento.")) {
                          deleteMaintenanceLog(log.id);
                          toast.success("Mantenimiento eliminado. Cronómetro restaurado.");
                        }
                      }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}