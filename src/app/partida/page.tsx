'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Player } from '@/domain/types';
import type { Flip7Entry } from '@/domain/flip7/types';
import type { MatchRecord } from '@/lib/db';
import { getMatch, saveMatch, toFlip7Match } from '@/lib/repo';
import { computeStandings, computeRoundScore, isGameOver } from '@/domain/flip7/scoring';
import { Avatar } from '@/components/Avatar';
import { Flip7EntryDialog } from '@/components/flip7/Flip7EntryDialog';

type EditTarget = { pid: string; round: number | 'draft' };

function entrySummary(entry: Flip7Entry | undefined): string {
  if (!entry) return '—';
  if (entry.kind === 'bust') return 'Estourou';
  return `${computeRoundScore(entry)} pts`;
}

function MatchView() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';
  const match = useLiveQuery(() => (id ? getMatch(id) : undefined), [id]);
  const [editing, setEditing] = useState<EditTarget | null>(null);

  if (!id || match === null) {
    return (
      <p className="text-muted">
        Partida não encontrada.{' '}
        <Link href="/" className="text-primary underline">
          Início
        </Link>
      </p>
    );
  }
  if (match === undefined) return <p className="text-muted">Carregando…</p>;

  const m = match;
  const standings = computeStandings(toFlip7Match(m));
  const finished = m.status === 'finalizada';
  const roundNumber = m.rounds.length + 1;
  const draft = m.draftRound.entries;
  const allEntered = m.playerIds.every((pid) => pid in draft);

  const playerById = new Map<string, Player>(m.players.map((p) => [p.id, p]));
  const totalById = new Map<string, number>(standings.map((s) => [s.playerId, s.total]));
  const champions = m.championIds.map((cid) => playerById.get(cid)).filter((p): p is Player => !!p);
  const leader = standings[0]?.total ?? 0;

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
    await saveMatch({ ...m, rounds, draftRound, status: over ? 'finalizada' : 'em_andamento', championIds });
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
    await saveMatch({
      ...m,
      rounds,
      draftRound: { entries: {} },
      status: over ? 'finalizada' : 'em_andamento',
      championIds,
    });
  }

  const editingEntry: Flip7Entry | undefined =
    editing === null
      ? undefined
      : editing.round === 'draft'
        ? m.draftRound.entries[editing.pid]
        : m.rounds[editing.round]?.entries[editing.pid];

  return (
    <div className="pb-28">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Flip 7</h1>
          <p className="text-sm text-muted">
            {finished ? 'Partida encerrada' : `Rodada ${roundNumber}`} · meta {m.targetScore}
          </p>
        </div>
        <Link href="/" className="text-sm font-medium text-muted transition-colors hover:text-ink">
          Sair
        </Link>
      </div>

      {finished && champions.length > 0 && (
        <div className="animate-pop-in mb-6 overflow-hidden rounded-3xl bg-accent p-6 text-center text-accent-fg shadow-lg">
          <div className="text-5xl">🏆</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-widest opacity-80">
            {champions.length > 1 ? 'Co-campeões' : 'Campeão'}
          </div>
          <div className="font-display text-3xl font-extrabold">{champions.map((c) => c.name).join(' e ')}</div>
        </div>
      )}

      {/* Classificação */}
      <ol className="mb-6 flex flex-col gap-2">
        {standings.map((s) => {
          const p = playerById.get(s.playerId)!;
          const pct = leader > 0 ? Math.round((s.total / leader) * 100) : 0;
          return (
            <li
              key={s.playerId}
              className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3 ${
                s.isChampion ? 'border-accent bg-accent/10' : 'border-border bg-surface'
              }`}
            >
              {!finished && (
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 bg-primary/8"
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
              )}
              <span className="relative z-10 w-5 text-center text-sm font-bold text-muted">{s.rank}</span>
              <span className="relative z-10">
                <Avatar emoji={p.avatar} color={p.color} />
              </span>
              <span className="relative z-10 flex-1 font-semibold text-ink">{p.name}</span>
              <span className="relative z-10 font-display text-xl font-extrabold tabular-nums text-ink">{s.total}</span>
            </li>
          );
        })}
      </ol>

      {/* Rodada atual */}
      {!finished && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Rodada {roundNumber}</h2>
          <ul className="flex flex-col gap-2">
            {m.players.map((p) => {
              const entry = draft[p.id];
              const done = p.id in draft;
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2">
                  <Avatar emoji={p.avatar} color={p.color} size="sm" />
                  <span className="flex-1 text-sm font-medium text-ink">{p.name}</span>
                  <span className={`text-sm tabular-nums ${done ? 'font-semibold text-ink' : 'text-muted'}`}>
                    {entrySummary(entry)}
                  </span>
                  <button
                    onClick={() => setEditing({ pid: p.id, round: 'draft' })}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                      done
                        ? 'bg-surface-2 text-muted hover:text-ink'
                        : 'bg-primary text-primary-fg hover:brightness-105'
                    }`}
                  >
                    {done ? 'Editar' : 'Lançar'}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Histórico de rodadas */}
      {m.rounds.length > 0 && (
        <details className="mb-6 rounded-xl border border-border bg-surface p-3">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted">
            Rodadas ({m.rounds.length}) · toque para editar
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted">
                  <th className="p-1 text-left font-semibold">Jogador</th>
                  {m.rounds.map((_, i) => (
                    <th key={i} className="p-1 text-center font-semibold">
                      R{i + 1}
                    </th>
                  ))}
                  <th className="p-1 text-center font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {m.players.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="whitespace-nowrap p-1 text-ink">
                      {p.avatar} {p.name}
                    </td>
                    {m.rounds.map((r, i) => (
                      <td key={i} className="p-1 text-center">
                        <button
                          onClick={() => setEditing({ pid: p.id, round: i })}
                          className="w-full rounded px-1 tabular-nums text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                        >
                          {r.entries[p.id] ? computeRoundScore(r.entries[p.id]) : '–'}
                        </button>
                      </td>
                    ))}
                    <td className="p-1 text-center font-bold tabular-nums text-ink">{totalById.get(p.id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {/* Ação inferior */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          {!finished ? (
            <>
              <span className="text-sm text-muted">
                {allEntered ? '✓ Todos lançaram' : 'Faltam jogadores lançar'}
              </span>
              <button
                onClick={closeRound}
                disabled={!allEntered}
                className="rounded-xl bg-primary px-6 py-2.5 font-semibold text-primary-fg transition hover:brightness-105 disabled:opacity-40"
              >
                Fechar rodada
              </button>
            </>
          ) : (
            <div className="flex w-full items-center justify-end gap-2">
              <Link
                href="/historico"
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface"
              >
                Ranking
              </Link>
              <Link
                href="/novo/flip7"
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-fg transition hover:brightness-105"
              >
                Nova partida
              </Link>
            </div>
          )}
        </div>
      </div>

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

export default function MatchPage() {
  return (
    <Suspense fallback={<p className="text-muted">Carregando…</p>}>
      <MatchView />
    </Suspense>
  );
}
