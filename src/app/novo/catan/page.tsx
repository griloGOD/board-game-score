'use client';

import { MatchSetup } from '@/components/MatchSetup';
import { createCatanMatch } from '@/lib/repo';
import { getGame } from '@/lib/games';

export default function NewCatanMatchPage() {
  return (
    <MatchSetup
      game={getGame('catan')!}
      defaultTarget={10}
      targetLabel="Pontos de vitória para vencer"
      targetHint="Padrão do Catan: 10 pontos de vitória."
      onCreate={createCatanMatch}
    />
  );
}
