import type { Standing } from '../types';
import type { CatanAction, CatanPlayerState, CatanState } from './types';

/** Limites físicos de peças do jogo base (por jogador). */
export const CATAN_MAX = { settlements: 5, cities: 4, vpCards: 5 } as const;

/** Estado inicial de um jogador: a preparação do Catan começa com 2 povoados (2 PV). */
export function initialCatanPlayer(): CatanPlayerState {
  return { settlements: 2, cities: 0, vpCards: 0, hasLongestRoad: false, hasLargestArmy: false };
}

export function initialCatanState(playerIds: string[]): CatanState {
  return Object.fromEntries(playerIds.map((id) => [id, initialCatanPlayer()]));
}

/** Pontos de vitória de um jogador a partir do estado dele. */
export function computeCatanScore(p: CatanPlayerState): number {
  return (
    p.settlements +
    p.cities * 2 +
    p.vpCards +
    (p.hasLongestRoad ? 2 : 0) +
    (p.hasLargestArmy ? 2 : 0)
  );
}

/** O "+" deste contador é permitido neste estado? (a tela usa para desabilitar o botão) */
export function canIncrement(p: CatanPlayerState, counter: keyof typeof CATAN_MAX): boolean {
  if (counter === 'cities') {
    // Uma cidade só nasce substituindo um povoado do tabuleiro.
    return p.cities < CATAN_MAX.cities && p.settlements > 0;
  }
  return p[counter] < CATAN_MAX[counter];
}

/**
 * Aplica uma ação ao estado da partida, respeitando as regras do jogo:
 * - povoados/cartas de PV: apenas dentro dos limites de peças;
 * - construir cidade consome um povoado (e desfazer a cidade devolve o povoado);
 * - Estrada Mais Longa e Maior Exército pertencem a no máximo um jogador —
 *   marcar em alguém tira de quem tinha (a carta é "roubada" no jogo real).
 * Retorna um NOVO estado; ações inválidas retornam o estado original.
 */
export function applyCatanAction(state: CatanState, playerId: string, action: CatanAction): CatanState {
  const p = state[playerId] ?? initialCatanPlayer();

  if (action.type === 'toggleLongestRoad' || action.type === 'toggleLargestArmy') {
    const key = action.type === 'toggleLongestRoad' ? 'hasLongestRoad' : 'hasLargestArmy';
    const turningOn = !p[key];
    const next: CatanState = {};
    for (const [id, ps] of Object.entries(state)) {
      // Ligar para um jogador desliga para todos os outros.
      next[id] = { ...ps, [key]: id === playerId ? turningOn : turningOn ? false : ps[key] };
    }
    if (!(playerId in next)) next[playerId] = { ...p, [key]: turningOn };
    return next;
  }

  if (action.type === 'increment') {
    if (!canIncrement(p, action.counter)) return state;
    const updated =
      action.counter === 'cities'
        ? { ...p, cities: p.cities + 1, settlements: p.settlements - 1 }
        : { ...p, [action.counter]: p[action.counter] + 1 };
    return { ...state, [playerId]: updated };
  }

  // decrement
  if (p[action.counter] <= 0) return state;
  const updated =
    action.counter === 'cities'
      ? // Desfazer uma cidade devolve o povoado que ela substituiu.
        { ...p, cities: p.cities - 1, settlements: Math.min(CATAN_MAX.settlements, p.settlements + 1) }
      : { ...p, [action.counter]: p[action.counter] - 1 };
  return { ...state, [playerId]: updated };
}

/**
 * Classificação da partida: PV por jogador, do maior para o menor, com ranking
 * de competição. No Catan não há empate de campeão — a vitória é declarada por
 * UM jogador no turno dele, então `championIds` vem da declaração manual.
 */
export function computeCatanStandings(
  playerIds: string[],
  state: CatanState,
  championIds: string[] = [],
): Standing[] {
  const rows = playerIds.map((playerId) => ({
    playerId,
    total: computeCatanScore(state[playerId] ?? initialCatanPlayer()),
  }));

  rows.sort((a, b) => b.total - a.total);

  return rows.map((row) => ({
    playerId: row.playerId,
    total: row.total,
    rank: 1 + rows.filter((r) => r.total > row.total).length,
    isChampion: championIds.includes(row.playerId),
  }));
}
