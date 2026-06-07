¡Ese es un error súper común! Y como en toda auditoría, si hacemos un movimiento por error, el sistema debe permitirnos hacer el "reverso contable" exacto.

Cuando registras un mantenimiento, el sistema hace dos cosas: crea el registro de texto y pone el cronómetro de suciedad de la consola en 0.

Acabo de programar una función especial que hace exactamente el reverso: elimina el registro falso y le devuelve a la consola las horas de uso que tenía antes de que lo resetearas, dejándolo exactamente como estaba.

Solo vamos a actualizar 2 archivos:

🗄️ 1. Archivo: src/lib/store.ts
(Agregamos la función deleteMaintenanceLog al final de nuestra base de datos)

Abre store.ts, borra todo y pega este código completo:

TypeScript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "./supabase";

export type ProductId = string;
export interface Product {
  id: ProductId;
  name: string;
  price: number;
  stock: number;
}

export interface ComboItem { productId: ProductId; qty: number; }
export interface Combo {
  id: string;
  name: string;
  price: number;
  hours: number;
  items: ComboItem[];
}

export type ConsoleType = "PS4" | "PS5";
export type SessionMode = "free" | "fixed";

export interface ConsoleSession {
  mode: SessionMode;
  startedAt: number; 
  endsAt?: number;   
  alerted?: boolean;
  preAlerted?: boolean;
  prepaid?: boolean;
  prepaidMinutes?: number;
  customerName?: string;
  pausedAt?: number;
}

export interface ExtraCharge {
  label: string;
  amount: number;
  ts: number;
  productId?: ProductId;
  qty?: number;
}

export interface ConsoleState {
  id: string;
  name: string;
  type: ConsoleType;
  ratePerHour: number;
  totalMinutes: number;
  maintenanceMinutes?: number;
  session?: ConsoleSession;
  charges: ExtraCharge[];
}

export interface MaintenanceLog {
  id: string;
  consoleId: string;
  consoleName: string;
  description: string;
  date: number;
  minutesAtService: number;
}

export type PaymentMethod = "full" | "mixed" | "credit" | "cash_bs";

export interface SaleRecord {
  id: string;
  ts: number;
  consoleId?: string;
  consoleName?: string;
  minutes?: number;
  timeAmount: number;
  extrasAmount: number;
  total: number;
  cashUsd: number;
  mobileBs: number;
  cashBs?: number;
  mobileBank?: string;
  mobileRef?: string;
  rate: number;
  method: PaymentMethod;
  customer?: string;
  concept: string;
  items: { name: string; qty: number; price: number }[];
}

export interface Credit {
  id: string;
  customer: string;
  amount: number;
  createdAt: number;
  note?: string;
}

export interface CustomerInfo {
  name: string;
  idDoc?: string;
  phone?: string;
}

export interface Member {
  id: string;
  name: string;
  idDoc?: string;
  phone?: string;
  totalMinutes: number;
  rewardMinutes: number;
  pendingRewards: number;
  createdAt: number;
  lastVisit: number;
}

export interface QueueEntry {
  id: string;
  name: string;
  preference: "PS4" | "PS5" | "Cualquiera";
  ts: number;
}

export interface SessionHistoryEntry {
  id: string;
  ts: number;
  consoleId: string;
  consoleName: string;
  customer?: string;
  minutes: number;
  amount: number;
  prepaid: boolean;
}

export type ExpenseCategory =
  | "Servicios"
  | "Compras"
  | "Mantenimiento"
  | "Sueldos"
  | "Limpieza"
  | "Impuestos"
  | "Otros";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Servicios", "Compras", "Mantenimiento", "Sueldos", "Limpieza", "Impuestos", "Otros",
];

export interface Expense {
  id: string;
  ts: number;
  createdAt?: number;
  description: string;
  amount: number;
  method: "cash" | "mobile";
  amountBs?: number;
  rate: number;
  category?: ExpenseCategory;
}

interface State {
  rate: number;
  soundOn: boolean;
  products: Product[];
  combos: Combo[];
  consoles: ConsoleState[];
  sales: SaleRecord[];
  credits: Credit[];
  queue: QueueEntry[];
  members: Member[];
  maintenanceLogs: MaintenanceLog[];
  sessionHistory: SessionHistoryEntry[];
  expenses: Expense[];

  setRate: (n: number) => void;
  toggleSound: () => void;

  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  removeProduct: (id: string) => void;

  addCombo: (c: Omit<Combo, "id">) => void;
  removeCombo: (id: string) => void;

  startSession: (consoleId: string, minutes?: number, customerName?: string) => void;
  extendSession: (consoleId: string, addMinutes: number) => void;
  markAlerted: (consoleId: string) => void;
  markPreAlerted: (consoleId: string) => void;
  pauseSession: (consoleId: string) => void;
  resumeSession: (consoleId: string) => void;
  cancelSession: (consoleId: string) => void;

