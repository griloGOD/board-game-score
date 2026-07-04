/**
 * Tipos do motor de placar do Flip 7.
 *
 * O app NÃO simula o baralho — ele registra o resultado de cada jogador em cada
 * rodada e faz as contas. A entrada de uma rodada pode ser: um "estouro" (bust),
 * um total digitado à mão, ou os componentes (cartas + modificadores) para o app
 * calcular.
 */

/** Como a pontuação de um jogador é registrada em uma rodada. */
export type Flip7Entry =
  | { kind: 'bust' }
  | { kind: 'manual'; total: number }
  | {
      kind: 'calculated';
      /** Cartas de número únicas mantidas na rodada (valores 0–12). */
      numberCards: number[];
      /** Se o modificador ×2 está em mãos (dobra APENAS a soma das cartas de número). */
      hasX2: boolean;
      /** Modificadores fixos em mãos, ex.: [2, 4] para +2 e +4. */
      bonusModifiers: number[];
      // "Flip 7" (+15) é DERIVADO: acontece automaticamente quando numberCards tem 7 cartas.
    };

/** Uma rodada: uma entrada de pontuação por jogador participante, indexada por playerId. */
export interface Flip7Round {
  entries: Record<string, Flip7Entry>;
}

/** Uma partida de Flip 7, em andamento ou finalizada. */
export interface Flip7Match {
  playerIds: string[];
  rounds: Flip7Round[];
  /** Pontuação que dispara a última rodada quando atingida (padrão 200). */
  targetScore: number;
}

/** A posição de um jogador na classificação da partida. */
export interface Standing {
  playerId: string;
  total: number;
  /** Rank começando em 1; jogadores empatados compartilham o mesmo rank. */
  rank: number;
  /** True somente quando a partida terminou e este jogador tem o maior total. */
  isChampion: boolean;
}
