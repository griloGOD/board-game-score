'use client';

import { MatchSetup } from '@/components/MatchSetup';
import { createTrioMatch } from '@/lib/repo';
import { getGame } from '@/lib/games';

export default function NewTrioMatchPage() {
  return (
    <MatchSetup
      game={getGame('trio')!}
      defaultTarget={3}
      targetLabel="Trios para vencer"
      targetHint="Padrão do Trio: 3 trios (ou pegar o trio de 7)."
      onCreate={createTrioMatch}
    />
  );
}