  addSnackToConsole: (consoleId: string, productId: string, qty: number) => void;
  applyComboToConsole: (consoleId: string, comboId: string) => void;
  addExtraController: (consoleId: string) => void;
  transferSession: (originId: string, destId: string) => void;

  finalizeConsole: (
    consoleId: string,
    payload: { method: PaymentMethod; cashUsd: number; mobileBs: number; mobileBank?: string; mobileRef?: string; cashBs?: number; customer?: string; total: number; timeAmount: number; extrasAmount: number; minutes: number; customerInfo?: CustomerInfo }
  ) => void;

  finalizeMultipleConsoles: (
    consoleIds: string[],
    payload: { method: PaymentMethod; cashUsd: number; mobileBs: number; mobileBank?: string; mobileRef?: string; cashBs?: number; customer?: string; total: number; timeAmount: number; extrasAmount: number; totalMinutes: number; customerInfo?: CustomerInfo; items: { name: string; qty: number; price: number }[] }
  ) => void;

  directSale: (payload: { method: PaymentMethod; cashUsd: number; mobileBs: number; mobileBank?: string; mobileRef?: string; cashBs?: number; total: number; customer?: string; items: { productId: string; qty: number; price: number; name: string }[] }) => void;

  payCredit: (creditId: string, payload: { method: PaymentMethod; cashUsd: number; mobileBs: number; mobileBank?: string; mobileRef?: string; amount: number }) => void;

  enqueue: (e: Omit<QueueEntry, "id" | "ts">) => void;
  dequeue: (id: string) => void;

  redeemReward: (memberId: string) => void;
  removeMember: (memberId: string) => void;
  
  addMember: (data: { name: string; idDoc?: string; phone?: string }) => void;
  updateMember: (memberId: string, data: Partial<Member>) => void;

  closeDay: () => void;

  registerMaintenance: (consoleId: string, description: string, date: number) => void;
  
  // 👈 NUEVA FUNCIÓN PARA REVERSAR MANTENIMIENTO
  deleteMaintenanceLog: (logId: string) => void;

  prepaySession: (consoleId: string, minutes: number, payload: { method: PaymentMethod; cashUsd: number; mobileBs: number; mobileBank?: string; mobileRef?: string; cashBs?: number; total: number; customerInfo?: CustomerInfo; comboId?: string }) => void;
  releaseConsole: (consoleId: string) => boolean;
  payExtras: (consoleId: string, payload: { method: PaymentMethod; cashUsd: number; mobileBs: number; mobileBank?: string; mobileRef?: string; total: number; customer?: string }) => void;
  extendPaidSession: (consoleId: string, addMinutes: number, payload: { method: PaymentMethod; cashUsd: number; mobileBs: number; mobileBank?: string; mobileRef?: string; total: number; customer?: string }) => void;

  addExpense: (e: { description: string; amount: number; method: "cash" | "mobile"; amountBs?: number; category?: ExpenseCategory; ts?: number }) => void;
  setConsoleRate: (type: ConsoleType, ratePerHour: number) => void;

