import type { Flip7Entry, Flip7Match, Standing } from './types';

/**
 * Pontuação de um jogador em UMA rodada de Flip 7.
 *
 * Ordem das operações (fiel ao jogo): soma das cartas de número → ×2 (se tiver o
 * modificador, dobra APENAS as cartas) → + modificadores fixos → + 15 do "Flip 7"
 * (nunca dobrado). O +15 é AUTOMÁTICO quando o jogador vira 7 cartas de número.
 * Estouro (bust) = 0.
 */
export function computeRoundScore(entry: Flip7Entry): number {
  if (entry.kind === 'bust') return 0;
  if (entry.kind === 'manual') return Math.max(0, entry.total);

  // entry.kind === 'calculated'
  const cardsSum = entry.numberCards.reduce((sum, card) => sum + card, 0);
  const base = entry.hasX2 ? cardsSum * 2 : cardsSum;
  const modifiers = entry.bonusModifiers.reduce((sum, mod) => sum + mod, 0);
  const flip7Bonus = entry.numberCards.length === 7 ? 15 : 0;
  return base + modifiers + flip7Bonus;
}

/** Total acumulado de cada jogador ao longo de todas as rodadas. */
function playerTotals(match: Flip7Match): Map<string, number> {
  const totals = new Map<string, number>();
  for (const id of match.playerIds) totals.set(id, 0);
  for (const round of match.rounds) {
    for (const [id, entry] of Object.entries(round.entries)) {
      totals.set(id, (totals.get(id) ?? 0) + computeRoundScore(entry));
    }
  }
  return totals;
}

/**
 * A partida acabou? Verdadeiro quando ao menos uma rodada foi jogada e algum
 * jogador atingiu (ou passou) a meta. A checagem deve ser feita ao FINAL de uma
 * rodada completa (todos lançaram) — quem chama garante isso.
 */
export function isGameOver(match: Flip7Match): boolean {
  if (match.rounds.length === 0) return false;
  for (const total of playerTotals(match).values()) {
    if (total >= match.targetScore) return true;
  }
  return false;
}

/**
 * Classificação da partida: total por jogador, ordenado do maior para o menor,
 * com ranking de competição (empatados compartilham o rank). O campeão só é
 * marcado quando a partida terminou; em empate exato no topo, há co-campeões.
 */
export function computeStandings(match: Flip7Match): Standing[] {
  const totals = playerTotals(match);
  const gameOver = isGameOver(match);

  const rows = match.playerIds.map((playerId) => ({
    playerId,
    total: totals.get(playerId) ?? 0,
  }));

  // Ordenação estável: mantém a ordem de entrada entre jogadores empatados.
  rows.sort((a, b) => b.total - a.total);

  const maxTotal = rows.length > 0 ? rows[0].total : 0;

  return rows.map((row) => ({
    playerId: row.playerId,
    total: row.total,
    // rank = 1 + nº de jogadores com total estritamente maior.
    rank: 1 + rows.filter((r) => r.total > row.total).length,
    isChampion: gameOver && row.total === maxTotal,
  }));
}
