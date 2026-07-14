/**
 * Tipos do motor de placar do Azul.
 *
 * O app não simula o tabuleiro: a cada rodada o jogador lê do próprio jogo os
 * pontos que fez (já líquidos das penalidades da fileira do chão / *floor line*,
 * que podem deixar o valor negativo) e registra aqui. No fim entram os bônus:
 *
 *   linha completa +2 · coluna completa +7 · cor completa (5 peças) +10
 *
 * A pontuação nunca fica abaixo de 0. O jogo termina quando alguém completa uma
 * linha horizontal — como não há meta numérica, o fim é declarado e o campeão é
 * quem tiver o maior total (desempate: mais linhas completas).
 */

/** Estado de pontuação de UM jogador durante a partida. */
export interface AzulPlayerState {
  /** Pontos líquidos de cada rodada (editáveis). Podem ser negativos. */
  rounds: number[];
  /** Linhas horizontais completas (0–5). Vale +2 cada no fim. */
  fullRows: number;
  /** Colunas completas (0–5). Vale +7 cada no fim. */
  fullCols: number;
  /** Cores completas — 5 peças de uma cor (0–5). Vale +10 cada no fim. */
  fullColors: number;
}

/** Estado da partida inteira, indexado por playerId. */
export type AzulState = Record<string, AzulPlayerState>;

/** Contadores de bônus de fim de jogo. */
export type AzulBonus = 'fullRows' | 'fullCols' | 'fullColors';

/** Ações que a tela dispara; as regras (piso, limites) ficam no motor. */
export type AzulAction =
  | { type: 'addRound'; points: number }
  | { type: 'editRound'; index: number; points: number }
  | { type: 'removeRound'; index: number }
  | { type: 'setBonus'; bonus: AzulBonus; value: number };
