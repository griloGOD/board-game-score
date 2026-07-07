/**
 * Tipos de domínio compartilhados.
 *
 * Na Fase 1 os dados vivem apenas no aparelho (IndexedDB). Os tipos já são
 * desenhados para, na Fase 2, mapear para contas de usuário na nuvem sem
 * reescrever a base (ver docs/specs/2026-07-04-fase1-flip7-placar-local-design.md).
 */

/** Perfil de um jogador (local na Fase 1; vira conta de usuário na Fase 2). */
export interface Player {
  id: string;
  name: string;
  /** Chave de um avatar pronto (emoji do conjunto de presets). */
  avatar: string;
  /** Token de cor da paleta, para diferenciar o jogador. */
  color: string;
}

/** A posição de um jogador na classificação de uma partida (qualquer jogo). */
export interface Standing {
  playerId: string;
  total: number;
  /** Rank começando em 1; jogadores empatados compartilham o mesmo rank. */
  rank: number;
  /** True somente quando a partida terminou e este jogador é (co-)campeão. */
  isChampion: boolean;
}
