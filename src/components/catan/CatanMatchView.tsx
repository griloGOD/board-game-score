'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Player } from '@/domain/types';
import type { CatanAction, CatanPlayerState } from '@/domain/catan/types';
import type { MatchRecord } from '@/lib/db';
import { applyCatanMatchAction, declareCatanChampion, reopenMatch } from '@/lib/repo';
import {
  CATAN_MAX,
  canIncrement,
  computeCatanStandings,
  initialCatanPlayer,
  initialCatanState,
} from '@/domain/catan/scoring';
import { Avatar } from '@/components/Avatar';
import { Dialog } from '@/components/Dialog';

function stepClass(kind: 'dec' | 'inc'): string {
  const base =
    'grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg font-bold transition disabled:opacity-30';
  return kind === 'inc'
    ? `${base} bg-success text-success-fg hover:brightness-105`
    : `${base} bg-surface-2 text-ink hover:bg-border`;
}

interface CounterRowProps {
  label: string;
  hint: string;
  value: number;
  canDec: boolean;
  canInc: boolean;
  onDec: () => void;
  onInc: () => void;
}

function CounterRow({ label, hint, value, canDec, canInc, onDec, onInc }: CounterRowProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink">{label}</div>
        <div className="text-[11px] text-muted">{hint}</div>
      </div>
      <button onClick={onDec} disabled={!canDec} className={stepClass('dec')} aria-label={`Menos ${label}`}>
        −
      </button>
      <span className="w-6 text-center font-display text-lg font-extrabold tabular-nums text-ink">{value}</span>
      <button onClick={onInc} disabled={!canInc} className={stepClass('inc')} aria-label={`Mais ${label}`}>
        +
      </button>
    </div>
  );
}

/** Resumo textual do estado de um jogador (usado quando a partida encerra). */
function breakdown(p: CatanPlayerState): string {
  const parts: string[] = [];
  parts.push(`${p.settlements} povoado${p.settlements === 1 ? '' : 's'}`);
  parts.push(`${p.cities} cidade${p.cities === 1 ? '' : 's'}`);
  if (p.vpCards > 0) parts.push(`${p.vpCards} carta${p.vpCards === 1 ? '' : 's'} de PV`);
  if (p.hasLongestRoad) parts.push('🛤️ Estrada Mais Longa');
  if (p.hasLargestArmy) parts.push('⚔️ Maior Exército');
  return parts.join(' · ');
}

/**
 * Placar de uma partida de Catan: estado vivo por jogador (povoados ×1,
 * cidades ×2, cartas de PV ×1, Estrada Mais Longa/Maior Exército +2) numa
 * corrida até a meta de pontos de vitória. A vitória é DECLARADA, como no jogo.
 */
