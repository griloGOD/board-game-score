'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { listFinishedMatches, toFlip7Match, deleteMatch } from '@/lib/repo';
import { computeStandings } from '@/domain/flip7/scoring';
import { computeFlip7Ranking, type FinishedFlip7Match } from '@/domain/flip7/ranking';
import { Avatar } from '@/components/Avatar';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function HistoricoPage() {
  const matches = useLiveQuery(() => listFinishedMatches('flip7'), []);

  if (matches === undefined) return <p className="text-muted">Carregando…</p>;

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
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Ranking</h1>
      <p className="mt-1 mb-6 text-sm text-muted">Flip 7 · neste aparelho</p>

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
          <ol className="mb-8 flex flex-col gap-2">
            {ranking.map((row, i) => (
              <li
                key={row.player.id}
                className={`flex items-center gap-3 rounded-2xl border p-3 ${
                  i === 0 ? 'border-accent bg-accent/10' : 'border-border bg-surface'
                }`}
              >
                <span className="w-6 text-center text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-sm font-bold text-muted">{i + 1}</span>}</span>
                <Avatar emoji={row.player.avatar} color={row.player.color} />
                <div className="flex-1">
                  <div className="font-semibold text-ink">{row.player.name}</div>
                  <div className="text-xs text-muted">
                    {row.matchesPlayed} partida(s) · melhor {row.bestScore}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-extrabold tabular-nums text-ink">{row.wins}</div>
                  <div className="text-[11px] text-muted">{row.wins === 1 ? 'vitória' : 'vitórias'}</div>
                </div>
              </li>
            ))}
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
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                >
                  <span className="text-lg">🏆</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-ink">{champs || '—'}</div>
                    <div className="text-xs text-muted">
                      {formatDate(m.createdAt)} · {m.players.length} jogadores · {m.rounds.length} rodadas
                    </div>
                  </div>
                  <button
                    onClick={() => void deleteMatch(m.id)}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label="Apagar partida"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
