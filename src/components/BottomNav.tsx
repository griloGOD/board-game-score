'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { listOpenMatches } from '@/lib/repo';
import { getGame } from '@/lib/games';
import { Dialog, type DialogAction } from '@/components/Dialog';

function tabClass(active: boolean): string {
  return `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition-colors ${
    active ? 'text-primary' : 'text-muted hover:text-ink'
  }`;
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const open = useLiveQuery(() => listOpenMatches(), []) ?? [];
  const [noGame, setNoGame] = useState(false);
  const [choosing, setChoosing] = useState(false);

  // Esconde durante os fluxos de partida/config (que têm barra de ação própria).
  if (pathname.startsWith('/partida') || pathname.startsWith('/novo')) return null;

  function continuar() {
    if (open.length === 0) setNoGame(true);
    else if (open.length === 1) router.push(`/partida?id=${open[0].id}`);
    else setChoosing(true); // uma partida aberta por jogo — deixa escolher qual
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl">
          <Link href="/" className={tabClass(pathname === '/')}>
            <span className="text-lg" aria-hidden>
              🏠
            </span>
            Início
          </Link>

          <button onClick={continuar} className={tabClass(false)}>
            <span className="relative text-lg" aria-hidden>
              ▶️
              {open.length > 0 && (
                <span className="absolute -right-1.5 -top-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-bg" />
              )}
            </span>
            Continuar
          </button>

          <Link href="/historico" className={tabClass(pathname.startsWith('/historico'))}>
            <span className="text-lg" aria-hidden>
              🏆
            </span>
            Ranking
          </Link>
        </div>
      </nav>

      {noGame && (
        <Dialog
          title="Nenhuma partida em andamento"
          message="Você não tem nenhum jogo aberto. Escolha um jogo no Início para começar."
          onClose={() => setNoGame(false)}
          actions={[
            {
              label: 'Escolher um jogo',
              variant: 'primary',
              onClick: () => {
                setNoGame(false);
                router.push('/');
              },
            },
            { label: 'Fechar', variant: 'ghost', onClick: () => setNoGame(false) },
          ]}
        />
      )}

      {choosing && (
        <Dialog
          title="Continuar qual partida?"
          message="Cada jogo guarda a própria partida em aberto."
          onClose={() => setChoosing(false)}
          actions={[
            ...open.map(
              (m, i): DialogAction => ({
                label: `${getGame(m.gameId)?.name ?? m.gameId} · ${m.players.map((p) => p.name).join(', ')}`,
                variant: i === 0 ? 'primary' : 'ghost',
                onClick: () => {
                  setChoosing(false);
                  router.push(`/partida?id=${m.id}`);
                },
              }),
            ),
            { label: 'Cancelar', variant: 'ghost', onClick: () => setChoosing(false) },
          ]}
        />
      )}
    </>
  );
}
