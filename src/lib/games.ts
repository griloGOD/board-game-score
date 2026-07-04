/**
 * Catálogo de jogos.
 *
 * Fase 1: só o Flip 7 está jogável; os demais aparecem como "Em breve" para
 * prever a visão. As capas oficiais entram depois (por ora, cards com cor +
 * emoji como placeholder — é só trocar por um arquivo de imagem por jogo).
 */

export type EngineKind = 'flip7';

export interface GameInfo {
  id: string;
  name: string;
  /** Emoji do card placeholder (até termos as capas). */
  emoji: string;
  /** Cor de destaque do card placeholder. */
  accent: string;
  minPlayers: number;
  maxPlayers: number;
  /** false = "Em breve" (ainda não jogável na Fase 1). */
  available: boolean;
  /** Motor de placar usado; null enquanto indisponível. */
  engine: EngineKind | null;
}

export const GAMES: GameInfo[] = [
  { id: 'flip7', name: 'Flip 7', emoji: '🃏', accent: '#6366f1', minPlayers: 3, maxPlayers: 18, available: true, engine: 'flip7' },
  { id: 'catan', name: 'Catan', emoji: '🎲', accent: '#f97316', minPlayers: 3, maxPlayers: 4, available: false, engine: null },
  { id: 'bang-dice', name: 'Bang! Dice', emoji: '🤠', accent: '#ef4444', minPlayers: 3, maxPlayers: 8, available: false, engine: null },
  { id: 'trio', name: 'Trio', emoji: '🔢', accent: '#14b8a6', minPlayers: 3, maxPlayers: 6, available: false, engine: null },
  { id: 'ticket-to-ride', name: 'Ticket to Ride', emoji: '🚂', accent: '#3b82f6', minPlayers: 2, maxPlayers: 5, available: false, engine: null },
  { id: 'survive', name: 'Survive', emoji: '🌋', accent: '#f59e0b', minPlayers: 2, maxPlayers: 4, available: false, engine: null },
  { id: 'dixit', name: 'Dixit', emoji: '🐰', accent: '#a855f7', minPlayers: 3, maxPlayers: 6, available: false, engine: null },
  { id: 'azul', name: 'Azul', emoji: '🔷', accent: '#0ea5e9', minPlayers: 2, maxPlayers: 4, available: false, engine: null },
];

export function getGame(id: string): GameInfo | undefined {
  return GAMES.find((g) => g.id === id);
}
