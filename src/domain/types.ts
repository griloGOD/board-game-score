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
