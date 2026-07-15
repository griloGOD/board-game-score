import Link from 'next/link';
import type { ReactNode } from 'react';
import { getGame } from '@/lib/games';

interface Props {
  gameId: string;
  title: string;
  subtitle: string;
  /** Conteúdo extra sob o subtítulo (ex.: peças decorativas do jogo). */
  children?: ReactNode;
}

/**
 * Cabeçalho das telas de partida: faixa com a capa do jogo (a mesma da home)
 * atrás do título, escurecida para o texto branco funcionar nos dois temas.
 */
export function MatchHeader({ gameId, title, subtitle, children }: Props) {
  const cover = getGame(gameId)?.cover;

  return (
    <div className="relative mb-4 overflow-hidden rounded-2xl shadow-sm ring-1 ring-border">
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-surface-2" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

      <div className="relative flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-extrabold tracking-tight text-white">{title}</h1>
          <p className="truncate text-sm text-white/85">{subtitle}</p>
          {children}
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-full bg-black/45 px-3.5 py-1.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-black/60"
        >
          Sair
        </Link>
      </div>
    </div>
  );
}
