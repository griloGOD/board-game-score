'use client';

import { useRef, useState } from 'react';
import type { Player } from '@/domain/types';
import type { TtrPlayerState } from '@/domain/ttr/types';
import { ticketsNet, ticketsOf } from '@/domain/ttr/scoring';
import { applyTtrMatchAction } from '@/lib/repo';
import { stripLeadingZeros } from '@/components/NumberPrompt';

interface Props {
  matchId: string;
  player: Player;
  /** Estado atual do jogador (vem do liveQuery — a lista atualiza sozinha). */
  state: TtrPlayerState;
  onClose: () => void;
}

/**
 * Bilhetes de destino lançados UM A UM: digite os pontos do bilhete e toque em
 * "Cumprido" (soma) ou "Falhou" (desconta). A soma é automática — nada de fazer
 * conta de cabeça quando se completa vários bilhetes na mesma partida.
 */
export function TtrTicketsSheet({ matchId, player, state, onClose }: Props) {
  const [raw, setRaw] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const tickets = ticketsOf(state);
  const net = ticketsNet(state);
  const value = Math.abs(Math.round(Number(raw) || 0));
  const canAdd = value > 0;

  function add(sign: 1 | -1) {
    if (!canAdd) return;
    void applyTtrMatchAction(matchId, player.id, { type: 'addTicket', value: sign * value });
    setRaw('');
    inputRef.current?.focus();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl border border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-bold text-ink">🎫 Bilhetes de {player.name}</h3>
          <div className="shrink-0 text-right">
            <div className="font-display text-2xl font-extrabold tabular-nums text-ink">
              {net > 0 ? `+${net}` : net}
            </div>
            <div className="-mt-0.5 text-[11px] text-muted">líquido</div>
          </div>
        </div>
        <p className="mt-1.5 text-sm text-muted">
          Lance um bilhete por vez: cumprido soma, falhado desconta. A soma é automática.
        </p>

        {tickets.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tickets.map((t, i) => (
              <span
                key={`${i}-${t}`}
                className={`inline-flex items-center gap-1 rounded-lg py-1 pl-2.5 pr-1 text-sm font-semibold tabular-nums ring-1 ${
                  t > 0 ? 'bg-success/10 text-ink ring-success/40' : 'bg-danger/10 text-danger ring-danger/40'
                }`}
              >
                {t > 0 ? `+${t}` : t}
                <button
                  onClick={() => void applyTtrMatchAction(matchId, player.id, { type: 'removeTicket', index: i })}
                  className="grid h-5 w-5 place-items-center rounded-full text-muted transition hover:bg-danger/15 hover:text-danger"
                  aria-label={`Remover bilhete de ${Math.abs(t)} pontos`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="mt-4">
          <label htmlFor="ttr-ticket-value" className="mb-1.5 block text-[11px] font-semibold text-muted">
            Pontos do bilhete
          </label>
          <input
            id="ttr-ticket-value"
            ref={inputRef}
            type="number"
            inputMode="numeric"
            min={0}
            value={raw}
            placeholder="0"
            autoFocus
            onFocus={(e) => e.target.select()}
            onChange={(e) => setRaw(stripLeadingZeros(e.target.value.replace('-', '')))}
            onKeyDown={(e) => e.key === 'Enter' && add(1)}
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-center font-display text-2xl font-extrabold tabular-nums text-ink outline-none placeholder:text-muted/50 focus:border-primary"
          />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => add(1)}
            disabled={!canAdd}
            className="flex-1 rounded-xl bg-success py-2.5 text-sm font-semibold text-success-fg transition hover:brightness-105 disabled:opacity-40"
          >
            ✓ Cumprido {canAdd && `+${value}`}
          </button>
          <button
            onClick={() => add(-1)}
            disabled={!canAdd}
            className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-semibold text-danger-fg transition hover:brightness-105 disabled:opacity-40"
          >
            ✗ Falhou {canAdd && `−${value}`}
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-2 w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-2"
        >
          Concluir
        </button>
      </div>
    </div>
  );
}