  deleteSale: (saleId: string) => void;
  resetConsoleStats: (consoleId: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultConsoles: ConsoleState[] = [
  { id: "ps4-1", name: "PS4 #3", type: "PS4", ratePerHour: 2, totalMinutes: 0, charges: [] },
  { id: "ps4-2", name: "PS4 #4", type: "PS4", ratePerHour: 2, totalMinutes: 0, charges: [] },
  { id: "ps4-3", name: "PS4 #5", type: "PS4", ratePerHour: 2, totalMinutes: 0, charges: [] },
  { id: "ps4-4", name: "PS4 #6", type: "PS4", ratePerHour: 2, totalMinutes: 0, charges: [] },
  { id: "ps5-1", name: "PS5 #1", type: "PS5", ratePerHour: 3, totalMinutes: 0, charges: [] },
  { id: "ps5-2", name: "PS5 #2", type: "PS5", ratePerHour: 3, totalMinutes: 0, charges: [] },
];

const vaccinateZustandPayload = (payload: any) => {
  if (payload && payload.state && payload.state.consoles) {
    payload.state.consoles = payload.state.consoles.map((c: any) => {
      if (c.id === "ps4-1") c.name = "PS4 #3";
      if (c.id === "ps4-2") c.name = "PS4 #4";
      if (c.id === "ps4-3") c.name = "PS4 #5";
      if (c.id === "ps4-4") c.name = "PS4 #6";
      return c;
    });
  }
  return payload;
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      rate: 40,
      soundOn: true,
      products: [
        { id: uid(), name: "Pepsi 355ml", price: 1, stock: 24 },
        { id: uid(), name: "Doritos", price: 1.5, stock: 12 },
        { id: uid(), name: "Agua 500ml", price: 0.75, stock: 30 },
      ],
      combos: [],
      consoles: defaultConsoles,
      sales: [],
      credits: [],
      queue: [],
      members: [],
      maintenanceLogs: [],
      sessionHistory: [],
      expenses: [],

      setRate: (n) => set({ rate: Math.max(0, n) }),
      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),

      addProduct: (p) => set((s) => ({ products: [...s.products, { ...p, id: uid() }] })),
      updateProduct: (id, p) => set((s) => ({ products: s.products.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      removeProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      addCombo: (c) => set((s) => ({ combos: [...s.combos, { ...c, id: uid() }] })),
      removeCombo: (id) => set((s) => ({ combos: s.combos.filter((c) => c.id !== id) })),

      startSession: (consoleId, minutes, customerName) =>
        set((s) => ({
          consoles: s.consoles.map((c) =>
            c.id === consoleId ? { ...c, session: { mode: minutes ? "fixed" : "free", startedAt: Date.now(), endsAt: minutes ? Date.now() + minutes * 60_000 : undefined, customerName } } : c
          ),
        })),

      extendSession: (consoleId, addMinutes) =>
        set((s) => ({
          consoles: s.consoles.map((c) => {
            if (c.id !== consoleId || !c.session) return c;
            const base = c.session.endsAt && c.session.endsAt > Date.now() ? c.session.endsAt : Date.now();
            return { ...c, session: { ...c.session, mode: "fixed", endsAt: base + addMinutes * 60_000, alerted: false } };
          }),
        })),

      markAlerted: (consoleId) => set((s) => ({ consoles: s.consoles.map((c) => c.id === consoleId && c.session ? { ...c, session: { ...c.session, alerted: true } } : c ) })),
      markPreAlerted: (consoleId) => set((s) => ({ consoles: s.consoles.map((c) => c.id === consoleId && c.session ? { ...c, session: { ...c.session, preAlerted: true } } : c ) })),
      pauseSession: (consoleId) => set((s) => ({ consoles: s.consoles.map((c) => { if (c.id !== consoleId || !c.session || c.session.pausedAt) return c; return { ...c, session: { ...c.session, pausedAt: Date.now() } }; }) })),
      resumeSession: (consoleId) => set((s) => ({ consoles: s.consoles.map((c) => { if (c.id !== consoleId || !c.session || !c.session.pausedAt) return c; const delta = Date.now() - c.session.pausedAt; return { ...c, session: { ...c.session, startedAt: c.session.startedAt + delta, endsAt: c.session.endsAt ? c.session.endsAt + delta : undefined, pausedAt: undefined, alerted: false, preAlerted: false } }; }) })),
      cancelSession: (consoleId) => set((s) => ({ consoles: s.consoles.map((c) => c.id === consoleId ? { ...c, session: undefined, charges: [] } : c ) })),

      addSnackToConsole: (consoleId, productId, qty) =>
        set((s) => {
          const product = s.products.find((p) => p.id === productId);
          if (!product || product.stock < qty) return s;
          return {
            products: s.products.map((p) => (p.id === productId ? { ...p, stock: p.stock - qty } : p)),
            consoles: s.consoles.map((c) => c.id === consoleId ? { ...c, charges: [ ...c.charges, { label: `${product.name} x${qty}`, amount: product.price * qty, ts: Date.now(), productId, qty } ] } : c ),
          };
        }),

      applyComboToConsole: (consoleId, comboId) =>
        set((s) => {
          const combo = s.combos.find((c) => c.id === comboId);
          if (!combo) return s;
          for (const it of combo.items) { const p = s.products.find((pp) => pp.id === it.productId); if (!p || p.stock < it.qty) return s; }
          const consoleObj = s.consoles.find((c) => c.id === consoleId);
          if (!consoleObj) return s;
          const newProducts = s.products.map((p) => { const it = combo.items.find((i) => i.productId === p.id); return it ? { ...p, stock: p.stock - it.qty } : p; });
          const addMs = combo.hours * 60 * 60_000;
          const newSession: ConsoleSession = consoleObj.session ? { ...consoleObj.session, mode: "fixed", endsAt: (consoleObj.session.endsAt && consoleObj.session.endsAt > Date.now() ? consoleObj.session.endsAt : Date.now()) + addMs, alerted: false } : { mode: "fixed", startedAt: Date.now(), endsAt: Date.now() + addMs };
          return { products: newProducts, consoles: s.consoles.map((c) => c.id === consoleId ? { ...c, session: combo.hours > 0 ? newSession : c.session, charges: [ ...c.charges, { label: `Combo: ${combo.name}`, amount: combo.price, ts: Date.now() } ] } : c ) };
        }),

      addExtraController: (consoleId) =>
        set((s) => ({
          consoles: s.consoles.map((c) =>
            c.id === consoleId
              ? { ...c, charges: [ ...c.charges, { label: "Control Adicional", amount: 1, ts: Date.now() } ] }
              : c
          ),
        })),

      transferSession: (originId, destId) => set((s) => {
        const origin = s.consoles.find(c => c.id === originId);
        const dest = s.consoles.find(c => c.id === destId);
        if (!origin || !origin.session || !dest || dest.session) return s;

        const nowMs = Date.now();
        const ref = origin.session.pausedAt ?? nowMs;
        const elapsedMs = Math.max(0, ref - origin.session.startedAt);
        const minutes = Math.ceil(elapsedMs / 60_000);
        const amount = (minutes / 60) * origin.ratePerHour;

        const newCharges = [...dest.charges, ...origin.charges];
        if (!origin.session.prepaid && amount > 0.01) {
          newCharges.push({ label: `Tiempo ${origin.name} (${minutes} min)`, amount: +(amount.toFixed(2)), ts: nowMs });
        }

        let newEndsAt = undefined;
        let newStartedAt = nowMs;
        let newPausedAt = origin.session.pausedAt ? nowMs : undefined;

        if (origin.session.mode === "fixed" && origin.session.endsAt) {
          const remainingMs = Math.max(0, origin.session.endsAt - ref);
          newEndsAt = nowMs + remainingMs;
        }

        const newSession: ConsoleSession = { ...origin.session, startedAt: newStartedAt, endsAt: newEndsAt, pausedAt: newPausedAt };

        return {
          consoles: s.consoles.map(c => {
            if (c.id === originId) return { ...c, session: undefined, charges: [], totalMinutes: c.totalMinutes + minutes, maintenanceMinutes: (c.maintenanceMinutes || 0) + minutes };
            if (c.id === destId) return { ...c, session: newSession, charges: newCharges };
            return c;
          })
        };
      }),

      finalizeConsole: (consoleId, payload) =>
        set((s) => {
          const c = s.consoles.find((x) => x.id === consoleId);
          if (!c) return s;
          const sale: SaleRecord = { id: uid(), ts: Date.now(), consoleId: c.id, consoleName: c.name, minutes: payload.minutes, timeAmount: payload.timeAmount, extrasAmount: payload.extrasAmount, total: payload.total, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, mobileBank: payload.mobileBank, mobileRef: payload.mobileRef, cashBs: payload.cashBs || 0, rate: s.rate, method: payload.method, customer: payload.customerInfo?.name || payload.customer, concept: "Consola", items: [ ...(payload.timeAmount > 0 ? [{ name: `Tiempo ${c.name} (${payload.minutes} min)`, qty: 1, price: payload.timeAmount }] : []), ...c.charges.map((ch) => ({ name: ch.label, qty: 1, price: ch.amount })) ] };
          const newCredits = payload.method === "credit" ? [ ...s.credits, { id: uid(), customer: payload.customerInfo?.name || payload.customer || "Sin nombre", amount: payload.total, createdAt: Date.now(), note: c.name } ] : s.credits;

          let newMembers = s.members;
          const ci = payload.customerInfo;
          if (ci && ci.name?.trim() && ci.phone?.trim()) {
            const key = ci.phone.trim();
            const existing = s.members.find((m) => m.phone === key);
            if (existing) {
              const newReward = existing.rewardMinutes + payload.minutes;
              const earned = Math.floor(newReward / 600);
              newMembers = s.members.map((m) => m.id === existing.id ? { ...m, name: ci.name.trim(), idDoc: ci.idDoc?.trim() || m.idDoc, totalMinutes: m.totalMinutes + payload.minutes, rewardMinutes: newReward - earned * 600, pendingRewards: m.pendingRewards + earned, lastVisit: Date.now() } : m );
            } else {
              const earned = Math.floor(payload.minutes / 600);
              newMembers = [ ...s.members, { id: uid(), name: ci.name.trim(), idDoc: ci.idDoc?.trim(), phone: key, totalMinutes: payload.minutes, rewardMinutes: payload.minutes - earned * 600, pendingRewards: earned, createdAt: Date.now(), lastVisit: Date.now() } ];
            }
          }
          const histEntry: SessionHistoryEntry = { id: uid(), ts: Date.now(), consoleId: c.id, consoleName: c.name, customer: payload.customerInfo?.name || payload.customer, minutes: payload.minutes, amount: payload.total, prepaid: false };

          return { consoles: s.consoles.map((x) => x.id === consoleId ? { ...x, session: undefined, charges: [], totalMinutes: x.totalMinutes + payload.minutes, maintenanceMinutes: (x.maintenanceMinutes || 0) + payload.minutes } : x ), sales: payload.method === "credit" ? s.sales : [...s.sales, sale], credits: newCredits, members: newMembers, sessionHistory: [histEntry, ...s.sessionHistory] };
        }),

      finalizeMultipleConsoles: (consoleIds, payload) =>
        set((s) => {
          const involved = s.consoles.filter((c) => consoleIds.includes(c.id));
          if (involved.length === 0) return s;

          const sale: SaleRecord = {
            id: uid(),
            ts: Date.now(),
            consoleName: involved.map(c => c.name).join(" + "),
            minutes: payload.totalMinutes,
            timeAmount: payload.timeAmount,
            extrasAmount: payload.extrasAmount,
            total: payload.total,
            cashUsd: payload.cashUsd,
            mobileBs: payload.mobileBs,
            mobileBank: payload.mobileBank,
            mobileRef: payload.mobileRef,
            cashBs: payload.cashBs || 0,
            rate: s.rate,
            method: payload.method,
            customer: payload.customerInfo?.name || payload.customer,
            concept: "Cobro Múltiple",
            items: payload.items,
          };

          const newCredits = payload.method === "credit" ? [ ...s.credits, { id: uid(), customer: payload.customerInfo?.name || payload.customer || "Sin nombre", amount: payload.total, createdAt: Date.now(), note: sale.consoleName } ] : s.credits;

          let newMembers = s.members;
          const ci = payload.customerInfo;
          if (ci && ci.name?.trim() && ci.phone?.trim()) {
            const key = ci.phone.trim();
            const existing = s.members.find((m) => m.phone === key);
            if (existing) {
              const newReward = existing.rewardMinutes + payload.totalMinutes;
              const earned = Math.floor(newReward / 600);
              newMembers = s.members.map((m) => m.id === existing.id ? { ...m, name: ci.name.trim(), idDoc: ci.idDoc?.trim() || m.idDoc, totalMinutes: m.totalMinutes + payload.totalMinutes, rewardMinutes: newReward - earned * 600, pendingRewards: m.pendingRewards + earned, lastVisit: Date.now() } : m );
            } else {
              const earned = Math.floor(payload.totalMinutes / 600);
              newMembers = [ ...s.members, { id: uid(), name: ci.name.trim(), idDoc: ci.idDoc?.trim(), phone: key, totalMinutes: payload.totalMinutes, rewardMinutes: payload.totalMinutes - earned * 600, pendingRewards: earned, createdAt: Date.now(), lastVisit: Date.now() } ];
            }
          }

          const newHistEntries: SessionHistoryEntry[] = involved.map((c) => {
            const ref = c.session?.pausedAt ?? Date.now();
            const elapsedMs = Math.max(0, ref - (c.session?.startedAt ?? ref));
            const mins = Math.ceil(elapsedMs / 60_000);
            return { id: uid(), ts: Date.now(), consoleId: c.id, consoleName: c.name, customer: payload.customerInfo?.name || payload.customer, minutes: mins, amount: 0, prepaid: !!c.session?.prepaid };
          });

          return {
            consoles: s.consoles.map((c) => {
              if (consoleIds.includes(c.id)) {
                const ref = c.session?.pausedAt ?? Date.now();
                const elapsedMs = Math.max(0, ref - (c.session?.startedAt ?? ref));
                const mins = Math.ceil(elapsedMs / 60_000);
                return { ...c, session: undefined, charges: [], totalMinutes: c.totalMinutes + mins, maintenanceMinutes: (c.maintenanceMinutes || 0) + mins };
              }
              return c;
            }),
            sales: payload.method === "credit" ? s.sales : [...s.sales, sale],
            credits: newCredits,
            members: newMembers,
            sessionHistory: [...newHistEntries, ...s.sessionHistory]
          };
        }),

      directSale: (payload) =>
        set((s) => {
          let newProducts = s.products;
          for (const it of payload.items) { newProducts = newProducts.map((p) => p.id === it.productId ? { ...p, stock: p.stock - it.qty } : p ); }
          const sale: SaleRecord = { id: uid(), ts: Date.now(), timeAmount: 0, extrasAmount: payload.total, total: payload.total, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, mobileBank: payload.mobileBank, mobileRef: payload.mobileRef, cashBs: payload.cashBs || 0, rate: s.rate, method: payload.method, customer: payload.customer, concept: "Venta Directa", items: payload.items.map((it) => ({ name: it.name, qty: it.qty, price: it.price })) };
          const newCredits = payload.method === "credit" ? [ ...s.credits, { id: uid(), customer: payload.customer || "Sin nombre", amount: payload.total, createdAt: Date.now(), note: "Venta Directa" } ] : s.credits;
          return { products: newProducts, sales: [...s.sales, sale], credits: newCredits };
        }),

      payCredit: (creditId, payload) =>
        set((s) => {
          const credit = s.credits.find((c) => c.id === creditId);
          if (!credit) return s;
          const sale: SaleRecord = { id: uid(), ts: Date.now(), timeAmount: 0, extrasAmount: payload.amount, total: payload.amount, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, mobileBank: payload.mobileBank, mobileRef: payload.mobileRef, rate: s.rate, method: payload.method, customer: credit.customer, concept: "Deuda Cobrada", items: [{ name: `Deuda de ${credit.customer}`, qty: 1, price: payload.amount }] };
          const remaining = credit.amount - payload.amount;
          return { sales: [...s.sales, sale], credits: remaining > 0.001 ? s.credits.map((c) => (c.id === creditId ? { ...c, amount: remaining } : c)) : s.credits.filter((c) => c.id !== creditId) };
        }),

      enqueue: (e) => set((s) => ({ queue: [...s.queue, { ...e, id: uid(), ts: Date.now() }] })),
      dequeue: (id) => set((s) => ({ queue: s.queue.filter((q) => q.id !== id) })),
      redeemReward: (memberId) => set((s) => ({ members: s.members.map((m) => m.id === memberId && m.pendingRewards > 0 ? { ...m, pendingRewards: m.pendingRewards - 1, rewardMinutes: 0 } : m ) })),
      removeMember: (memberId) => set({ members: get().members.filter((m) => m.id !== memberId) }),
      
      addMember: (data) => set((s) => { if (data.phone && s.members.some((m) => m.phone === data.phone)) return s; const newMember: Member = { id: uid(), name: data.name, idDoc: data.idDoc, phone: data.phone, totalMinutes: 0, rewardMinutes: 0, pendingRewards: 0, createdAt: Date.now(), lastVisit: Date.now() }; return { members: [...s.members, newMember] }; }),
      updateMember: (memberId, data) => set((s) => ({ members: s.members.map((m) => (m.id === memberId ? { ...m, ...data } : m)) })),

      closeDay: () => set((s) => { const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0); return { sales: s.sales.filter((sale) => sale.ts < startOfToday.getTime()), consoles: s.consoles.map((c) => ({ ...c, session: undefined, charges: [] })) }; }),

      registerMaintenance: (consoleId, description, date) => set((s) => { 
        const c = s.consoles.find((x) => x.id === consoleId); 
        if (!c) return s; 
        const log: MaintenanceLog = { id: uid(), consoleId: c.id, consoleName: c.name, description, date, minutesAtService: c.maintenanceMinutes || 0 }; 
        return { 
          consoles: s.consoles.map((x) => x.id === consoleId ? { ...x, maintenanceMinutes: 0 } : x ), 
          maintenanceLogs: [log, ...s.maintenanceLogs] 
        }; 
      }),
      
      // 👈 LA MAGIA: BORRAR MANTENIMIENTO Y DEVOLVERLE LAS HORAS A LA CONSOLA
      deleteMaintenanceLog: (logId) => set((s) => {
        const log = s.maintenanceLogs.find(l => l.id === logId);
        if (!log) return s;
        
        // Buscamos la consola y le sumamos de vuelta las horas que tenía antes del reset
        const consoles = s.consoles.map(c => {
           if (c.id === log.consoleId) {
               return { ...c, maintenanceMinutes: (c.maintenanceMinutes || 0) + log.minutesAtService };
           }
           return c;
        });
  
        return {
          maintenanceLogs: s.maintenanceLogs.filter(l => l.id !== logId),
          consoles
        };
      }),

      prepaySession: (consoleId, minutes, payload) => set((s) => {
          const c = s.consoles.find((x) => x.id === consoleId);
          if (!c) return s;
          const combo = payload.comboId ? s.combos.find((cm) => cm.id === payload.comboId) : undefined;
          let newProducts = s.products;
          const items: SaleRecord["items"] = [];
          if (combo) {
            for (const it of combo.items) { const p = s.products.find((pp) => pp.id === it.productId); if (!p || p.stock < it.qty) return s; }
            newProducts = s.products.map((p) => { const it = combo.items.find((i) => i.productId === p.id); return it ? { ...p, stock: p.stock - it.qty } : p; });
            items.push({ name: `Combo: ${combo.name} - ${c.name} (${minutes} min)`, qty: 1, price: payload.total });
            for (const it of combo.items) { const p = s.products.find((pp) => pp.id === it.productId); if (p) items.push({ name: `  · ${p.name}`, qty: it.qty, price: 0 }); }
          } else {
            items.push({ name: `Prepago ${c.name} (${minutes} min)`, qty: 1, price: payload.total });
          }
          const sale: SaleRecord = { id: uid(), ts: Date.now(), consoleId: c.id, consoleName: c.name, minutes, timeAmount: payload.total, extrasAmount: 0, total: payload.total, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, mobileBank: payload.mobileBank, mobileRef: payload.mobileRef, cashBs: payload.cashBs || 0, rate: s.rate, method: payload.method, customer: payload.customerInfo?.name, concept: "Consola", items };
          let newMembers = s.members;
          const ci = payload.customerInfo;
          if (ci && ci.name?.trim() && ci.phone?.trim()) {
            const key = ci.phone.trim();
            const existing = s.members.find((m) => m.phone === key);
            if (existing) {
              const newReward = existing.rewardMinutes + minutes;
              const earned = Math.floor(newReward / 600);
              newMembers = s.members.map((m) => m.id === existing.id ? { ...m, name: ci.name.trim(), idDoc: ci.idDoc?.trim() || m.idDoc, totalMinutes: m.totalMinutes + minutes, rewardMinutes: newReward - earned * 600, pendingRewards: m.pendingRewards + earned, lastVisit: Date.now() } : m );
            } else {
              const earned = Math.floor(minutes / 600);
              newMembers = [...s.members, { id: uid(), name: ci.name.trim(), idDoc: ci.idDoc?.trim(), phone: key, totalMinutes: minutes, rewardMinutes: minutes - earned * 600, pendingRewards: earned, createdAt: Date.now(), lastVisit: Date.now() }];
            }
          }
          return { products: newProducts, consoles: s.consoles.map((x) => x.id === consoleId ? { ...x, session: { mode: "fixed", startedAt: Date.now(), endsAt: Date.now() + minutes * 60_000, prepaid: true, prepaidMinutes: minutes, customerName: ci?.name?.trim() } } : x ), sales: [...s.sales, sale], members: newMembers };
        }),

      releaseConsole: (consoleId) => {
        const s = get();
        const c = s.consoles.find((x) => x.id === consoleId);
        if (!c || !c.session) return false;
        const pendingExtras = c.charges.reduce((a, ch) => a + ch.amount, 0);
        if (pendingExtras > 0.001) return false;
        const mins = c.session.prepaidMinutes ?? 0;
        const histEntry: SessionHistoryEntry = { id: uid(), ts: Date.now(), consoleId: c.id, consoleName: c.name, customer: c.session.customerName, minutes: mins, amount: 0, prepaid: true };
        set({ consoles: s.consoles.map((x) => x.id === consoleId ? { ...x, session: undefined, charges: [], totalMinutes: x.totalMinutes + mins, maintenanceMinutes: (x.maintenanceMinutes || 0) + mins } : x ), sessionHistory: [histEntry, ...s.sessionHistory] });
        return true;
      },

      payExtras: (consoleId, payload) => set((s) => { const c = s.consoles.find((x) => x.id === consoleId); if (!c || c.charges.length === 0) return s; const sale: SaleRecord = { id: uid(), ts: Date.now(), consoleId: c.id, consoleName: c.name, minutes: 0, timeAmount: 0, extrasAmount: payload.total, total: payload.total, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, mobileBank: payload.mobileBank, mobileRef: payload.mobileRef, rate: s.rate, method: payload.method, customer: payload.customer, concept: "Adicionales", items: c.charges.map((ch) => ({ name: ch.label, qty: 1, price: ch.amount })) }; const newCredits = payload.method === "credit" ? [...s.credits, { id: uid(), customer: payload.customer || "Sin nombre", amount: payload.total, createdAt: Date.now(), note: `Adicionales ${c.name}` }] : s.credits; return { consoles: s.consoles.map((x) => x.id === consoleId ? { ...x, charges: [] } : x), sales: payload.method === "credit" ? s.sales : [...s.sales, sale], credits: newCredits }; }),
      extendPaidSession: (consoleId, addMinutes, payload) => set((s) => { const c = s.consoles.find((x) => x.id === consoleId); if (!c || !c.session) return s; const base = c.session.endsAt && c.session.endsAt > Date.now() ? c.session.endsAt : Date.now(); const newEnds = base + addMinutes * 60_000; const sale: SaleRecord = { id: uid(), ts: Date.now(), consoleId: c.id, consoleName: c.name, minutes: addMinutes, timeAmount: payload.total, extrasAmount: 0, total: payload.total, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, mobileBank: payload.mobileBank, mobileRef: payload.mobileRef, rate: s.rate, method: payload.method, customer: payload.customer || c.session.customerName, concept: "Consola", items: [{ name: `Extensión ${c.name} (+${addMinutes} min)`, qty: 1, price: payload.total }] }; const newCredits = payload.method === "credit" ? [...s.credits, { id: uid(), customer: payload.customer || c.session.customerName || "Sin nombre", amount: payload.total, createdAt: Date.now(), note: `Extensión ${c.name}` }] : s.credits; return { consoles: s.consoles.map((x) => x.id === consoleId ? { ...x, session: { ...x.session!, mode: "fixed", endsAt: newEnds, prepaidMinutes: (x.session!.prepaidMinutes ?? 0) + addMinutes, alerted: false, preAlerted: false } } : x ), sales: payload.method === "credit" ? s.sales : [...s.sales, sale], credits: newCredits }; }),
      addExpense: ({ ts, ...rest }) => set((s) => ({ expenses: [ { id: uid(), ts: ts ?? Date.now(), createdAt: Date.now(), rate: s.rate, ...rest }, ...s.expenses ] })),
      setConsoleRate: (type, ratePerHour) => set((s) => ({ consoles: s.consoles.map((c) => c.type === type ? { ...c, ratePerHour: Math.max(0, ratePerHour) } : c ) })),

      deleteSale: (id) => set((s) => ({ sales: s.sales.filter((x) => x.id !== id) })),
      resetConsoleStats: (consoleId) => set((s) => ({
        consoles: s.consoles.map((c) => c.id === consoleId ? { ...c, totalMinutes: 0, maintenanceMinutes: 0 } : c),
        sessionHistory: s.sessionHistory.filter((h) => h.consoleId !== consoleId)
      })),
    }),
    {
      name: "gamerzone-store-v1",
      storage: {
        getItem: async (name) => {
          try {
            const { data, error } = await supabase.from('app_state').select('state').eq('id', name).maybeSingle();
            if (!error && data && data.state) { 
              const safeData = vaccinateZustandPayload(data.state);
              localStorage.setItem(name, JSON.stringify(safeData)); 
              return safeData; 
            }
          } catch (err) {}
          const local = localStorage.getItem(name); 
          if (local) {
            try {
              const parsed = JSON.parse(local);
              return vaccinateZustandPayload(parsed);
            } catch(e) {}
          }
          return null;
        },
        setItem: async (name, value) => {
          const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(name, stringValue);
          if ((window as any).isSincronizando) return;
          (window as any).estadoPendiente = value;
          if ((window as any).relojSubida) clearTimeout((window as any).relojSubida);
          (window as any).relojSubida = setTimeout(async () => {
            try {
              const valorFinal = (window as any).estadoPendiente;
              const safeValue = typeof valorFinal === 'string' ? JSON.parse(valorFinal) : valorFinal;
              await supabase.from('app_state').upsert({ id: name, state: safeValue });
            } catch (err) {}
          }, 800); 
        },
        removeItem: async (name) => {
          localStorage.removeItem(name);
          try { await supabase.from('app_state').delete().eq('id', name); } catch (err) {}
        }
      }
    }
  )
);

