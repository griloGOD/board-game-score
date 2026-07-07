/**
 * Catálogo de jogos.
 *
 * Jogáveis: Flip 7 e Catan; os demais aparecem como "Em breve" para prever a
 * visão. Capas oficiais do BoardGameGeek em /public/games (uso pessoal);
 * se faltar a capa, o card cai para o emoji + cor de destaque.
 */

export type EngineKind = 'flip7' | 'catan';

export interface GameInfo {
  id: string;
  name: string;
  /** Emoji do card placeholder (fallback quando não há capa). */
  emoji: string;
  /** Cor de destaque do card placeholder. */
  accent: string;
  /** Caminho da capa em /public (ex.: /games/flip7.jpg). Opcional. */
  cover?: string;
  minPlayers: number;
  maxPlayers: number;
  /** false = "Em breve" (ainda não jogável na Fase 1). */
  available: boolean;
  /** Motor de placar usado; null enquanto indisponível. */
  engine: EngineKind | null;
}

export const GAMES: GameInfo[] = [
  { id: 'flip7', name: 'Flip 7', emoji: '🃏', accent: '#6366f1', cover: '/games/flip7.jpg', minPlayers: 3, maxPlayers: 18, available: true, engine: 'flip7' },
  // 3–4 no jogo base; até 6 com a expansão de 5–6 jogadores.
  { id: 'catan', name: 'Catan', emoji: '🎲', accent: '#f97316', cover: '/games/catan.png', minPlayers: 3, maxPlayers: 6, available: true, engine: 'catan' },
  { id: 'bang-dice', name: 'Bang! Dice', emoji: '🤠', accent: '#ef4444', cover: '/games/bang-dice.jpg', minPlayers: 3, maxPlayers: 8, available: false, engine: null },
  { id: 'trio', name: 'Trio', emoji: '🔢', accent: '#14b8a6', cover: '/games/trio.jpg', minPlayers: 3, maxPlayers: 6, available: false, engine: null },
  { id: 'ticket-to-ride', name: 'Ticket to Ride', emoji: '🚂', accent: '#3b82f6', cover: '/games/ticket-to-ride.jpg', minPlayers: 2, maxPlayers: 5, available: false, engine: null },
  { id: 'survive', name: 'Survive', emoji: '🌋', accent: '#f59e0b', cover: '/games/survive.png', minPlayers: 2, maxPlayers: 4, available: false, engine: null },
  { id: 'dixit', name: 'Dixit', emoji: '🐰', accent: '#a855f7', cover: '/games/dixit.jpg', minPlayers: 3, maxPlayers: 6, available: false, engine: null },
  { id: 'azul', name: 'Azul', emoji: '🔷', accent: '#0ea5e9', cover: '/games/azul.png', minPlayers: 2, maxPlayers: 4, available: false, engine: null },
];

export function getGame(id: string): GameInfo | undefined {
  return GAMES.find((g) => g.id === id);
}
