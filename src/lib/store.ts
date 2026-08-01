import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "./supabase";

export type ProductId = string;
export interface Product { id: ProductId; name: string; price: number; stock: number; }
export interface ComboItem { productId: ProductId; qty: number; }
export interface Combo { id: string; name: string; price: number; hours: number; items: ComboItem[]; }
export type ConsoleType = "PS4" | "PS5";
export type SessionMode = "free" | "fixed" | "tournament"; 

export interface ConsoleSession { mode: SessionMode; startedAt: number; endsAt?: number; alerted?: boolean; preAlerted?: boolean; prepaid?: boolean; prepaidMinutes?: number; customerName?: string; pausedAt?: number; isTournament?: boolean; prepaidSaleIds?: string[]; }
export interface ExtraCharge { label: string; amount: number; ts: number; productId?: ProductId; qty?: number; }
export interface ConsoleState { id: string; name: string; type: ConsoleType; ratePerHour: number; totalMinutes: number; maintenanceMinutes?: number; session?: ConsoleSession; charges: ExtraCharge[]; }
export interface MaintenanceLog { id: string; consoleId: string; consoleName: string; description: string; date: number; minutesAtService: number; }
export type PaymentMethod = "full" | "mixed" | "credit" | "cash_bs";

export interface SaleRecord { id: string; ts: number; consoleId?: string; consoleName?: string; minutes?: number; timeAmount: number; extrasAmount: number; total: number; cashUsd: number; mobileBs: number; cashBs?: number; mobileBank?: string; mobileRef?: string; rate: number; method: PaymentMethod; customer?: string; concept: string; items: { name: string; qty: number; price: number }[]; }
export interface Credit { id: string; customer: string; amount: number; createdAt: number; note?: string; phone?: string; }
export interface CustomerInfo { name: string; idDoc?: string; phone?: string; }
export interface Member { id: string; name: string; idDoc?: string; phone?: string; totalMinutes: number; rewardMinutes: number; pendingRewards: number; createdAt: number; lastVisit: number; }
export interface QueueEntry { id: string; name: string; preference: "PS4" | "PS5" | "Cualquiera"; ts: number; }
export interface SessionHistoryEntry { id: string; ts: number; consoleId: string; consoleName: string; customer?: string; minutes: number; amount: number; prepaid: boolean; }
export type ExpenseCategory = "Servicios" | "Compras" | "Mantenimiento" | "Sueldos" | "Limpieza" | "Impuestos" | "Otros";
export const EXPENSE_CATEGORIES: ExpenseCategory[] = ["Servicios", "Compras", "Mantenimiento", "Sueldos", "Limpieza", "Impuestos", "Otros"];
export interface Expense { id: string; ts: number; createdAt?: number; description: string; amount: number; method: "cash" | "mobile"; amountBs?: number; rate: number; category?: ExpenseCategory; }

// NUEVOS TIPOS DE TORNEOS (MK y FIFA)
export type TournamentFormat = "single_elimination" | "double_elimination" | "league" | "groups";
export interface Tournament { id: string; name: string; game: string; maxPlayers: number; entryFee: number; prizePercentage: number; format: TournamentFormat; groupCount?: number; dateRange: string; status: "registering" | "active" | "completed"; createdAt: number; defaultMatchFormat?: "FT2" | "FT3" | "FT5"; allowDraws?: boolean; } 
export interface TournamentParticipant { id: string; tournamentId: string; memberId?: string; memberName: string; phone?: string; groupName?: string; teamName?: string; paymentStatus: "paid" | "pending"; enrolledAt: number; enrollSaleId?: string; }
export interface TournamentMatch { id: string; tournamentId: string; round: number; matchIndex: number; player1Id?: string; player2Id?: string; winnerId?: string; isDraw?: boolean; score1?: number; score2?: number; nextMatchId?: string; phase?: "groups" | "knockout"; groupName?: string; bracket?: "winners" | "losers" | "grand_finals"; matchFormat?: "FT2" | "FT3" | "FT5"; assignedConsoleId?: string; loserGoesToMatchId?: string; penalties1?: number; penalties2?: number; }

export interface PastClosure { id: string; date: number; totalSales: number; totalExpenses: number; sales: SaleRecord[]; expenses: Expense[]; }

interface State {
  rate: number; soundOn: boolean; products: Product[]; combos: Combo[]; consoles: ConsoleState[]; sales: SaleRecord[]; credits: Credit[]; queue: QueueEntry[]; members: Member[]; maintenanceLogs: MaintenanceLog[]; sessionHistory: SessionHistoryEntry[]; expenses: Expense[]; tournaments: Tournament[]; participants: TournamentParticipant[]; matches: TournamentMatch[]; pastClosures: PastClosure[];

  setRate: (n: number) => void; toggleSound: () => void;
  addProduct: (p: Omit<Product, "id">) => void; updateProduct: (id: string, p: Partial<Product>) => void; removeProduct: (id: string) => void;
  addCombo: (c: Omit<Combo, "id">) => void; removeCombo: (id: string) => void;
  startSession: (consoleId: string, minutes?: number, customerName?: string, isTournament?: boolean) => void; extendSession: (consoleId: string, addMinutes: number) => void; markAlerted: (consoleId: string) => void; markPreAlerted: (consoleId: string) => void; pauseSession: (consoleId: string) => void; resumeSession: (consoleId: string) => void; cancelSession: (consoleId: string) => void;
  updateSessionCustomer: (consoleId: string, customerName: string) => void;
  addSnackToConsole: (consoleId: string, productId: string, qty: number) => void; applyComboToConsole: (consoleId: string, comboId: string) => void; addExtraController: (consoleId: string) => void; transferSession: (originId: string, destId: string) => void;
  finalizeConsole: (consoleId: string, payload: { method: PaymentMethod; cashUsd: number; mobileBs: number; mobileBank?: string; mobileRef?: string; cashBs?: number; customer?: string; total: number; timeAmount: number; extrasAmount: number; minutes: number; customerInfo?: CustomerInfo }) => void;
  finalizeMultipleConsoles: (consoleIds: string[], payload: { method: PaymentMethod; cashUsd: number; mobileBs: number; mobileBank?: string; mobileRef?: string; cashBs?: number; customer?: string; total: number; timeAmount: number; extrasAmount: number; totalMinutes: number; customerInfo?: CustomerInfo; items: { name: string; qty: number; price: number }[] }) => void;
  directSale: (payload: { method: PaymentMethod; cashUsd: number; mobileBs: number; mobileBank?: string; mobileRef?: string; cashBs?: number; total: number; customer?: string; items: { productId: string; qty: number; price: number; name: string }[] }) => void;
  payCredit: (creditId: string, payload: { method: PaymentMethod; cashUsd: number; mobileBs: number; mobileBank?: string; mobileRef?: string; amount: number; customerInfo?: CustomerInfo }) => void;
  enqueue: (e: Omit<QueueEntry, "id" | "ts">) => void; dequeue: (id: string) => void; redeemReward: (memberId: string) => void; removeMember: (memberId: string) => void; 
  addMember: (data: { name: string; idDoc?: string; phone?: string }) => void; 
  updateMember: (memberId: string, data: Partial<Member>) => void;
  closeDay: () => void; registerMaintenance: (consoleId: string, description: string, date: number) => void; deleteMaintenanceLog: (logId: string) => void;
  prepaySession: (consoleId: string, minutes: number, payload: { method: PaymentMethod; cashUsd: number; mobileBs: number; mobileBank?: string; mobileRef?: string; cashBs?: number; total: number; customerInfo?: CustomerInfo; comboId?: string }) => void; releaseConsole: (consoleId: string) => boolean; payExtras: (consoleId: string, payload: { method: PaymentMethod; cashUsd: number; mobileBs: number; mobileBank?: string; mobileRef?: string; total: number; customer?: string }) => void; extendPaidSession: (consoleId: string, addMinutes: number, payload: { method: PaymentMethod; cashUsd: number; mobileBs: number; mobileBank?: string; mobileRef?: string; total: number; customer?: string }) => void;
  addExpense: (e: { description: string; amount: number; method: "cash" | "mobile"; amountBs?: number; category?: ExpenseCategory; ts?: number }) => void; setConsoleRate: (type: ConsoleType, ratePerHour: number) => void; deleteSale: (saleId: string) => void; resetConsoleStats: (consoleId: string) => void;
  
