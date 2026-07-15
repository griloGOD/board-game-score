/**
 * Tipos do motor de placar do Ticket to Ride (mapa base, EUA).
 *
 * Durante a partida o placar sobe pelos trajetos capturados (público). No fim
 * entram os bilhetes de destino (secretos, lançados UM A UM: cumprido soma,
 * falhado desconta) e o bônus do Trajeto Mais Longo (+10, de um jogador só).
 * O app registra:
 *
 *   trajeto por comprimento 1·2·3·4·5·6 → 1·2·4·7·10·15 pontos
 *
 * Cada jogador joga com uma cor de trem da caixa (azul, vermelho, verde,
 * amarelo, preto) — usada só no visual das peças.
 *
 * Sem meta numérica: o jogo acaba quando alguém fica com ≤2 vagões; o fim é
 * declarado e vence o maior total (desempate: dono do Trajeto Mais Longo).
 */

/** Cores dos trens que vêm na caixa do jogo. */
export type TtrTrainColor = 'blue' | 'red' | 'green' | 'yellow' | 'black';

/** Estado de pontuação de UM jogador durante a partida. */
export interface TtrPlayerState {
  /** Valores dos trajetos capturados (cada um ∈ TTR_ROUTE_VALUES). Editável. */
  routes: number[];
  /** Bilhetes de destino lançados um a um (positivo = cumprido, negativo = falhado). */
  tickets?: number[];
  /** Legado (v1.6.0): líquido único de bilhetes; migra para `tickets` na primeira edição. */
  ticketPoints?: number;
  /** Tem o Trajeto Mais Longo (+10). No máximo um jogador por vez. */
  hasLongestPath: boolean;
  /** Cor dos trens do jogador (peças da caixa). */
  color?: TtrTrainColor;
}

/** Estado da partida inteira, indexado por playerId. */
export type TtrState = Record<string, TtrPlayerState>;

/** Ações que a tela dispara; as regras (exclusividade, migração) ficam no motor. */
export type TtrAction =
  | { type: 'addRoute'; value: number }
  | { type: 'undoRoute' }
  | { type: 'removeRoute'; index: number }
  | { type: 'addTicket'; value: number }
  | { type: 'removeTicket'; index: number }
  | { type: 'setColor'; color: TtrTrainColor }
  | { type: 'toggleLongestPath' };
