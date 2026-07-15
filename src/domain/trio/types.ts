/**
 * Tipos do motor de placar do Trio.
 *
 * A partida é uma série de RODADAS: em cada rodada os jogadores coletam trios
 * (três cartas de mesmo número) e quem junta a meta (padrão 3) OU pega o trio
 * de 7 fecha a rodada e marca 1 PONTO; os trios de todos zeram e joga-se outra.
 * A partida segue até o grupo decidir parar (fim declarado) — campeão é quem
 * tem mais pontos.
 */

/** Estado de UM jogador durante a partida. */
export interface TrioPlayerState {
  /** Pontos na partida = rodadas vencidas. */
  wins: number;
  /** Trios coletados na rodada ATUAL. */
  trios: number;
  /** Pegou o trio de 7 na rodada atual (fecha a rodada na hora). */
  hasSeven: boolean;
}

/** Estado da partida inteira, indexado por playerId. */
export type TrioState = Record<string, TrioPlayerState>;

/** Ações da tela: coletar/desfazer um trio na rodada, ou corrigir os pontos. */
export type TrioAction =
  | { type: 'addTrio'; seven: boolean }
  | { type: 'undoTrio'; seven: boolean }
  | { type: 'setWins'; value: number };

/** Resultado de uma ação: novo estado e, se a ação fechou a rodada, quem pontuou. */
export interface TrioActionResult {
  state: TrioState;
  roundWinnerId?: string;
}
