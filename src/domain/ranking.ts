import type { Player } from './types';

/**
 * Ranking local agregado a partir de partidas finalizadas.
 *
 * É agnóstico de jogo: cada partida entra como um resumo (jogadores, campeões e
 * total final por jogador), então serve tanto para o ranking de UM jogo quanto
 * para o ranking GERAL (basta passar as partidas de todos os jogos juntas —
 * nesse caso "pontos" soma escalas diferentes, ex.: ~200 do Flip 7 e ~10 do Catan).
 */

/** Resumo de uma partida finalizada, para agregar o ranking. */
export interface FinishedMatchSummary {
  players: Player[];
  championIds: string[];
  /** playerId → total final. */
  totals: Record<string, number>;
}

/** Linha do ranking local. */
export interface RankRow {
  player: Player;
  wins: number;
  matchesPlayed: number;
  bestScore: number;
  /** Soma dos pontos do jogador em todas as partidas. */
  totalPoints: number;
}

/**
 * Agrega o ranking a partir das partidas finalizadas.
 * Cada co-campeão ganha uma vitória. Mantém o primeiro snapshot visto de cada
 * jogador (passe as partidas da mais recente para a mais antiga para usar o
 * nome/avatar mais atuais). Ordena por vitórias, depois melhor pontuação, nome.
 */
export function computeRanking(matches: FinishedMatchSummary[]): RankRow[] {
  const rows = new Map<string, RankRow>();

  for (const m of matches) {
    for (const player of m.players) {
      const existing = rows.get(player.id);
      const row = existing ?? { player, wins: 0, matchesPlayed: 0, bestScore: 0, totalPoints: 0 };
      const pts = m.totals[player.id] ?? 0;
      row.matchesPlayed += 1;
      row.bestScore = Math.max(row.bestScore, pts);
      row.totalPoints += pts;
      if (m.championIds.includes(player.id)) row.wins += 1;
      if (!existing) rows.set(player.id, row);
    }
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.wins - a.wins ||
      b.bestScore - a.bestScore ||
      a.player.name.localeCompare(b.player.name),
  );
}
