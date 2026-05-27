import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileImage, FileText, MessageCircle } from "lucide-react";
import { fmtUsd, fmtBs } from "@/lib/store";

export interface ReceiptData {
  ts: number;
  rate: number;
  consoleName?: string;
  minutes: number;
  timeAmount: number;
  items: { name: string; qty: number; price: number }[];
  total: number;
  method: "full" | "mixed" | "credit";
  cashUsd: number;
  mobileBs: number;
  customer: { name: string; idDoc?: string; phone?: string };
}

// 1. Aquí actualizamos el nombre de usuario
const INSTAGRAM = "@twinszonagamer";
// 2. Aquí agregamos el enlace directo exacto
const INSTAGRAM_LINK = "https://www.instagram.com/twinszonagamer?igsh=MWd2cnU5eW4yYnh4Zw==";
const LOCAL = "TWINS GAMER";

export function ReceiptDialog({ open, onClose, data }: { open: boolean; onClose: () => void; data: ReceiptData | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [qr, setQr] = useState<string>("");

  useEffect(() => {
    // 3. Generamos el QR usando el nuevo enlace
    QRCode.toDataURL(INSTAGRAM_LINK, { margin: 1, width: 160, color: { dark: "#1a0b2e", light: "#ffffff" } })
      .then(setQr).catch(() => setQr(""));
  }, []);

  if (!data) return null;

  const date = new Date(data.ts);
  const fileBase = `recibo-twinsgamer-${date.getTime()}`;

  const downloadPng = async () => {
    if (!ref.current) return;
    const url = await toPng(ref.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
    const a = document.createElement("a"); a.href = url; a.download = `${fileBase}.png`; a.click();
  };

  const downloadPdf = async () => {
    if (!ref.current) return;
    const url = await toPng(ref.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ unit: "px", format: [400, 640] });
    const props = pdf.getImageProperties(url);
    const w = 400; const h = (props.height * w) / props.width;
    pdf.addImage(url, "PNG", 0, 0, w, h);
    pdf.save(`${fileBase}.pdf`);
  };

  const sendWhatsApp = () => {
    const phone = (data.customer.phone || "").replace(/\D/g, "");
    const msg = encodeURIComponent(`¡Hola ${data.customer.name}! 🎮 Aquí tu recibo de ${LOCAL}.\nTotal: ${fmtUsd(data.total)} (${fmtBs(data.total, data.rate)})\n¡Gracias por jugar con nosotros!\nIG: ${INSTAGRAM}`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const methodLabel = data.method === "full" ? "Pago Completo" : data.method === "mixed" ? "Pago Mixto" : "Fiado";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-4">
        <DialogHeader><DialogTitle className="font-display">Recibo Digital</DialogTitle></DialogHeader>
        <div ref={ref} className="bg-white text-zinc-900 p-6 rounded-lg" style={{ fontFamily: "'Hind', system-ui, sans-serif" }}>
          <div className="text-center border-b-2 border-purple-700 pb-3">
            <h1 className="text-2xl font-black tracking-wider text-purple-800" style={{ fontFamily: "'Archivo Black', sans-serif" }}>{LOCAL}</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Zona Gamer · Venezuela</p>
            <p className="text-xs text-zinc-600 mt-1">{date.toLocaleString("es-VE")}</p>
          </div>

          <div className="mt-3 text-sm">
            <p className="font-bold text-purple-800 text-xs uppercase tracking-wider">Cliente</p>
            <p className="font-semibold">{data.customer.name}</p>
            {data.customer.idDoc && <p className="text-xs text-zinc-600">CI/RIF: {data.customer.idDoc}</p>}
            {data.customer.phone && <p className="text-xs text-zinc-600">Tel: {data.customer.phone}</p>}
          </div>

          <div className="mt-3">
            <p className="font-bold text-purple-800 text-xs uppercase tracking-wider mb-1">Detalle</p>
            <table className="w-full text-sm">
              <tbody>
                {data.items.map((it, i) => (
                  <tr key={i} className="border-b border-zinc-200">
                    <td className="py-1">{it.name}</td>
                    <td className="py-1 text-right">${it.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 bg-purple-50 rounded p-3">
            <div className="flex justify-between text-lg font-black text-purple-800">
              <span>TOTAL</span><span>{fmtUsd(data.total)}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-700">
              <span>Equivalente</span><span>{fmtBs(data.total, data.rate)}</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">Tasa del día: Bs {data.rate.toFixed(2)}/$</p>
          </div>

          <div className="mt-3 text-sm">
            <p className="font-bold text-purple-800 text-xs uppercase tracking-wider">Método de Pago</p>
            <p>{methodLabel}</p>
            {data.method === "mixed" && (
              <div className="text-xs text-zinc-600">
                <p>Efectivo: ${data.cashUsd.toFixed(2)}</p>
                <p>Pago Móvil: Bs {data.mobileBs.toFixed(2)}</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t-2 border-purple-700 text-center">
            <p className="font-bold text-purple-800">¡Gracias por jugar con nosotros! 🎮</p>
            <div className="flex items-center justify-center gap-3 mt-2">
              {qr && <img src={qr} alt="QR Instagram" className="w-20 h-20" />}
              <div className="text-left text-xs">
                <p className="text-zinc-500">Síguenos en</p>
                <p className="font-bold text-purple-800">{INSTAGRAM}</p>
                <p className="text-zinc-500 mt-1">Escanea para seguirnos</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <Button variant="outline" size="sm" onClick={downloadPng}><FileImage className="h-4 w-4 mr-1" />PNG</Button>
          <Button variant="outline" size="sm" onClick={downloadPdf}><FileText className="h-4 w-4 mr-1" />PDF</Button>
          <Button size="sm" onClick={sendWhatsApp} disabled={!data.customer.phone} className="bg-green-600 hover:bg-green-700">
            <MessageCircle className="h-4 w-4 mr-1" />WhatsApp
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}