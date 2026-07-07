/**
 * O ranking virou agnóstico de jogo (ver domain/ranking.ts) quando o Catan
 * entrou. Estes aliases mantêm a API antiga do Flip 7 (e seus testes) intactos.
 */
export type { FinishedMatchSummary as FinishedFlip7Match, RankRow as Flip7RankRow } from '../ranking';
export { computeRanking as computeFlip7Ranking } from '../ranking';
