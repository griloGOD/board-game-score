import type { Standing } from '../types';
import type { TrioAction, TrioActionResult, TrioPlayerState, TrioState } from './types';

/** Meta padrão da rodada: 3 trios. */
export const TRIO_DEFAULT_TARGET = 3;

export function initialTrioPlayer(): TrioPlayerState {
  return { wins: 0, trios: 0, hasSeven: false };
}

export function initialTrioState(playerIds: string[]): TrioState {
  return Object.fromEntries(playerIds.map((id) => [id, initialTrioPlayer()]));
}

/**
 * Completa campos de registros antigos (até a v1.6.0 não existia `wins`).
 * Naquela época a partida acabava na primeira vitória, então quem tinha
 * vencido (meta padrão ou trio de 7) equivale a 1 ponto de hoje.
 */
export function normalizeTrioPlayer(p: Partial<TrioPlayerState> | undefined): TrioPlayerState {
  const trios = p?.trios ?? 0;
  const hasSeven = p?.hasSeven ?? false;
  const legacyWin = hasSeven || trios >= TRIO_DEFAULT_TARGET ? 1 : 0;
  return { wins: p?.wins ?? legacyWin, trios, hasSeven };
}

/** Pontos de um jogador = rodadas vencidas. */
export function computeTrioScore(p: TrioPlayerState): number {
  return normalizeTrioPlayer(p).wins;
}

/** Fechou a rodada? Ao pegar o trio de 7, ou ao juntar a meta de trios. */
export function hasTrioWon(p: TrioPlayerState, target: number): boolean {
  return p.hasSeven || p.trios >= target;
}

/**
 * Aplica uma ação, devolvendo um NOVO estado. Quando um `addTrio` atinge a meta
 * (ou é o trio de 7), a rodada fecha: o jogador ganha +1 ponto e os trios de
 * TODOS zeram para a próxima rodada — `roundWinnerId` indica quem pontuou.
 */
export function applyTrioAction(
  state: TrioState,
  playerId: string,
  action: TrioAction,
  target: number,
): TrioActionResult {
  const p = normalizeTrioPlayer(state[playerId]);

  if (action.type === 'setWins') {
    return { state: { ...state, [playerId]: { ...p, wins: Math.max(0, Math.round(action.value) || 0) } } };
  }

  if (action.type === 'addTrio') {
    const next: TrioPlayerState = { ...p, trios: p.trios + 1, hasSeven: p.hasSeven || action.seven };
    if (hasTrioWon(next, Math.max(1, target))) {
      // Rodada fechada: +1 ponto para quem completou e todos recomeçam do zero.
      const fresh: TrioState = Object.fromEntries(
        Object.entries(state).map(([id, ps]) => {
          const norm = normalizeTrioPlayer(ps);
          return [id, { ...norm, trios: 0, hasSeven: false, wins: norm.wins + (id === playerId ? 1 : 0) }];
        }),
      );
      if (!(playerId in fresh)) fresh[playerId] = { wins: p.wins + 1, trios: 0, hasSeven: false };
      return { state: fresh, roundWinnerId: playerId };
    }
    return { state: { ...state, [playerId]: next } };
  }

  // undoTrio — não deixa negativo; desfazer o trio de 7 também desmarca hasSeven.
  return {
    state: {
      ...state,
      [playerId]: { ...p, trios: Math.max(0, p.trios - 1), hasSeven: action.seven ? false : p.hasSeven },
    },
  };
}

/** Campeões da partida = quem tem mais pontos (empate ⇒ co-campeões). */
export function trioChampions(playerIds: string[], state: TrioState): string[] {
  if (playerIds.length === 0) return [];
  const rows = playerIds.map((id) => ({ id, wins: normalizeTrioPlayer(state[id]).wins }));
  const max = Math.max(...rows.map((r) => r.wins));
  return rows.filter((r) => r.wins === max).map((r) => r.id);
}

/**
 * Classificação por pontos (rodadas vencidas), do maior para o menor, com
 * ranking de competição. O campeão vem de `championIds` (fim declarado).
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
