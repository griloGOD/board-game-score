'use client';

import { Suspense, type ReactElement } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import type { MatchRecord } from '@/lib/db';
import { getMatch } from '@/lib/repo';
import { Flip7MatchView } from '@/components/flip7/Flip7MatchView';
import { CatanMatchView } from '@/components/catan/CatanMatchView';
import { AzulMatchView } from '@/components/azul/AzulMatchView';
import { TtrMatchView } from '@/components/ttr/TtrMatchView';
import { TrioMatchView } from '@/components/trio/TrioMatchView';

/** Placar de cada jogo, por gameId. O padrão (fallback) é o Flip 7. */
const MATCH_VIEWS: Record<string, (props: { match: MatchRecord }) => ReactElement> = {
  catan: CatanMatchView,
  azul: AzulMatchView,
  'ticket-to-ride': TtrMatchView,
  trio: TrioMatchView,
};

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

  const View = MATCH_VIEWS[match.gameId] ?? Flip7MatchView;
  return <View match={match} />;
}

export default function MatchPage() {
  return (
    <Suspense fallback={<p className="text-muted">Carregando…</p>}>
      <MatchLoader />
    </Suspense>
  );
}