export const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`;
export const fmtBs = (usd: number, rate: number) => `Bs ${((usd || 0) * rate).toLocaleString("es-VE", { maximumFractionDigits: 2 })}`;
export const computeTimeAmount = (consoleObj: ConsoleState, nowMs: number): { minutes: number; amount: number } => {
  if (!consoleObj.session) return { minutes: 0, amount: 0 };
  const ref = consoleObj.session.pausedAt ?? nowMs;
  const elapsedMs = Math.max(0, ref - consoleObj.session.startedAt);
  const minutes = Math.ceil(elapsedMs / 60_000);
  const amount = (minutes / 60) * consoleObj.ratePerHour;
  return { minutes, amount };
};

supabase.channel('escuchar-nube').on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, (payload) => {
  let rawState = payload.new ? (payload.new as any).state : null;
  if (typeof rawState === 'string') { try { rawState = JSON.parse(rawState); } catch(e) {} }
  rawState = vaccinateZustandPayload(rawState);
  const newState = rawState ? rawState.state : null;
  if (newState) {
    const estadoActual = JSON.stringify(useStore.getState());
    const estadoNube = JSON.stringify(newState);
    if (estadoActual !== estadoNube) {
      (window as any).isSincronizando = true;
      useStore.setState(newState);
      localStorage.setItem("gamerzone-store-v1", JSON.stringify(rawState));
      setTimeout(() => { (window as any).isSincronizando = false; }, 500);
    }
  }
}).subscribe();

window.addEventListener('online', async () => {
  try {
    const localData = localStorage.getItem('gamerzone-store-v1');
    if (localData) {
      const parsed = JSON.parse(localData);
      await supabase.from('app_state').upsert({ id: 'gamerzone-store-v1', state: parsed });
    }
  } catch (err) {}
});