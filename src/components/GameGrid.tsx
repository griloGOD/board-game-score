'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { GAMES, getGame } from '@/lib/games';
import { getActiveMatch } from '@/lib/repo';
import { Dialog } from '@/components/Dialog';

export function GameGrid() {
  const router = useRouter();
  const active = useLiveQuery(() => getActiveMatch(), []);
  const [confirmGame, setConfirmGame] = useState<string | null>(null);

  function pick(gameId: string) {
    if (active) setConfirmGame(gameId); // já há partida em andamento → confirma
    else router.push(`/novo/${gameId}`);
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {GAMES.map((game) => {
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

      {confirmGame && active && (
        <Dialog
          title="Partida em andamento"
          message={`Você tem uma partida de ${getGame(active.gameId)?.name ?? 'outro jogo'} que ainda não terminou. Criar uma nova apaga a atual.`}
          onClose={() => setConfirmGame(null)}
          actions={[
            {
              label: 'Continuar a atual',
              variant: 'primary',
              onClick: () => router.push(`/partida?id=${active.id}`),
            },
            {
              label: 'Criar uma nova',
              variant: 'ghost',
              onClick: () => router.push(`/novo/${confirmGame}`),
            },
            { label: 'Cancelar', variant: 'ghost', onClick: () => setConfirmGame(null) },
          ]}
        />
      )}
    </>
  );
}
