import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const fmtUsd = (val: number) => `$${val.toFixed(2)}`;
export const fmtBs = (val: number) => `Bs${val.toFixed(2)}`;

export interface Member {
  id: string;
  name: string;
  phone?: string;
  idDoc?: string;
  totalMinutes?: number;
  joinedAt: number;
}

export interface Console {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
}

export interface PrepaidSession {
  id: string;
  consoleId: string;
  memberId?: string;
  customerName?: string;
  startTime: number;
  durationMinutes: number;
  endTime: number;
  status: 'active' | 'paused' | 'completed';
  remainingPausedMinutes?: number;
  saleId?: string;
  isPaid?: boolean;
}

export interface SaleItem {
  name: string;
  qty: number;
  price: number;
}

export interface Sale {
  id: string;
  ts: number;
  concept: string;
  items: SaleItem[];
  total: number;
  method: 'cash' | 'mobile' | 'card' | 'mixed' | 'cash_bs';
  cashUsd: number;
  mobileBs: number;
  cashBs?: number;
  mobileBank?: string;
  rate: number;
  customer?: string;
  isTournamentEnrollment?: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  game: string; // Ejemplo: "Mortal Kombat 1", "FIFA 24"
  dateRange: string;
  status: 'registering' | 'active' | 'completed';
  entryFee: number;
  prizePercentage: number;
  maxPlayers: number;
  format: "single_elimination" | "double_elimination" | "league" | "groups";
  groupCount?: number;
  defaultMatchFormat?: "FT2" | "FT3" | "FT5";
  allowDraws?: boolean; // Automático: true para FIFA en grupos, false para MK
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  memberName: string;
  phone?: string;
  paymentStatus: 'pending' | 'paid';
  enrollSaleId?: string;
  groupName?: string;
  teamName?: string; // Para FIFA: Ej. "Real Madrid"
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  phase: 'groups' | 'knockout';
  bracket?: "winners" | "losers" | "grand_finals";
  groupName?: string;
  player1Id?: string;
  player2Id?: string;
  winnerId?: string;
  isDraw?: boolean;
  score1?: number;
  score2?: number;
  round: number;
  matchIndex: number;
  nextMatchId?: string;
  assignedConsoleId?: string;
  matchFormat?: "FT2" | "FT3" | "FT5";
  penalties1?: number; // Para empates en eliminatorias de FIFA
  penalties2?: number;
}

export interface StoreState {
  rate: number;
  setRate: (rate: number) => void;

  members: Member[];
  addMember: (m: Omit<Member, 'id' | 'joinedAt'>) => void;
  updateMember: (id: string, m: Partial<Member>) => void;
  deleteMember: (id: string) => void;

  consoles: Console[];
  addConsole: (c: Omit<Console, 'id'>) => void;
  updateConsole: (id: string, c: Partial<Console>) => void;
  deleteConsole: (id: string) => void;

  prepaidSessions: PrepaidSession[];
  addSession: (s: Omit<PrepaidSession, 'id' | 'status' | 'isPaid'>, isPaid: boolean, saleData?: Omit<Sale, 'id' | 'ts' | 'rate' | 'concept'>) => void;
  updateSession: (id: string, s: Partial<PrepaidSession>) => void;
  deleteSession: (id: string) => void;
  updateSessionStatus: (id: string, status: 'active' | 'paused' | 'completed') => void;
  pauseSession: (id: string, remainingTime: number) => void;
  resumeSession: (id: string) => void;
  completeSession: (id: string) => void;
  updateSessionTime: (id: string, additionalMinutes: number) => void;
  chargeSession: (id: string, saleData: Omit<Sale, 'id' | 'ts' | 'rate' | 'concept'>) => void;

  sales: Sale[];
  addSale: (s: Omit<Sale, 'id'>) => void;
  deleteSale: (id: string) => void;
  clearDailySales: () => void;

  tournaments: Tournament[];
  participants: TournamentParticipant[];
  matches: TournamentMatch[];
  createTournament: (t: Omit<Tournament, 'id' | 'status'>) => void;
  updateTournament: (id: string, t: Partial<Tournament>) => void;
  deleteTournament: (id: string) => void;
  enrollParticipant: (tournamentId: string, memberName: string, phone?: string, isPaid?: boolean, saleData?: any, teamName?: string) => void;
  updateParticipant: (id: string, data: Partial<TournamentParticipant>) => void;
  removeParticipant: (id: string) => void;
  payEnrollment: (participantId: string, saleData: any) => void;
  
