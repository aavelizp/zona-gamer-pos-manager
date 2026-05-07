import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProductId = string;
export interface Product {
  id: ProductId;
  name: string;
  price: number; // USD
  stock: number;
}

export interface ComboItem { productId: ProductId; qty: number; }
export interface Combo {
  id: string;
  name: string;
  price: number; // USD
  hours: number;
  items: ComboItem[];
}

export type ConsoleType = "PS4" | "PS5";
export type SessionMode = "free" | "fixed";

export interface ConsoleSession {
  mode: SessionMode;
  startedAt: number; // ms
  endsAt?: number;   // ms (for fixed)
  alerted?: boolean;
}

export interface ExtraCharge {
  label: string;
  amount: number; // USD
  ts: number;
  // for inventory restock on revert (not implemented)
  productId?: ProductId;
  qty?: number;
}

export interface ConsoleState {
  id: string;
  name: string;
  type: ConsoleType;
  ratePerHour: number; // USD
  totalMinutes: number; // historical
  session?: ConsoleSession;
  charges: ExtraCharge[]; // snacks, combos extras
}

export type PaymentMethod = "full" | "mixed" | "credit";

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
  rate: number;
  method: PaymentMethod;
  customer?: string;
  concept: string; // "Consola", "Deuda Cobrada"
  items: { name: string; qty: number; price: number }[];
}

export interface Credit {
  id: string;
  customer: string;
  amount: number; // USD remaining
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
  totalMinutes: number;     // historical accumulated minutes
  rewardMinutes: number;    // minutes since last reward (resets on redeem)
  pendingRewards: number;   // unredeemed gifts (1h each per 10h)
  createdAt: number;
  lastVisit: number;
}

export interface QueueEntry {
  id: string;
  name: string;
  preference: "PS4" | "PS5" | "Cualquiera";
  ts: number;
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

  // setters
  setRate: (n: number) => void;
  toggleSound: () => void;

  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  removeProduct: (id: string) => void;

  addCombo: (c: Omit<Combo, "id">) => void;
  removeCombo: (id: string) => void;

  startSession: (consoleId: string, minutes?: number) => void;
  extendSession: (consoleId: string, addMinutes: number) => void;
  markAlerted: (consoleId: string) => void;

  addSnackToConsole: (consoleId: string, productId: string, qty: number) => void;
  applyComboToConsole: (consoleId: string, comboId: string) => void;

  finalizeConsole: (
    consoleId: string,
    payload: { method: PaymentMethod; cashUsd: number; mobileBs: number; customer?: string; total: number; timeAmount: number; extrasAmount: number; minutes: number; customerInfo?: CustomerInfo }
  ) => void;

  payCredit: (
    creditId: string,
    payload: { method: PaymentMethod; cashUsd: number; mobileBs: number; amount: number }
  ) => void;

  enqueue: (e: Omit<QueueEntry, "id" | "ts">) => void;
  dequeue: (id: string) => void;

  redeemReward: (memberId: string) => void;
  removeMember: (memberId: string) => void;

  closeDay: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultConsoles: ConsoleState[] = [
  { id: "ps4-1", name: "PS4 #1", type: "PS4", ratePerHour: 2, totalMinutes: 0, charges: [] },
  { id: "ps4-2", name: "PS4 #2", type: "PS4", ratePerHour: 2, totalMinutes: 0, charges: [] },
  { id: "ps4-3", name: "PS4 #3", type: "PS4", ratePerHour: 2, totalMinutes: 0, charges: [] },
  { id: "ps4-4", name: "PS4 #4", type: "PS4", ratePerHour: 2, totalMinutes: 0, charges: [] },
  { id: "ps5-1", name: "PS5 #1", type: "PS5", ratePerHour: 3, totalMinutes: 0, charges: [] },
  { id: "ps5-2", name: "PS5 #2", type: "PS5", ratePerHour: 3, totalMinutes: 0, charges: [] },
];

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

