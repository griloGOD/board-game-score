'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Player } from '@/domain/types';
import type { TrioState } from '@/domain/trio/types';
import type { MatchRecord } from '@/lib/db';
import { applyTrioMatchAction, finishTrioByHighest, reopenMatch, restoreTrioState } from '@/lib/repo';
import {
  computeTrioStandings,
  initialTrioState,
  normalizeTrioPlayer,
  trioChampions,
  TRIO_DEFAULT_TARGET,
} from '@/domain/trio/scoring';
import { Avatar } from '@/components/Avatar';
import { Dialog } from '@/components/Dialog';
import { MatchHeader } from '@/components/MatchHeader';
import { NumberPrompt } from '@/components/NumberPrompt';

/** Quem acabou de fechar uma rodada (para celebrar e poder desfazer). */
type RoundWin = { winner: Player; before: TrioState };

/**
 * Placar do Trio: a partida é uma série de rodadas. Fechar uma rodada (juntar a
 * meta de trios ou pegar o trio de 7) vale 1 PONTO e zera os trios de todos —
 * joga-se até decidirem parar (fim declarado); campeão é quem tem mais pontos.
 */
export function TrioMatchView({ match: m }: { match: MatchRecord }) {
  const [roundWin, setRoundWin] = useState<RoundWin | null>(null);
  const [editingWins, setEditingWins] = useState<Player | null>(null);
  const [ending, setEnding] = useState(false);

  const finished = m.status === 'finalizada';
  const target = m.targetScore || TRIO_DEFAULT_TARGET;
  const state = m.trioState ?? initialTrioState(m.playerIds);
  const standings = computeTrioStandings(m.playerIds, state, m.championIds);
  const rankById = new Map(standings.map((s) => [s.playerId, s.rank]));

  const roundNumber = 1 + m.playerIds.reduce((sum, id) => sum + normalizeTrioPlayer(state[id]).wins, 0);

  const champions = m.championIds
    .map((cid) => m.players.find((p) => p.id === cid))
    .filter((p): p is Player => !!p);

  const previewChampions = trioChampions(m.playerIds, state)
    .map((id) => m.players.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .join(' e ');

  async function addTrio(p: Player, seven: boolean) {
    const { roundWinnerId, before } = await applyTrioMatchAction(m.id, p.id, { type: 'addTrio', seven });
    if (roundWinnerId && before) setRoundWin({ winner: p, before });
  }

  return (
    <div className="pb-28">
      <MatchHeader
        gameId="trio"
        title="Trio"
        subtitle={
          finished
            ? 'Partida encerrada'
            : `Rodada ${roundNumber} · ${target} trios (ou o trio de 7) valem 1 ponto`
        }
      />

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

      {roundWin && !finished && (
        <div className="animate-pop-in mb-4 rounded-2xl border border-accent bg-accent/15 p-3">
          <div className="text-sm font-bold text-ink">
            🎉 {roundWin.winner.name} fechou a rodada: +1 ponto!
          </div>
          <div className="mt-0.5 text-xs text-muted">
            Os trios de todos zeraram — valendo a rodada {roundNumber}.
          </div>
          <div className="mt-2.5 flex gap-2">
            <button
              onClick={() => setRoundWin(null)}
              className="flex-1 rounded-lg bg-success py-2 text-xs font-semibold text-success-fg transition hover:brightness-105"
            >
              Continuar
            </button>
            <button
              onClick={() => {
                void restoreTrioState(m.id, roundWin.before);
                setRoundWin(null);
              }}
              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-ink transition hover:bg-surface-2"
            >
              ↩︎ Desfazer
            </button>
          </div>
        </div>
      )}

      <ol className="flex flex-col gap-3">
        {m.players.map((p) => {
          const ps = normalizeTrioPlayer(state[p.id]);
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
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">{p.name}</span>
                <button
                  onClick={() => !finished && setEditingWins(p)}
                  disabled={finished}
                  title="Tocar para corrigir os pontos"
                  aria-label={`Corrigir os pontos de ${p.name}`}
                  className="rounded-lg px-1 font-display text-2xl font-extrabold tabular-nums text-ink transition enabled:hover:bg-surface-2"
                >
                  {ps.wins}
                </button>
                <span className="-ml-1 pt-1 text-[11px] font-bold uppercase text-muted">
                  {ps.wins === 1 ? 'ponto' : 'pontos'}
                </span>
              </div>

              {!finished && (
                <div className="flex items-center gap-1.5 px-3 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Rodada
                  </span>
                  {Array.from({ length: target }).map((_, i) => (
                    <span
                      key={i}
                      aria-hidden
                      className={`h-3 w-3 rounded-full ${
                        i < Math.min(ps.trios, target) ? 'bg-success' : 'bg-surface-2 ring-1 ring-border'
                      }`}
                    />
                  ))}
                  <span className="text-[11px] tabular-nums text-muted">
                    {ps.trios}/{target}
                  </span>
                </div>
              )}

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
                    onClick={() => void addTrio(p, false)}
                    className="flex-1 rounded-xl bg-success py-2.5 text-sm font-semibold text-success-fg transition hover:brightness-105"
                  >
                    + trio
                  </button>
                  <button
                    onClick={() => void addTrio(p, true)}
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

      {!finished ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <span className="text-sm text-muted">Joguem quantas rodadas quiserem</span>
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
            <Link href="/novo/trio" className="rounded-xl bg-success px-6 py-2.5 text-sm font-semibold text-success-fg transition hover:brightness-105">
              Nova partida
            </Link>
          </div>
        </div>
      )}

      {editingWins && (
        <NumberPrompt
          title={`Pontos de ${editingWins.name}`}
          hint="Cada rodada vencida vale 1 ponto. Use para corrigir um engano."
          initial={normalizeTrioPlayer(state[editingWins.id]).wins}
          confirmLabel="Salvar"
          onConfirm={(value) => {
            void applyTrioMatchAction(m.id, editingWins.id, { type: 'setWins', value });
            setEditingWins(null);
          }}
          onCancel={() => setEditingWins(null)}
        />
      )}

      {ending && (
        <Dialog
          title="Encerrar a partida?"
          message={
            previewChampions
              ? `Vence quem tem mais pontos: ${previewChampions}. Dá para reabrir depois se precisar.`
              : 'Vence quem tem mais pontos (rodadas vencidas).'
          }
          onClose={() => setEnding(false)}
          actions={[
            {
              label: '🏆 Encerrar e declarar campeão',
              variant: 'primary',
              onClick: () => {
                void finishTrioByHighest(m.id);
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
