import { describe, expect, it } from 'vitest';
import {
  applyAzulAction,
  azulChampions,
  AZUL_BONUS_MAX,
  computeAzulScore,
  computeAzulStandings,
  initialAzulPlayer,
  initialAzulState,
} from './scoring';
import type { AzulPlayerState, AzulState } from './types';

function player(overrides: Partial<AzulPlayerState> = {}): AzulPlayerState {
  return { ...initialAzulPlayer(), ...overrides };
}

describe('computeAzulScore', () => {
  it('soma as rodadas e os bônus de fim (2/7/10)', () => {
    // (10 - 3) + 2·1 = 9
    expect(computeAzulScore(player({ rounds: [10, -3], fullRows: 1 }))).toBe(9);
  });

  it('o total nunca fica abaixo de 0 (piso da soma das rodadas)', () => {
    expect(computeAzulScore(player({ rounds: [5, -20] }))).toBe(0);
  });

  it('o piso não zera os bônus de fim de jogo', () => {
    // max(0, -15) + 2·1 = 2
    expect(computeAzulScore(player({ rounds: [5, -20], fullRows: 1 }))).toBe(2);
  });

  it('placar máximo de bônus: 5 linhas + 5 colunas + 5 cores = 95', () => {
    expect(computeAzulScore(player({ fullRows: 5, fullCols: 5, fullColors: 5 }))).toBe(10 + 35 + 50);
  });
});

describe('applyAzulAction', () => {
  it('addRound acrescenta uma rodada (inclusive negativa)', () => {
    const s = applyAzulAction({ a: player({ rounds: [8] }) }, 'a', { type: 'addRound', points: -2 });
    expect(s.a.rounds).toEqual([8, -2]);
  });

  it('editRound troca uma rodada; índice inválido não muda nada', () => {
    const base: AzulState = { a: player({ rounds: [8, 4] }) };
    expect(applyAzulAction(base, 'a', { type: 'editRound', index: 1, points: 9 }).a.rounds).toEqual([8, 9]);
    expect(applyAzulAction(base, 'a', { type: 'editRound', index: 5, points: 9 })).toBe(base);
  });

  it('removeRound tira a rodada pelo índice', () => {
    const s = applyAzulAction({ a: player({ rounds: [8, 4, 1] }) }, 'a', { type: 'removeRound', index: 1 });
    expect(s.a.rounds).toEqual([8, 1]);
  });

  it('setBonus clampa entre 0 e AZUL_BONUS_MAX', () => {
    const base: AzulState = { a: player() };
    expect(applyAzulAction(base, 'a', { type: 'setBonus', bonus: 'fullCols', value: 9 }).a.fullCols).toBe(
      AZUL_BONUS_MAX,
    );
    expect(applyAzulAction(base, 'a', { type: 'setBonus', bonus: 'fullCols', value: -3 }).a.fullCols).toBe(0);
  });

  it('não muta o estado original', () => {
    const s: AzulState = { a: player({ rounds: [1] }) };
    applyAzulAction(s, 'a', { type: 'addRound', points: 5 });
    expect(s.a.rounds).toEqual([1]);
  });
});

describe('computeAzulStandings', () => {
  it('ordena por total com ranking de competição', () => {
    const state: AzulState = {
      a: player({ rounds: [20] }),
      b: player({ rounds: [20] }),
      c: player({ rounds: [5] }),
    };
    const st = computeAzulStandings(['a', 'b', 'c'], state);
    expect(st.map((s) => s.rank)).toEqual([1, 1, 3]);
  });

  it('marca o campeão a partir dos championIds passados', () => {
    const st = computeAzulStandings(['a', 'b'], initialAzulState(['a', 'b']), ['b']);
    expect(st.find((s) => s.playerId === 'b')?.isChampion).toBe(true);
  });
});

describe('azulChampions', () => {
  it('campeão é o maior total', () => {
    const state: AzulState = { a: player({ rounds: [30] }), b: player({ rounds: [24] }) };
    expect(azulChampions(['a', 'b'], state)).toEqual(['a']);
  });

  it('desempata pelo maior número de linhas completas', () => {
    const state: AzulState = {
      a: player({ rounds: [10], fullRows: 2 }), // 14, 2 linhas
      b: player({ rounds: [14], fullRows: 0 }), // 14, 0 linhas
    };
    expect(azulChampions(['a', 'b'], state)).toEqual(['a']);
  });

  it('empate total e de linhas ⇒ co-campeões', () => {
    const state: AzulState = {
      a: player({ rounds: [10], fullRows: 2 }),
      b: player({ rounds: [10], fullRows: 2 }),
    };
    expect(azulChampions(['a', 'b'], state).sort()).toEqual(['a', 'b']);
  });
});
