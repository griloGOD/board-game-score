import type { Standing } from '../types';
import type { TrioAction, TrioPlayerState, TrioState } from './types';

/** Meta padrão: 3 trios. */
export const TRIO_DEFAULT_TARGET = 3;

export function initialTrioPlayer(): TrioPlayerState {
  return { trios: 0, hasSeven: false };
}

export function initialTrioState(playerIds: string[]): TrioState {
  return Object.fromEntries(playerIds.map((id) => [id, initialTrioPlayer()]));
}

/** Pontos de um jogador = trios coletados. */
export function computeTrioScore(p: TrioPlayerState): number {
  return p.trios;
}

/** Venceu? Ao pegar o trio de 7, ou ao juntar a meta de trios. */
export function hasTrioWon(p: TrioPlayerState, target: number): boolean {
  return p.hasSeven || p.trios >= target;
}

/**
 * Aplica uma ação, devolvendo um NOVO estado. `undoTrio` não deixa os trios
 * ficarem negativos; desfazer o trio de 7 também desmarca `hasSeven`.
 */
export function applyTrioAction(state: TrioState, playerId: string, action: TrioAction): TrioState {
  const p = state[playerId] ?? initialTrioPlayer();

  if (action.type === 'addTrio') {
    return { ...state, [playerId]: { trios: p.trios + 1, hasSeven: p.hasSeven || action.seven } };
  }

  // undoTrio
  return {
    ...state,
    [playerId]: { trios: Math.max(0, p.trios - 1), hasSeven: action.seven ? false : p.hasSeven },
  };
}

/**
 * Classificação por número de trios, do maior para o menor, com ranking de
 * competição. O campeão vem de `championIds` (gravado quando alguém vence).
 */
export function computeTrioStandings(
  playerIds: string[],
  state: TrioState,
  championIds: string[] = [],
): Standing[] {
  const rows = playerIds.map((playerId) => ({
    playerId,
    total: computeTrioScore(state[playerId] ?? initialTrioPlayer()),
  }));

  rows.sort((a, b) => b.total - a.total);

  return rows.map((row) => ({
    playerId: row.playerId,
    total: row.total,
    rank: 1 + rows.filter((r) => r.total > row.total).length,
    isChampion: championIds.includes(row.playerId),
  }));
}
