'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { getActiveFlip7Match } from '@/lib/repo';
import { Dialog } from '@/components/Dialog';

function tabClass(active: boolean): string {
  return `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition-colors ${
    active ? 'text-primary' : 'text-muted hover:text-ink'
  }`;
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const active = useLiveQuery(() => getActiveFlip7Match(), []);
  const [noGame, setNoGame] = useState(false);

  // Esconde durante os fluxos de partida/config (que têm barra de ação própria).
  if (pathname.startsWith('/partida') || pathname.startsWith('/novo')) return null;

  function continuar() {
    if (active) router.push(`/partida?id=${active.id}`);
    else setNoGame(true);
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
              {active && (
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
    </>
  );
}
