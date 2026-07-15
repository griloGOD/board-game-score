import { db, type MatchRecord } from './db';
import type { Player } from '@/domain/types';
import type { Flip7Match } from '@/domain/flip7/types';
import type { CatanAction } from '@/domain/catan/types';
import { applyCatanAction, initialCatanState } from '@/domain/catan/scoring';
import type { AzulAction } from '@/domain/azul/types';
import { applyAzulAction, azulChampions, initialAzulState } from '@/domain/azul/scoring';
import type { TtrAction } from '@/domain/ttr/types';
import { applyTtrAction, initialTtrState, ttrChampions } from '@/domain/ttr/scoring';
import type { TrioAction, TrioState } from '@/domain/trio/types';
import { applyTrioAction, initialTrioState, trioChampions, TRIO_DEFAULT_TARGET } from '@/domain/trio/scoring';

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

/**
 * Cada jogo pode ter UMA partida em andamento (jogos diferentes convivem):
 * criar uma nova de um jogo apaga só a aberta DELE.
 */
async function deleteOpenMatches(gameId: string): Promise<void> {
  const openIds = (await db.matches.where('status').equals('em_andamento').toArray())
    .filter((m) => m.gameId === gameId)
    .map((m) => m.id);
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
  await deleteOpenMatches('flip7');
  const record = newMatchRecord('flip7', players, targetScore);
  await db.matches.add(record);
  return record.id;
}

export async function createCatanMatch(players: Player[], targetScore = 10): Promise<string> {
  await deleteOpenMatches('catan');
  const record: MatchRecord = {
    ...newMatchRecord('catan', players, targetScore),
    catanState: initialCatanState(players.map((p) => p.id)),
  };
  await db.matches.add(record);
  return record.id;
}

// Azul e Ticket to Ride não têm meta numérica (o fim é declarado); o alvo fica 0.
export async function createAzulMatch(players: Player[]): Promise<string> {
  await deleteOpenMatches('azul');
  const record: MatchRecord = {
    ...newMatchRecord('azul', players, 0),
    azulState: initialAzulState(players.map((p) => p.id)),
  };
  await db.matches.add(record);
  return record.id;
}

export async function createTtrMatch(players: Player[]): Promise<string> {
  await deleteOpenMatches('ticket-to-ride');
  const record: MatchRecord = {
    ...newMatchRecord('ticket-to-ride', players, 0),
    ttrState: initialTtrState(players.map((p) => p.id)),
  };
  await db.matches.add(record);
  return record.id;
}

