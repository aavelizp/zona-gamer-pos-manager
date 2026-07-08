import * as XLSX from "xlsx";
import { type SaleRecord, type Product, type Credit } from "./store";

export const exportData = (data: { sales: SaleRecord[], products: Product[], credits: Credit[], rate: number }) => {
  
  // 👇 RELOJ COMERCIAL PARA EL EXCEL 👇
  // Si descargamos antes de las 6:00 AM, el sistema retrocede 1 día
  const d = new Date();
  if (d.getHours() < 6) {
    d.setDate(d.getDate() - 1);
  }
  
  // Calcular el inicio del turno basándonos en la fecha comercial
  const shiftStart = new Date(d);
  shiftStart.setHours(6, 0, 0, 0);

  // Filtrar solo las ventas de este turno
  const tSales = data.sales.filter(s => s.ts >= shiftStart.getTime());

  // Construir las columnas del Excel
  const salesWs = XLSX.utils.json_to_sheet(tSales.map(s => ({
    "Fecha y Hora": new Date(s.ts).toLocaleString("es-VE"),
    "Concepto": s.concept,
    "Cliente": s.customer || "---",
    "Detalle de Compra": s.items.map(i => `${i.qty}x ${i.name}`).join(" + "),
    "Total ($)": s.total,
    "Efectivo ($)": s.cashUsd,
    "Pago Móvil (Bs)": s.mobileBs,
    "Efectivo (Bs)": s.cashBs || 0,
    "Tasa (Bs/$)": s.rate,
    "Método de Pago": s.method === "mixed" ? "Mixto" : s.method === "credit" ? "Fiado" : s.method === "mobile" ? "Pago Móvil" : s.method === "cash_bs" ? "Efectivo Bs" : "Efectivo $"
  })));

  // Ajustar anchos de las columnas para que se vea profesional
  salesWs['!cols'] = [
    { wch: 20 }, // Fecha
    { wch: 20 }, // Concepto
    { wch: 25 }, // Cliente
    { wch: 45 }, // Detalle
    { wch: 10 }, // Total $
    { wch: 12 }, // Efectivo $
    { wch: 15 }, // Pago Movil Bs
    { wch: 15 }, // Efectivo Bs
    { wch: 12 }, // Tasa
    { wch: 15 }, // Método
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, salesWs, "Cierre Diario");

  // 👇 NOMBRE DEL ARCHIVO CON LA FECHA CORRECTA 👇
  const dateStr = d.toLocaleDateString('es-VE').replace(/\//g, '-');
  const fileName = `Cierre_Caja_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
};