  // FUNCIONES DE TORNEOS
  createTournament: (t: Omit<Tournament, "id" | "createdAt" | "status">) => void; 
  updateTournament: (id: string, data: Partial<Tournament>) => void;
  deleteTournament: (id: string) => void; 
  enrollParticipant: (tournamentId: string, memberName: string, phone: string | undefined, isPaid: boolean, payload?: any, teamName?: string) => void;
  updateParticipant: (id: string, data: Partial<TournamentParticipant>) => void;
  removeParticipant: (participantId: string) => void; 
  payEnrollment: (participantId: string, payload: any) => void; 
  generateBracket: (tournamentId: string) => void; 
  generateKnockoutFromGroups: (tournamentId: string) => void; 
  setMatchScore: (matchId: string, score1: number, score2: number, penalties1?: number, penalties2?: number) => void; 
  setMatchWinner: (matchId: string, winnerId: string) => void; 
  setMatchDraw: (matchId: string) => void; 
  revertMatchWinner: (matchId: string) => void; 
  revertTournamentToRegistering: (tournamentId: string) => void;
  assignConsoleToMatch: (matchId: string, consoleId?: string) => void;
  updateMatchFormat: (matchId: string, matchFormat: "FT2" | "FT3" | "FT5") => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const defaultConsoles: ConsoleState[] = [ { id: "ps4-1", name: "PS4 #3", type: "PS4", ratePerHour: 2, totalMinutes: 0, charges: [] }, { id: "ps4-2", name: "PS4 #4", type: "PS4", ratePerHour: 2, totalMinutes: 0, charges: [] }, { id: "ps4-3", name: "PS4 #5", type: "PS4", ratePerHour: 2, totalMinutes: 0, charges: [] }, { id: "ps4-4", name: "PS4 #6", type: "PS4", ratePerHour: 2, totalMinutes: 0, charges: [] }, { id: "ps5-1", name: "PS5 #1", type: "PS5", ratePerHour: 3, totalMinutes: 0, charges: [] }, { id: "ps5-2", name: "PS5 #2", type: "PS5", ratePerHour: 3, totalMinutes: 0, charges: [] } ];

const vaccinateZustandPayload = (payload: any) => { 
  if (payload && payload.state) { 
    if (Array.isArray(payload.state.consoles)) { 
      payload.state.consoles = payload.state.consoles.map((c: any) => { 
        if (!c) return null;
        if (c.id === "ps4-1") c.name = "PS4 #3"; if (c.id === "ps4-2") c.name = "PS4 #4"; if (c.id === "ps4-3") c.name = "PS4 #5"; if (c.id === "ps4-4") c.name = "PS4 #6"; 
        return { ...c, charges: Array.isArray(c.charges) ? c.charges : [] }; 
      }).filter(Boolean); 
    } else { payload.state.consoles = JSON.parse(JSON.stringify(defaultConsoles)); }
    payload.state.sales = Array.isArray(payload.state.sales) ? payload.state.sales : []; 
    payload.state.members = Array.isArray(payload.state.members) ? payload.state.members : []; 
    payload.state.products = Array.isArray(payload.state.products) ? payload.state.products : []; 
    payload.state.combos = Array.isArray(payload.state.combos) ? payload.state.combos : []; 
    payload.state.credits = Array.isArray(payload.state.credits) ? payload.state.credits : []; 
    payload.state.tournaments = Array.isArray(payload.state.tournaments) ? payload.state.tournaments : []; 
    payload.state.participants = Array.isArray(payload.state.participants) ? payload.state.participants : []; 
    payload.state.matches = Array.isArray(payload.state.matches) ? payload.state.matches : []; 
    payload.state.maintenanceLogs = Array.isArray(payload.state.maintenanceLogs) ? payload.state.maintenanceLogs : []; 
    payload.state.queue = Array.isArray(payload.state.queue) ? payload.state.queue : []; 
    payload.state.sessionHistory = Array.isArray(payload.state.sessionHistory) ? payload.state.sessionHistory : []; 
    payload.state.expenses = Array.isArray(payload.state.expenses) ? payload.state.expenses : [];
    payload.state.pastClosures = Array.isArray(payload.state.pastClosures) ? payload.state.pastClosures : [];
  } 
  return payload; 
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      rate: 40, soundOn: true, products: [{ id: uid(), name: "Pepsi 355ml", price: 1, stock: 24 }], combos: [], consoles: defaultConsoles, sales: [], credits: [], queue: [], members: [], maintenanceLogs: [], sessionHistory: [], expenses: [], tournaments: [], participants: [], matches: [], pastClosures: [],
      
      setRate: (n) => set({ rate: Math.max(0, n) }), toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
      addProduct: (p) => set((s) => ({ products: [...(s.products||[]), { ...p, id: uid() }] })), updateProduct: (id, p) => set((s) => ({ products: (s.products||[]).map((x) => (x?.id === id ? { ...x, ...p } : x)) })), removeProduct: (id) => set((s) => ({ products: (s.products||[]).filter((p) => p?.id !== id) })),
      addCombo: (c) => set((s) => ({ combos: [...(s.combos||[]), { ...c, id: uid() }] })), removeCombo: (id) => set((s) => ({ combos: (s.combos||[]).filter((c) => c?.id !== id) })),
      
      startSession: (consoleId, minutes, customerName, isTournament) => set((s) => ({ consoles: (s.consoles||[]).map((c) => c?.id === consoleId ? { ...c, session: { mode: isTournament ? "tournament" : (minutes ? "fixed" : "free"), startedAt: Date.now(), endsAt: minutes ? Date.now() + minutes * 60_000 : undefined, customerName, isTournament } } : c ) })),
      extendSession: (consoleId, addMinutes) => set((s) => ({ consoles: (s.consoles||[]).map((c) => { if (c?.id !== consoleId || !c.session) return c; const base = c.session.endsAt && c.session.endsAt > Date.now() ? c.session.endsAt : Date.now(); return { ...c, session: { ...c.session, mode: "fixed", endsAt: base + addMinutes * 60_000, alerted: false } }; }) })),
      markAlerted: (consoleId) => set((s) => ({ consoles: (s.consoles||[]).map((c) => c?.id === consoleId && c.session ? { ...c, session: { ...c.session, alerted: true } } : c ) })), 
      markPreAlerted: (consoleId) => set((s) => ({ consoles: (s.consoles||[]).map((c) => c?.id === consoleId && c.session ? { ...c, session: { ...c.session, preAlerted: true } } : c ) })), 
      pauseSession: (consoleId) => set((s) => ({ consoles: (s.consoles||[]).map((c) => c?.id === consoleId && c.session && !c.session.pausedAt ? { ...c, session: { ...c.session, pausedAt: Date.now() } } : c ) })), 
      resumeSession: (consoleId) => set((s) => ({ consoles: (s.consoles||[]).map((c) => { if (c?.id !== consoleId || !c.session || !c.session.pausedAt) return c; const delta = Date.now() - c.session.pausedAt; return { ...c, session: { ...c.session, startedAt: c.session.startedAt + delta, endsAt: c.session.endsAt ? c.session.endsAt + delta : undefined, pausedAt: undefined, alerted: false, preAlerted: false } }; }) })), 
      
      cancelSession: (consoleId) => set((s) => { 
        const c = (s.consoles||[]).find((x) => x?.id === consoleId); 
        if (!c) return s; 
        let newSales = s.sales || []; 
        if (c.session?.prepaidSaleIds && c.session.prepaidSaleIds.length > 0) { 
          newSales = newSales.filter(sale => !c.session!.prepaidSaleIds!.includes(sale.id)); 
        } 
        return { consoles: (s.consoles||[]).map((x) => x?.id === consoleId ? { ...x, session: undefined, charges: [] } : x ), sales: newSales }; 
      }),
      
      updateSessionCustomer: (consoleId, customerName) => set((s) => ({ consoles: (s.consoles||[]).map((c) => c?.id === consoleId && c.session ? { ...c, session: { ...c.session, customerName } } : c ) })),
      addSnackToConsole: (consoleId, productId, qty) => set((s) => { const product = (s.products||[]).find((p) => p?.id === productId); if (!product || product.stock < qty) return s; return { products: (s.products||[]).map((p) => (p?.id === productId ? { ...p, stock: p.stock - qty } : p)), consoles: (s.consoles||[]).map((c) => c?.id === consoleId ? { ...c, charges: [ ...(c.charges || []), { label: `${product.name} x${qty}`, amount: product.price * qty, ts: Date.now(), productId, qty } ] } : c ), }; }),
      applyComboToConsole: (consoleId, comboId) => set((s) => { const combo = (s.combos||[]).find((c) => c?.id === comboId); if (!combo) return s; for (const it of combo.items || []) { const p = (s.products||[]).find((pp) => pp?.id === it.productId); if (!p || p.stock < it.qty) return s; } const consoleObj = (s.consoles||[]).find((c) => c?.id === consoleId); if (!consoleObj) return s; const newProducts = (s.products||[]).map((p) => { const it = (combo.items||[]).find((i) => i.productId === p?.id); return it ? { ...p, stock: p.stock - it.qty } : p; }); const addMs = combo.hours * 60 * 60_000; const newSession: ConsoleSession = consoleObj.session ? { ...consoleObj.session, mode: "fixed", endsAt: (consoleObj.session.endsAt && consoleObj.session.endsAt > Date.now() ? consoleObj.session.endsAt : Date.now()) + addMs, alerted: false } : { mode: "fixed", startedAt: Date.now(), endsAt: Date.now() + addMs }; return { products: newProducts, consoles: (s.consoles||[]).map((c) => c?.id === consoleId ? { ...c, session: combo.hours > 0 ? newSession : c.session, charges: [ ...(c.charges || []), { label: `Combo: ${combo.name}`, amount: combo.price, ts: Date.now() } ] } : c ) }; }),
      addExtraController: (consoleId) => set((s) => ({ consoles: (s.consoles||[]).map((c) => c?.id === consoleId ? { ...c, charges: [ ...(c.charges || []), { label: "Control Adicional", amount: 1, ts: Date.now() } ] } : c ) })),
      transferSession: (originId, destId) => set((s) => { const origin = (s.consoles||[]).find(c => c?.id === originId); const dest = (s.consoles||[]).find(c => c?.id === destId); if (!origin || !origin.session || !dest || dest.session) return s; const nowMs = Date.now(); const ref = origin.session.pausedAt ?? nowMs; const elapsedMs = Math.max(0, ref - origin.session.startedAt); const minutes = Math.ceil(elapsedMs / 60_000); const amount = (minutes / 60) * origin.ratePerHour; const newCharges = [...(dest.charges || []), ...(origin.charges || [])]; if (!origin.session.prepaid && amount > 0.01) { newCharges.push({ label: `Tiempo ${origin.name} (${minutes} min)`, amount: +(amount.toFixed(2)), ts: nowMs }); } let newEndsAt = undefined; let newStartedAt = nowMs; let newPausedAt = origin.session.pausedAt ? nowMs : undefined; if (origin.session.mode === "fixed" && origin.session.endsAt) { const remainingMs = Math.max(0, origin.session.endsAt - ref); newEndsAt = nowMs + remainingMs; } const newSession: ConsoleSession = { ...origin.session, startedAt: newStartedAt, endsAt: newEndsAt, pausedAt: newPausedAt }; return { consoles: (s.consoles||[]).map(c => { if (c?.id === originId) return { ...c, session: undefined, charges: [], totalMinutes: (c.totalMinutes||0) + minutes, maintenanceMinutes: (c.maintenanceMinutes || 0) + minutes }; if (c?.id === destId) return { ...c, session: newSession, charges: newCharges }; return c; }) }; }),
      
      finalizeConsole: (consoleId, payload) => set((s) => { const c = (s.consoles||[]).find((x) => x?.id === consoleId); if (!c) return s; const sale: SaleRecord = { id: uid(), ts: Date.now(), consoleId: c.id, consoleName: c.name, minutes: payload.minutes, timeAmount: payload.timeAmount, extrasAmount: payload.extrasAmount, total: payload.total, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, mobileBank: payload.mobileBank, mobileRef: payload.mobileRef, cashBs: payload.cashBs || 0, rate: s.rate, method: payload.method, customer: payload.customerInfo?.name || payload.customer, concept: "Consola", items: [ ...(payload.timeAmount > 0 ? [{ name: `Tiempo ${c.name} (${payload.minutes} min)`, qty: 1, price: payload.timeAmount }] : []), ...(c.charges || []).map((ch) => ({ name: ch.label, qty: 1, price: ch.amount })) ] }; const newCredits = payload.method === "credit" ? [ ... (s.credits||[]), { id: uid(), customer: payload.customerInfo?.name || payload.customer || "Sin nombre", phone: payload.customerInfo?.phone || undefined, amount: payload.total, createdAt: Date.now(), note: c.name } ] : (s.credits||[]); let newMembers = s.members || []; const ci = payload.customerInfo; if (ci && ci.name?.trim() && ci.phone?.trim() && !c.session?.isTournament) { const key = ci.phone.trim(); const existing = newMembers.find((m) => m?.phone === key); if (existing) { const newReward = (existing.rewardMinutes||0) + payload.minutes; const earned = Math.floor(newReward / 600); newMembers = newMembers.map((m) => m?.id === existing.id ? { ...m, name: ci.name.trim(), idDoc: ci.idDoc?.trim() || m.idDoc, totalMinutes: (m.totalMinutes||0) + payload.minutes, rewardMinutes: newReward - earned * 600, pendingRewards: (m.pendingRewards||0) + earned, lastVisit: Date.now() } : m ); } else { const earned = Math.floor(payload.minutes / 600); newMembers = [ ...newMembers, { id: uid(), name: ci.name.trim(), idDoc: ci.idDoc?.trim(), phone: key, totalMinutes: payload.minutes, rewardMinutes: payload.minutes - earned * 600, pendingRewards: earned, createdAt: Date.now(), lastVisit: Date.now() } ]; } } const histEntry: SessionHistoryEntry = { id: uid(), ts: Date.now(), consoleId: c.id, consoleName: c.name, customer: payload.customerInfo?.name || payload.customer, minutes: payload.minutes, amount: payload.total, prepaid: false }; return { consoles: (s.consoles||[]).map((x) => x?.id === consoleId ? { ...x, session: undefined, charges: [], totalMinutes: (x.totalMinutes||0) + payload.minutes, maintenanceMinutes: (x.maintenanceMinutes || 0) + payload.minutes } : x ), sales: payload.method === "credit" ? (s.sales||[]) : [...(s.sales||[]), sale], credits: newCredits, members: newMembers, sessionHistory: [histEntry, ... (s.sessionHistory||[])] }; }),
      finalizeMultipleConsoles: (consoleIds, payload) => set((s) => { const involved = (s.consoles||[]).filter((c) => c && consoleIds.includes(c.id)); if (involved.length === 0) return s; const sale: SaleRecord = { id: uid(), ts: Date.now(), consoleName: involved.map(c => c.name).join(" + "), minutes: payload.totalMinutes, timeAmount: payload.timeAmount, extrasAmount: payload.extrasAmount, total: payload.total, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, mobileBank: payload.mobileBank, mobileRef: payload.mobileRef, cashBs: payload.cashBs || 0, rate: s.rate, method: payload.method, customer: payload.customerInfo?.name || payload.customer, concept: "Cobro Múltiple", items: payload.items, }; const newCredits = payload.method === "credit" ? [ ... (s.credits||[]), { id: uid(), customer: payload.customerInfo?.name || payload.customer || "Sin nombre", phone: payload.customerInfo?.phone || undefined, amount: payload.total, createdAt: Date.now(), note: sale.consoleName } ] : (s.credits||[]); let clubMinutesToAdd = 0; involved.forEach(c => { if (!c.session?.isTournament) { const ref = c.session?.pausedAt ?? Date.now(); const elapsedMs = Math.max(0, ref - (c.session?.startedAt ?? ref)); clubMinutesToAdd += Math.ceil(elapsedMs / 60_000); } }); let newMembers = s.members || []; const ci = payload.customerInfo; if (ci && ci.name?.trim() && ci.phone?.trim() && clubMinutesToAdd > 0) { const key = ci.phone.trim(); const existing = newMembers.find((m) => m?.phone === key); if (existing) { const newReward = (existing.rewardMinutes||0) + clubMinutesToAdd; const earned = Math.floor(newReward / 600); newMembers = newMembers.map((m) => m?.id === existing.id ? { ...m, name: ci.name.trim(), idDoc: ci.idDoc?.trim() || m.idDoc, totalMinutes: (m.totalMinutes||0) + clubMinutesToAdd, rewardMinutes: newReward - earned * 600, pendingRewards: (m.pendingRewards||0) + earned, lastVisit: Date.now() } : m ); } else { const earned = Math.floor(clubMinutesToAdd / 600); newMembers = [ ...newMembers, { id: uid(), name: ci.name.trim(), idDoc: ci.idDoc?.trim(), phone: key, totalMinutes: clubMinutesToAdd, rewardMinutes: clubMinutesToAdd - earned * 600, pendingRewards: earned, createdAt: Date.now(), lastVisit: Date.now() } ]; } } const newHistEntries: SessionHistoryEntry[] = involved.map((c) => { const ref = c.session?.pausedAt ?? Date.now(); const elapsedMs = Math.max(0, ref - (c.session?.startedAt ?? ref)); const mins = Math.ceil(elapsedMs / 60_000); return { id: uid(), ts: Date.now(), consoleId: c.id, consoleName: c.name, customer: payload.customerInfo?.name || payload.customer, minutes: mins, amount: 0, prepaid: !!c.session?.prepaid }; }); return { consoles: (s.consoles||[]).map((c) => { if (c && consoleIds.includes(c.id)) { const ref = c.session?.pausedAt ?? Date.now(); const elapsedMs = Math.max(0, ref - (c.session?.startedAt ?? ref)); const mins = Math.ceil(elapsedMs / 60_000); return { ...c, session: undefined, charges: [], totalMinutes: (c.totalMinutes||0) + mins, maintenanceMinutes: (c.maintenanceMinutes || 0) + mins }; } return c; }), sales: payload.method === "credit" ? (s.sales||[]) : [...(s.sales||[]), sale], credits: newCredits, members: newMembers, sessionHistory: [...newHistEntries, ... (s.sessionHistory||[])] }; }),
      directSale: (payload) => set((s) => { let newProducts = s.products || []; for (const it of payload.items) { newProducts = newProducts.map((p) => p?.id === it.productId ? { ...p, stock: p.stock - it.qty } : p ); } const sale: SaleRecord = { id: uid(), ts: Date.now(), timeAmount: 0, extrasAmount: payload.total, total: payload.total, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, mobileBank: payload.mobileBank, mobileRef: payload.mobileRef, cashBs: payload.cashBs || 0, rate: s.rate, method: payload.method, customer: payload.customer, concept: "Venta Directa", items: payload.items.map((it) => ({ name: it.name, qty: it.qty, price: it.price })) }; const newCredits = payload.method === "credit" ? [ ... (s.credits||[]), { id: uid(), customer: payload.customer || "Sin nombre", amount: payload.total, createdAt: Date.now(), note: "Venta Directa" } ] : (s.credits||[]); return { products: newProducts, sales: [...(s.sales||[]), sale], credits: newCredits }; }),
      payCredit: (creditId, payload) => set((s) => { const credit = (s.credits||[]).find((c) => c?.id === creditId); if (!credit) return s; const sale: SaleRecord = { id: uid(), ts: Date.now(), timeAmount: 0, extrasAmount: payload.amount, total: payload.amount, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, mobileBank: payload.mobileBank, rate: s.rate, method: payload.method, customer: credit.customer, concept: "Deuda Cobrada", items: [{ name: `Deuda de ${credit.customer} (${credit.note || "General"})`, qty: 1, price: payload.amount }] }; const remaining = credit.amount - payload.amount; let newMembers = s.members || []; const ci = payload.customerInfo; if (ci && ci.name?.trim() && ci.phone?.trim()) { const key = ci.phone.trim(); const existing = newMembers.find((m) => m?.phone === key); if (existing) { newMembers = newMembers.map((m) => m?.id === existing.id ? { ...m, name: ci.name.trim(), idDoc: ci.idDoc?.trim() || m.idDoc, lastVisit: Date.now() } : m ); } else { newMembers = [ ...newMembers, { id: uid(), name: ci.name.trim(), idDoc: ci.idDoc?.trim(), phone: key, totalMinutes: 0, rewardMinutes: 0, pendingRewards: 0, createdAt: Date.now(), lastVisit: Date.now() } ]; } } return { sales: [...(s.sales||[]), sale], credits: remaining > 0.001 ? (s.credits||[]).map((c) => (c?.id === creditId ? { ...c, amount: remaining } : c)) : (s.credits||[]).filter((c) => c?.id !== creditId), members: newMembers }; }),
      enqueue: (e) => set((s) => ({ queue: [...(s.queue||[]), { ...e, id: uid(), ts: Date.now() }] })), dequeue: (id) => set((s) => ({ queue: (s.queue||[]).filter((q) => q?.id !== id) })), redeemReward: (memberId) => set((s) => ({ members: (s.members||[]).map((m) => m?.id === memberId && (m.pendingRewards||0) > 0 ? { ...m, pendingRewards: m.pendingRewards - 1, rewardMinutes: 0 } : m ) })), removeMember: (memberId) => set({ members: (get().members||[]).filter((m) => m?.id !== memberId) }),
      addMember: (data) => set((s) => { const newM: Member = { id: uid(), name: data.name.trim(), idDoc: data.idDoc?.trim(), phone: data.phone?.trim(), totalMinutes: 0, rewardMinutes: 0, pendingRewards: 0, createdAt: Date.now(), lastVisit: Date.now() }; return { members: [...(s.members || []), newM] }; }),
      updateMember: (memberId, data) => set((s) => { return { members: (s.members || []).map((m) => m?.id === memberId ? { ...m, ...data } : m) }; }),
      closeDay: () => set((s) => { const totalSales = (s.sales || []).reduce((acc, x) => acc + (x?.total || 0), 0); const totalExpenses = (s.expenses || []).reduce((acc, x) => acc + (x?.amount || 0), 0); const snapshot: PastClosure = { id: uid(), date: Date.now(), totalSales, totalExpenses, sales: [...(s.sales || [])], expenses: [...(s.expenses || [])] }; return { pastClosures: [snapshot, ...(s.pastClosures || [])], sales: [], sessionHistory: [], consoles: (s.consoles||[]).map((c) => ({ ...c, session: undefined, charges: [] })) }; }),
      registerMaintenance: (consoleId, description, date) => set((s) => { const c = (s.consoles||[]).find((x) => x?.id === consoleId); if (!c) return s; const log: MaintenanceLog = { id: uid(), consoleId: c.id, consoleName: c.name, description, date, minutesAtService: c.maintenanceMinutes || 0 }; return { consoles: (s.consoles||[]).map((x) => x?.id === consoleId ? { ...x, maintenanceMinutes: 0 } : x ), maintenanceLogs: [log, ...(s.maintenanceLogs||[])] }; }),
      deleteMaintenanceLog: (logId) => set((s) => { const log = (s.maintenanceLogs||[]).find(l => l?.id === logId); if (!log) return s; const consoles = (s.consoles||[]).map(c => { if (c?.id === log.consoleId) { return { ...c, maintenanceMinutes: (c.maintenanceMinutes || 0) + log.minutesAtService }; } return c; }); return { maintenanceLogs: (s.maintenanceLogs||[]).filter(l => l?.id !== logId), consoles }; }),
      
      prepaySession: (consoleId, minutes, payload) => set((s) => { 
        const c = (s.consoles||[]).find((x) => x?.id === consoleId); 
        if (!c) return s; 
        const combo = payload.comboId ? (s.combos||[]).find((cm) => cm?.id === payload.comboId) : undefined; 
        let newProducts = s.products || []; 
        const items: SaleRecord["items"] = []; 
        if (combo) { 
          for (const it of combo.items || []) { const p = (s.products||[]).find((pp) => pp?.id === it.productId); if (!p || p.stock < it.qty) return s; } 
          newProducts = (s.products||[]).map((p) => { const it = (combo.items||[]).find((i) => i.productId === p?.id); return it ? { ...p, stock: p.stock - it.qty } : p; }); 
          items.push({ name: `Combo: ${combo.name} - ${c.name} (${minutes} min)`, qty: 1, price: payload.total }); 
          for (const it of combo.items || []) { const p = (s.products||[]).find((pp) => pp?.id === it.productId); if (p) items.push({ name: `  · ${p.name}`, qty: it.qty, price: 0 }); } 
        } else { 
          items.push({ name: `Prepago ${c.name} (${minutes} min)`, qty: 1, price: payload.total }); 
        } 
        const saleId = uid(); 
        const sale: SaleRecord = { id: saleId, ts: Date.now(), consoleId: c.id, consoleName: c.name, minutes, timeAmount: payload.total, extrasAmount: 0, total: payload.total, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, mobileBank: payload.mobileBank, mobileRef: payload.mobileRef, cashBs: payload.cashBs || 0, rate: s.rate, method: payload.method, customer: payload.customerInfo?.name, concept: "Consola", items }; 
        let newMembers = s.members || []; 
        const ci = payload.customerInfo; 
        if (ci && ci.name?.trim() && ci.phone?.trim()) { 
          const key = ci.phone.trim(); const existing = newMembers.find((m) => m?.phone === key); 
          if (existing) { 
            const newReward = (existing.rewardMinutes||0) + minutes; const earned = Math.floor(newReward / 600); 
            newMembers = newMembers.map((m) => m?.id === existing.id ? { ...m, name: ci.name.trim(), idDoc: ci.idDoc?.trim() || m.idDoc, totalMinutes: (m.totalMinutes||0) + minutes, rewardMinutes: newReward - earned * 600, pendingRewards: (m.pendingRewards||0) + earned, lastVisit: Date.now() } : m ); 
          } else { 
            const earned = Math.floor(minutes / 600); 
            newMembers = [...newMembers, { id: uid(), name: ci.name.trim(), idDoc: ci.idDoc?.trim(), phone: key, totalMinutes: minutes, rewardMinutes: minutes - earned * 600, pendingRewards: earned, createdAt: Date.now(), lastVisit: Date.now() }]; 
          } 
        } 
        return { products: newProducts, consoles: (s.consoles||[]).map((x) => x?.id === consoleId ? { ...x, session: { mode: "fixed", startedAt: Date.now(), endsAt: Date.now() + minutes * 60_000, prepaid: true, prepaidMinutes: minutes, customerName: ci?.name?.trim(), prepaidSaleIds: [saleId] } } : x ), sales: [...(s.sales||[]), sale], members: newMembers }; 
      }),
      
      releaseConsole: (consoleId) => { const s = get(); const c = (s.consoles||[]).find((x) => x?.id === consoleId); if (!c || !c.session) return false; const pendingExtras = (c.charges || []).reduce((a, ch) => a + (ch?.amount||0), 0); if (pendingExtras > 0.001) return false; const mins = c.session.prepaidMinutes ?? 0; const histEntry: SessionHistoryEntry = { id: uid(), ts: Date.now(), consoleId: c.id, consoleName: c.name, customer: c.session.customerName, minutes: mins, amount: 0, prepaid: true }; set({ consoles: (s.consoles||[]).map((x) => x?.id === consoleId ? { ...x, session: undefined, charges: [], totalMinutes: (x.totalMinutes||0) + mins, maintenanceMinutes: (x.maintenanceMinutes || 0) + mins } : x ), sessionHistory: [histEntry, ...(s.sessionHistory||[])] }); return true; },
      payExtras: (consoleId, payload) => set((s) => { const c = (s.consoles||[]).find((x) => x?.id === consoleId); if (!c || (c.charges || []).length === 0) return s; const sale: SaleRecord = { id: uid(), ts: Date.now(), consoleId: c.id, consoleName: c.name, minutes: 0, timeAmount: 0, extrasAmount: payload.total, total: payload.total, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, mobileBank: payload.mobileBank, mobileRef: payload.mobileRef, rate: s.rate, method: payload.method, customer: payload.customer, concept: "Adicionales", items: (c.charges || []).map((ch) => ({ name: ch.label, qty: 1, price: ch.amount })) }; const newCredits = payload.method === "credit" ? [...(s.credits||[]), { id: uid(), customer: payload.customer || "Sin nombre", amount: payload.total, createdAt: Date.now(), note: `Adicionales ${c.name}` }] : (s.credits||[]); return { consoles: (s.consoles||[]).map((x) => x?.id === consoleId ? { ...x, charges: [] } : x), sales: payload.method === "credit" ? (s.sales||[]) : [...(s.sales||[]), sale], credits: newCredits }; }),
      extendPaidSession: (consoleId, addMinutes, payload) => set((s) => { 
        const c = (s.consoles||[]).find((x) => x?.id === consoleId); 
        if (!c || !c.session) return s; 
        const base = c.session.endsAt && c.session.endsAt > Date.now() ? c.session.endsAt : Date.now(); 
        const newEnds = base + addMinutes * 60_000; 
        const saleId = uid(); 
        const sale: SaleRecord = { id: saleId, ts: Date.now(), consoleId: c.id, consoleName: c.name, minutes: addMinutes, timeAmount: payload.total, extrasAmount: 0, total: payload.total, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, mobileBank: payload.mobileBank, mobileRef: payload.mobileRef, rate: s.rate, method: payload.method, customer: payload.customer || c.session.customerName, concept: "Consola", items: [{ name: `Extensión ${c.name} (+${addMinutes} min)`, qty: 1, price: payload.total }] }; 
        const newCredits = payload.method === "credit" ? [...(s.credits||[]), { id: uid(), customer: payload.customer || c.session.customerName || "Sin nombre", amount: payload.total, createdAt: Date.now(), note: `Extensión ${c.name}` }] : (s.credits||[]); 
        return { consoles: (s.consoles||[]).map((x) => x?.id === consoleId ? { ...x, session: { ...x.session!, mode: "fixed", endsAt: newEnds, prepaidMinutes: (x.session!.prepaidMinutes ?? 0) + addMinutes, alerted: false, preAlerted: false, prepaidSaleIds: [...(x.session!.prepaidSaleIds || []), saleId] } } : x ), sales: payload.method === "credit" ? (s.sales||[]) : [...(s.sales||[]), sale], credits: newCredits }; 
      }),
      addExpense: ({ ts, ...rest }) => set((s) => ({ expenses: [ { id: uid(), ts: ts ?? Date.now(), createdAt: Date.now(), rate: s.rate, ...rest }, ...(s.expenses||[]) ] })),
      setConsoleRate: (type, ratePerHour) => set((s) => ({ consoles: (s.consoles||[]).map((c) => c?.type === type ? { ...c, ratePerHour: Math.max(0, ratePerHour) } : c ) })),
      deleteSale: (id) => set((s) => ({ sales: (s.sales||[]).filter((x) => x?.id !== id) })),
      resetConsoleStats: (consoleId) => set((s) => ({ consoles: (s.consoles||[]).map((c) => c?.id === consoleId ? { ...c, totalMinutes: 0, maintenanceMinutes: 0 } : c), sessionHistory: (s.sessionHistory||[]).filter((h) => h?.consoleId !== consoleId) })),
      
      // ===============================================
      // NUEVA LÓGICA DE TORNEOS (MK y FIFA)
      // ===============================================
      createTournament: (t) => set((s) => {
        const gameLower = t.game.toLowerCase();
        const isMK = gameLower.includes('mortal') || gameLower.includes('mk') || gameLower.includes('kombat') || gameLower.includes('tekken') || gameLower.includes('street');
        const isFIFA = gameLower.includes('fifa') || gameLower.includes('fc') || gameLower.includes('pes') || gameLower.includes('efootball');

        const newTournament: Tournament = {
          ...t,
          id: uid(),
          createdAt: Date.now(),
          status: 'registering',
          format: t.format || (isMK ? 'double_elimination' : 'groups'),
          defaultMatchFormat: t.defaultMatchFormat || (isMK ? 'FT2' : undefined),
          allowDraws: isFIFA && t.format === 'groups'
        };
        return { tournaments: [...(s.tournaments||[]), newTournament] };
      }),
      updateTournament: (id, data) => set((s) => ({ tournaments: (s.tournaments||[]).map(t => t?.id === id ? { ...t, ...data } : t) })),
      deleteTournament: (id) => set((s) => { const parts = (s.participants||[]).filter(p => p?.tournamentId === id); const saleIds = parts.map(p => p?.enrollSaleId).filter(Boolean); return { tournaments: (s.tournaments||[]).filter(t => t?.id !== id), participants: (s.participants||[]).filter(p => p?.tournamentId !== id), matches: (s.matches||[]).filter(m => m?.tournamentId !== id), sales: (s.sales||[]).filter(sale => !saleIds.includes(sale?.id)) }; }),
      
      enrollParticipant: (tournamentId, memberName, phone, isPaid, payload, teamName) => set((s) => { 
        const t = (s.tournaments||[]).find(x => x?.id === tournamentId); if (!t) return s; 
        const participantId = uid(); let enrollSaleId = undefined; let newSales = s.sales || []; 
        if (isPaid && payload) { 
          enrollSaleId = uid(); const sale: SaleRecord = { id: enrollSaleId, ts: Date.now(), timeAmount: 0, extrasAmount: payload.total, total: payload.total, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, mobileBank: payload.mobileBank, cashBs: payload.cashBs || 0, rate: s.rate, method: payload.method, customer: memberName, concept: `Inscripción Torneo: ${t.name}`, items: [{ name: `Inscripción: ${t.name}`, qty: 1, price: payload.total }] }; 
          newSales = [...newSales, sale]; 
        } 
        const p: TournamentParticipant = { id: participantId, tournamentId, memberName, phone, paymentStatus: isPaid ? "paid" : "pending", enrolledAt: Date.now(), enrollSaleId, teamName }; 
        return { participants: [...(s.participants||[]), p], sales: newSales }; 
      }),
      updateParticipant: (id, data) => set((s) => ({ participants: (s.participants||[]).map(p => p?.id === id ? { ...p, ...data } : p) })),
      removeParticipant: (participantId) => set((s) => { const p = (s.participants||[]).find(x => x?.id === participantId); if (!p) return s; return { participants: (s.participants||[]).filter(x => x?.id !== participantId), sales: p.enrollSaleId ? (s.sales||[]).filter(sale => sale?.id !== p.enrollSaleId) : (s.sales||[]) }; }),
      payEnrollment: (participantId, payload) => set((s) => { const p = (s.participants||[]).find(x => x?.id === participantId); if (!p) return s; const t = (s.tournaments||[]).find(x => x?.id === p.tournamentId); const enrollSaleId = uid(); const sale: SaleRecord = { id: enrollSaleId, ts: Date.now(), timeAmount: 0, extrasAmount: payload.total, total: payload.total, cashUsd: payload.cashUsd, mobileBs: payload.mobileBs, mobileBank: payload.mobileBank, cashBs: payload.cashBs || 0, rate: s.rate, method: payload.method, customer: p.memberName, concept: `Pago de Inscripción: ${t?.name || 'Torneo'}`, items: [{ name: `Pago Inscripción: ${p.memberName}`, qty: 1, price: payload.total }] }; return { participants: (s.participants||[]).map(x => x?.id === participantId ? { ...x, paymentStatus: "paid", enrollSaleId } : x), sales: [...(s.sales||[]), sale] }; }),
      
      assignConsoleToMatch: (matchId, consoleId) => set((s) => ({ matches: (s.matches||[]).map(m => m?.id === matchId ? { ...m, assignedConsoleId: consoleId } : m) })),
      updateMatchFormat: (matchId, matchFormat) => set((s) => ({ matches: (s.matches||[]).map(m => m?.id === matchId ? { ...m, matchFormat } : m) })),

      generateBracket: (tournamentId) => set((s) => { 
        const t = (s.tournaments||[]).find(x => x?.id === tournamentId); 
        const parts = (s.participants||[]).filter(p => p?.tournamentId === tournamentId); 
        
        if (!t) return s; 
        if (parts.length < 2) { alert("¡Debe haber mínimo 2 jugadores inscritos para comenzar el torneo!"); return s; }
        
        const matches: TournamentMatch[] = []; 
        let finalParts = parts;

        if (t.format === "league" || t.format === "groups") {
          const numGroups = t.format === "groups" ? (t.groupCount || 2) : 1;
          const groupsList = ["A", "B", "C", "D", "E", "F", "G", "H"].slice(0, numGroups);
          
          const shuffled = [...parts].sort(() => Math.random() - 0.5);
          finalParts = shuffled.map((p, idx) => ({ ...p, groupName: t.format === "groups" ? groupsList[idx % numGroups] : undefined }));

          let matchIndex = 0;
          for (let g = 0; g < numGroups; g++) {
              const gName = t.format === "groups" ? groupsList[g] : undefined;
              const gParts = finalParts.filter(p => p.groupName === gName);
              
              const players = [...gParts];
              if (players.length % 2 !== 0) players.push({ id: "bye", memberName: "BYE", groupName: gName } as any);
              const numRounds = players.length - 1;
              const half = players.length / 2;

              for (let r = 0; r < numRounds; r++) {
                  for (let i = 0; i < half; i++) {
                      const p1 = players[i];
                      const p2 = players[players.length - 1 - i];
                      if (p1.id !== "bye" && p2.id !== "bye") {
                          matches.push({ id: uid(), tournamentId, round: r + 1, matchIndex: matchIndex++, player1Id: p1.id, player2Id: p2.id, isDraw: false, groupName: gName, phase: "groups", matchFormat: t.defaultMatchFormat || "FT2" });
                      }
                  }
                  players.splice(1, 0, players.pop()!);
              }
          }
        } else if (t.format === "single_elimination" || t.format === "double_elimination") {
          const shuffled = [...parts].sort(() => Math.random() - 0.5);
          const totalPlayers = shuffled.length;
          const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(totalPlayers)));
          const byes = nextPowerOf2 - totalPlayers;

          const firstRoundMatches = nextPowerOf2 / 2;
          let pIndex = 0;
          const wMatches: TournamentMatch[] = [];

          for (let i = 0; i < firstRoundMatches; i++) {
            const p1 = shuffled[pIndex++];
            const p2 = byes > i ? null : shuffled[pIndex++];
            wMatches.push({ id: uid(), tournamentId, phase: "knockout", bracket: "winners", player1Id: p1?.id, player2Id: p2?.id, winnerId: !p2 ? p1?.id : undefined, round: 1, matchIndex: i, matchFormat: t.defaultMatchFormat });
          }

          let currentRoundMatches = wMatches;
          let roundNum = 2;
          const allWinners = [...wMatches];

          while (currentRoundMatches.length > 1) {
            const nextRoundMatches: TournamentMatch[] = [];
            for (let i = 0; i < currentRoundMatches.length; i += 2) {
              const match: TournamentMatch = { id: uid(), tournamentId, phase: "knockout", bracket: "winners", round: roundNum, matchIndex: i / 2, matchFormat: t.defaultMatchFormat };
              currentRoundMatches[i].nextMatchId = match.id;
              if (currentRoundMatches[i+1]) currentRoundMatches[i+1].nextMatchId = match.id;
              nextRoundMatches.push(match);
              allWinners.push(match);
            }
            currentRoundMatches = nextRoundMatches;
            roundNum++;
          }
          matches.push(...allWinners);

          if (t.format === "double_elimination") {
            const losersRounds = (Math.log2(nextPowerOf2) - 1) * 2;
            let lMatchCount = firstRoundMatches / 2;
            let lRoundNum = 1;
            let previousLosersRound: TournamentMatch[] = [];
            const allLosers: TournamentMatch[] = [];

            while (lRoundNum <= losersRounds) {
              const currentLMatches: TournamentMatch[] = [];
              for (let i = 0; i < lMatchCount; i++) {
                const lMatch: TournamentMatch = { id: uid(), tournamentId, phase: "knockout", bracket: "losers", round: lRoundNum, matchIndex: i, matchFormat: t.defaultMatchFormat };
                if (lRoundNum > 1 && lRoundNum % 2 !== 0 && previousLosersRound.length > 0) {
                   if(previousLosersRound[i*2]) previousLosersRound[i*2].nextMatchId = lMatch.id;
                   if (previousLosersRound[i*2+1]) previousLosersRound[i*2+1].nextMatchId = lMatch.id;
                } else if (lRoundNum > 1 && lRoundNum % 2 === 0 && previousLosersRound.length > 0) {
                   if(previousLosersRound[i]) previousLosersRound[i].nextMatchId = lMatch.id;
                }
                currentLMatches.push(lMatch);
                allLosers.push(lMatch);
              }
              previousLosersRound = currentLMatches;
              if (lRoundNum % 2 !== 0 && lMatchCount > 1) lMatchCount /= 2;
              lRoundNum++;
            }
            matches.push(...allLosers);

            const grandFinal: TournamentMatch = { id: uid(), tournamentId, phase: "knockout", bracket: "grand_finals", round: 1, matchIndex: 0, matchFormat: t.defaultMatchFormat };
            const winnersFinal = allWinners[allWinners.length - 1];
            const losersFinal = allLosers[allLosers.length - 1];
            if (winnersFinal) winnersFinal.nextMatchId = grandFinal.id;
            if (losersFinal) losersFinal.nextMatchId = grandFinal.id;
            matches.push(grandFinal);
          }
        }

        const updatedTourneys = (s.tournaments||[]).map((x) => x?.id === tournamentId ? { ...x, status: "active" as "active" } : x);
        const updatedParts = (s.participants||[]).map(p => { const fp = finalParts.find(x => x.id === p.id); return fp ? fp : p; });
        return { tournaments: updatedTourneys, participants: updatedParts, matches: [...(s.matches||[]), ...matches] };
      }),
      
      generateKnockoutFromGroups: (tournamentId) => set((s) => {
        const t = (s.tournaments||[]).find(x => x?.id === tournamentId);
        if (!t || t.format !== "groups") return s;
        const groupMatches = (s.matches||[]).filter(m => m?.tournamentId === tournamentId && m.phase === "groups");
        if (!groupMatches.every(m => m.winnerId || m.isDraw)) { alert("¡Aún hay partidos pendientes en la fase de grupos!"); return s; }

        const parts = (s.participants||[]).filter(p => p?.tournamentId === tournamentId);
        const groups = Array.from(new Set(parts.map(p => p.groupName).filter(Boolean))) as string[];
        const qualified: TournamentParticipant[] = [];

        groups.forEach(g => {
          const gParts = parts.filter(p => p.groupName === g);
          const stats: Record<string, any> = {};
          gParts.forEach(p => stats[p.id] = { ...p, pts: 0, gd: 0 });
          const gM = groupMatches.filter(m => m.groupName === g);
          
          gM.forEach(m => {
            const s1 = m.score1 || 0; const s2 = m.score2 || 0;
            if (m.winnerId === m.player1Id) { stats[m.player1Id!].pts += 3; stats[m.player1Id!].gd += (s1 - s2); stats[m.player2Id!].gd += (s2 - s1); }
            else if (m.winnerId === m.player2Id) { stats[m.player2Id!].pts += 3; stats[m.player2Id!].gd += (s2 - s1); stats[m.player1Id!].gd += (s1 - s2); }
            else if (m.isDraw) { stats[m.player1Id!].pts += 1; stats[m.player2Id!].pts += 1; }
          });
          
          const sorted = Object.values(stats).sort((a: any, b: any) => { if (b.pts !== a.pts) return b.pts - a.pts; return b.gd - a.gd; });
          if (sorted[0]) qualified.push(sorted[0]);
          if (sorted[1]) qualified.push(sorted[1]);
        });

        const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(qualified.length)));
        const byes = nextPowerOf2 - qualified.length;
        const firstRoundMatches = nextPowerOf2 / 2;
        let pIndex = 0;
        const kMatches: TournamentMatch[] = [];
        
        for (let i = 0; i < firstRoundMatches; i++) {
          const p1 = qualified[pIndex++];
          const p2 = byes > i ? null : qualified[pIndex++];
          kMatches.push({ id: uid(), tournamentId, phase: "knockout", player1Id: p1?.id, player2Id: p2?.id, winnerId: !p2 ? p1?.id : undefined, round: 1, matchIndex: i });
        }

        let currentRoundMatches = kMatches;
        let roundNum = 2;
        
        while (currentRoundMatches.length > 1) {
          const nextRoundMatches: TournamentMatch[] = [];
          for (let i = 0; i < currentRoundMatches.length; i += 2) {
            const match: TournamentMatch = { id: uid(), tournamentId, phase: "knockout", round: roundNum, matchIndex: i / 2 };
            currentRoundMatches[i].nextMatchId = match.id;
            if (currentRoundMatches[i+1]) currentRoundMatches[i+1].nextMatchId = match.id;
            nextRoundMatches.push(match);
            kMatches.push(match);
          }
          currentRoundMatches = nextRoundMatches;
          roundNum++;
        }
        return { matches: [...(s.matches||[]), ...kMatches] };
      }),

      setMatchScore: (matchId, score1, score2, penalties1, penalties2) => set((s) => {
        const mIndex = (s.matches||[]).findIndex((m) => m?.id === matchId);
        if (mIndex === -1) return s;
        const m = s.matches[mIndex];
        const newMatches = [...s.matches];
        const tourney = (s.tournaments||[]).find((t) => t?.id === m.tournamentId);
        
        let winnerId: string | undefined;
        let loserId: string | undefined;
        let isDraw = false;

        if (score1 > score2) { winnerId = m.player1Id; loserId = m.player2Id; } 
        else if (score2 > score1) { winnerId = m.player2Id; loserId = m.player1Id; } 
        else {
          if (tourney && tourney.format === "groups" && tourney.allowDraws) { isDraw = true; } 
          else if (penalties1 !== undefined && penalties2 !== undefined) {
             if (penalties1 > penalties2) { winnerId = m.player1Id; loserId = m.player2Id; } 
             else if (penalties2 > penalties1) { winnerId = m.player2Id; loserId = m.player1Id; }
          } else {
             alert("En este torneo no se permiten empates. Debe haber un ganador.");
             return s;
          }
        }

        newMatches[mIndex] = { ...m, score1, score2, winnerId, isDraw, penalties1, penalties2, assignedConsoleId: undefined };

        if (tourney && tourney.format !== "league" && m.phase === "knockout" && winnerId) {
          if (m.nextMatchId) {
            const nextIdx = newMatches.findIndex((nx) => nx?.id === m.nextMatchId);
            if (nextIdx !== -1) {
              const nextM = { ...newMatches[nextIdx] };
              if (!nextM.player1Id) nextM.player1Id = winnerId;
              else if (!nextM.player2Id && nextM.player1Id !== winnerId) nextM.player2Id = winnerId;
              newMatches[nextIdx] = nextM;
            }
          }
          if (tourney.format === "double_elimination" && m.bracket === "winners" && loserId) {
            const targetLosersRound = m.round === 1 ? 1 : (m.round - 1) * 2;
            const targetMatchIdx = newMatches.findIndex(nx => nx?.tournamentId === m.tournamentId && nx.bracket === "losers" && nx.round === targetLosersRound && (!nx.player1Id || !nx.player2Id));
            if (targetMatchIdx !== -1) {
              const targetM = { ...newMatches[targetMatchIdx] };
              if (!targetM.player1Id) targetM.player1Id = loserId;
              else if (!targetM.player2Id && targetM.player1Id !== loserId) targetM.player2Id = loserId;
              newMatches[targetMatchIdx] = targetM;
            }
          }
          if (m.bracket === "grand_finals" && tourney.format === "double_elimination") {
            const isLoserBracketWinner = s.matches.some(prevM => prevM?.bracket === "losers" && prevM.winnerId === winnerId && prevM.nextMatchId === m.id);
            if (isLoserBracketWinner && !m.nextMatchId) {
               const grandFinalReset: TournamentMatch = { id: uid(), tournamentId: m.tournamentId, phase: "knockout", bracket: "grand_finals", player1Id: m.player1Id, player2Id: m.player2Id, round: 2, matchIndex: 0, matchFormat: tourney.defaultMatchFormat };
               newMatches[mIndex] = { ...newMatches[mIndex], nextMatchId: grandFinalReset.id };
               newMatches.push(grandFinalReset);
            }
          }
        }
        return { matches: newMatches };
      }),
      setMatchWinner: (matchId, winnerId) => set((s) => { return s; }), // Mantenida por retrocompatibilidad
      setMatchDraw: (matchId) => set((s) => { return s; }), // Mantenida por retrocompatibilidad
      
      revertMatchWinner: (matchId) => set((s) => {
        const m = (s.matches||[]).find(x => x?.id === matchId);
        if (!m || (!m.winnerId && !m.isDraw)) return s;
        const newMatches = (s.matches||[]).map(x => {
          if (x?.id === matchId) return { ...x, winnerId: undefined, isDraw: false, score1: undefined, score2: undefined, penalties1: undefined, penalties2: undefined };
          if (x?.nextMatchId === m.nextMatchId || (m.nextMatchId && x?.id === m.nextMatchId)) {
             if (x.player1Id === m.winnerId) return { ...x, player1Id: undefined };
             if (x.player2Id === m.winnerId) return { ...x, player2Id: undefined };
          }
          if (m.bracket === "winners" && x?.bracket === "losers" && (x.player1Id === m.player1Id || x.player1Id === m.player2Id || x.player2Id === m.player1Id || x.player2Id === m.player2Id)) {
             if (x.player1Id === m.player1Id || x.player1Id === m.player2Id) return { ...x, player1Id: undefined };
             if (x.player2Id === m.player1Id || x.player2Id === m.player2Id) return { ...x, player2Id: undefined };
          }
          return x;
        });
        const cleanedMatches = newMatches.filter(x => !(x.bracket === "grand_finals" && x.round === 2 && m.bracket === "grand_finals"));
        return { matches: cleanedMatches };
      }),
      revertTournamentToRegistering: (tournamentId) => set((s) => ({ tournaments: (s.tournaments||[]).map(t => t?.id === tournamentId ? { ...t, status: "registering" as "registering" } : t), matches: (s.matches||[]).filter(m => m?.tournamentId !== tournamentId) }))
    }),
    {
      name: "gamerzone-store-v1",
      storage: {
        getItem: async (name) => { try { const { data, error } = await supabase.from('app_state').select('state').eq('id', name).maybeSingle(); if (!error && data && data.state) { const safeData = vaccinateZustandPayload(data.state); localStorage.setItem(name, JSON.stringify(safeData)); return safeData; } } catch (err) {} const local = localStorage.getItem(name); if (local) { try { return vaccinateZustandPayload(JSON.parse(local)); } catch(e) {} } return null; },
        setItem: async (name, value) => { localStorage.setItem(name, typeof value === 'string' ? value : JSON.stringify(value)); if ((window as any).pausarSubida) return; (window as any).pausarDescarga = true; if ((window as any).relojBloqueo) clearTimeout((window as any).relojBloqueo); (window as any).relojBloqueo = setTimeout(() => { (window as any).pausarDescarga = false; }, 3500); (window as any).estadoPendiente = value; if ((window as any).relojSubida) clearTimeout((window as any).relojSubida); (window as any).relojSubida = setTimeout(async () => { if ((window as any).pausarSubida) return; try { await supabase.from('app_state').upsert({ id: name, state: typeof (window as any).estadoPendiente === 'string' ? JSON.parse((window as any).estadoPendiente) : (window as any).estadoPendiente }); } catch (err) {} }, 800); },
        removeItem: async (name) => { localStorage.removeItem(name); try { await supabase.from('app_state').delete().eq('id', name); } catch (err) {} }
      }
    }
  )
);