      setRate: (n) => set({ rate: Math.max(0, n) }),
      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),

      addProduct: (p) => set((s) => ({ products: [...s.products, { ...p, id: uid() }] })),
      updateProduct: (id, p) =>
        set((s) => ({ products: s.products.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      removeProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      addCombo: (c) => set((s) => ({ combos: [...s.combos, { ...c, id: uid() }] })),
      removeCombo: (id) => set((s) => ({ combos: s.combos.filter((c) => c.id !== id) })),

      startSession: (consoleId, minutes) =>
        set((s) => ({
          consoles: s.consoles.map((c) =>
            c.id === consoleId
              ? {
                  ...c,
                  session: {
                    mode: minutes ? "fixed" : "free",
                    startedAt: Date.now(),
                    endsAt: minutes ? Date.now() + minutes * 60_000 : undefined,
                  },
                }
              : c
          ),
        })),

      extendSession: (consoleId, addMinutes) =>
        set((s) => ({
          consoles: s.consoles.map((c) => {
            if (c.id !== consoleId || !c.session) return c;
            const base = c.session.endsAt && c.session.endsAt > Date.now() ? c.session.endsAt : Date.now();
            return {
              ...c,
              session: {
                ...c.session,
                mode: "fixed",
                endsAt: base + addMinutes * 60_000,
                alerted: false,
              },
            };
          }),
        })),

      markAlerted: (consoleId) =>
        set((s) => ({
          consoles: s.consoles.map((c) =>
            c.id === consoleId && c.session ? { ...c, session: { ...c.session, alerted: true } } : c
          ),
        })),

      addSnackToConsole: (consoleId, productId, qty) =>
        set((s) => {
          const product = s.products.find((p) => p.id === productId);
          if (!product || product.stock < qty) return s;
          return {
            products: s.products.map((p) => (p.id === productId ? { ...p, stock: p.stock - qty } : p)),
            consoles: s.consoles.map((c) =>
              c.id === consoleId
                ? {
                    ...c,
                    charges: [
                      ...c.charges,
                      { label: `${product.name} x${qty}`, amount: product.price * qty, ts: Date.now(), productId, qty },
                    ],
                  }
                : c
            ),
          };
        }),

      applyComboToConsole: (consoleId, comboId) =>
        set((s) => {
          const combo = s.combos.find((c) => c.id === comboId);
          if (!combo) return s;
          // verify stock
          for (const it of combo.items) {
            const p = s.products.find((pp) => pp.id === it.productId);
            if (!p || p.stock < it.qty) return s;
          }
          const consoleObj = s.consoles.find((c) => c.id === consoleId);
          if (!consoleObj) return s;
          // Discount stock
          const newProducts = s.products.map((p) => {
            const it = combo.items.find((i) => i.productId === p.id);
            return it ? { ...p, stock: p.stock - it.qty } : p;
          });
          // Apply hours: extend if running, otherwise start fixed
          const addMs = combo.hours * 60 * 60_000;
          const newSession: ConsoleSession = consoleObj.session
            ? {
                ...consoleObj.session,
                mode: "fixed",
                endsAt:
                  (consoleObj.session.endsAt && consoleObj.session.endsAt > Date.now()
                    ? consoleObj.session.endsAt
                    : Date.now()) + addMs,
                alerted: false,
              }
            : { mode: "fixed", startedAt: Date.now(), endsAt: Date.now() + addMs };
          return {
            products: newProducts,
            consoles: s.consoles.map((c) =>
              c.id === consoleId
                ? {
                    ...c,
                    session: combo.hours > 0 ? newSession : c.session,
                    charges: [
                      ...c.charges,
                      { label: `Combo: ${combo.name}`, amount: combo.price, ts: Date.now() },
                    ],
                  }
                : c
            ),
          };
        }),

      finalizeConsole: (consoleId, payload) =>
        set((s) => {
          const c = s.consoles.find((x) => x.id === consoleId);
          if (!c) return s;
          const sale: SaleRecord = {
            id: uid(),
            ts: Date.now(),
            consoleId: c.id,
            consoleName: c.name,
            minutes: payload.minutes,
            timeAmount: payload.timeAmount,
            extrasAmount: payload.extrasAmount,
            total: payload.total,
            cashUsd: payload.cashUsd,
            mobileBs: payload.mobileBs,
            rate: s.rate,
            method: payload.method,
            customer: payload.customerInfo?.name || payload.customer,
            concept: "Consola",
            items: [
              ...(payload.timeAmount > 0
                ? [{ name: `Tiempo ${c.name} (${payload.minutes} min)`, qty: 1, price: payload.timeAmount }]
                : []),
              ...c.charges.map((ch) => ({ name: ch.label, qty: 1, price: ch.amount })),
            ],
          };
          const newCredits =
            payload.method === "credit"
              ? [
                  ...s.credits,
                  {
                    id: uid(),
                    customer: payload.customerInfo?.name || payload.customer || "Sin nombre",
                    amount: payload.total,
                    createdAt: Date.now(),
                    note: c.name,
                  },
                ]
              : s.credits;

          // Loyalty: upsert member if customerInfo with name+phone provided
          let newMembers = s.members;
          const ci = payload.customerInfo;
          if (ci && ci.name?.trim() && ci.phone?.trim()) {
            const key = ci.phone.trim();
            const existing = s.members.find((m) => m.phone === key);
            if (existing) {
              const newReward = existing.rewardMinutes + payload.minutes;
              const earned = Math.floor(newReward / 600);
              newMembers = s.members.map((m) =>
                m.id === existing.id
                  ? {
                      ...m,
                      name: ci.name.trim(),
                      idDoc: ci.idDoc?.trim() || m.idDoc,
                      totalMinutes: m.totalMinutes + payload.minutes,
                      rewardMinutes: newReward - earned * 600,
                      pendingRewards: m.pendingRewards + earned,
                      lastVisit: Date.now(),
                    }
                  : m
              );
            } else {
              const earned = Math.floor(payload.minutes / 600);
              newMembers = [
                ...s.members,
                {
                  id: uid(),
                  name: ci.name.trim(),
                  idDoc: ci.idDoc?.trim(),
                  phone: key,
                  totalMinutes: payload.minutes,
                  rewardMinutes: payload.minutes - earned * 600,
                  pendingRewards: earned,
                  createdAt: Date.now(),
                  lastVisit: Date.now(),
                },
              ];
            }
          }

          return {
            consoles: s.consoles.map((x) =>
              x.id === consoleId
                ? { ...x, session: undefined, charges: [], totalMinutes: x.totalMinutes + payload.minutes }
                : x
            ),
            sales: payload.method === "credit" ? s.sales : [...s.sales, sale],
            credits: newCredits,
            members: newMembers,
          };
        }),

      payCredit: (creditId, payload) =>
        set((s) => {
          const credit = s.credits.find((c) => c.id === creditId);
          if (!credit) return s;
          const sale: SaleRecord = {
            id: uid(),
            ts: Date.now(),
            timeAmount: 0,
            extrasAmount: payload.amount,
            total: payload.amount,
            cashUsd: payload.cashUsd,
            mobileBs: payload.mobileBs,
            rate: s.rate,
            method: payload.method,
            customer: credit.customer,
            concept: "Deuda Cobrada",
            items: [{ name: `Deuda de ${credit.customer}`, qty: 1, price: payload.amount }],
          };
          const remaining = credit.amount - payload.amount;
          return {
            sales: [...s.sales, sale],
            credits:
              remaining > 0.001
                ? s.credits.map((c) => (c.id === creditId ? { ...c, amount: remaining } : c))
                : s.credits.filter((c) => c.id !== creditId),
          };
        }),

      enqueue: (e) => set((s) => ({ queue: [...s.queue, { ...e, id: uid(), ts: Date.now() }] })),
      dequeue: (id) => set((s) => ({ queue: s.queue.filter((q) => q.id !== id) })),

      redeemReward: (memberId) =>
        set((s) => ({
          members: s.members.map((m) =>
            m.id === memberId && m.pendingRewards > 0
              ? { ...m, pendingRewards: m.pendingRewards - 1, rewardMinutes: 0 }
              : m
          ),
        })),
      removeMember: (memberId) => set((s) => ({ members: s.members.filter((m) => m.id !== memberId) })),

      closeDay: () =>
        set((s) => ({
          sales: [],
          consoles: s.consoles.map((c) => ({ ...c, session: undefined, charges: [] })),
        })),
    }),
    { name: "gamerzone-store-v1" }
  )
);

// Helpers
export const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`;
export const fmtBs = (usd: number, rate: number) =>
  `Bs ${((usd || 0) * rate).toLocaleString("es-VE", { maximumFractionDigits: 2 })}`;

export const computeTimeAmount = (consoleObj: ConsoleState, nowMs: number): { minutes: number; amount: number } => {
  if (!consoleObj.session) return { minutes: 0, amount: 0 };
  const elapsedMs = Math.max(0, nowMs - consoleObj.session.startedAt);
  const minutes = Math.ceil(elapsedMs / 60_000);
  const amount = (minutes / 60) * consoleObj.ratePerHour;
  return { minutes, amount };
};
