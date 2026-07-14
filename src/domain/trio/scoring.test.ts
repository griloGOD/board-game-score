import { describe, expect, it } from 'vitest';
import {
  applyTrioAction,
  computeTrioScore,
  computeTrioStandings,
  hasTrioWon,
  initialTrioPlayer,
  TRIO_DEFAULT_TARGET,
} from './scoring';
import type { TrioPlayerState, TrioState } from './types';

function player(overrides: Partial<TrioPlayerState> = {}): TrioPlayerState {
  return { ...initialTrioPlayer(), ...overrides };
}

describe('computeTrioScore', () => {
  it('pontos = número de trios', () => {
    expect(computeTrioScore(player({ trios: 2 }))).toBe(2);
  });
});

describe('hasTrioWon', () => {
  it('vence ao chegar na meta de trios', () => {
    expect(hasTrioWon(player({ trios: 2 }), TRIO_DEFAULT_TARGET)).toBe(false);
    expect(hasTrioWon(player({ trios: 3 }), TRIO_DEFAULT_TARGET)).toBe(true);
    expect(TRIO_DEFAULT_TARGET).toBe(3);
  });

  it('vence na hora com o trio de 7, mesmo com poucos trios', () => {
    expect(hasTrioWon(player({ trios: 1, hasSeven: true }), 3)).toBe(true);
  });
});

describe('applyTrioAction', () => {
  it('addTrio comum incrementa os trios', () => {
    const s = applyTrioAction({ a: player({ trios: 1 }) }, 'a', { type: 'addTrio', seven: false });
    expect(s.a).toEqual({ trios: 2, hasSeven: false });
  });

  it('addTrio do 7 incrementa e marca hasSeven', () => {
    const s = applyTrioAction({ a: player() }, 'a', { type: 'addTrio', seven: true });
    expect(s.a).toEqual({ trios: 1, hasSeven: true });
  });

  it('undoTrio não deixa os trios ficarem negativos', () => {
    const s = applyTrioAction({ a: player({ trios: 0 }) }, 'a', { type: 'undoTrio', seven: false });
    expect(s.a.trios).toBe(0);
  });

  it('undoTrio do 7 desmarca hasSeven', () => {
    const s = applyTrioAction({ a: player({ trios: 1, hasSeven: true }) }, 'a', {
      type: 'undoTrio',
      seven: true,
    });
    expect(s.a).toEqual({ trios: 0, hasSeven: false });
  });

  it('não muta o estado original', () => {
    const s: TrioState = { a: player({ trios: 1 }) };
    applyTrioAction(s, 'a', { type: 'addTrio', seven: false });
    expect(s.a.trios).toBe(1);
  });
});

describe('computeTrioStandings', () => {
  it('ordena por trios com ranking de competição', () => {
    const state: TrioState = { a: player({ trios: 2 }), b: player({ trios: 2 }), c: player({ trios: 0 }) };
    const st = computeTrioStandings(['a', 'b', 'c'], state);
    expect(st.map((s) => s.rank)).toEqual([1, 1, 3]);
  });

  it('marca o campeão a partir dos championIds', () => {
    const st = computeTrioStandings(['a', 'b'], { a: player({ trios: 3 }), b: player() }, ['a']);
    expect(st.find((s) => s.playerId === 'a')?.isChampion).toBe(true);
  });
});
