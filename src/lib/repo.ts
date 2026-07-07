import { db, type MatchRecord } from './db';
import type { Player } from '@/domain/types';
import type { Flip7Match } from '@/domain/flip7/types';
import type { CatanAction } from '@/domain/catan/types';
import { applyCatanAction, initialCatanState } from '@/domain/catan/scoring';

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

/** Só pode existir UMA partida em andamento (de qualquer jogo): apaga as abertas. */
async function deleteOpenMatches(): Promise<void> {
  const openIds = (await db.matches.where('status').equals('em_andamento').toArray()).map((m) => m.id);
  if (openIds.length) await db.matches.bulkDelete(openIds);
}

function newMatchRecord(gameId: string, players: Player[], targetScore: number): MatchRecord {
  const now = Date.now();
  return {
    id: newId(),
    gameId,
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
}

export async function createFlip7Match(players: Player[], targetScore = 200): Promise<string> {
  await deleteOpenMatches();
  const record = newMatchRecord('flip7', players, targetScore);
  await db.matches.add(record);
  return record.id;
}

export async function createCatanMatch(players: Player[], targetScore = 10): Promise<string> {
  await deleteOpenMatches();
  const record: MatchRecord = {
    ...newMatchRecord('catan', players, targetScore),
    catanState: initialCatanState(players.map((p) => p.id)),
  };
  await db.matches.add(record);
  return record.id;
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

/** A partida em andamento mais recente, de qualquer jogo (botão "Continuar"). */
export async function getActiveMatch(): Promise<MatchRecord | undefined> {
  const inProgress = await db.matches.where('status').equals('em_andamento').toArray();
  return inProgress.sort((a, b) => b.updatedAt - a.updatedAt)[0];
}

// ---- Catan ----

/**
 * Aplica uma ação do placar do Catan direto no banco. Lê e grava dentro de uma
 * transação para que toques rápidos em sequência não se atropelem.
 */
export async function applyCatanMatchAction(matchId: string, playerId: string, action: CatanAction): Promise<void> {
  await db.transaction('rw', db.matches, async () => {
    const m = await db.matches.get(matchId);
    if (!m || m.gameId !== 'catan' || m.status !== 'em_andamento') return;
    const state = m.catanState ?? initialCatanState(m.playerIds);
    await db.matches.put({ ...m, catanState: applyCatanAction(state, playerId, action), updatedAt: Date.now() });
  });
}

/** Encerra a partida de Catan declarando o campeão (a vitória é declarada, não automática). */
export async function declareCatanChampion(matchId: string, playerId: string): Promise<void> {
  const m = await db.matches.get(matchId);
  if (!m) return;
  await db.matches.put({ ...m, status: 'finalizada', championIds: [playerId], updatedAt: Date.now() });
}

/** Reabre uma partida finalizada (para corrigir um encerramento por engano). */
export async function reopenMatch(matchId: string): Promise<void> {
  const m = await db.matches.get(matchId);
  if (!m) return;
  await db.matches.put({ ...m, status: 'em_andamento', championIds: [], updatedAt: Date.now() });
}
