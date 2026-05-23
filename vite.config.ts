// Configuración modificada para forzar compatibilidad con Vercel
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { 
      preset: "vercel", // ¡AQUÍ ESTÁ LA MAGIA! Obligamos al sistema a usar el motor de Vercel
      entry: "server" 
    },
  },
});
