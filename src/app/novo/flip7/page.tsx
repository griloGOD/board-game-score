'use client';

import { MatchSetup } from '@/components/MatchSetup';
import { createFlip7Match } from '@/lib/repo';
import { getGame } from '@/lib/games';

export default function NewFlip7MatchPage() {
  return (
    <MatchSetup
      game={getGame('flip7')!}
      defaultTarget={200}
      targetLabel="Pontuação para encerrar"
      targetHint="Padrão do Flip 7: 200."
      onCreate={createFlip7Match}
    />
  );
}
