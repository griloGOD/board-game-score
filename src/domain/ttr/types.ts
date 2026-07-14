/**
 * Tipos do motor de placar do Ticket to Ride (mapa base, EUA).
 *
 * Durante a partida o placar sobe pelos trajetos capturados (público). No fim
 * entram os bilhetes de destino (secretos, líquido = cumpridos − falhados) e o
 * bônus do Trajeto Mais Longo (+10, de um jogador só). O app registra:
 *
 *   trajeto por comprimento 1·2·3·4·5·6 → 1·2·4·7·10·15 pontos
 *
 * Sem meta numérica: o jogo acaba quando alguém fica com ≤2 vagões; o fim é
 * declarado e vence o maior total (desempate: dono do Trajeto Mais Longo).
 */

/** Estado de pontuação de UM jogador durante a partida. */
export interface TtrPlayerState {
  /** Valores dos trajetos capturados (cada um ∈ TTR_ROUTE_VALUES). Editável. */
  routes: number[];
  /** Líquido dos bilhetes de destino no fim (cumpridos − falhados). Pode ser negativo. */
  ticketPoints: number;
  /** Tem o Trajeto Mais Longo (+10). No máximo um jogador por vez. */
  hasLongestPath: boolean;
}

/** Estado da partida inteira, indexado por playerId. */
export type TtrState = Record<string, TtrPlayerState>;

/** Ações que a tela dispara; as regras (exclusividade do trajeto) ficam no motor. */
export type TtrAction =
  | { type: 'addRoute'; value: number }
  | { type: 'undoRoute' }
  | { type: 'removeRoute'; index: number }
  | { type: 'setTicketPoints'; value: number }
  | { type: 'toggleLongestPath' };
