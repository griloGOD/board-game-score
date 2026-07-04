interface Props {
  emoji: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'h-8 w-8 text-base',
  md: 'h-9 w-9 text-lg',
  lg: 'h-11 w-11 text-xl',
};

/** Ficha do jogador: emoji num círculo tingido com a cor dele. */
export function Avatar({ emoji, color, size = 'md' }: Props) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full ${SIZES[size]}`}
      style={{ backgroundColor: color + '2e' }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}
