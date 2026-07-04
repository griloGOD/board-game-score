'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Player } from '@/domain/types';
import type { Flip7Entry } from '@/domain/flip7/types';
import type { MatchRecord } from '@/lib/db';
import { getMatch, saveMatch, toFlip7Match } from '@/lib/repo';
import { computeStandings, computeRoundScore, isGameOver } from '@/domain/flip7/scoring';
import { Flip7EntryDialog } from '@/components/flip7/Flip7EntryDialog';

/** Alvo da edição: a rodada atual ('draft') ou uma rodada já fechada (índice). */
type EditTarget = { pid: string; round: number | 'draft' };

function entrySummary(entry: Flip7Entry | undefined): string {
  if (!entry) return '—';
  if (entry.kind === 'bust') return 'Estourou';
  return `${computeRoundScore(entry)} pts`;
}

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const match = useLiveQuery(() => getMatch(id), [id]);
  const [editing, setEditing] = useState<EditTarget | null>(null);

  if (match === undefined) return <p className="text-zinc-500">Carregando…</p>;
  if (match === null) {
    return (
      <p className="text-zinc-500">
        Partida não encontrada.{' '}
        <Link href="/" className="text-indigo-600 underline">
          Início
        </Link>
      </p>
    );
  }

  const m = match;
  const standings = computeStandings(toFlip7Match(m));
  const finished = m.status === 'finalizada';
  const roundNumber = m.rounds.length + 1;
  const draft = m.draftRound.entries;
  const allEntered = m.playerIds.every((pid) => pid in draft);

  const playerById = new Map<string, Player>(m.players.map((p) => [p.id, p]));
  const totalById = new Map<string, number>(standings.map((s) => [s.playerId, s.total]));
  const champions = m.championIds.map((cid) => playerById.get(cid)).filter((p): p is Player => !!p);

  /** Aplica uma entrada (na rodada atual ou numa fechada) e recalcula o fim/campeão. */
  async function applyEntry(target: EditTarget, entry: Flip7Entry) {
    let rounds = m.rounds;
    let draftRound = m.draftRound;

    if (target.round === 'draft') {
      draftRound = { entries: { ...m.draftRound.entries, [target.pid]: entry } };
    } else {
      rounds = m.rounds.map((r, i) =>
        i === target.round ? { entries: { ...r.entries, [target.pid]: entry } } : r,
      );
    }

    const view = { playerIds: m.playerIds, rounds, targetScore: m.targetScore };
    const over = isGameOver(view);
    const championIds = over
      ? computeStandings(view).filter((s) => s.isChampion).map((s) => s.playerId)
      : [];

    const updated: MatchRecord = {
      ...m,
      rounds,
      draftRound,
      status: over ? 'finalizada' : 'em_andamento',
      championIds,
    };
    await saveMatch(updated);
    setEditing(null);
  }

  async function closeRound() {
    if (!allEntered) return;
    const rounds = [...m.rounds, m.draftRound];
    const view = { playerIds: m.playerIds, rounds, targetScore: m.targetScore };
    const over = isGameOver(view);
    const championIds = over
      ? computeStandings(view).filter((s) => s.isChampion).map((s) => s.playerId)
      : [];
    const updated: MatchRecord = {
      ...m,
      rounds,
      draftRound: { entries: {} },
      status: over ? 'finalizada' : 'em_andamento',
      championIds,
    };
    await saveMatch(updated);
  }

  const editingEntry: Flip7Entry | undefined =
    editing === null
      ? undefined
      : editing.round === 'draft'
        ? m.draftRound.entries[editing.pid]
        : m.rounds[editing.round]?.entries[editing.pid];

  return (
    <div className="pb-28">
      {/* Cabeçalho */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Flip 7</h1>
          <p className="text-sm text-zinc-500">
            {finished ? 'Partida encerrada' : `Rodada ${roundNumber}`} · meta {m.targetScore}
          </p>
        </div>
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          Sair
        </Link>
      </div>

      {/* Campeão */}
      {finished && champions.length > 0 && (
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-5 text-center text-white shadow">
          <div className="text-4xl">🏆</div>
          <div className="mt-1 text-xs uppercase tracking-wide opacity-90">
            {champions.length > 1 ? 'Co-campeões' : 'Campeão'}
          </div>
          <div className="text-2xl font-bold">{champions.map((c) => c.name).join(' e ')}</div>
        </div>
      )}

      {/* Classificação */}
      <ol className="mb-6 flex flex-col gap-2">
        {standings.map((s) => {
          const p = playerById.get(s.playerId)!;
          return (
            <li
              key={s.playerId}
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                s.isChampion
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
                  : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <span className="w-5 text-center text-sm font-semibold text-zinc-400">{s.rank}</span>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                style={{ backgroundColor: p.color + '33' }}
              >
                {p.avatar}
              </span>
              <span className="flex-1 font-medium">{p.name}</span>
              <span className="text-xl font-bold tabular-nums">{s.total}</span>
            </li>
          );
        })}
      </ol>

      {/* Rodada atual */}
      {!finished && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Rodada {roundNumber}
          </h2>
          <ul className="flex flex-col gap-2">
            {m.players.map((p) => {
              const entry = draft[p.id];
              const done = p.id in draft;
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-base"
                    style={{ backgroundColor: p.color + '33' }}
                  >
                    {p.avatar}
                  </span>
                  <span className="flex-1 text-sm font-medium">{p.name}</span>
                  <span className={`text-sm tabular-nums ${done ? 'font-semibold' : 'text-zinc-400'}`}>
                    {entrySummary(entry)}
                  </span>
                  <button
                    onClick={() => setEditing({ pid: p.id, round: 'draft' })}
                    className="rounded-md bg-zinc-100 px-3 py-1 text-sm font-medium dark:bg-zinc-800"
                  >
                    {done ? 'Editar' : 'Lançar'}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Histórico de rodadas (editável) */}
      {m.rounds.length > 0 && (
        <details className="mb-6">
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Histórico de rodadas ({m.rounds.length}) · toque para editar
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500">
                  <th className="p-1 text-left font-medium">Jogador</th>
                  {m.rounds.map((_, i) => (
                    <th key={i} className="p-1 text-center font-medium">
                      R{i + 1}
                    </th>
                  ))}
                  <th className="p-1 text-center font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {m.players.map((p) => (
                  <tr key={p.id} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="whitespace-nowrap p-1">
                      {p.avatar} {p.name}
                    </td>
                    {m.rounds.map((r, i) => (
                      <td key={i} className="p-1 text-center">
                        <button
                          onClick={() => setEditing({ pid: p.id, round: i })}
                          className="w-full rounded px-1 tabular-nums text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          {r.entries[p.id] ? computeRoundScore(r.entries[p.id]) : '–'}
                        </button>
                      </td>
                    ))}
                    <td className="p-1 text-center font-semibold tabular-nums">{totalById.get(p.id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {/* Ação inferior */}
      {!finished ? (
        <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white/90 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <span className="text-sm text-zinc-500">
              {allEntered ? 'Todos lançaram' : 'Faltam jogadores lançar'}
            </span>
            <button
              onClick={closeRound}
              disabled={!allEntered}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white disabled:opacity-40"
            >
              Fechar rodada
            </button>
          </div>
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white/90 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="mx-auto flex max-w-3xl items-center justify-end gap-2">
            <Link
              href="/historico"
              className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium dark:border-zinc-700"
            >
              Ranking
            </Link>
            <Link
              href="/novo/flip7"
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white"
            >
              Nova partida
            </Link>
          </div>
        </div>
      )}

      {editing !== null && (
        <Flip7EntryDialog
          playerName={playerById.get(editing.pid)?.name ?? ''}
          initial={editingEntry}
          onCancel={() => setEditing(null)}
          onConfirm={(entry) => applyEntry(editing, entry)}
        />
      )}
    </div>
  );
}
