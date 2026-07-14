'use client';

import { MatchSetup } from '@/components/MatchSetup';
import { createAzulMatch } from '@/lib/repo';
import { getGame } from '@/lib/games';

export default function NewAzulMatchPage() {
  // Azul não tem meta numérica — o fim é declarado e vence o maior total.
  return <MatchSetup game={getGame('azul')!} onCreate={createAzulMatch} />;
}
