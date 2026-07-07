import Dexie, { type Table } from 'dexie';
import type { Player } from '@/domain/types';
import type { Flip7Round } from '@/domain/flip7/types';
import type { CatanState } from '@/domain/catan/types';

/**
 * Registro de uma partida gravado no IndexedDB.
 *
 * Guarda um SNAPSHOT dos jogadores (nome/avatar/cor no momento do jogo), para
 * que o histórico continue fiel mesmo se um perfil for editado/apagado depois.
 *
 * Cada jogo usa a fatia que lhe cabe (campos extras não indexados não exigem
 * migração no Dexie):
 * - Flip 7: `rounds` são as rodadas fechadas; `draftRound` é a rodada em
 *   andamento (pode estar parcial) — nada se perde se a página recarregar.
 * - Catan: `catanState` é o estado vivo por jogador (construções e cartas).
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
  /** Estado do Catan (só em partidas com gameId 'catan'). */
  catanState?: CatanState;
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
