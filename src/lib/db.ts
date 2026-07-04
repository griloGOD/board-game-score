import Dexie, { type Table } from 'dexie';
import type { Player } from '@/domain/types';
import type { Flip7Round } from '@/domain/flip7/types';

/**
 * Registro de uma partida gravado no IndexedDB.
 *
 * Guarda um SNAPSHOT dos jogadores (nome/avatar/cor no momento do jogo), para
 * que o histórico continue fiel mesmo se um perfil for editado/apagado depois.
 * `rounds` são as rodadas já fechadas; `draftRound` é a rodada em andamento
 * (pode estar parcial) — assim nada se perde se a página for recarregada.
 */
export interface MatchRecord {
  id: string;
  gameId: string;
  createdAt: number;
  updatedAt: number;
  status: 'em_andamento' | 'finalizada';
  targetScore: number;
  playerIds: string[];
  players: Player[];
  rounds: Flip7Round[];
  draftRound: Flip7Round;
  championIds: string[];
}

class BGSDatabase extends Dexie {
  players!: Table<Player, string>;
  matches!: Table<MatchRecord, string>;

  constructor() {
    super('board-game-score');
    this.version(1).stores({
      players: 'id, name',
      matches: 'id, gameId, status, createdAt',
    });
  }
}

export const db = new BGSDatabase();
