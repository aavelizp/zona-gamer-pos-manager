import * as XLSX from "xlsx";
import type { SaleRecord, Product, Credit } from "./store";

export function exportData(opts: { sales: SaleRecord[]; products: Product[]; credits: Credit[]; rate: number }) {
  const wb = XLSX.utils.book_new();

  const salesRows = opts.sales.map((s) => ({
    Fecha: new Date(s.ts).toLocaleString("es-VE"),
    Concepto: s.concept,
    Consola: s.consoleName ?? "",
    Cliente: s.customer ?? "",
    Minutos: s.minutes ?? "",
    Tiempo_USD: s.timeAmount.toFixed(2),
    Extras_USD: s.extrasAmount.toFixed(2),
    Total_USD: s.total.toFixed(2),
    Total_Bs: (s.total * s.rate).toFixed(2),
    Efectivo_USD: s.cashUsd.toFixed(2),
    PagoMovil_Bs: s.mobileBs.toFixed(2),
    Metodo: s.method,
    Tasa: s.rate,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesRows), "Ventas");

  const invRows = opts.products.map((p) => ({
    Producto: p.name,
    Precio_USD: p.price.toFixed(2),
    Precio_Bs: (p.price * opts.rate).toFixed(2),
    Stock: p.stock,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invRows), "Inventario");

  const credRows = opts.credits.map((c) => ({
    Cliente: c.customer,
    Deuda_USD: c.amount.toFixed(2),
    Deuda_Bs: (c.amount * opts.rate).toFixed(2),
    Fecha: new Date(c.createdAt).toLocaleString("es-VE"),
    Nota: c.note ?? "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(credRows), "Fiados");

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `gamerzone-${stamp}.xlsx`);
}