  revertTournamentToRegistering: (tournamentId: string) => void;
  generateBracket: (tournamentId: string) => void;
  setMatchScore: (matchId: string, score1: number, score2: number, penalties1?: number, penalties2?: number) => void;
  revertMatchWinner: (matchId: string) => void;
  generateKnockoutFromGroups: (tournamentId: string) => void;
  assignConsoleToMatch: (matchId: string, consoleId: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      rate: 36.5,
      setRate: (rate) => set({ rate }),

      members: [],
      addMember: (m) => set((s) => ({ members: [...s.members, { ...m, id: crypto.randomUUID(), joinedAt: Date.now(), totalMinutes: 0 }] })),
      updateMember: (id, m) => set((s) => ({ members: s.members.map((x) => (x.id === id ? { ...x, ...m } : x)) })),
      deleteMember: (id) => set((s) => ({ members: s.members.filter((x) => x.id !== id) })),

      consoles: [],
      addConsole: (c) => set((s) => ({ consoles: [...s.consoles, { ...c, id: crypto.randomUUID() }] })),
      updateConsole: (id, c) => set((s) => ({ consoles: s.consoles.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
      deleteConsole: (id) => set((s) => ({ consoles: s.consoles.filter((x) => x.id !== id) })),

      prepaidSessions: [],
      addSession: (s, isPaid, saleData) => set((state) => {
        const sessionId = crypto.randomUUID();
        let saleId = undefined;
        let newSales = state.sales;

        if (isPaid && saleData) {
          saleId = crypto.randomUUID();
          const concept = `Sesión: ${state.consoles.find((c) => c.id === s.consoleId)?.name || 'Consola'} - ${s.customerName || state.members.find(m => m.id === s.memberId)?.name || 'Cliente'}`;
          const newSale: Sale = {
            id: saleId,
            ts: Date.now(),
            concept,
            ...saleData,
            rate: state.rate,
            customer: s.customerName || state.members.find(m => m.id === s.memberId)?.name
          };
          newSales = [...state.sales, newSale];
        }

        return {
          prepaidSessions: [...state.prepaidSessions, { ...s, id: sessionId, status: 'active', isPaid, saleId }],
          sales: newSales
        };
      }),
      updateSession: (id, s) => set((state) => ({ prepaidSessions: state.prepaidSessions.map((x) => (x.id === id ? { ...x, ...s } : x)) })),
      deleteSession: (id) => set((state) => ({ prepaidSessions: state.prepaidSessions.filter((x) => x.id !== id) })),
      updateSessionStatus: (id, status) => set((state) => ({ prepaidSessions: state.prepaidSessions.map((x) => (x.id === id ? { ...x, status } : x)) })),
      pauseSession: (id, remaining) => set((state) => ({ prepaidSessions: state.prepaidSessions.map((x) => (x.id === id ? { ...x, status: 'paused', remainingPausedMinutes: remaining, endTime: Date.now() } : x)) })),
      resumeSession: (id) => set((state) => ({ prepaidSessions: state.prepaidSessions.map((x) => {
        if (x.id !== id) return x;
        const remaining = x.remainingPausedMinutes || 0;
        const now = Date.now();
        return { ...x, status: 'active', startTime: now, endTime: now + remaining * 60000, remainingPausedMinutes: undefined };
      }) })),
      completeSession: (id) => set((state) => {
        const session = state.prepaidSessions.find(s => s.id === id);
        if (!session) return state;
        let updatedMembers = state.members;
        if (session.memberId) {
           updatedMembers = state.members.map(m => m.id === session.memberId ? { ...m, totalMinutes: (m.totalMinutes || 0) + session.durationMinutes } : m);
        }
        return {
           prepaidSessions: state.prepaidSessions.map((x) => (x.id === id ? { ...x, status: 'completed', endTime: Date.now() } : x)),
           members: updatedMembers
        };
      }),
      updateSessionTime: (id, extra) => set((state) => ({ prepaidSessions: state.prepaidSessions.map((x) => {
        if (x.id !== id) return x;
        return { ...x, durationMinutes: x.durationMinutes + extra, endTime: x.endTime + extra * 60000 };
      }) })),
      chargeSession: (id, saleData) => set((state) => {
         const session = state.prepaidSessions.find(s => s.id === id);
         if (!session || session.isPaid) return state;
         
         const saleId = crypto.randomUUID();
         const concept = `Sesión: ${state.consoles.find((c) => c.id === session.consoleId)?.name || 'Consola'} - ${session.customerName || state.members.find(m => m.id === session.memberId)?.name || 'Cliente'}`;
         
         const newSale: Sale = {
            id: saleId,
            ts: Date.now(),
            concept,
            ...saleData,
            rate: state.rate,
            customer: session.customerName || state.members.find(m => m.id === session.memberId)?.name
         };

         return {
            prepaidSessions: state.prepaidSessions.map((x) => (x.id === id ? { ...x, isPaid: true, saleId } : x)),
            sales: [...state.sales, newSale]
         };
      }),

      sales: [],
      addSale: (s) => set((state) => ({ sales: [...state.sales, { ...s, id: crypto.randomUUID() }] })),
      deleteSale: (id) => set((state) => ({ sales: state.sales.filter((x) => x.id !== id) })),
      clearDailySales: () => set((state) => {
        const activeOrUnpaidSessions = state.prepaidSessions.filter(s => s.status !== 'completed' || !s.isPaid);
        return { sales: [], prepaidSessions: activeOrUnpaidSessions };
      }),

      tournaments: [],
      participants: [],
      matches: [],
      
      createTournament: (t) => set((state) => {
        // ASIGNACIÓN AUTOMÁTICA DE REGLAS SEGÚN EL JUEGO
        const gameLower = t.game.toLowerCase();
        const isMK = gameLower.includes('mortal') || gameLower.includes('mk') || gameLower.includes('kombat') || gameLower.includes('tekken') || gameLower.includes('street');
        const isFIFA = gameLower.includes('fifa') || gameLower.includes('fc') || gameLower.includes('pes') || gameLower.includes('efootball');

        const newTournament: Tournament = {
          ...t,
          id: crypto.randomUUID(),
          status: 'registering',
          format: t.format || (isMK ? 'double_elimination' : 'groups'),
          defaultMatchFormat: t.defaultMatchFormat || (isMK ? 'FT2' : undefined),
          allowDraws: isFIFA && t.format === 'groups'
        };

        return { tournaments: [...state.tournaments, newTournament] };
      }),

      updateTournament: (id, t) => set((state) => ({ tournaments: state.tournaments.map((x) => (x.id === id ? { ...x, ...t } : x)) })),
      deleteTournament: (id) => set((state) => ({
        tournaments: state.tournaments.filter(t => t.id !== id),
        participants: state.participants.filter(p => p.tournamentId !== id),
        matches: state.matches.filter(m => m.tournamentId !== id)
      })),

      enrollParticipant: (tournamentId, memberName, phone, isPaid, saleData, teamName) => set((state) => {
        const t = state.tournaments.find(x => x.id === tournamentId);
        if (!t) return state;
        
        let enrollSaleId = undefined;
        let newSales = state.sales;

        if (isPaid && saleData && t.entryFee > 0) {
           enrollSaleId = crypto.randomUUID();
           newSales = [...state.sales, {
             id: enrollSaleId,
             ts: Date.now(),
             concept: `Torneo: ${t.name}`,
             ...saleData,
             rate: state.rate,
             customer: memberName,
             isTournamentEnrollment: true
           }];
        }

        const newPart: TournamentParticipant = {
          id: crypto.randomUUID(),
          tournamentId,
          memberName,
          phone,
          paymentStatus: isPaid || t.entryFee === 0 ? 'paid' : 'pending',
          enrollSaleId,
          teamName
        };

        return { participants: [...state.participants, newPart], sales: newSales };
      }),

      updateParticipant: (id, data) => set((state) => ({ participants: state.participants.map(p => p.id === id ? { ...p, ...data } : p) })),
      removeParticipant: (id) => set((state) => ({ participants: state.participants.filter(p => p.id !== id) })),

      payEnrollment: (participantId, saleData) => set((state) => {
         const p = state.participants.find(x => x.id === participantId);
         if (!p) return state;
         const t = state.tournaments.find(x => x.id === p.tournamentId);
         if (!t) return state;

         const saleId = crypto.randomUUID();
         const newSale: Sale = {
             id: saleId,
             ts: Date.now(),
             concept: `Torneo: ${t.name}`,
             ...saleData,
             rate: state.rate,
             customer: p.memberName,
             isTournamentEnrollment: true
         };

         return {
            participants: state.participants.map(x => x.id === participantId ? { ...x, paymentStatus: 'paid', enrollSaleId: saleId } : x),
            sales: [...state.sales, newSale]
         };
      }),

      revertTournamentToRegistering: (tournamentId) => set((state) => ({
         tournaments: state.tournaments.map(t => t.id === tournamentId ? { ...t, status: 'registering' } : t),
         matches: state.matches.filter(m => m.tournamentId !== tournamentId),
         participants: state.participants.map(p => p.tournamentId === tournamentId ? { ...p, groupName: undefined } : p)
      })),

      assignConsoleToMatch: (matchId, consoleId) => set((state) => ({
        matches: state.matches.map(m => m.id === matchId ? { ...m, assignedConsoleId: consoleId || undefined } : m)
      })),

      generateBracket: (tournamentId) => {
        set((state) => {
          const t = state.tournaments.find((x) => x.id === tournamentId);
          const parts = state.participants.filter((p) => p.tournamentId === tournamentId);
          
          // BLINDAJE: Si faltan datos o participantes, no borra nada ni se rompe
          if (!t) {
            console.error("Torneo no encontrado");
            return state;
          }
          if (parts.length < 2) {
            alert("¡Debe haber mínimo 2 jugadores inscritos para comenzar el torneo!");
            return state;
          }

          let finalParts = parts;
          const newMatches: TournamentMatch[] = [];

          // FORMATO LIGA
          if (t.format === "league") {
            let round = 1;
            for (let i = 0; i < parts.length; i++) {
              for (let j = i + 1; j < parts.length; j++) {
                newMatches.push({
                  id: crypto.randomUUID(), tournamentId, phase: "groups",
                  player1Id: parts[i].id, player2Id: parts[j].id,
                  round, matchIndex: j
                });
                round++;
              }
            }
          } 
          // FORMATO GRUPOS (ESTILO MUNDIAL O CHAMPIONS PARA FIFA)
          else if (t.format === "groups") {
            const gCount = t.groupCount || 2;
            const groups = Array.from({ length: gCount }, (_, i) => String.fromCharCode(65 + i)); // A, B...
            
            const shuffled = [...parts].sort(() => Math.random() - 0.5);
            finalParts = shuffled.map((p, idx) => ({ ...p, groupName: groups[idx % gCount] }));
            
            groups.forEach(g => {
              const gParts = finalParts.filter(p => p.groupName === g);
              let round = 1;
              for (let i = 0; i < gParts.length; i++) {
                for (let j = i + 1; j < gParts.length; j++) {
                  newMatches.push({
                    id: crypto.randomUUID(), tournamentId, phase: "groups", groupName: g,
                    player1Id: gParts[i].id, player2Id: gParts[j].id,
                    round, matchIndex: j
                  });
                  round++;
                }
              }
            });
          } 
          // ELIMINATORIA SENCILLA O DOBLE (ESTILO MK)
          else if (t.format === "single_elimination" || t.format === "double_elimination") {
            const shuffled = [...parts].sort(() => Math.random() - 0.5);
            const totalPlayers = shuffled.length;
            const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(totalPlayers)));
            const byes = nextPowerOf2 - totalPlayers;

            const firstRoundMatches = nextPowerOf2 / 2;
            let pIndex = 0;
            const wMatches: TournamentMatch[] = [];

            // Winners Bracket - Ronda 1
            for (let i = 0; i < firstRoundMatches; i++) {
              const p1 = shuffled[pIndex++];
              const p2 = byes > i ? null : shuffled[pIndex++];
              
              wMatches.push({
                id: crypto.randomUUID(), tournamentId, phase: "knockout", bracket: "winners",
                player1Id: p1?.id, player2Id: p2?.id,
                winnerId: !p2 ? p1?.id : undefined,
                round: 1, matchIndex: i,
                matchFormat: t.defaultMatchFormat
              });
            }

            let currentRoundMatches = wMatches;
            let roundNum = 2;
            const allWinners = [...wMatches];

            while (currentRoundMatches.length > 1) {
              const nextRoundMatches: TournamentMatch[] = [];
              for (let i = 0; i < currentRoundMatches.length; i += 2) {
                const match = {
                  id: crypto.randomUUID(), tournamentId, phase: "knockout", bracket: "winners",
                  round: roundNum, matchIndex: i / 2, matchFormat: t.defaultMatchFormat
                };
                currentRoundMatches[i].nextMatchId = match.id;
                if (currentRoundMatches[i+1]) {
                  currentRoundMatches[i+1].nextMatchId = match.id;
                }
                nextRoundMatches.push(match as TournamentMatch);
                allWinners.push(match as TournamentMatch);
              }
              currentRoundMatches = nextRoundMatches;
              roundNum++;
            }

            newMatches.push(...allWinners);

            // Losers Bracket (Doble Eliminación MK)
            if (t.format === "double_elimination") {
              const losersRounds = (Math.log2(nextPowerOf2) - 1) * 2;
              let lMatchCount = firstRoundMatches / 2;
              let lRoundNum = 1;
              let previousLosersRound: TournamentMatch[] = [];
              
              const allLosers: TournamentMatch[] = [];

              while (lRoundNum <= losersRounds) {
                const currentLMatches: TournamentMatch[] = [];
                for (let i = 0; i < lMatchCount; i++) {
                  const lMatch = {
                    id: crypto.randomUUID(), tournamentId, phase: "knockout", bracket: "losers",
                    round: lRoundNum, matchIndex: i, matchFormat: t.defaultMatchFormat
                  };
                  
                  if (lRoundNum > 1 && lRoundNum % 2 !== 0 && previousLosersRound.length > 0) {
                     if(previousLosersRound[i*2]) previousLosersRound[i*2].nextMatchId = lMatch.id;
                     if (previousLosersRound[i*2+1]) previousLosersRound[i*2+1].nextMatchId = lMatch.id;
                  } else if (lRoundNum > 1 && lRoundNum % 2 === 0 && previousLosersRound.length > 0) {
                     if(previousLosersRound[i]) previousLosersRound[i].nextMatchId = lMatch.id;
                  }

                  currentLMatches.push(lMatch as TournamentMatch);
                  allLosers.push(lMatch as TournamentMatch);
                }
                previousLosersRound = currentLMatches;
                
                if (lRoundNum % 2 !== 0 && lMatchCount > 1) lMatchCount /= 2;
                lRoundNum++;
              }
              newMatches.push(...allLosers);

              // Grand Finals
              const grandFinal = {
                id: crypto.randomUUID(), tournamentId, phase: "knockout", bracket: "grand_finals",
                round: 1, matchIndex: 0, matchFormat: t.defaultMatchFormat
              };
              
              const winnersFinal = allWinners[allWinners.length - 1];
              const losersFinal = allLosers[allLosers.length - 1];
              if (winnersFinal) winnersFinal.nextMatchId = grandFinal.id;
              if (losersFinal) losersFinal.nextMatchId = grandFinal.id;
              
              newMatches.push(grandFinal as TournamentMatch);
            }
          }

          const updatedTourneys = state.tournaments.map((x) =>
            x.id === tournamentId ? { ...x, status: "active" as const } : x
          );
          
          const updatedParts = state.participants.map(p => {
             const fp = finalParts.find(x => x.id === p.id);
             return fp ? fp : p;
          });

          return { ...state, matches: [...state.matches, ...newMatches], tournaments: updatedTourneys, participants: updatedParts };
        });
      },

      setMatchScore: (matchId, score1, score2, penalties1, penalties2) => {
        set((state) => {
          const mIndex = state.matches.findIndex((m) => m.id === matchId);
          if (mIndex === -1) return state;

          const m = state.matches[mIndex];
          const newMatches = [...state.matches];
          const tourney = state.tournaments.find((t) => t.id === m.tournamentId);
          
          let winnerId: string | undefined;
          let loserId: string | undefined;
          let isDraw = false;

          // REGLA FIFA vs REGLA MK: Si es Knockout o Lucha, no hay empate.
          if (score1 > score2) {
            winnerId = m.player1Id;
            loserId = m.player2Id;
          } else if (score2 > score1) {
            winnerId = m.player2Id;
            loserId = m.player1Id;
          } else {
            // Empate en marcador (ej. 2-2)
            if (tourney && tourney.format === "groups" && tourney.allowDraws) {
               isDraw = true;
            } else if (penalties1 !== undefined && penalties2 !== undefined) {
               // Resuelto en Penales en una fase eliminatoria de FIFA
               if (penalties1 > penalties2) {
                 winnerId = m.player1Id;
                 loserId = m.player2Id;
               } else if (penalties2 > penalties1) {
                 winnerId = m.player2Id;
                 loserId = m.player1Id;
               }
            } else {
               // En Mortal Kombat no se permite empate
               alert("En este torneo no se permiten empates. Debe haber un ganador.");
               return state;
            }
          }

          newMatches[mIndex] = { ...m, score1, score2, winnerId, isDraw, penalties1, penalties2, assignedConsoleId: undefined };

          if (tourney && tourney.format !== "league" && m.phase === "knockout" && winnerId) {
            // Avanzar Ganador
            if (m.nextMatchId) {
              const nextIdx = newMatches.findIndex((nx) => nx.id === m.nextMatchId);
              if (nextIdx !== -1) {
                const nextM = { ...newMatches[nextIdx] };
                if (!nextM.player1Id) nextM.player1Id = winnerId;
                else if (!nextM.player2Id && nextM.player1Id !== winnerId) nextM.player2Id = winnerId;
                newMatches[nextIdx] = nextM;
              }
            }

            // Perdedor cae al Losers Bracket (Doble Eliminación MK)
            if (tourney.format === "double_elimination" && m.bracket === "winners" && loserId) {
              const targetLosersRound = m.round === 1 ? 1 : (m.round - 1) * 2;
              
              const targetMatchIdx = newMatches.findIndex(nx => 
                nx.tournamentId === m.tournamentId && 
                nx.bracket === "losers" && 
                nx.round === targetLosersRound && 
                (!nx.player1Id || !nx.player2Id)
              );

              if (targetMatchIdx !== -1) {
                const targetM = { ...newMatches[targetMatchIdx] };
                if (!targetM.player1Id) targetM.player1Id = loserId;
                else if (!targetM.player2Id && targetM.player1Id !== loserId) targetM.player2Id = loserId;
                newMatches[targetMatchIdx] = targetM;
              }
            }

            // Regla Mortal Kombat: Reset de Grand Finals
            if (m.bracket === "grand_finals" && tourney.format === "double_elimination") {
              const isLoserBracketWinner = state.matches.some(prevM => 
                 prevM.bracket === "losers" && prevM.winnerId === winnerId && prevM.nextMatchId === m.id
              );

              if (isLoserBracketWinner && !m.nextMatchId) {
                 const grandFinalReset: TournamentMatch = {
                    id: crypto.randomUUID(), 
                    tournamentId: m.tournamentId, 
                    phase: "knockout", 
                    bracket: "grand_finals",
                    player1Id: m.player1Id, 
                    player2Id: m.player2Id,
                    round: 2, 
                    matchIndex: 0,
                    matchFormat: tourney.defaultMatchFormat
                 };
                 newMatches[mIndex] = { ...newMatches[mIndex], nextMatchId: grandFinalReset.id };
                 newMatches.push(grandFinalReset);
              }
            }
          }

          return { ...state, matches: newMatches };
        });
      },

      revertMatchWinner: (matchId) => set((state) => {
        const m = state.matches.find(x => x.id === matchId);
        if (!m || (!m.winnerId && !m.isDraw)) return state;

        const newMatches = state.matches.map(x => {
          if (x.id === matchId) {
            return { ...x, winnerId: undefined, isDraw: undefined, score1: undefined, score2: undefined, penalties1: undefined, penalties2: undefined };
          }
          
          if (x.nextMatchId === m.nextMatchId || (m.nextMatchId && x.id === m.nextMatchId)) {
             if (x.player1Id === m.winnerId) return { ...x, player1Id: undefined };
             if (x.player2Id === m.winnerId) return { ...x, player2Id: undefined };
          }

          if (m.bracket === "winners" && x.bracket === "losers" && (x.player1Id === m.player1Id || x.player1Id === m.player2Id || x.player2Id === m.player1Id || x.player2Id === m.player2Id)) {
             if (x.player1Id === m.player1Id || x.player1Id === m.player2Id) return { ...x, player1Id: undefined };
             if (x.player2Id === m.player1Id || x.player2Id === m.player2Id) return { ...x, player2Id: undefined };
          }

          return x;
        });

        const cleanedMatches = newMatches.filter(x => !(x.bracket === "grand_finals" && x.round === 2 && m.bracket === "grand_finals"));

        return { matches: cleanedMatches };
      }),

      generateKnockoutFromGroups: (tournamentId) => set((state) => {
        const t = state.tournaments.find(x => x.id === tournamentId);
        if (!t || t.format !== "groups") return state;

        const groupMatches = state.matches.filter(m => m.tournamentId === tournamentId && m.phase === "groups");
        if (!groupMatches.every(m => m.winnerId || m.isDraw)) {
           alert("¡Aún hay partidos pendientes en la fase de grupos!");
           return state;
        }

        const parts = state.participants.filter(p => p.tournamentId === tournamentId);
        const groups = Array.from(new Set(parts.map(p => p.groupName).filter(Boolean))) as string[];
        const qualified: TournamentParticipant[] = [];

        groups.forEach(g => {
          const gParts = parts.filter(p => p.groupName === g);
          const stats: Record<string, any> = {};
          gParts.forEach(p => stats[p.id] = { ...p, pts: 0, gd: 0 });
          const gM = groupMatches.filter(m => m.groupName === g);
          
          gM.forEach(m => {
            const s1 = m.score1 || 0;
            const s2 = m.score2 || 0;
            if (m.winnerId === m.player1Id) { 
               stats[m.player1Id!].pts += 3;
               stats[m.player1Id!].gd += (s1 - s2);
               stats[m.player2Id!].gd += (s2 - s1);
            }
            else if (m.winnerId === m.player2Id) { 
               stats[m.player2Id!].pts += 3;
               stats[m.player2Id!].gd += (s2 - s1);
               stats[m.player1Id!].gd += (s1 - s2);
            }
            else if (m.isDraw) { 
               stats[m.player1Id!].pts += 1; 
               stats[m.player2Id!].pts += 1; 
            }
          });
          
          // Desempate por Puntos y luego por Diferencia de Goles (DG)
          const sorted = Object.values(stats).sort((a: any, b: any) => {
             if (b.pts !== a.pts) return b.pts - a.pts;
             return b.gd - a.gd;
          });
          
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
          
          kMatches.push({
            id: crypto.randomUUID(), tournamentId, phase: "knockout",
            player1Id: p1?.id, player2Id: p2?.id,
            winnerId: !p2 ? p1?.id : undefined,
            round: 1, matchIndex: i
          });
        }

        let currentRoundMatches = kMatches;
        let roundNum = 2;
        
        while (currentRoundMatches.length > 1) {
          const nextRoundMatches: TournamentMatch[] = [];
          for (let i = 0; i < currentRoundMatches.length; i += 2) {
            const match: TournamentMatch = {
              id: crypto.randomUUID(), tournamentId, phase: "knockout",
              round: roundNum, matchIndex: i / 2
            };
            currentRoundMatches[i].nextMatchId = match.id;
            if (currentRoundMatches[i+1]) {
              currentRoundMatches[i+1].nextMatchId = match.id;
            }
            nextRoundMatches.push(match);
            kMatches.push(match);
          }
          currentRoundMatches = nextRoundMatches;
          roundNum++;
        }

        return { matches: [...state.matches, ...kMatches] };
      })
    }),
    {
      name: 'lounge-storage',
    }
  )
);