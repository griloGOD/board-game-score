'use client';

import { MatchSetup } from '@/components/MatchSetup';
import { createTrioMatch } from '@/lib/repo';
import { getGame } from '@/lib/games';

export default function NewTrioMatchPage() {
  return (
    <MatchSetup
      game={getGame('trio')!}
      defaultTarget={3}
      targetLabel="Trios para fechar a rodada"
      targetHint="Cada rodada vencida (3 trios ou o trio de 7) vale 1 ponto — joguem até decidirem parar."
      onCreate={createTrioMatch}
    />
  );
}
