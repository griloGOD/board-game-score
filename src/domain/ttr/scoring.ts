import type { Standing } from '../types';
import type { TtrAction, TtrPlayerState, TtrState } from './types';

/** Pontos por comprimento de trajeto (1 a 6 vagões). */
export const TTR_ROUTE_VALUES = [1, 2, 4, 7, 10, 15] as const;

/** Bônus do Trajeto Mais Longo (de um jogador só). */
export const TTR_LONGEST_PATH_BONUS = 10;

export function initialTtrPlayer(): TtrPlayerState {
  return { routes: [], ticketPoints: 0, hasLongestPath: false };
}

export function initialTtrState(playerIds: string[]): TtrState {
  return Object.fromEntries(playerIds.map((id) => [id, initialTtrPlayer()]));
}

/** Pontuação: soma dos trajetos + líquido dos bilhetes + o bônus do trajeto. */
export function computeTtrScore(p: TtrPlayerState): number {
  const routes = p.routes.reduce((sum, n) => sum + n, 0);
  return routes + p.ticketPoints + (p.hasLongestPath ? TTR_LONGEST_PATH_BONUS : 0);
}

/**
 * Aplica uma ação, sempre devolvendo um NOVO estado (ações inválidas devolvem o
 * original). O Trajeto Mais Longo é exclusivo: marcar em alguém tira de todos os
 * outros; marcar de novo em quem tem remove a carta (ninguém fica com ela).
 */
export function applyTtrAction(state: TtrState, playerId: string, action: TtrAction): TtrState {
  const p = state[playerId] ?? initialTtrPlayer();

  switch (action.type) {
    case 'addRoute': {
      if (!Number.isFinite(action.value) || action.value <= 0) return state;
      return { ...state, [playerId]: { ...p, routes: [...p.routes, Math.round(action.value)] } };
    }

    case 'undoRoute': {
      if (p.routes.length === 0) return state;
      return { ...state, [playerId]: { ...p, routes: p.routes.slice(0, -1) } };
    }

    case 'removeRoute': {
      if (action.index < 0 || action.index >= p.routes.length) return state;
      return { ...state, [playerId]: { ...p, routes: p.routes.filter((_, i) => i !== action.index) } };
    }

    case 'setTicketPoints':
      return { ...state, [playerId]: { ...p, ticketPoints: Math.round(action.value) || 0 } };

    case 'toggleLongestPath': {
      const turningOn = !p.hasLongestPath;
      const next: TtrState = {};
      for (const [id, ps] of Object.entries(state)) {
        // Ligar para um jogador desliga para todos os outros.
        next[id] = { ...ps, hasLongestPath: id === playerId ? turningOn : turningOn ? false : ps.hasLongestPath };
      }
      if (!(playerId in next)) next[playerId] = { ...p, hasLongestPath: turningOn };
      return next;
    }
  }
}

/**
 * Classificação por total, do maior para o menor, com ranking de competição.
 * O campeão vem de `championIds` (a vitória é declarada no fim — ver `ttrChampions`).
 */
export function computeTtrStandings(
  playerIds: string[],
  state: TtrState,
  championIds: string[] = [],
): Standing[] {
  const rows = playerIds.map((playerId) => ({
    playerId,
    total: computeTtrScore(state[playerId] ?? initialTtrPlayer()),
  }));

  rows.sort((a, b) => b.total - a.total);

  return rows.map((row) => ({
    playerId: row.playerId,
    total: row.total,
    rank: 1 + rows.filter((r) => r.total > row.total).length,
    isChampion: championIds.includes(row.playerId),
  }));
}

/**
 * Quem vence pelo maior total. Desempate: entre os empatados no topo, quem tem o
 * Trajeto Mais Longo; se nenhum deles tem, há co-campeões.
 */
export function ttrChampions(playerIds: string[], state: TtrState): string[] {
  if (playerIds.length === 0) return [];

  const rows = playerIds.map((id) => {
    const p = state[id] ?? initialTtrPlayer();
    return { id, score: computeTtrScore(p), longest: p.hasLongestPath };
  });

  const maxScore = Math.max(...rows.map((r) => r.score));
  const top = rows.filter((r) => r.score === maxScore);
  if (top.length === 1) return [top[0].id];

  const holders = top.filter((r) => r.longest);
  return (holders.length ? holders : top).map((r) => r.id);
}
