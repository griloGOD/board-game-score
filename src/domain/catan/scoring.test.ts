import { describe, expect, it } from 'vitest';
import {
  applyCatanAction,
  canIncrement,
  computeCatanScore,
  computeCatanStandings,
  initialCatanPlayer,
  initialCatanState,
} from './scoring';
import type { CatanPlayerState, CatanState } from './types';

function player(overrides: Partial<CatanPlayerState> = {}): CatanPlayerState {
  return { ...initialCatanPlayer(), ...overrides };
}

describe('computeCatanScore', () => {
  it('a preparação vale 2 PV (2 povoados)', () => {
    expect(computeCatanScore(initialCatanPlayer())).toBe(2);
  });

  it('soma povoados ×1, cidades ×2, cartas de PV ×1 e as cartas especiais +2', () => {
    const p = player({ settlements: 3, cities: 2, vpCards: 1, hasLongestRoad: true, hasLargestArmy: false });
    // 3 + 4 + 1 + 2 = 10
    expect(computeCatanScore(p)).toBe(10);
  });

  it('placar máximo do jogo base: 5 povoados + 4 cidades + 5 cartas + as duas especiais = 22', () => {
    const p = player({ settlements: 5, cities: 4, vpCards: 5, hasLongestRoad: true, hasLargestArmy: true });
    expect(computeCatanScore(p)).toBe(22);
  });
});

describe('applyCatanAction — contadores', () => {
  const base: CatanState = { a: player(), b: player() };

  it('incrementa povoado até o limite de 5 peças', () => {
    let s = base;
    for (let i = 0; i < 10; i += 1) s = applyCatanAction(s, 'a', { type: 'increment', counter: 'settlements' });
    expect(s.a.settlements).toBe(5);
  });

  it('não deixa contador ficar negativo', () => {
    let s: CatanState = { a: player({ settlements: 0 }) };
    s = applyCatanAction(s, 'a', { type: 'decrement', counter: 'settlements' });
    expect(s.a.settlements).toBe(0);
  });

  it('construir cidade consome um povoado (upgrade = +1 PV líquido)', () => {
    const before = player({ settlements: 2, cities: 0 });
    const s = applyCatanAction({ a: before }, 'a', { type: 'increment', counter: 'cities' });
    expect(s.a).toMatchObject({ settlements: 1, cities: 1 });
    expect(computeCatanScore(s.a)).toBe(computeCatanScore(before) + 1);
  });

  it('não constrói cidade sem povoado no tabuleiro, nem além de 4 cidades', () => {
    expect(canIncrement(player({ settlements: 0 }), 'cities')).toBe(false);
    expect(canIncrement(player({ settlements: 3, cities: 4 }), 'cities')).toBe(false);
    const s: CatanState = { a: player({ settlements: 0 }) };
    expect(applyCatanAction(s, 'a', { type: 'increment', counter: 'cities' })).toBe(s);
  });

  it('desfazer uma cidade devolve o povoado', () => {
    const s = applyCatanAction({ a: player({ settlements: 1, cities: 2 }) }, 'a', {
      type: 'decrement',
      counter: 'cities',
    });
    expect(s.a).toMatchObject({ settlements: 2, cities: 1 });
  });

  it('cartas de PV vão de 0 a 5', () => {
    expect(canIncrement(player({ vpCards: 5 }), 'vpCards')).toBe(false);
    const s = applyCatanAction({ a: player({ vpCards: 4 }) }, 'a', { type: 'increment', counter: 'vpCards' });
    expect(s.a.vpCards).toBe(5);
  });

  it('não muta o estado original', () => {
    const s: CatanState = { a: player() };
    applyCatanAction(s, 'a', { type: 'increment', counter: 'settlements' });
    expect(s.a.settlements).toBe(2);
  });
});

describe('applyCatanAction — Estrada Mais Longa / Maior Exército', () => {
  it('marcar a Estrada Mais Longa em alguém tira de quem tinha (roubo)', () => {
    let s: CatanState = { a: player({ hasLongestRoad: true }), b: player() };
    s = applyCatanAction(s, 'b', { type: 'toggleLongestRoad' });
    expect(s.a.hasLongestRoad).toBe(false);
    expect(s.b.hasLongestRoad).toBe(true);
  });

  it('tocar de novo em quem tem remove a carta (ninguém fica com ela)', () => {
    let s: CatanState = { a: player({ hasLargestArmy: true }), b: player() };
    s = applyCatanAction(s, 'a', { type: 'toggleLargestArmy' });
    expect(s.a.hasLargestArmy).toBe(false);
    expect(s.b.hasLargestArmy).toBe(false);
  });

  it('as duas cartas especiais são independentes entre si', () => {
    let s: CatanState = { a: player({ hasLongestRoad: true }), b: player() };
    s = applyCatanAction(s, 'b', { type: 'toggleLargestArmy' });
    expect(s.a.hasLongestRoad).toBe(true);
    expect(s.b.hasLargestArmy).toBe(true);
  });
});

describe('computeCatanStandings', () => {
  it('ordena por PV com ranking de competição (empates dividem o rank)', () => {
    const state: CatanState = {
      a: player({ settlements: 4 }), // 4
      b: player({ settlements: 2, cities: 1 }), // 4
      c: player(), // 2
    };
    const st = computeCatanStandings(['a', 'b', 'c'], state);
    expect(st.map((s) => s.playerId)).toEqual(['a', 'b', 'c']);
    expect(st.map((s) => s.rank)).toEqual([1, 1, 3]);
  });

  it('campeão vem da declaração manual, não do total', () => {
    const state = initialCatanState(['a', 'b']);
    const st = computeCatanStandings(['a', 'b'], state, ['b']);
    expect(st.find((s) => s.playerId === 'b')?.isChampion).toBe(true);
    expect(st.find((s) => s.playerId === 'a')?.isChampion).toBe(false);
  });

  it('jogador sem estado registrado conta como estado inicial', () => {
    const st = computeCatanStandings(['a'], {});
    expect(st[0].total).toBe(2);
  });
});
