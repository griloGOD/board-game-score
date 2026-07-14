'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Player } from '@/domain/types';
import type { TtrPlayerState } from '@/domain/ttr/types';
import type { MatchRecord } from '@/lib/db';
import { applyTtrMatchAction, finishTtrByHighest, reopenMatch } from '@/lib/repo';
import {
  computeTtrStandings,
  initialTtrPlayer,
  initialTtrState,
  ttrChampions,
  TTR_ROUTE_VALUES,
} from '@/domain/ttr/scoring';
import { Avatar } from '@/components/Avatar';
import { Dialog } from '@/components/Dialog';
import { NumberPrompt } from '@/components/NumberPrompt';

/** Nº de vagões (comprimento) que vale cada pontuação de trajeto. */
const ROUTE_LENGTH: Record<number, number> = { 1: 1, 2: 2, 4: 3, 7: 4, 10: 5, 15: 6 };

function routesSum(p: TtrPlayerState): number {
  return p.routes.reduce((s, n) => s + n, 0);
}

/** Resumo textual do estado (usado quando a partida encerra). */
function breakdown(p: TtrPlayerState): string {
  const parts = [`${routesSum(p)} de trajetos`];
  if (p.ticketPoints !== 0) parts.push(`bilhetes ${p.ticketPoints > 0 ? '+' : ''}${p.ticketPoints}`);
  if (p.hasLongestPath) parts.push('🛤️ trajeto mais longo +10');
  return parts.join(' · ');
}

/**
 * Placar do Ticket to Ride: total corrente por jogador. Trajetos capturados por
 * comprimento (1·2·4·7·10·15), bilhetes de destino (líquido) e o Trajeto Mais
 * Longo (+10, exclusivo). Sem meta — o fim é declarado e vence o maior total.
 */
