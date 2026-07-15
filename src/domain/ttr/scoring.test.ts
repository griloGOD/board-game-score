import { describe, expect, it } from 'vitest';
import {
  applyTtrAction,
  computeTtrScore,
  computeTtrStandings,
  initialTtrPlayer,
  initialTtrState,
  ticketsOf,
  ticketsNet,
  ttrChampions,
  TTR_LONGEST_PATH_BONUS,
  TTR_ROUTE_VALUES,
  TTR_TRAIN_COLORS,
} from './scoring';
import type { TtrPlayerState, TtrState } from './types';

function player(overrides: Partial<TtrPlayerState> = {}): TtrPlayerState {
  return { ...initialTtrPlayer(), ...overrides };
}

describe('computeTtrScore', () => {
  it('soma trajetos + bilhetes (um a um) + trajeto mais longo', () => {
    // 15 + 4 + (7 − 11) + 10 = 25
    expect(
      computeTtrScore(player({ routes: [15, 4], tickets: [7, -11], hasLongestPath: true })),
    ).toBe(25);
  });

  it('sem trajeto mais longo não soma o bônus', () => {
    expect(computeTtrScore(player({ routes: [10], hasLongestPath: false }))).toBe(10);
    expect(TTR_LONGEST_PATH_BONUS).toBe(10);
    expect(TTR_ROUTE_VALUES).toEqual([1, 2, 4, 7, 10, 15]);
  });

  it('legado (v1.6.0): ticketPoints único ainda conta enquanto não há lista', () => {
    const legacy = { routes: [10], ticketPoints: -4, hasLongestPath: false } as TtrPlayerState;
    expect(computeTtrScore(legacy)).toBe(6);
  });
});

describe('ticketsOf / ticketsNet', () => {
  it('lista vazia por padrão; legado vira lista de um item', () => {
    expect(ticketsOf(player())).toEqual([]);
    expect(ticketsOf({ routes: [], ticketPoints: -6, hasLongestPath: false } as TtrPlayerState)).toEqual([-6]);
  });

  it('líquido soma cumpridos e falhados', () => {
    expect(ticketsNet(player({ tickets: [7, 16, -8] }))).toBe(15);
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

  it('addTicket lança um bilhete por vez (cumprido + / falhado −)', () => {
    let s: TtrState = { a: player() };
    s = applyTtrAction(s, 'a', { type: 'addTicket', value: 7 });
    s = applyTtrAction(s, 'a', { type: 'addTicket', value: 16 });
    s = applyTtrAction(s, 'a', { type: 'addTicket', value: -8 });
    expect(s.a.tickets).toEqual([7, 16, -8]);
    expect(ticketsNet(s.a)).toBe(15);
  });

  it('addTicket ignora zero e valores inválidos', () => {
    const s: TtrState = { a: player() };
    expect(applyTtrAction(s, 'a', { type: 'addTicket', value: 0 })).toBe(s);
    expect(applyTtrAction(s, 'a', { type: 'addTicket', value: NaN })).toBe(s);
  });

  it('addTicket migra o líquido legado para a lista (e o campo antigo some)', () => {
    const legacy: TtrState = { a: { routes: [], ticketPoints: 5, hasLongestPath: false } as TtrPlayerState };
    const s = applyTtrAction(legacy, 'a', { type: 'addTicket', value: 7 });
    expect(s.a.tickets).toEqual([5, 7]);
    expect(s.a.ticketPoints).toBeUndefined();
  });

  it('removeTicket tira pelo índice', () => {
    const s = applyTtrAction({ a: player({ tickets: [7, 16, -8] }) }, 'a', { type: 'removeTicket', index: 1 });
    expect(s.a.tickets).toEqual([7, -8]);
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

  it('setColor troca a cor do trem; escolher a cor de outro jogador faz a troca entre os dois', () => {
    let s: TtrState = { a: player({ color: 'blue' }), b: player({ color: 'red' }) };
    s = applyTtrAction(s, 'a', { type: 'setColor', color: 'green' });
    expect(s.a.color).toBe('green');
    // 'a' pega a cor de 'b' → 'b' herda a antiga de 'a'
    s = applyTtrAction(s, 'a', { type: 'setColor', color: 'red' });
    expect(s.a.color).toBe('red');
    expect(s.b.color).toBe('green');
  });

  it('não muta o estado original', () => {
    const s: TtrState = { a: player({ routes: [1], tickets: [7] }) };
    applyTtrAction(s, 'a', { type: 'addRoute', value: 2 });
    applyTtrAction(s, 'a', { type: 'addTicket', value: 3 });
    expect(s.a.routes).toEqual([1]);
    expect(s.a.tickets).toEqual([7]);
  });
});

describe('initialTtrState', () => {
  it('distribui cores de trem distintas na ordem dos jogadores', () => {
    const s = initialTtrState(['a', 'b', 'c']);
    expect(s.a.color).toBe(TTR_TRAIN_COLORS[0]);
    expect(s.b.color).toBe(TTR_TRAIN_COLORS[1]);
    expect(s.c.color).toBe(TTR_TRAIN_COLORS[2]);
    expect(TTR_TRAIN_COLORS).toHaveLength(5);
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
