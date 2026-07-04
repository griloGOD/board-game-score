import { describe, it, expect } from 'vitest';
import { computeRoundScore, isGameOver, computeStandings } from './scoring';
import type { Flip7Entry, Flip7Round, Flip7Match } from './types';

/** Helper: monta uma rodada com totais digitados (modo manual) por jogador. */
function roundOf(totals: Record<string, number>): Flip7Round {
  const entries: Record<string, Flip7Entry> = {};
  for (const [playerId, total] of Object.entries(totals)) {
    entries[playerId] = { kind: 'manual', total };
  }
  return { entries };
}

/** Helper: monta uma partida a partir de uma lista de rodadas. */
function matchOf(rounds: Flip7Round[], playerIds: string[], targetScore = 200): Flip7Match {
  return { playerIds, rounds, targetScore };
}

describe('computeRoundScore', () => {
  it('pontua 0 em um estouro (bust)', () => {
    expect(computeRoundScore({ kind: 'bust' })).toBe(0);
  });

  it('devolve o total digitado à mão', () => {
    expect(computeRoundScore({ kind: 'manual', total: 34 })).toBe(34);
  });

  it('soma as cartas de número quando não há modificadores', () => {
    expect(
      computeRoundScore({ kind: 'calculated', numberCards: [3, 5, 10], hasX2: false, bonusModifiers: [] }),
    ).toBe(18);
  });

  it('dobra apenas a soma das cartas com o ×2 e só então soma os modificadores fixos', () => {
    // (3+5+10)=18 → ×2 = 36 → +4 = 40
    expect(
      computeRoundScore({ kind: 'calculated', numberCards: [3, 5, 10], hasX2: true, bonusModifiers: [4] }),
    ).toBe(40);
  });

  it('soma o bônus +15 do Flip 7 sem dobrá-lo', () => {
    // cartas 1..7 = 28 → +15 = 43
    expect(
      computeRoundScore({ kind: 'calculated', numberCards: [1, 2, 3, 4, 5, 6, 7], hasX2: false, bonusModifiers: [] }),
    ).toBe(43);
  });

  it('aplica o ×2 às cartas, mas nunca ao +15 do Flip 7', () => {
    // 28 → ×2 = 56 → +15 = 71
    expect(
      computeRoundScore({ kind: 'calculated', numberCards: [1, 2, 3, 4, 5, 6, 7], hasX2: true, bonusModifiers: [] }),
    ).toBe(71);
  });

  it('aplica o +15 automaticamente ao virar 7 cartas', () => {
    // 7 cartas (6..12) = 63 → +15 = 78 (sem marcar nada de "Flip 7")
    expect(
      computeRoundScore({ kind: 'calculated', numberCards: [6, 7, 8, 9, 10, 11, 12], hasX2: false, bonusModifiers: [] }),
    ).toBe(78);
  });

  it('não aplica o +15 com menos de 7 cartas', () => {
    // 6 cartas (1..6) = 21, sem bônus
    expect(
      computeRoundScore({ kind: 'calculated', numberCards: [1, 2, 3, 4, 5, 6], hasX2: false, bonusModifiers: [] }),
    ).toBe(21);
  });

  it('acumula vários modificadores fixos', () => {
    // 10 + (+2 +4 +6) = 22
    expect(
      computeRoundScore({ kind: 'calculated', numberCards: [10], hasX2: false, bonusModifiers: [2, 4, 6] }),
    ).toBe(22);
  });

  it('pontua apenas os modificadores fixos quando o jogador não ficou com cartas de número', () => {
    // 0 ×2 = 0 → +10 = 10
    expect(
      computeRoundScore({ kind: 'calculated', numberCards: [], hasX2: true, bonusModifiers: [10] }),
    ).toBe(10);
  });
});

describe('isGameOver', () => {
  it('é falso enquanto todos os totais estão abaixo da meta', () => {
    const m = matchOf([roundOf({ a: 120, b: 90 })], ['a', 'b']);
    expect(isGameOver(m)).toBe(false);
  });

  it('é verdadeiro quando um jogador atinge a meta exatamente (200)', () => {
    const m = matchOf([roundOf({ a: 150, b: 80 }), roundOf({ a: 50, b: 40 })], ['a', 'b']); // a = 200
    expect(isGameOver(m)).toBe(true);
  });

  it('é verdadeiro quando um jogador passa da meta (201)', () => {
    const m = matchOf([roundOf({ a: 201, b: 80 })], ['a', 'b']);
    expect(isGameOver(m)).toBe(true);
  });

  it('é falso quando nenhuma rodada foi jogada', () => {
    const m = matchOf([], ['a', 'b']);
    expect(isGameOver(m)).toBe(false);
  });
});

describe('computeStandings', () => {
  it('acumula a pontuação de cada jogador ao longo das rodadas', () => {
    const m = matchOf([roundOf({ a: 30, b: 20 }), roundOf({ a: 15, b: 60 })], ['a', 'b']);
    const byId = Object.fromEntries(computeStandings(m).map((s) => [s.playerId, s]));
    expect(byId.a.total).toBe(45);
    expect(byId.b.total).toBe(80);
  });

  it('ordena os jogadores por total decrescente', () => {
    const m = matchOf([roundOf({ a: 50, b: 120, c: 30 })], ['a', 'b', 'c']);
    const s = computeStandings(m);
    expect(s.map((x) => x.playerId)).toEqual(['b', 'a', 'c']);
    expect(s.map((x) => x.total)).toEqual([120, 50, 30]);
    expect(s.map((x) => x.rank)).toEqual([1, 2, 3]);
  });

  it('dá o mesmo rank a jogadores empatados (ranking de competição)', () => {
    const m = matchOf([roundOf({ a: 50, b: 50, c: 30 })], ['a', 'b', 'c']);
    const byId = Object.fromEntries(computeStandings(m).map((s) => [s.playerId, s]));
    expect(byId.a.rank).toBe(1);
    expect(byId.b.rank).toBe(1);
    expect(byId.c.rank).toBe(3);
  });

  it('não marca campeão enquanto a partida está em andamento', () => {
    const m = matchOf([roundOf({ a: 120, b: 90 })], ['a', 'b']);
    expect(computeStandings(m).every((x) => !x.isChampion)).toBe(true);
  });

  it('coroa o maior pontuador quando a partida termina — 202 vence 201', () => {
    const m = matchOf([roundOf({ a: 201, b: 202 })], ['a', 'b']);
    const byId = Object.fromEntries(computeStandings(m).map((s) => [s.playerId, s]));
    expect(byId.b.isChampion).toBe(true); // 202
    expect(byId.a.isChampion).toBe(false); // 201
  });

  it('declara co-campeões apenas quando os maiores totais são exatamente iguais', () => {
    const m = matchOf([roundOf({ a: 205, b: 205, c: 150 })], ['a', 'b', 'c']);
    const byId = Object.fromEntries(computeStandings(m).map((s) => [s.playerId, s]));
    expect(byId.a.isChampion).toBe(true);
    expect(byId.b.isChampion).toBe(true);
    expect(byId.c.isChampion).toBe(false);
  });
});