export function CatanMatchView({ match: m }: { match: MatchRecord }) {
  const [declaring, setDeclaring] = useState<Player | null>(null);

  const finished = m.status === 'finalizada';
  const state = m.catanState ?? initialCatanState(m.playerIds);
  const standings = computeCatanStandings(m.playerIds, state, m.championIds);
  const rankById = new Map(standings.map((s) => [s.playerId, s.rank]));
  const totalById = new Map(standings.map((s) => [s.playerId, s.total]));
  const champions = m.championIds
    .map((cid) => m.players.find((p) => p.id === cid))
    .filter((p): p is Player => !!p);

  function act(playerId: string, action: CatanAction) {
    void applyCatanMatchAction(m.id, playerId, action);
  }

  return (
    <div className={finished ? 'pb-28' : 'pb-10'}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Catan</h1>
          <p className="text-sm text-muted">
            {finished
              ? `Partida encerrada · meta ${m.targetScore} PV`
              : `Corrida até ${m.targetScore} pontos de vitória`}
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
            <div className="font-display text-3xl font-extrabold">
              {champions.map((c) => c.name).join(' e ')}
            </div>
          </div>
          <button
            onClick={() => void reopenMatch(m.id)}
            className="mx-auto mt-2 block text-xs text-muted underline transition-colors hover:text-ink"
          >
            Reabrir partida para corrigir
          </button>
        </div>
      )}

      {/* Um cartão por jogador, na ordem da mesa (não reordena sob o dedo) */}
      <ol className="flex flex-col gap-3">
        {m.players.map((p) => {
          const ps = state[p.id] ?? initialCatanPlayer();
          const total = totalById.get(p.id) ?? 0;
          const rank = rankById.get(p.id) ?? 1;
          const pct = Math.min(100, Math.round((total / m.targetScore) * 100));
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
                <span className="-ml-1 pt-1 text-[11px] font-bold uppercase text-muted">PV</span>
              </div>

              <div className="mx-3 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                <div
                  className="h-full rounded-full bg-success transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {!finished ? (
                <div className="flex flex-col gap-2.5 p-3">
                  <CounterRow
                    label="🏠 Povoados"
                    hint="1 PV cada"
                    value={ps.settlements}
                    canDec={ps.settlements > 0}
                    canInc={canIncrement(ps, 'settlements')}
                    onDec={() => act(p.id, { type: 'decrement', counter: 'settlements' })}
                    onInc={() => act(p.id, { type: 'increment', counter: 'settlements' })}
                  />
                  <CounterRow
                    label="🏰 Cidades"
                    hint="2 PV cada · substitui um povoado"
                    value={ps.cities}
                    canDec={ps.cities > 0}
                    canInc={canIncrement(ps, 'cities')}
                    onDec={() => act(p.id, { type: 'decrement', counter: 'cities' })}
                    onInc={() => act(p.id, { type: 'increment', counter: 'cities' })}
                  />
                  <CounterRow
                    label="📜 Cartas de PV"
                    hint="1 PV cada (desenvolvimento)"
                    value={ps.vpCards}
                    canDec={ps.vpCards > 0}
                    canInc={canIncrement(ps, 'vpCards')}
                    onDec={() => act(p.id, { type: 'decrement', counter: 'vpCards' })}
                    onInc={() => act(p.id, { type: 'increment', counter: 'vpCards' })}
                  />

                  <div className="mt-0.5 flex gap-2">
                    <button
                      onClick={() => act(p.id, { type: 'toggleLongestRoad' })}
                      title="No máximo um jogador por vez — marcar aqui tira de quem tiver"
                      className={`flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition ${
                        ps.hasLongestRoad
                          ? 'bg-success/15 text-ink ring-2 ring-success'
                          : 'bg-bg text-muted ring-1 ring-border hover:bg-surface-2'
                      }`}
                    >
                      🛤️ Estrada Mais Longa <span className="tabular-nums">+2</span>
                    </button>
                    <button
                      onClick={() => act(p.id, { type: 'toggleLargestArmy' })}
                      title="No máximo um jogador por vez — marcar aqui tira de quem tiver"
                      className={`flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition ${
                        ps.hasLargestArmy
                          ? 'bg-success/15 text-ink ring-2 ring-success'
                          : 'bg-bg text-muted ring-1 ring-border hover:bg-surface-2'
                      }`}
                    >
                      ⚔️ Maior Exército <span className="tabular-nums">+2</span>
                    </button>
                  </div>

                  {total >= m.targetScore && (
                    <button
                      onClick={() => setDeclaring(p)}
                      className="animate-pop-in mt-0.5 w-full rounded-xl bg-accent py-2.5 font-semibold text-accent-fg transition hover:brightness-105"
                    >
                      🏆 Declarar vitória de {p.name}
                    </button>
                  )}
                </div>
              ) : (
                <p className="p-3 pt-2 text-xs text-muted">{breakdown(ps)}</p>
              )}
            </li>
          );
        })}
      </ol>

      {/* Ação inferior (apenas quando encerrada; durante o jogo tudo é inline) */}
      {finished && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-end gap-2">
            <Link
              href="/historico"
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface"
            >
              Ranking
            </Link>
            <Link
              href="/novo/catan"
              className="rounded-xl bg-success px-6 py-2.5 text-sm font-semibold text-success-fg transition hover:brightness-105"
            >
              Nova partida
            </Link>
          </div>
        </div>
      )}

      {declaring && (
        <Dialog
          title="Encerrar a partida?"
          message={`${declaring.name} tem ${totalById.get(declaring.id) ?? 0} pontos de vitória (meta: ${m.targetScore}). No Catan quem atinge a meta declara a vitória no próprio turno.`}
          onClose={() => setDeclaring(null)}
          actions={[
            {
              label: '🏆 Declarar campeão',
              variant: 'primary',
              onClick: () => {
                void declareCatanChampion(m.id, declaring.id);
                setDeclaring(null);
              },
            },
            { label: 'Cancelar', variant: 'ghost', onClick: () => setDeclaring(null) },
          ]}
        />
      )}
    </div>
  );
}
