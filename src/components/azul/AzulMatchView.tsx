'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Player } from '@/domain/types';
import type { AzulBonus, AzulPlayerState } from '@/domain/azul/types';
import type { MatchRecord } from '@/lib/db';
import { applyAzulMatchAction, finishAzulByHighest, reopenMatch } from '@/lib/repo';
import {
  AZUL_BONUS_MAX,
  azulChampions,
  computeAzulStandings,
  initialAzulPlayer,
  initialAzulState,
} from '@/domain/azul/scoring';
import { Avatar } from '@/components/Avatar';
import { Dialog } from '@/components/Dialog';
import { NumberPrompt } from '@/components/NumberPrompt';

/** Onde estamos editando um ponto de rodada: nova rodada ou uma existente. */
type RoundEdit = { pid: string; index: number | 'new' };

const stepBtn =
  'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-lg font-bold transition disabled:opacity-30';

function BonusRow({
  label,
  points,
  value,
  onDec,
  onInc,
}: {
  label: string;
  points: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink">{label}</div>
        <div className="text-[11px] text-muted">{points}</div>
      </div>
      <button onClick={onDec} disabled={value <= 0} className={`${stepBtn} bg-surface-2 text-ink hover:bg-border`} aria-label={`Menos ${label}`}>
        −
      </button>
      <span className="w-5 text-center font-display text-base font-extrabold tabular-nums text-ink">{value}</span>
      <button
        onClick={onInc}
        disabled={value >= AZUL_BONUS_MAX}
        className={`${stepBtn} bg-success text-success-fg hover:brightness-105`}
        aria-label={`Mais ${label}`}
      >
        +
      </button>
    </div>
  );
}

/** Resumo textual do estado de um jogador (usado quando a partida encerra). */
function breakdown(p: AzulPlayerState): string {
  const roundTotal = Math.max(0, p.rounds.reduce((s, n) => s + n, 0));
  const parts = [`${roundTotal} de rodadas`];
  if (p.fullRows > 0) parts.push(`${p.fullRows}×linha`);
  if (p.fullCols > 0) parts.push(`${p.fullCols}×coluna`);
  if (p.fullColors > 0) parts.push(`${p.fullColors}×cor`);
  return parts.join(' · ');
}

/**
 * Placar do Azul: total corrente por jogador (soma das rodadas, piso 0) mais os
 * bônus de fim (linha +2, coluna +7, cor +10). Sem meta — o fim é declarado e
 * vence o maior total.
 */
export function AzulMatchView({ match: m }: { match: MatchRecord }) {
  const [editing, setEditing] = useState<RoundEdit | null>(null);
  const [ending, setEnding] = useState(false);

  const finished = m.status === 'finalizada';
  const state = m.azulState ?? initialAzulState(m.playerIds);
  const standings = computeAzulStandings(m.playerIds, state, m.championIds);
  const rankById = new Map(standings.map((s) => [s.playerId, s.rank]));
  const totalById = new Map(standings.map((s) => [s.playerId, s.total]));
  const leader = Math.max(0, ...standings.map((s) => s.total));
  const someoneFinishedRow = m.playerIds.some((id) => (state[id] ?? initialAzulPlayer()).fullRows >= 1);

  const champions = m.championIds
    .map((cid) => m.players.find((p) => p.id === cid))
    .filter((p): p is Player => !!p);

  function bonus(pid: string, b: AzulBonus, delta: number) {
    const current = (state[pid] ?? initialAzulPlayer())[b];
    void applyAzulMatchAction(m.id, pid, { type: 'setBonus', bonus: b, value: current + delta });
  }

  // Prévia do campeão no diálogo de encerrar.
  const previewChampions = azulChampions(m.playerIds, state)
    .map((id) => m.players.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .join(' e ');
  const previewScore = leader;

  return (
    <div className={finished ? 'pb-28' : 'pb-24'}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Azul</h1>
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
          const ps = state[p.id] ?? initialAzulPlayer();
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
                  <button
                    onClick={() => setEditing({ pid: p.id, index: 'new' })}
                    className="w-full rounded-xl bg-success py-2.5 text-sm font-semibold text-success-fg transition hover:brightness-105"
                  >
                    + pontos da rodada
                  </button>

                  {ps.rounds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {ps.rounds.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => setEditing({ pid: p.id, index: i })}
                          className="rounded-lg bg-bg px-2.5 py-1 text-sm font-semibold tabular-nums text-ink ring-1 ring-border transition hover:bg-surface-2"
                          title="Tocar para editar ou apagar"
                        >
                          {r >= 0 ? `+${r}` : r}
                        </button>
                      ))}
                    </div>
                  )}

                  <details className="rounded-xl border border-border bg-bg">
                    <summary className="cursor-pointer px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">
                      Fim de jogo · bônus
                    </summary>
                    <div className="flex flex-col gap-2 p-3 pt-1">
                      <BonusRow label="🟦 Linhas completas" points="+2 cada" value={ps.fullRows} onDec={() => bonus(p.id, 'fullRows', -1)} onInc={() => bonus(p.id, 'fullRows', 1)} />
                      <BonusRow label="🟥 Colunas completas" points="+7 cada" value={ps.fullCols} onDec={() => bonus(p.id, 'fullCols', -1)} onInc={() => bonus(p.id, 'fullCols', 1)} />
                      <BonusRow label="🎨 Cores completas" points="+10 cada" value={ps.fullColors} onDec={() => bonus(p.id, 'fullColors', -1)} onInc={() => bonus(p.id, 'fullColors', 1)} />
                    </div>
                  </details>
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
            <span className="text-sm text-muted">
              {someoneFinishedRow ? '✓ Alguém completou uma linha' : 'Encerre quando alguém completar uma linha'}
            </span>
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
            <Link href="/novo/azul" className="rounded-xl bg-success px-6 py-2.5 text-sm font-semibold text-success-fg transition hover:brightness-105">
              Nova partida
            </Link>
          </div>
        </div>
      )}

      {editing && (
        <NumberPrompt
          title={editing.index === 'new' ? 'Pontos da rodada' : 'Editar rodada'}
          hint="Pode ser negativo (penalidade da fileira do chão)."
          initial={editing.index === 'new' ? 0 : (state[editing.pid]?.rounds[editing.index] ?? 0)}
          confirmLabel={editing.index === 'new' ? 'Adicionar' : 'Salvar'}
          removeLabel={editing.index === 'new' ? undefined : 'Apagar rodada'}
          onRemove={
            editing.index === 'new'
              ? undefined
              : () => {
                  void applyAzulMatchAction(m.id, editing.pid, { type: 'removeRound', index: editing.index as number });
                  setEditing(null);
                }
          }
          onConfirm={(value) => {
            if (editing.index === 'new') {
              void applyAzulMatchAction(m.id, editing.pid, { type: 'addRound', points: value });
            } else {
              void applyAzulMatchAction(m.id, editing.pid, { type: 'editRound', index: editing.index, points: value });
            }
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {ending && (
        <Dialog
          title="Encerrar a partida?"
          message={
            previewChampions
              ? `Vence quem tiver o maior total: ${previewChampions} (${previewScore} pts). Confira os bônus de fim antes.`
              : 'Vence o maior total. Confira os bônus de fim antes.'
          }
          onClose={() => setEnding(false)}
          actions={[
            {
              label: '🏆 Encerrar e declarar campeão',
              variant: 'primary',
              onClick: () => {
                void finishAzulByHighest(m.id);
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
