import { describe, it, expect } from 'vitest';
import { computeFlip7Ranking, type FinishedFlip7Match } from './ranking';
import type { Player } from '../types';

const ana: Player = { id: 'a', name: 'Ana', avatar: '🦊', color: '#ef4444' };
const bruno: Player = { id: 'b', name: 'Bruno', avatar: '🐼', color: '#3b82f6' };

function match(players: Player[], championIds: string[], totals: Record<string, number>): FinishedFlip7Match {
  return { players, championIds, totals };
}

describe('computeFlip7Ranking', () => {
  it('conta vitórias, partidas jogadas e melhor pontuação por jogador', () => {
    const r = computeFlip7Ranking([
      match([ana, bruno], ['a'], { a: 210, b: 150 }),
      match([ana, bruno], ['b'], { a: 120, b: 205 }),
    ]);
    const byId = Object.fromEntries(r.map((x) => [x.player.id, x]));
    expect(byId.a.wins).toBe(1);
    expect(byId.a.matchesPlayed).toBe(2);
    expect(byId.a.bestScore).toBe(210);
    expect(byId.b.wins).toBe(1);
    expect(byId.b.bestScore).toBe(205);
  });

  it('dá uma vitória a cada co-campeão', () => {
    const r = computeFlip7Ranking([match([ana, bruno], ['a', 'b'], { a: 205, b: 205 })]);
    const byId = Object.fromEntries(r.map((x) => [x.player.id, x]));
    expect(byId.a.wins).toBe(1);
    expect(byId.b.wins).toBe(1);
  });

  it('ordena por vitórias (desc) e, no empate, por melhor pontuação', () => {
    const r = computeFlip7Ranking([
      match([ana, bruno], ['b'], { a: 100, b: 200 }),
      match([ana, bruno], ['b'], { a: 100, b: 200 }),
      match([ana, bruno], ['a'], { a: 200, b: 100 }),
    ]);
    expect(r[0].player.id).toBe('b'); // 2 vitórias
    expect(r[1].player.id).toBe('a'); // 1 vitória
  });
});
