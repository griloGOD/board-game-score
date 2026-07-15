'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { GAMES, getGame } from '@/lib/games';
import { listOpenMatches, matchCountsByGame } from '@/lib/repo';
import { Dialog } from '@/components/Dialog';

type SortMode = 'plays' | 'name';

const SORT_TABS: { key: SortMode; label: string }[] = [
  { key: 'plays', label: 'Mais jogados' },
  { key: 'name', label: 'Por nome' },
];

export function GameGrid() {
  const router = useRouter();
  const open = useLiveQuery(() => listOpenMatches(), []) ?? [];
  const counts = useLiveQuery(() => matchCountsByGame(), []) ?? ({} as Record<string, number>);
  const [confirmGame, setConfirmGame] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>('plays');

  // Cada jogo tem no máximo uma partida aberta; jogos diferentes convivem.
  const openByGame = new Map(open.map((m) => [m.gameId, m] as const));

  // Lê a preferência salva depois de montar (localStorage não existe no prerender,
  // e começar em 'plays' evita divergência de hidratação).
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bgs.homeSort');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === 'plays' || saved === 'name') setSort(saved);
    } catch {}
  }, []);

  function changeSort(next: SortMode) {
    setSort(next);
    try {
      localStorage.setItem('bgs.homeSort', next);
    } catch {}
  }

  // Jogáveis primeiro; dentro do grupo, o modo escolhido (contagem desc ou nome A–Z).
  const sorted = GAMES.map((game, i) => ({ game, i, plays: counts[game.id] ?? 0 })).sort((a, b) => {
    if (a.game.available !== b.game.available) return a.game.available ? -1 : 1;
    if (sort === 'plays') return b.plays - a.plays || a.i - b.i;
    return a.game.name.localeCompare(b.game.name, 'pt-BR');
  });

  function pick(gameId: string) {
    // Só avisa se ESTE jogo já tem partida aberta — outros jogos não são afetados.
    if (openByGame.has(gameId)) setConfirmGame(gameId);
    else router.push(`/novo/${gameId}`);
  }

  const confirmOpen = confirmGame ? openByGame.get(confirmGame) : undefined;

  return (
    <>
      <div className="mb-4 flex rounded-xl bg-surface-2 p-1 text-sm">
        {SORT_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => changeSort(t.key)}
            className={`flex-1 rounded-lg py-1.5 font-semibold transition ${
              sort === t.key ? 'bg-bg text-ink shadow-sm' : 'text-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {sorted.map(({ game }) => {
          const hasOpen = openByGame.has(game.id);
          const inner = (
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-2 shadow-sm ring-1 ring-border">
              {game.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={game.cover}
                  alt={game.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0 grid place-items-center text-5xl"
                  style={{ backgroundColor: game.accent + '26' }}
                >
                  <span aria-hidden>{game.emoji}</span>
                </div>
              )}

              {hasOpen && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success-fg shadow-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-success-fg" aria-hidden />
                  Em andamento
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-2.5 pt-9">
                <div className="font-display text-sm font-bold leading-tight text-white">{game.name}</div>
                <div className="text-[11px] text-white/75">
                  {game.minPlayers}–{game.maxPlayers} jogadores
                </div>
              </div>

              {!game.available && (
                <div className="absolute inset-0 grid place-items-center bg-bg/70 backdrop-blur-[1px]">
                  <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted ring-1 ring-border">
                    Em breve
                  </span>
                </div>
              )}
            </div>
          );

          return game.available ? (
            <button
              key={game.id}
              onClick={() => pick(game.id)}
              className="block w-full rounded-2xl outline-none transition-transform duration-200 ease-out hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              {inner}
            </button>
          ) : (
            <div key={game.id} aria-disabled className="cursor-not-allowed">
              {inner}
            </div>
          );
        })}
      </div>

      {confirmGame && confirmOpen && (
        <Dialog
          title={`${getGame(confirmGame)?.name ?? 'Jogo'} em andamento`}
          message={`Você tem uma partida de ${getGame(confirmGame)?.name ?? confirmGame} que ainda não terminou (${confirmOpen.players
            .map((p) => p.name)
            .join(', ')}). Criar uma nova apaga só essa partida.`}
          onClose={() => setConfirmGame(null)}
          actions={[
            {
              label: 'Continuar essa partida',
              variant: 'primary',
              onClick: () => router.push(`/partida?id=${confirmOpen.id}`),
            },
            {
              label: 'Criar uma nova (apaga a atual)',
              variant: 'danger',
              onClick: () => router.push(`/novo/${confirmGame}`),
            },
            { label: 'Cancelar', variant: 'ghost', onClick: () => setConfirmGame(null) },
          ]}
        />
      )}
    </>
  );
}
