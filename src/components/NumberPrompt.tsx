'use client';

import { useState } from 'react';

interface Props {
  title: string;
  hint?: string;
  /** Valor inicial mostrado no campo. */
  initial?: number;
  confirmLabel?: string;
  /** Rótulo de uma ação de remover (ex.: apagar a rodada). Opcional. */
  removeLabel?: string;
  onRemove?: () => void;
  onConfirm: (value: number) => void;
  onCancel: () => void;
}

/** Tira zeros à esquerda ("020" → "20", "-07" → "-7") preservando o sinal. */
export function stripLeadingZeros(text: string): string {
  return text.replace(/^(-?)0+(?=\d)/, '$1');
}

/**
 * Entrada numérica em folha inferior (aceita negativos — usada em "+ pontos da
 * rodada" do Azul e correções de placar). Mesmo visual do Dialog. Começa vazia
 * quando o valor é 0 e normaliza zeros à esquerda para digitar direto.
 */
export function NumberPrompt({
  title,
  hint,
  initial = 0,
  confirmLabel = 'Confirmar',
  removeLabel,
  onRemove,
  onConfirm,
  onCancel,
}: Props) {
  const [raw, setRaw] = useState(initial === 0 ? '' : String(initial));
  const value = Math.round(Number(raw) || 0);

  const step =
    'grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-xl font-bold text-ink transition hover:bg-border';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl border border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
        {hint && <p className="mt-1.5 text-sm text-muted">{hint}</p>}

        <div className="mt-4 flex items-center gap-2">
          <button onClick={() => setRaw(String(value - 1))} className={step} aria-label="Menos um">
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            value={raw}
            placeholder="0"
            autoFocus
            onFocus={(e) => e.target.select()}
            onChange={(e) => setRaw(stripLeadingZeros(e.target.value))}
            onKeyDown={(e) => e.key === 'Enter' && onConfirm(value)}
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-center font-display text-2xl font-extrabold tabular-nums text-ink outline-none placeholder:text-muted/50 focus:border-primary"
          />
          <button onClick={() => setRaw(String(value + 1))} className={step} aria-label="Mais um">
            +
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={() => onConfirm(value)}
            className="w-full rounded-xl bg-success py-2.5 text-sm font-semibold text-success-fg transition hover:brightness-105"
          >
            {confirmLabel}
          </button>
          {removeLabel && onRemove && (
            <button
              onClick={onRemove}
              className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/10"
            >
              {removeLabel}
            </button>
          )}
          <button
            onClick={onCancel}
            className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-2"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
