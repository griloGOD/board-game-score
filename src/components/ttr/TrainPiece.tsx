import type { TtrTrainColor } from '@/domain/ttr/types';

/** Cor plástica de cada trem da caixa (funciona no tema claro e no escuro). */
export const TRAIN_COLOR_HEX: Record<TtrTrainColor, string> = {
  blue: '#3a76c4',
  red: '#cf4136',
  green: '#3f9e4d',
  yellow: '#eec53f',
  black: '#3c434b',
};

export const TRAIN_COLOR_LABEL: Record<TtrTrainColor, string> = {
  blue: 'Azul',
  red: 'Vermelho',
  green: 'Verde',
  yellow: 'Amarelo',
  black: 'Preto',
};

/**
 * Vagãozinho de plástico do Ticket to Ride visto de lado, na cor do jogador.
 * Contorno escuro + brilho no topo para ler bem em qualquer fundo/tema.
 */
export function TrainPiece({ color, className }: { color: TtrTrainColor; className?: string }) {
  const fill = TRAIN_COLOR_HEX[color];
  return (
    <svg viewBox="0 0 44 26" className={className} aria-hidden focusable="false">
      <g stroke="rgba(0,0,0,.45)" strokeWidth="1.4" strokeLinejoin="round">
        {/* cabine */}
        <rect x="6.5" y="2" width="13" height="10" rx="2.4" fill={fill} />
        {/* corpo do vagão */}
        <rect x="1.5" y="7.5" width="41" height="12.5" rx="3" fill={fill} />
      </g>
      {/* brilho do plástico */}
      <rect x="4.5" y="9.6" width="35" height="3" rx="1.5" fill="rgba(255,255,255,.32)" />
      {/* rodas */}
      <g fill="#23272c" stroke="rgba(0,0,0,.45)" strokeWidth="1">
        <circle cx="10" cy="21.4" r="3.4" />
        <circle cx="22" cy="21.4" r="3.4" />
        <circle cx="34" cy="21.4" r="3.4" />
      </g>
    </svg>
  );
}
