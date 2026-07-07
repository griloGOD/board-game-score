'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { getMatch } from '@/lib/repo';
import { Flip7MatchView } from '@/components/flip7/Flip7MatchView';
import { CatanMatchView } from '@/components/catan/CatanMatchView';

/** Carrega a partida pelo id da URL e delega para o placar do jogo certo. */
function MatchLoader() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';
  // null = não existe; undefined = ainda carregando.
  const match = useLiveQuery(async () => (id ? ((await getMatch(id)) ?? null) : null), [id]);

  if (match === null) {
    return (
      <p className="text-muted">
        Partida não encontrada.{' '}
        <Link href="/" className="text-primary underline">
          Início
        </Link>
      </p>
    );
  }
  if (match === undefined) return <p className="text-muted">Carregando…</p>;

  if (match.gameId === 'catan') return <CatanMatchView match={match} />;
  return <Flip7MatchView match={match} />;
}

export default function MatchPage() {
  return (
    <Suspense fallback={<p className="text-muted">Carregando…</p>}>
      <MatchLoader />
    </Suspense>
  );
}
