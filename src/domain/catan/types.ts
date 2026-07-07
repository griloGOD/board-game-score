/**
 * Tipos do motor de placar do Catan (jogo base).
 *
 * Diferente do Flip 7, o Catan não tem rodadas de pontuação: cada jogador tem um
 * ESTADO vivo (construções e cartas) que sobe e desce durante a partida. O app
 * registra esse estado e calcula os pontos de vitória (PV):
 *
 *   povoado ×1 · cidade ×2 · carta de PV ×1 · Estrada Mais Longa +2 · Maior Exército +2
 *
 * Vence quem atingir a meta (padrão 10 PV) — no jogo real a vitória é declarada
 * no turno do jogador, então aqui ela também é confirmada manualmente.
 */

/** Estado de pontuação de UM jogador durante a partida. */
export interface CatanPlayerState {
  /** Povoados no tabuleiro (0–5). Vale 1 PV cada. */
  settlements: number;
  /** Cidades no tabuleiro (0–4). Vale 2 PV cada; cada uma substitui um povoado. */
  cities: number;
  /** Cartas de desenvolvimento de Ponto de Vitória (0–5). Vale 1 PV cada. */
  vpCards: number;
  /** Tem a carta Estrada Mais Longa (+2 PV). No máximo um jogador por vez. */
  hasLongestRoad: boolean;
  /** Tem a carta Maior Exército (+2 PV). No máximo um jogador por vez. */
  hasLargestArmy: boolean;
}

/** Estado da partida inteira, indexado por playerId. */
export type CatanState = Record<string, CatanPlayerState>;

/** Contadores incrementáveis do estado de um jogador. */
export type CatanCounter = 'settlements' | 'cities' | 'vpCards';

/** Ações que a tela dispara; as regras (limites, exclusividade) ficam no motor. */
export type CatanAction =
  | { type: 'increment'; counter: CatanCounter }
  | { type: 'decrement'; counter: CatanCounter }
  | { type: 'toggleLongestRoad' }
  | { type: 'toggleLargestArmy' };
