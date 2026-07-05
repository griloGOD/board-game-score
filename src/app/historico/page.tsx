'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import type { MatchRecord } from '@/lib/db';
import { listFinishedMatches, toFlip7Match, deleteMatch } from '@/lib/repo';
import { computeStandings } from '@/domain/flip7/scoring';
import { computeFlip7Ranking, type FinishedFlip7Match, type Flip7RankRow } from '@/domain/flip7/ranking';
import { Avatar } from '@/components/Avatar';
import { Dialog } from '@/components/Dialog';

type SortKey = 'wins' | 'winRate' | 'points';

const winRate = (r: Flip7RankRow) => (r.matchesPlayed > 0 ? r.wins / r.matchesPlayed : 0);

const SORTERS: Record<SortKey, (a: Flip7RankRow, b: Flip7RankRow) => number> = {
  wins: (a, b) => b.wins - a.wins || b.totalPoints - a.totalPoints || a.player.name.localeCompare(b.player.name),
  winRate: (a, b) => winRate(b) - winRate(a) || b.wins - a.wins || a.player.name.localeCompare(b.player.name),
  points: (a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins || a.player.name.localeCompare(b.player.name),
};

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: 'wins', label: 'Vitórias' },
  { key: 'winRate', label: 'Aproveit.' },
  { key: 'points', label: 'Pontos' },
];

function bigMetric(row: Flip7RankRow, sort: SortKey): { value: string; label: string } {
  if (sort === 'winRate') return { value: `${Math.round(winRate(row) * 100)}%`, label: 'aproveit.' };
  if (sort === 'points') return { value: `${row.totalPoints}`, label: 'pontos' };
  return { value: `${row.wins}`, label: row.wins === 1 ? 'vitória' : 'vitórias' };
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function HistoricoPage() {
  const matches = useLiveQuery(() => listFinishedMatches('flip7'), []);
  const [sort, setSort] = useState<SortKey>('wins');
  const [toDelete, setToDelete] = useState<MatchRecord | null>(null);

  if (matches === undefined) return <p className="text-muted">Carregando…</p>;

  const finished: FinishedFlip7Match[] = matches.map((m) => {
    const standings = computeStandings(toFlip7Match(m));
    return {
      players: m.players,
      championIds: m.championIds,
      totals: Object.fromEntries(standings.map((s) => [s.playerId, s.total])),
    };
  });
  const ranking = [...computeFlip7Ranking(finished)].sort(SORTERS[sort]);

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Ranking</h1>
      <p className="mt-1 mb-5 text-sm text-muted">Flip 7 · neste aparelho</p>

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <div className="text-4xl">🏆</div>
          <p className="mt-2 text-sm text-muted">Nenhuma partida finalizada ainda.</p>
          <Link
            href="/novo/flip7"
            className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-fg transition hover:brightness-105"
          >
            Jogar Flip 7
          </Link>
        </div>
      ) : (
        <>
          {/* Ordenação */}
          <div className="mb-4 flex rounded-xl bg-surface-2 p-1 text-sm">
            {SORT_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setSort(t.key)}
                className={`flex-1 rounded-lg py-1.5 font-semibold transition ${
                  sort === t.key ? 'bg-bg text-ink shadow-sm' : 'text-muted'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <ol className="mb-8 flex flex-col gap-2">
            {ranking.map((row, i) => {
              const big = bigMetric(row, sort);
              return (
                <li
                  key={row.player.id}
                  className={`flex items-center gap-3 rounded-2xl border p-3 ${
                    i === 0 ? 'border-accent bg-accent/10' : 'border-border bg-surface'
                  }`}
                >
                  <span className="w-6 text-center text-lg">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-sm font-bold text-muted">{i + 1}</span>}
                  </span>
                  <Avatar emoji={row.player.avatar} color={row.player.color} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink">{row.player.name}</div>
                    <div className="text-[11px] text-muted">
                      {row.matchesPlayed} jogos · {row.wins} vit · {Math.round(winRate(row) * 100)}% · {row.totalPoints} pts
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-extrabold tabular-nums text-ink">{big.value}</div>
                    <div className="text-[11px] text-muted">{big.label}</div>
                  </div>
                </li>
              );
            })}
          </ol>

          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
            Partidas ({matches.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {matches.map((m) => {
              const champs = m.championIds
                .map((id) => m.players.find((p) => p.id === id)?.name)
                .filter(Boolean)
                .join(' e ');
              return (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                  <span className="text-lg">🏆</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{champs || '—'}</div>
                    <div className="text-xs text-muted">
                      {formatDate(m.createdAt)} · {m.players.length} jogadores · {m.rounds.length} rodadas
                    </div>
                  </div>
                  <button
                    onClick={() => setToDelete(m)}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label="Apagar partida"
                  >
                    🗑️
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {toDelete && (
        <Dialog
          title="Apagar esta partida?"
          message={`${
            toDelete.championIds
              .map((id) => toDelete.players.find((p) => p.id === id)?.name)
              .filter(Boolean)
              .join(' e ') || 'Partida'
          } · ${formatDate(toDelete.createdAt)}. Essa ação não pode ser desfeita.`}
          onClose={() => setToDelete(null)}
          actions={[
            {
              label: 'Apagar',
              variant: 'danger',
              onClick: () => {
                void deleteMatch(toDelete.id);
                setToDelete(null);
              },
            },
            { label: 'Cancelar', variant: 'ghost', onClick: () => setToDelete(null) },
          ]}
        />
      )}
    </div>
  );
}