export function TtrMatchView({ match: m }: { match: MatchRecord }) {
  const [tickets, setTickets] = useState<Player | null>(null);
  const [ending, setEnding] = useState(false);

  const finished = m.status === 'finalizada';
  const state = m.ttrState ?? initialTtrState(m.playerIds);
  const standings = computeTtrStandings(m.playerIds, state, m.championIds);
  const rankById = new Map(standings.map((s) => [s.playerId, s.rank]));
  const totalById = new Map(standings.map((s) => [s.playerId, s.total]));
  const leader = Math.max(0, ...standings.map((s) => s.total));

  const champions = m.championIds
    .map((cid) => m.players.find((p) => p.id === cid))
    .filter((p): p is Player => !!p);

  const previewChampions = ttrChampions(m.playerIds, state)
    .map((id) => m.players.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .join(' e ');

  return (
    <div className={finished ? 'pb-28' : 'pb-24'}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Ticket to Ride</h1>
          <p className="text-sm text-muted">
            {finished ? 'Partida encerrada' : 'Maior pontuação vence · sem meta'}
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
            <div className="mt-1 text-xs font-bold uppercase tracking-widest opacity-80">
              {champions.length > 1 ? 'Co-campeões' : 'Campeão'}
            </div>
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
          const ps = state[p.id] ?? initialTtrPlayer();
          const total = totalById.get(p.id) ?? 0;
          const rank = rankById.get(p.id) ?? 1;
          const pct = leader > 0 ? Math.round((total / leader) * 100) : 0;
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
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">{p.name}</span>
                <span className="font-display text-2xl font-extrabold tabular-nums text-ink">{total}</span>
                <span className="-ml-1 pt-1 text-[11px] font-bold uppercase text-muted">pts</span>
              </div>

              <div className="mx-3 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                <div className="h-full rounded-full bg-success transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>

              {!finished ? (
                <div className="flex flex-col gap-2.5 p-3">
                  <div>
                    <div className="mb-1.5 text-[11px] font-semibold text-muted">Trajeto capturado (vagões)</div>
                    <div className="flex flex-wrap gap-1.5">
                      {TTR_ROUTE_VALUES.map((v) => (
                        <button
                          key={v}
                          onClick={() => void applyTtrMatchAction(m.id, p.id, { type: 'addRoute', value: v })}
                          className="flex-1 rounded-lg bg-bg py-1.5 text-center ring-1 ring-border transition hover:bg-surface-2"
                          aria-label={`Trajeto de ${ROUTE_LENGTH[v]} vagões, +${v} pontos`}
                        >
                          <div className="font-display text-base font-extrabold tabular-nums text-ink">+{v}</div>
                          <div className="text-[10px] text-muted">{ROUTE_LENGTH[v]}🚃</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void applyTtrMatchAction(m.id, p.id, { type: 'undoRoute' })}
                      disabled={ps.routes.length === 0}
                      className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-border disabled:opacity-30"
                    >
                      ↩︎ Desfazer último
                    </button>
                    <button
                      onClick={() => setTickets(p)}
                      className="flex-1 rounded-lg bg-bg px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-border transition hover:bg-surface-2"
                    >
                      🎫 Bilhetes: <span className="tabular-nums">{ps.ticketPoints > 0 ? `+${ps.ticketPoints}` : ps.ticketPoints}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => void applyTtrMatchAction(m.id, p.id, { type: 'toggleLongestPath' })}
                    title="No máximo um jogador por vez — marcar aqui tira de quem tiver"
                    className={`rounded-xl px-2 py-2 text-xs font-semibold transition ${
                      ps.hasLongestPath
                        ? 'bg-success/15 text-ink ring-2 ring-success'
                        : 'bg-bg text-muted ring-1 ring-border hover:bg-surface-2'
                    }`}
                  >
                    🛤️ Trajeto Mais Longo <span className="tabular-nums">+10</span>
                  </button>
                </div>
              ) : (
                <p className="p-3 pt-2 text-xs text-muted">{breakdown(ps)}</p>
              )}
            </li>
          );
        })}
      </ol>

      {!finished ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <span className="text-sm text-muted">Encerre quando os vagões acabarem</span>
            <button
              onClick={() => setEnding(true)}
              className="rounded-xl bg-accent px-6 py-2.5 font-semibold text-accent-fg transition hover:brightness-105"
            >
              Encerrar jogo
            </button>
          </div>
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-end gap-2">
            <Link href="/historico" className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface">
              Ranking
            </Link>
            <Link href="/novo/ticket-to-ride" className="rounded-xl bg-success px-6 py-2.5 text-sm font-semibold text-success-fg transition hover:brightness-105">
              Nova partida
            </Link>
          </div>
        </div>
      )}

      {tickets && (
        <NumberPrompt
          title={`Bilhetes de ${tickets.name}`}
          hint="Líquido no fim: soma dos cumpridos menos os falhados (pode ser negativo)."
          initial={(state[tickets.id] ?? initialTtrPlayer()).ticketPoints}
          confirmLabel="Salvar"
          onConfirm={(value) => {
            void applyTtrMatchAction(m.id, tickets.id, { type: 'setTicketPoints', value });
            setTickets(null);
          }}
          onCancel={() => setTickets(null)}
        />
      )}

      {ending && (
        <Dialog
          title="Encerrar a partida?"
          message={
            previewChampions
              ? `Vence o maior total: ${previewChampions} (${leader} pts). Confira bilhetes e o trajeto mais longo antes.`
              : 'Vence o maior total. Confira bilhetes e o trajeto mais longo antes.'
          }
          onClose={() => setEnding(false)}
          actions={[
            {
              label: '🏆 Encerrar e declarar campeão',
              variant: 'primary',
              onClick: () => {
                void finishTtrByHighest(m.id);
                setEnding(false);
              },
            },
            { label: 'Cancelar', variant: 'ghost', onClick: () => setEnding(false) },
          ]}
        />
      )}
    </div>
  );
}
