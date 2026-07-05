'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { getActiveFlip7Match } from '@/lib/repo';

export function BottomNav() {
  const pathname = usePathname();
  const active = useLiveQuery(() => getActiveFlip7Match(), []);

  // Esconde durante os fluxos de partida/config (que têm barra de ação própria).
  if (pathname.startsWith('/partida') || pathname.startsWith('/novo')) return null;

  // "Jogar" vira "Continuar" (e leva de volta à partida) quando há jogo em andamento.
  const jogar = active
    ? { href: `/partida?id=${active.id}`, label: 'Continuar', icon: '▶️' }
    : { href: '/novo/flip7', label: 'Jogar', icon: '🎲' };

  const tabs = [
    { href: '/', label: 'Início', icon: '🏠' },
    jogar,
    { href: '/historico', label: 'Ranking', icon: '🏆' },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl">
        {tabs.map((tab) => {
          const base = tab.href.split('?')[0];
          const isActive = base === '/' ? pathname === '/' : pathname.startsWith(base);
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition-colors ${
                isActive ? 'text-primary' : 'text-muted hover:text-ink'
              }`}
            >
              <span className="text-lg" aria-hidden>
                {tab.icon}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
