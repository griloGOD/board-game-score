'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { listFinishedMatches, toFlip7Match, deleteMatch } from '@/lib/repo';
import { computeStandings } from '@/domain/flip7/scoring';
import { computeFlip7Ranking, type FinishedFlip7Match } from '@/domain/flip7/ranking';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function HistoricoPage() {
  const matches = useLiveQuery(() => listFinishedMatches('flip7'), []);

  if (matches === undefined) return <p className="text-zinc-500">Carregando…</p>;

  const finished: FinishedFlip7Match[] = matches.map((m) => {
    const standings = computeStandings(toFlip7Match(m));
    return {
      players: m.players,
      championIds: m.championIds,
      totals: Object.fromEntries(standings.map((s) => [s.playerId, s.total])),
    };
  });
  const ranking = computeFlip7Ranking(finished);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Histórico &amp; ranking</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500 dark:text-zinc-400">Flip 7 · neste aparelho</p>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Nenhuma partida finalizada ainda.
          <div className="mt-3">
            <Link href="/novo/flip7" className="inline-block rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white">
              Jogar Flip 7
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">Ranking</h2>
            <ol className="flex flex-col gap-2">
              {ranking.map((row, i) => (
                <li
                  key={row.player.id}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="w-5 text-center text-sm font-semibold text-zinc-400">{i + 1}</span>
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                    style={{ backgroundColor: row.player.color + '33' }}
                  >
                    {row.player.avatar}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{row.player.name}</div>
                    <div className="text-xs text-zinc-500">
                      {row.matchesPlayed} partida(s) · melhor {row.bestScore}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold tabular-nums">{row.wins}</div>
                    <div className="text-xs text-zinc-500">vitória(s)</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Partidas ({matches.length})
            </h2>
            <ul className="flex flex-col gap-2">
              {matches.map((m) => {
                const champs = m.championIds
                  .map((id) => m.players.find((p) => p.id === id)?.name)
                  .filter(Boolean)
                  .join(' e ');
                return (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <span className="text-lg">🏆</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{champs || '—'}</div>
                      <div className="text-xs text-zinc-500">
                        {formatDate(m.createdAt)} · {m.players.length} jogadores · {m.rounds.length} rodadas
                      </div>
                    </div>
                    <button
                      onClick={() => void deleteMatch(m.id)}
                      className="px-2 text-zinc-400 hover:text-red-500"
                      aria-label="Apagar partida"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
