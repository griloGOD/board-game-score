'use client';

import { MatchSetup } from '@/components/MatchSetup';
import { createTtrMatch } from '@/lib/repo';
import { getGame } from '@/lib/games';

export default function NewTtrMatchPage() {
  // Ticket to Ride não tem meta numérica — o fim é declarado e vence o maior total.
  return <MatchSetup game={getGame('ticket-to-ride')!} onCreate={createTtrMatch} />;
}
