import { GameGrid } from '@/components/GameGrid';

export default function Home() {
  return (
    <div>
      <h1 className="text-balance font-display text-3xl font-extrabold tracking-tight text-ink">
        Escolha um jogo
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted">Monte o placar da noite de jogos.</p>
      <GameGrid />
    </div>
  );
}
