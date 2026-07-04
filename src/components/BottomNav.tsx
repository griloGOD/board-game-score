'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Início', icon: '🏠' },
  { href: '/novo/flip7', label: 'Jogar', icon: '🎲' },
  { href: '/historico', label: 'Ranking', icon: '🏆' },
];

export function BottomNav() {
  const pathname = usePathname();

  // Esconde durante os fluxos de partida/config (que têm barra de ação própria).
  if (pathname.startsWith('/partida') || pathname.startsWith('/novo')) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-3xl">
        {TABS.map((tab) => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'
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
