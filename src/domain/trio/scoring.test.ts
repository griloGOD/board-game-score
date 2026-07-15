import { describe, expect, it } from 'vitest';
import {
  applyTrioAction,
  computeTrioScore,
  computeTrioStandings,
  hasTrioWon,
  initialTrioPlayer,
  normalizeTrioPlayer,
  trioChampions,
  TRIO_DEFAULT_TARGET,
} from './scoring';
import type { TrioPlayerState, TrioState } from './types';

function player(overrides: Partial<TrioPlayerState> = {}): TrioPlayerState {
  return { ...initialTrioPlayer(), ...overrides };
}

/** Estado como era gravado até a v1.6.0 (sem `wins`). */
function legacy(trios: number, hasSeven = false): TrioPlayerState {
  return { trios, hasSeven } as TrioPlayerState;
}

describe('computeTrioScore', () => {
  it('pontos = rodadas vencidas, não os trios da rodada atual', () => {
    expect(computeTrioScore(player({ wins: 2, trios: 1 }))).toBe(2);
  });

  it('legado sem wins: quem tinha vencido (3 trios ou o 7) vale 1 ponto', () => {
    expect(computeTrioScore(legacy(3))).toBe(1);
    expect(computeTrioScore(legacy(1, true))).toBe(1);
    expect(computeTrioScore(legacy(2))).toBe(0);
  });
});

describe('normalizeTrioPlayer', () => {
  it('preenche wins ausente e aceita undefined', () => {
    expect(normalizeTrioPlayer(undefined)).toEqual(initialTrioPlayer());
    expect(normalizeTrioPlayer(legacy(2))).toEqual({ wins: 0, trios: 2, hasSeven: false });
  });
});

describe('hasTrioWon', () => {
  it('fecha a rodada ao chegar na meta de trios', () => {
    expect(hasTrioWon(player({ trios: 2 }), TRIO_DEFAULT_TARGET)).toBe(false);
    expect(hasTrioWon(player({ trios: 3 }), TRIO_DEFAULT_TARGET)).toBe(true);
    expect(TRIO_DEFAULT_TARGET).toBe(3);
  });

  it('fecha na hora com o trio de 7, mesmo com poucos trios', () => {
    expect(hasTrioWon(player({ trios: 1, hasSeven: true }), 3)).toBe(true);
  });
});

describe('applyTrioAction', () => {
  it('addTrio comum incrementa os trios da rodada', () => {
    const { state, roundWinnerId } = applyTrioAction(
      { a: player({ trios: 1 }) },
      'a',
      { type: 'addTrio', seven: false },
      3,
    );
    expect(state.a).toEqual({ wins: 0, trios: 2, hasSeven: false });
    expect(roundWinnerId).toBeUndefined();
  });

  it('completar a meta fecha a rodada: +1 ponto e os trios de TODOS zeram', () => {
    const start: TrioState = { a: player({ trios: 2 }), b: player({ trios: 1, wins: 1 }) };
    const { state, roundWinnerId } = applyTrioAction(start, 'a', { type: 'addTrio', seven: false }, 3);
    expect(roundWinnerId).toBe('a');
    expect(state.a).toEqual({ wins: 1, trios: 0, hasSeven: false });
    expect(state.b).toEqual({ wins: 1, trios: 0, hasSeven: false });
  });

  it('trio de 7 fecha a rodada na hora', () => {
    const { state, roundWinnerId } = applyTrioAction(
      { a: player(), b: player({ trios: 2 }) },
      'a',
      { type: 'addTrio', seven: true },
      3,
    );
    expect(roundWinnerId).toBe('a');
    expect(state.a).toEqual({ wins: 1, trios: 0, hasSeven: false });
    expect(state.b.trios).toBe(0);
  });

  it('respeita meta personalizada da rodada', () => {
    const { roundWinnerId } = applyTrioAction({ a: player({ trios: 3 }) }, 'a', { type: 'addTrio', seven: false }, 5);
    expect(roundWinnerId).toBeUndefined();
  });

  it('undoTrio não deixa negativo e não mexe nos pontos', () => {
    const { state } = applyTrioAction({ a: player({ wins: 2 }) }, 'a', { type: 'undoTrio', seven: false }, 3);
    expect(state.a).toEqual({ wins: 2, trios: 0, hasSeven: false });
  });

  it('undoTrio do 7 desmarca hasSeven', () => {
    const { state } = applyTrioAction(
      { a: player({ trios: 1, hasSeven: true }) },
      'a',
      { type: 'undoTrio', seven: true },
      3,
    );
    expect(state.a).toEqual({ wins: 0, trios: 0, hasSeven: false });
  });

  it('setWins corrige os pontos com piso 0', () => {
    expect(applyTrioAction({ a: player({ wins: 3 }) }, 'a', { type: 'setWins', value: 1 }, 3).state.a.wins).toBe(1);
    expect(applyTrioAction({ a: player({ wins: 3 }) }, 'a', { type: 'setWins', value: -2 }, 3).state.a.wins).toBe(0);
  });

  it('não muta o estado original', () => {
    const s: TrioState = { a: player({ trios: 2 }), b: player() };
    applyTrioAction(s, 'a', { type: 'addTrio', seven: false }, 3);
    expect(s.a).toEqual({ wins: 0, trios: 2, hasSeven: false });
  });

  it('normaliza estado legado (sem wins) ao aplicar ações', () => {
    const { state, roundWinnerId } = applyTrioAction({ a: legacy(2) }, 'a', { type: 'addTrio', seven: false }, 3);
    expect(roundWinnerId).toBe('a');
    expect(state.a).toEqual({ wins: 1, trios: 0, hasSeven: false });
  });
});

describe('trioChampions', () => {
  it('campeão = mais pontos', () => {
    const state: TrioState = { a: player({ wins: 2 }), b: player({ wins: 1 }) };
    expect(trioChampions(['a', 'b'], state)).toEqual(['a']);
  });

  it('empate em pontos ⇒ co-campeões', () => {
    const state: TrioState = { a: player({ wins: 2 }), b: player({ wins: 2 }), c: player() };
    expect(trioChampions(['a', 'b', 'c'], state).sort()).toEqual(['a', 'b']);
  });

  it('sem jogadores ⇒ ninguém', () => {
    expect(trioChampions([], {})).toEqual([]);
  });
});

describe('computeTrioStandings', () => {
  it('ordena por pontos com ranking de competição', () => {
    const state: TrioState = { a: player({ wins: 2 }), b: player({ wins: 2 }), c: player() };
    const st = computeTrioStandings(['a', 'b', 'c'], state);
    expect(st.map((s) => s.rank)).toEqual([1, 1, 3]);
  });

  it('marca o campeão a partir dos championIds', () => {
    const st = computeTrioStandings(['a', 'b'], { a: player({ wins: 3 }), b: player() }, ['a']);
    expect(st.find((s) => s.playerId === 'a')?.isChampion).toBe(true);
  });
});
