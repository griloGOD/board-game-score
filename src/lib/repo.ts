import { db, type MatchRecord } from './db';
import type { Player } from '@/domain/types';
import type { Flip7Match } from '@/domain/flip7/types';

export function newId(): string {
  return crypto.randomUUID();
}

// ---- Jogadores (perfis locais reutilizáveis entre partidas) ----

export async function listPlayers(): Promise<Player[]> {
  return db.players.orderBy('name').toArray();
}

export async function savePlayer(player: Player): Promise<void> {
  await db.players.put(player);
}

export async function deletePlayer(id: string): Promise<void> {
  await db.players.delete(id);
}

// ---- Partidas ----

export async function createFlip7Match(players: Player[], targetScore = 200): Promise<string> {
  const id = newId();
  const now = Date.now();
  const record: MatchRecord = {
    id,
    gameId: 'flip7',
    createdAt: now,
    updatedAt: now,
    status: 'em_andamento',
    targetScore,
    playerIds: players.map((p) => p.id),
    players,
    rounds: [],
    draftRound: { entries: {} },
    championIds: [],
  };
  await db.matches.add(record);
  return id;
}

export async function getMatch(id: string): Promise<MatchRecord | undefined> {
  return db.matches.get(id);
}

export async function saveMatch(record: MatchRecord): Promise<void> {
  await db.matches.put({ ...record, updatedAt: Date.now() });
}

export async function deleteMatch(id: string): Promise<void> {
  await db.matches.delete(id);
}

export async function listFinishedMatches(gameId?: string): Promise<MatchRecord[]> {
  const finished = await db.matches.where('status').equals('finalizada').toArray();
  const filtered = gameId ? finished.filter((m) => m.gameId === gameId) : finished;
  return filtered.sort((a, b) => b.createdAt - a.createdAt);
}

/** Extrai a "visão" que o motor de pontuação entende, a partir do registro. */
export function toFlip7Match(record: MatchRecord): Flip7Match {
  return {
    playerIds: record.playerIds,
    rounds: record.rounds,
    targetScore: record.targetScore,
  };
}

/** A partida de Flip 7 em andamento mais recente (para o botão "Continuar"). */
export async function getActiveFlip7Match(): Promise<MatchRecord | undefined> {
  const inProgress = await db.matches.where('status').equals('em_andamento').toArray();
  return inProgress
    .filter((m) => m.gameId === 'flip7')
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
}
