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
  const chip = 'flex h-9 items-center justify-center rounded-lg text-sm font-medium';
  const isFlip7 = cards.length === MAX_CARDS;

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onCancel}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl dark:bg-zinc-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">{playerName}</h3>
          <div className="text-right">
            <div className="text-xs text-zinc-500">Total da rodada</div>
            <div className="text-2xl font-bold tabular-nums">{total}</div>
          </div>
        </div>

        <button
          onClick={() => setBust((b) => !b)}
          className={`mb-4 w-full rounded-lg border py-2 text-sm font-medium ${
            bust ? 'border-red-500 bg-red-500 text-white' : 'border-zinc-300 dark:border-zinc-700'
          }`}
        >
          Estourou (0 pontos)
        </button>

        {!bust && (
          <>
            <div className="mb-4 flex rounded-lg bg-zinc-100 p-1 text-sm dark:bg-zinc-800">
              <button
                onClick={() => setMode('calc')}
                className={`flex-1 rounded-md py-1.5 ${mode === 'calc' ? 'bg-white shadow dark:bg-zinc-700' : ''}`}
              >
                Calcular
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`flex-1 rounded-md py-1.5 ${mode === 'manual' ? 'bg-white shadow dark:bg-zinc-700' : ''}`}
              >
                Digitar total
              </button>
            </div>

            {mode === 'calc' ? (
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                    <span>Cartas de número</span>
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
                          className={`${chip} ${
                            selected ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'
                          } ${blocked ? 'opacity-30' : ''}`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isFlip7 ? (
                  <div className="rounded-lg border border-indigo-500 bg-indigo-50 py-2 text-center text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    🎉 Flip 7! +15 automático
                  </div>
                ) : (
                  <div className="text-center text-xs text-zinc-400">
                    faltam {MAX_CARDS - cards.length} carta(s) para o Flip 7 (+15)
                  </div>
                )}

                <div>
                  <div className="mb-1 text-xs text-zinc-500">Modificadores</div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {FLAT_MODS.map((mod) => (
                      <button
                        key={mod}
                        onClick={() => toggleMod(mod)}
                        className={`${chip} ${mods.includes(mod) ? 'bg-emerald-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}
                      >
                        +{mod}
                      </button>
                    ))}
                    <button
                      onClick={() => setHasX2((x) => !x)}
                      className={`${chip} ${hasX2 ? 'bg-amber-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}
                    >
                      ×2
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-1 text-xs text-zinc-500">Total da rodada</div>
                <input
                  type="number"
                  min={0}
                  value={manualTotal}
                  onChange={(e) => setManualTotal(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
                  autoFocus
                />
              </div>
            )}
          </>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-zinc-300 py-2.5 text-sm font-medium dark:border-zinc-700"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(entry)}
            className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