export const fmtUsd = (n: number) => { if (isNaN(n)) return "$0.00"; return `$${(n || 0).toFixed(2)}`; };
export const fmtBs = (usd: number, rate: number) => { if (isNaN(usd) || isNaN(rate)) return "Bs 0.00"; return `Bs ${((usd || 0) * rate).toLocaleString("es-VE", { maximumFractionDigits: 2 })}`; };
export const computeTimeAmount = (consoleObj: ConsoleState, nowMs: number): { minutes: number; amount: number } => { if (!consoleObj || !consoleObj.session) return { minutes: 0, amount: 0 }; const ref = consoleObj.session.pausedAt ?? nowMs; const elapsedMs = Math.max(0, ref - (consoleObj.session.startedAt || ref)); const minutes = Math.ceil(elapsedMs / 60_000); if (consoleObj.session.isTournament) return { minutes, amount: 0 }; return { minutes, amount: (minutes / 60) * (consoleObj.ratePerHour || 0) }; };

const resyncFromCloud = async () => { if ((window as any).pausarDescarga) return; (window as any).pausarSubida = true; try { const { data, error } = await supabase.from('app_state').select('state').eq('id', 'gamerzone-store-v1').maybeSingle(); if ((window as any).pausarDescarga) return; if (!error && data && data.state) { const safeData = vaccinateZustandPayload(data.state); const estadoActual = JSON.stringify(useStore.getState()); if (safeData?.state && estadoActual !== JSON.stringify(safeData.state)) { useStore.setState(safeData.state); localStorage.setItem("gamerzone-store-v1", JSON.stringify(safeData)); } } } catch (e) { } finally { setTimeout(() => { (window as any).pausarSubida = false; }, 500); } };
const channel = supabase.channel('escuchar-nube'); channel.on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, () => { resyncFromCloud(); }).subscribe((status) => { if (status === 'CLOSED' || status === 'CHANNEL_ERROR') { setTimeout(() => supabase.channel('escuchar-nube').subscribe(), 5000); } });
window.addEventListener('online', resyncFromCloud); window.addEventListener('focus', resyncFromCloud); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { resyncFromCloud(); } }); setInterval(() => { if (document.visibilityState === 'visible') resyncFromCloud(); }, 15000);