import { describe, expect, it } from 'vitest';
import {
  applyTtrAction,
  computeTtrScore,
  computeTtrStandings,
  initialTtrPlayer,
  ttrChampions,
  TTR_LONGEST_PATH_BONUS,
  TTR_ROUTE_VALUES,
} from './scoring';
import type { TtrPlayerState, TtrState } from './types';

function player(overrides: Partial<TtrPlayerState> = {}): TtrPlayerState {
  return { ...initialTtrPlayer(), ...overrides };
}

describe('computeTtrScore', () => {
  it('soma trajetos + bilhetes (líquido) + trajeto mais longo', () => {
    // 15 + 4 - 4 + 10 = 25
    expect(computeTtrScore(player({ routes: [15, 4], ticketPoints: -4, hasLongestPath: true }))).toBe(25);
  });

  it('sem trajeto mais longo não soma o bônus', () => {
    expect(computeTtrScore(player({ routes: [10], hasLongestPath: false }))).toBe(10);
    expect(TTR_LONGEST_PATH_BONUS).toBe(10);
    expect(TTR_ROUTE_VALUES).toEqual([1, 2, 4, 7, 10, 15]);
  });
});

describe('applyTtrAction', () => {
  it('addRoute acrescenta o valor; undoRoute tira o último', () => {
    let s: TtrState = { a: player() };
    s = applyTtrAction(s, 'a', { type: 'addRoute', value: 7 });
    s = applyTtrAction(s, 'a', { type: 'addRoute', value: 15 });
    expect(s.a.routes).toEqual([7, 15]);
    s = applyTtrAction(s, 'a', { type: 'undoRoute' });
    expect(s.a.routes).toEqual([7]);
  });

  it('removeRoute tira pelo índice', () => {
    const s = applyTtrAction({ a: player({ routes: [1, 2, 4] }) }, 'a', { type: 'removeRoute', index: 1 });
    expect(s.a.routes).toEqual([1, 4]);
  });

  it('setTicketPoints grava o líquido (inclusive negativo)', () => {
    const s = applyTtrAction({ a: player() }, 'a', { type: 'setTicketPoints', value: -6 });
    expect(s.a.ticketPoints).toBe(-6);
  });

  it('o Trajeto Mais Longo é exclusivo: marcar em alguém tira de quem tinha', () => {
    let s: TtrState = { a: player({ hasLongestPath: true }), b: player() };
    s = applyTtrAction(s, 'b', { type: 'toggleLongestPath' });
    expect(s.a.hasLongestPath).toBe(false);
    expect(s.b.hasLongestPath).toBe(true);
  });

  it('tocar de novo em quem tem o trajeto remove de todos', () => {
    let s: TtrState = { a: player({ hasLongestPath: true }), b: player() };
    s = applyTtrAction(s, 'a', { type: 'toggleLongestPath' });
    expect(s.a.hasLongestPath).toBe(false);
    expect(s.b.hasLongestPath).toBe(false);
  });

  it('não muta o estado original', () => {
    const s: TtrState = { a: player({ routes: [1] }) };
    applyTtrAction(s, 'a', { type: 'addRoute', value: 2 });
    expect(s.a.routes).toEqual([1]);
  });
});

describe('computeTtrStandings', () => {
  it('ordena por total com ranking de competição', () => {
    const st = computeTtrStandings(['a', 'b'], { a: player({ routes: [15] }), b: player({ routes: [4] }) });
    expect(st.map((s) => s.rank)).toEqual([1, 2]);
  });
});

describe('ttrChampions', () => {
  it('campeão é o maior total', () => {
    const state: TtrState = { a: player({ routes: [10, 10] }), b: player({ routes: [10] }) };
    expect(ttrChampions(['a', 'b'], state)).toEqual(['a']);
  });

  it('empate no total: desempata pelo dono do Trajeto Mais Longo', () => {
    const state: TtrState = {
      a: player({ routes: [40], hasLongestPath: false }), // 40
      b: player({ routes: [30], hasLongestPath: true }), // 40 (30 + 10)
    };
    expect(ttrChampions(['a', 'b'], state)).toEqual(['b']);
  });

  it('empate no total e ninguém no topo tem o trajeto ⇒ co-campeões', () => {
    const state: TtrState = { a: player({ routes: [40] }), b: player({ routes: [40] }) };
    expect(ttrChampions(['a', 'b'], state).sort()).toEqual(['a', 'b']);
  });
});
