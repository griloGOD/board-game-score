'use client';

import Link from 'next/link';
import type { Player } from '@/domain/types';
import type { MatchRecord } from '@/lib/db';
import { applyTrioMatchAction, reopenMatch } from '@/lib/repo';
import { computeTrioStandings, initialTrioPlayer, initialTrioState, TRIO_DEFAULT_TARGET } from '@/domain/trio/scoring';
import { Avatar } from '@/components/Avatar';

/**
 * Placar do Trio: cada jogador coleta trios. Vence quem juntar a meta (padrão 3)
 * ou pegar o trio de 7 — a vitória é automática, como no Flip 7.
 */
export function TrioMatchView({ match: m }: { match: MatchRecord }) {
  const finished = m.status === 'finalizada';
  const target = m.targetScore || TRIO_DEFAULT_TARGET;
  const state = m.trioState ?? initialTrioState(m.playerIds);
  const standings = computeTrioStandings(m.playerIds, state, m.championIds);
  const rankById = new Map(standings.map((s) => [s.playerId, s.rank]));

  const champions = m.championIds
    .map((cid) => m.players.find((p) => p.id === cid))
    .filter((p): p is Player => !!p);

  return (
    <div className={finished ? 'pb-28' : 'pb-10'}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Trio</h1>
          <p className="text-sm text-muted">
            {finished ? 'Partida encerrada' : `Primeiro a ${target} trios (ou o trio de 7) vence`}
          </p>
        </div>
        <Link href="/" className="text-sm font-medium text-muted transition-colors hover:text-ink">
          Sair
        </Link>
      </div>

      {finished && champions.length > 0 && (
        <div className="mb-6">
          <div className="animate-pop-in overflow-hidden rounded-3xl bg-accent p-6 text-center text-accent-fg shadow-lg">
            <div className="text-5xl">🏆</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-widest opacity-80">Campeão</div>
            <div className="font-display text-3xl font-extrabold">{champions.map((c) => c.name).join(' e ')}</div>
          </div>
          <button
            onClick={() => void reopenMatch(m.id)}
            className="mx-auto mt-2 block text-xs text-muted underline transition-colors hover:text-ink"
          >
            Reabrir partida para corrigir
          </button>
        </div>
      )}

      <ol className="flex flex-col gap-3">
        {m.players.map((p) => {
          const ps = state[p.id] ?? initialTrioPlayer();
          const rank = rankById.get(p.id) ?? 1;
          const isChampion = m.championIds.includes(p.id);

          return (
            <li
              key={p.id}
              className={`overflow-hidden rounded-2xl border ${
                isChampion ? 'border-accent bg-accent/10' : 'border-border bg-surface'
              }`}
            >
              <div className="flex items-center gap-3 p-3 pb-2">
                <span className="w-6 text-center text-sm font-bold text-muted">{rank}º</span>
                <Avatar emoji={p.avatar} color={p.color} />
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">
                  {p.name}
                  {ps.hasSeven && <span className="ml-1.5 text-xs font-semibold text-success">🍀 trio de 7</span>}
                </span>
                <span className="font-display text-2xl font-extrabold tabular-nums text-ink">{ps.trios}</span>
                <span className="-ml-1 pt-1 text-[11px] font-bold uppercase text-muted">trios</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 pb-1" aria-hidden>
                {Array.from({ length: target }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-3 w-3 rounded-full ${i < Math.min(ps.trios, target) ? 'bg-success' : 'bg-surface-2 ring-1 ring-border'}`}
                  />
                ))}
              </div>

              {!finished && (
                <div className="flex items-center gap-2 p-3">
                  <button
                    onClick={() => void applyTrioMatchAction(m.id, p.id, { type: 'undoTrio', seven: false })}
                    disabled={ps.trios <= 0}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-lg font-bold text-ink transition hover:bg-border disabled:opacity-30"
                    aria-label={`Menos um trio de ${p.name}`}
                  >
                    −
                  </button>
                  <button
                    onClick={() => void applyTrioMatchAction(m.id, p.id, { type: 'addTrio', seven: false })}
                    className="flex-1 rounded-xl bg-success py-2.5 text-sm font-semibold text-success-fg transition hover:brightness-105"
                  >
                    + trio
                  </button>
                  <button
                    onClick={() => void applyTrioMatchAction(m.id, p.id, { type: 'addTrio', seven: true })}
                    className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-fg transition hover:brightness-105"
                  >
                    + trio dos 7 🍀
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {finished && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-end gap-2">
            <Link href="/historico" className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface">
              Ranking
            </Link>
            <Link href="/novo/trio" className="rounded-xl bg-success px-6 py-2.5 text-sm font-semibold text-success-fg transition hover:brightness-105">
              Nova partida
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
