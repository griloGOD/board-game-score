import Link from 'next/link';
import { GAMES } from '@/lib/games';

export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Escolha um jogo</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Selecione o jogo para montar o placar.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {GAMES.map((game) => {
          const card = (
            <div
              className="relative flex aspect-square flex-col justify-between overflow-hidden rounded-2xl p-3 text-white shadow-sm"
              style={{ backgroundColor: game.accent }}
            >
              <span className="text-3xl" aria-hidden>
                {game.emoji}
              </span>
              <div>
                <div className="font-semibold leading-tight">{game.name}</div>
                <div className="text-xs opacity-80">
                  {game.minPlayers}–{game.maxPlayers} jogadores
                </div>
              </div>
              {!game.available && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-medium">
                  Em breve
                </span>
              )}
            </div>
          );

          return game.available ? (
            <Link
              key={game.id}
              href={`/novo/${game.id}`}
              className="rounded-2xl outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              {card}
            </Link>
          ) : (
            <div key={game.id} aria-disabled className="cursor-not-allowed">
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
