/**
 * Tipos do motor de placar do Trio.
 *
 * Trio é curto: cada jogador coleta trios (três cartas de mesmo número). Vence
 * quem juntar 3 trios OU quem pegar o trio de 7 (vitória imediata). O app conta
 * os trios e marca se o jogador pegou o trio de 7; a vitória é automática, como
 * no Flip 7.
 */

/** Estado de UM jogador durante a partida. */
export interface TrioPlayerState {
  /** Trios coletados. */
  trios: number;
  /** Pegou o trio de 7 (vitória imediata). */
  hasSeven: boolean;
}

/** Estado da partida inteira, indexado por playerId. */
export type TrioState = Record<string, TrioPlayerState>;

/** Ações da tela: coletar um trio (comum ou o de 7) ou desfazer. */
export type TrioAction =
  | { type: 'addTrio'; seven: boolean }
  | { type: 'undoTrio'; seven: boolean };
