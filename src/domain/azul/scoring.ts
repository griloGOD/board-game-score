import type { Standing } from '../types';
import type { AzulAction, AzulPlayerState, AzulState } from './types';

/** Máximo de cada bônus de fim (a parede é 5×5, com 5 cores). */
export const AZUL_BONUS_MAX = 5;

/** Pontos de cada bônus de fim de jogo. */
export const AZUL_BONUS_POINTS = { fullRows: 2, fullCols: 7, fullColors: 10 } as const;

export function initialAzulPlayer(): AzulPlayerState {
  return { rounds: [], fullRows: 0, fullCols: 0, fullColors: 0 };
}

export function initialAzulState(playerIds: string[]): AzulState {
  return Object.fromEntries(playerIds.map((id) => [id, initialAzulPlayer()]));
}

/** Pontuação de um jogador: soma das rodadas (piso 0) mais os bônus de fim. */
export function computeAzulScore(p: AzulPlayerState): number {
  const roundTotal = Math.max(0, p.rounds.reduce((sum, n) => sum + n, 0));
  return (
    roundTotal +
    p.fullRows * AZUL_BONUS_POINTS.fullRows +
    p.fullCols * AZUL_BONUS_POINTS.fullCols +
    p.fullColors * AZUL_BONUS_POINTS.fullColors
  );
}

/**
 * Aplica uma ação ao estado, sempre devolvendo um NOVO estado (ações inválidas
 * — índice fora do log — devolvem o estado original). Pontos de rodada são
 * arredondados; contadores de bônus ficam presos ao intervalo [0, AZUL_BONUS_MAX].
 */
export function applyAzulAction(state: AzulState, playerId: string, action: AzulAction): AzulState {
  const p = state[playerId] ?? initialAzulPlayer();

  switch (action.type) {
    case 'addRound':
      return { ...state, [playerId]: { ...p, rounds: [...p.rounds, Math.round(action.points)] } };

    case 'editRound': {
      if (action.index < 0 || action.index >= p.rounds.length) return state;
      const rounds = p.rounds.map((n, i) => (i === action.index ? Math.round(action.points) : n));
      return { ...state, [playerId]: { ...p, rounds } };
    }

    case 'removeRound': {
      if (action.index < 0 || action.index >= p.rounds.length) return state;
      const rounds = p.rounds.filter((_, i) => i !== action.index);
      return { ...state, [playerId]: { ...p, rounds } };
    }

    case 'setBonus': {
      const value = Math.max(0, Math.min(AZUL_BONUS_MAX, Math.round(action.value)));
      return { ...state, [playerId]: { ...p, [action.bonus]: value } };
    }
  }
}

/**
 * Classificação: total por jogador, do maior para o menor, com ranking de
 * competição (empatados dividem o rank). O campeão vem de `championIds` (a
 * vitória do Azul é declarada no fim — ver `azulChampions`).
 */
export function computeAzulStandings(
  playerIds: string[],
  state: AzulState,
  championIds: string[] = [],
): Standing[] {
  const rows = playerIds.map((playerId) => ({
    playerId,
    total: computeAzulScore(state[playerId] ?? initialAzulPlayer()),
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
 * Quem vence pelo maior total. Desempate: mais linhas completas; se ainda
 * empatar, há co-campeões (todos os ids empatados no topo).
 */
export function azulChampions(playerIds: string[], state: AzulState): string[] {
  if (playerIds.length === 0) return [];

  const rows = playerIds.map((id) => {
    const p = state[id] ?? initialAzulPlayer();
    return { id, score: computeAzulScore(p), rows: p.fullRows };
  });

  const maxScore = Math.max(...rows.map((r) => r.score));
  const top = rows.filter((r) => r.score === maxScore);
  const maxRows = Math.max(...top.map((r) => r.rows));
  return top.filter((r) => r.rows === maxRows).map((r) => r.id);
}
