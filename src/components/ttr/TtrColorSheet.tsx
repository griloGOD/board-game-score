'use client';

import type { Player } from '@/domain/types';
import type { TtrState, TtrTrainColor } from '@/domain/ttr/types';
import { TTR_TRAIN_COLORS } from '@/domain/ttr/scoring';
import { applyTtrMatchAction } from '@/lib/repo';
import { TrainPiece, TRAIN_COLOR_LABEL } from './TrainPiece';

interface Props {
  matchId: string;
  player: Player;
  /** Cor atual de cada jogador (para mostrar quem já usa cada trem). */
  state: TtrState;
  players: Player[];
  colorOf: (playerId: string) => TtrTrainColor;
  onClose: () => void;
}

/**
 * Escolha da cor dos trens (as 5 da caixa). Escolher a cor de outro jogador
 * TROCA os trens entre os dois — nunca ficam duas pessoas com a mesma cor.
 */
export function TtrColorSheet({ matchId, player, players, colorOf, onClose }: Props) {
  const current = colorOf(player.id);

  function pick(color: TtrTrainColor) {
    if (color !== current) void applyTtrMatchAction(matchId, player.id, { type: 'setColor', color });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl border border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold text-ink">Trens de {player.name}</h3>
        <p className="mt-1.5 text-sm text-muted">
          Escolher a cor de outro jogador troca os trens entre vocês dois.
        </p>

        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {TTR_TRAIN_COLORS.map((color) => {
            const owner = players.find((p) => colorOf(p.id) === color);
            const isMine = color === current;
            return (
              <button
                key={color}
                onClick={() => pick(color)}
                aria-pressed={isMine}
                aria-label={`Trem ${TRAIN_COLOR_LABEL[color].toLowerCase()}${owner && !isMine ? `, com ${owner.name}` : ''}`}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 transition ${
                  isMine ? 'bg-success/15 ring-2 ring-success' : 'bg-bg ring-1 ring-border hover:bg-surface-2'
                }`}
              >
                <TrainPiece color={color} className="h-5 w-auto" />
                <span className="text-[10px] font-semibold text-ink">{TRAIN_COLOR_LABEL[color]}</span>
                <span className="min-h-3 max-w-full truncate px-0.5 text-[9px] leading-3 text-muted">
                  {owner ? (isMine ? 'você' : owner.name) : ''}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-2"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
