'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import type { MatchRecord } from '@/lib/db';
import { listFinishedMatches, toFlip7Match, deleteMatch } from '@/lib/repo';
import { GAMES, getGame } from '@/lib/games';
import { computeStandings } from '@/domain/flip7/scoring';
import { computeCatanScore, initialCatanPlayer } from '@/domain/catan/scoring';
import { computeRanking, type FinishedMatchSummary, type RankRow } from '@/domain/ranking';
import { Avatar } from '@/components/Avatar';
import { Dialog } from '@/components/Dialog';

type SortKey = 'wins' | 'winRate' | 'points';
/** 'all' = ranking geral (todos os jogos juntos); senão, um gameId. */
type GameFilter = 'all' | string;

const winRate = (r: RankRow) => (r.matchesPlayed > 0 ? r.wins / r.matchesPlayed : 0);

const SORTERS: Record<SortKey, (a: RankRow, b: RankRow) => number> = {
  wins: (a, b) => b.wins - a.wins || b.totalPoints - a.totalPoints || a.player.name.localeCompare(b.player.name),
  winRate: (a, b) => winRate(b) - winRate(a) || b.wins - a.wins || a.player.name.localeCompare(b.player.name),
  points: (a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins || a.player.name.localeCompare(b.player.name),
};

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: 'wins', label: 'Vitórias' },
  { key: 'winRate', label: 'Aproveit.' },
  { key: 'points', label: 'Pontos' },
];

function bigMetric(row: RankRow, sort: SortKey): { value: string; label: string } {
  if (sort === 'winRate') return { value: `${Math.round(winRate(row) * 100)}%`, label: 'aproveit.' };
  if (sort === 'points') return { value: `${row.totalPoints}`, label: 'pontos' };
  return { value: `${row.wins}`, label: row.wins === 1 ? 'vitória' : 'vitórias' };
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Total final por jogador de uma partida, no motor do jogo dela. */
function matchTotals(m: MatchRecord): Record<string, number> {
  if (m.gameId === 'catan') {
    const state = m.catanState ?? {};
    return Object.fromEntries(
      m.playerIds.map((id) => [id, computeCatanScore(state[id] ?? initialCatanPlayer())]),
    );
  }
  return Object.fromEntries(computeStandings(toFlip7Match(m)).map((s) => [s.playerId, s.total]));
}

/** Detalhe da partida na lista: rodadas no Flip 7, pontuação do campeão no Catan. */
function matchDetail(m: MatchRecord, totals: Record<string, number>): string {
  if (m.gameId === 'catan') {
    const champTotal = Math.max(0, ...m.championIds.map((id) => totals[id] ?? 0));
    return `${champTotal} PV`;
  }
  return `${m.rounds.length} rodadas`;
}

export default function HistoricoPage() {
  const matches = useLiveQuery(() => listFinishedMatches(), []);
  const [gameFilter, setGameFilter] = useState<GameFilter>('all');
  const [sort, setSort] = useState<SortKey>('wins');
  const [toDelete, setToDelete] = useState<MatchRecord | null>(null);

  if (matches === undefined) return <p className="text-muted">Carregando…</p>;

  const playableGames = GAMES.filter((g) => g.available);
  const visible = gameFilter === 'all' ? matches : matches.filter((m) => m.gameId === gameFilter);

  const enriched = visible.map((m) => ({ m, totals: matchTotals(m) }));
  const finished: FinishedMatchSummary[] = enriched.map(({ m, totals }) => ({
    players: m.players,
    championIds: m.championIds,
    totals,
  }));
  const ranking = [...computeRanking(finished)].sort(SORTERS[sort]);

  const filterName = gameFilter === 'all' ? 'Todos os jogos' : (getGame(gameFilter)?.name ?? gameFilter);

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Ranking</h1>
      <p className="mt-1 mb-4 text-sm text-muted">{filterName} · neste aparelho</p>

      {/* Filtro por jogo (Geral = todos juntos) */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[{ id: 'all' as const, name: 'Geral' }, ...playableGames].map((g) => (
          <button
            key={g.id}
            onClick={() => setGameFilter(g.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              gameFilter === g.id
                ? 'bg-ink text-bg'
                : 'bg-surface text-muted ring-1 ring-border hover:text-ink'
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <div className="text-4xl">🏆</div>
          <p className="mt-2 text-sm text-muted">
            {gameFilter === 'all'
              ? 'Nenhuma partida finalizada ainda.'
              : `Nenhuma partida de ${filterName} finalizada ainda.`}
          </p>
          <Link
            href={gameFilter === 'all' ? '/' : `/novo/${gameFilter}`}
            className="mt-4 inline-block rounded-xl bg-success px-5 py-2.5 font-semibold text-success-fg transition hover:brightness-105"
          >
            {gameFilter === 'all' ? 'Escolher um jogo' : `Jogar ${filterName}`}
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

          {gameFilter === 'all' && sort === 'points' && (
            <p className="-mt-2 mb-3 text-[11px] text-muted">
              No geral, os pontos somam escalas diferentes (ex.: ~200 por partida de Flip 7, ~10 de Catan).
            </p>
          )}

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
            Partidas ({visible.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {enriched.map(({ m, totals }) => {
              const champs = m.championIds
                .map((id) => m.players.find((p) => p.id === id)?.name)
                .filter(Boolean)
                .join(' e ');
              const gameName = getGame(m.gameId)?.name ?? m.gameId;
              return (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                  <span className="text-lg">🏆</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{champs || '—'}</div>
                    <div className="text-xs text-muted">
                      {formatDate(m.createdAt)}
                      {gameFilter === 'all' && ` · ${gameName}`} · {m.players.length} jogadores ·{' '}
                      {matchDetail(m, totals)}
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
          } · ${getGame(toDelete.gameId)?.name ?? toDelete.gameId} · ${formatDate(toDelete.createdAt)}. Essa ação não pode ser desfeita.`}
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