export async function createTrioMatch(players: Player[], targetScore = TRIO_DEFAULT_TARGET): Promise<string> {
  await deleteOpenMatches('trio');
  const record: MatchRecord = {
    ...newMatchRecord('trio', players, targetScore),
    trioState: initialTrioState(players.map((p) => p.id)),
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

/** Nº de partidas finalizadas por jogo (para ordenar a home por "mais jogados"). */
export async function matchCountsByGame(): Promise<Record<string, number>> {
  const finished = await db.matches.where('status').equals('finalizada').toArray();
  const counts: Record<string, number> = {};
  for (const m of finished) counts[m.gameId] = (counts[m.gameId] ?? 0) + 1;
  return counts;
}

/** Extrai a "visão" que o motor de pontuação entende, a partir do registro. */
export function toFlip7Match(record: MatchRecord): Flip7Match {
  return {
    playerIds: record.playerIds,
    rounds: record.rounds,
    targetScore: record.targetScore,
  };
}

/** Partidas em andamento (uma por jogo), da mais recente para a mais antiga. */
export async function listOpenMatches(): Promise<MatchRecord[]> {
  const inProgress = await db.matches.where('status').equals('em_andamento').toArray();
  return inProgress.sort((a, b) => b.updatedAt - a.updatedAt);
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

// ---- Azul ----

export async function applyAzulMatchAction(matchId: string, playerId: string, action: AzulAction): Promise<void> {
  await db.transaction('rw', db.matches, async () => {
    const m = await db.matches.get(matchId);
    if (!m || m.gameId !== 'azul' || m.status !== 'em_andamento') return;
    const state = m.azulState ?? initialAzulState(m.playerIds);
    await db.matches.put({ ...m, azulState: applyAzulAction(state, playerId, action), updatedAt: Date.now() });
  });
}

/** Encerra o Azul: campeão(ões) por maior total (desempate por linhas completas). */
export async function finishAzulByHighest(matchId: string): Promise<void> {
  const m = await db.matches.get(matchId);
  if (!m) return;
  const state = m.azulState ?? initialAzulState(m.playerIds);
  await db.matches.put({
    ...m,
    status: 'finalizada',
    championIds: azulChampions(m.playerIds, state),
    updatedAt: Date.now(),
  });
}

// ---- Ticket to Ride ----

export async function applyTtrMatchAction(matchId: string, playerId: string, action: TtrAction): Promise<void> {
  await db.transaction('rw', db.matches, async () => {
    const m = await db.matches.get(matchId);
    if (!m || m.gameId !== 'ticket-to-ride' || m.status !== 'em_andamento') return;
    const state = m.ttrState ?? initialTtrState(m.playerIds);
    await db.matches.put({ ...m, ttrState: applyTtrAction(state, playerId, action), updatedAt: Date.now() });
  });
}

/** Encerra o Ticket to Ride: campeão(ões) por maior total (desempate pelo trajeto mais longo). */
export async function finishTtrByHighest(matchId: string): Promise<void> {
  const m = await db.matches.get(matchId);
  if (!m) return;
  const state = m.ttrState ?? initialTtrState(m.playerIds);
  await db.matches.put({
    ...m,
    status: 'finalizada',
    championIds: ttrChampions(m.playerIds, state),
    updatedAt: Date.now(),
  });
}

// ---- Trio ----

/**
 * Aplica uma ação do Trio. Quando um trio fecha a rodada (meta ou trio de 7),
 * o motor soma 1 ponto ao vencedor e zera os trios de todos — a partida segue
 * até ser encerrada (`finishTrioByHighest`). Devolve quem pontuou (para a tela
 * celebrar) e o estado anterior (para desfazer um toque errado).
 */
export async function applyTrioMatchAction(
  matchId: string,
  playerId: string,
  action: TrioAction,
): Promise<{ roundWinnerId?: string; before?: TrioState }> {
  let result: { roundWinnerId?: string; before?: TrioState } = {};
  await db.transaction('rw', db.matches, async () => {
    const m = await db.matches.get(matchId);
    if (!m || m.gameId !== 'trio' || m.status !== 'em_andamento') return;
    const before = m.trioState ?? initialTrioState(m.playerIds);
    const target = m.targetScore || TRIO_DEFAULT_TARGET;
    const { state, roundWinnerId } = applyTrioAction(before, playerId, action, target);
    result = { roundWinnerId, before };
    await db.matches.put({ ...m, trioState: state, updatedAt: Date.now() });
  });
  return result;
}

/** Restaura um estado anterior do Trio (desfazer um "fechou a rodada" errado). */
export async function restoreTrioState(matchId: string, state: TrioState): Promise<void> {
  await db.transaction('rw', db.matches, async () => {
    const m = await db.matches.get(matchId);
    if (!m || m.gameId !== 'trio' || m.status !== 'em_andamento') return;
    await db.matches.put({ ...m, trioState: state, updatedAt: Date.now() });
  });
}

/** Encerra o Trio: campeão(ões) por mais pontos (rodadas vencidas). */
export async function finishTrioByHighest(matchId: string): Promise<void> {
  const m = await db.matches.get(matchId);
  if (!m) return;
  const state = m.trioState ?? initialTrioState(m.playerIds);
  await db.matches.put({
    ...m,
    status: 'finalizada',
    championIds: trioChampions(m.playerIds, state),
    updatedAt: Date.now(),
  });
}
