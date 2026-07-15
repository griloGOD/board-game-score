'use client';

import { useState } from 'react';
import type { Flip7Entry } from '@/domain/flip7/types';
import { computeRoundScore } from '@/domain/flip7/scoring';

const NUMBER_CARDS = Array.from({ length: 13 }, (_, i) => i); // 0..12
const FLAT_MODS = [2, 4, 6, 8, 10];
const MAX_CARDS = 7; // com 7 cartas de número o jogador faz "Flip 7" e a rodada acaba

interface Props {
  playerName: string;
  initial?: Flip7Entry;
  onCancel: () => void;
  onConfirm: (entry: Flip7Entry) => void;
}

export function Flip7EntryDialog({ playerName, initial, onCancel, onConfirm }: Props) {
  const [bust, setBust] = useState(initial?.kind === 'bust');
  const [mode, setMode] = useState<'calc' | 'manual'>(initial?.kind === 'manual' ? 'manual' : 'calc');
  const [manualTotal, setManualTotal] = useState(initial?.kind === 'manual' ? initial.total : 0);
  const [cards, setCards] = useState<number[]>(initial?.kind === 'calculated' ? initial.numberCards : []);
  const [hasX2, setHasX2] = useState(initial?.kind === 'calculated' ? initial.hasX2 : false);
  const [mods, setMods] = useState<number[]>(initial?.kind === 'calculated' ? initial.bonusModifiers : []);

  function toggleCard(n: number) {
    setCards((prev) => {
      if (prev.includes(n)) return prev.filter((c) => c !== n);
      if (prev.length >= MAX_CARDS) return prev; // trava em 7 cartas
      return [...prev, n];
    });
  }
  function toggleMod(m: number) {
    setMods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  const entry: Flip7Entry = bust
    ? { kind: 'bust' }
    : mode === 'manual'
      ? { kind: 'manual', total: manualTotal }
      : { kind: 'calculated', numberCards: cards, hasX2, bonusModifiers: mods };

  const total = computeRoundScore(entry);
  const chip = 'flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition';
  const idle = 'bg-surface-2 text-ink hover:brightness-105';
  const isFlip7 = cards.length === MAX_CARDS;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-y-auto rounded-t-3xl border border-border bg-surface shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 pb-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-ink">{playerName}</h3>
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Total</div>
              <div className="font-display text-3xl font-extrabold tabular-nums text-ink">{total}</div>
            </div>
          </div>

          <button
            onClick={() => setBust((b) => !b)}
            className={`mb-4 w-full rounded-xl border py-2.5 text-sm font-semibold transition ${
              bust ? 'border-danger bg-danger text-danger-fg' : 'border-border text-ink hover:bg-surface-2'
            }`}
          >
            Estourou (0 pontos)
          </button>

          {!bust && (
            <>
              <div className="mb-4 flex rounded-xl bg-surface-2 p-1 text-sm">
                <button
                  onClick={() => setMode('calc')}
                  className={`flex-1 rounded-lg py-1.5 font-medium transition ${mode === 'calc' ? 'bg-bg text-ink shadow-sm' : 'text-muted'}`}
                >
                  Calcular
                </button>
                <button
                  onClick={() => setMode('manual')}
                  className={`flex-1 rounded-lg py-1.5 font-medium transition ${mode === 'manual' ? 'bg-bg text-ink shadow-sm' : 'text-muted'}`}
                >
                  Digitar total
                </button>
              </div>

              {mode === 'calc' ? (
                <div className="space-y-3">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-muted">
                      <span>Toque nas cartas</span>
                      <span>
                        {cards.length}/{MAX_CARDS}
                      </span>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {NUMBER_CARDS.map((n) => {
                        const selected = cards.includes(n);
                        const blocked = !selected && cards.length >= MAX_CARDS;
                        return (
                          <button
                            key={n}
                            onClick={() => toggleCard(n)}
                            disabled={blocked}
                            aria-pressed={selected}
                            aria-label={`Carta ${n}`}
                            className={`relative aspect-[5/8] overflow-hidden rounded-md transition ${
                              selected ? 'ring-[3px] ring-success' : 'opacity-80 ring-1 ring-border'
                            } ${blocked ? '!opacity-30' : 'hover:opacity-100'}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/flip7cards/${n}.png`}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover object-center"
                            />
                            {selected && (
                              <span className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-success text-xs font-bold text-success-fg shadow-md ring-2 ring-surface">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {isFlip7 ? (
                    <div className="rounded-xl border border-accent bg-accent/15 py-2 text-center text-sm font-bold text-accent-fg">
                      🎉 Flip 7! +15 automático
                    </div>
                  ) : (
                    <div className="text-center text-xs text-muted">
                      faltam {MAX_CARDS - cards.length} carta(s) para o Flip 7 (+15)
                    </div>
                  )}

                  <div>
                    <div className="mb-1.5 text-[11px] font-semibold text-muted">Modificadores</div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {FLAT_MODS.map((mod) => (
                        <button
                          key={mod}
                          onClick={() => toggleMod(mod)}
                          className={`${chip} ${mods.includes(mod) ? 'bg-ink text-bg' : idle}`}
                        >
                          +{mod}
                        </button>
                      ))}
                      <button
                        onClick={() => setHasX2((x) => !x)}
                        className={`${chip} ${hasX2 ? 'bg-accent text-accent-fg' : idle}`}
                      >
                        ×2
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold text-muted">Total da rodada</div>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={manualTotal}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setManualTotal(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-ink outline-none focus:border-primary"
                    autoFocus
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Rodapé fixo — sempre acessível sem rolar */}
        <div className="sticky bottom-0 flex gap-2 border-t border-border bg-surface px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-2"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(entry)}
            className="flex-1 rounded-xl bg-success py-2.5 text-sm font-semibold text-success-fg transition hover:brightness-105"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
