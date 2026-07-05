'use client';

export interface DialogAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'ghost';
}

interface Props {
  title: string;
  message?: string;
  actions: DialogAction[];
  onClose: () => void;
}

function actionClass(variant: DialogAction['variant']): string {
  const base = 'w-full rounded-xl py-2.5 text-sm font-semibold transition';
  if (variant === 'primary') return `${base} bg-primary text-primary-fg hover:brightness-105`;
  if (variant === 'danger') return `${base} bg-danger text-danger-fg hover:brightness-105`;
  return `${base} border border-border text-ink hover:bg-surface-2`;
}

/** Caixa de diálogo genérica (confirmação, aviso) com botões empilhados. */
export function Dialog({ title, message, actions, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl border border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
        {message && <p className="mt-1.5 text-sm text-muted">{message}</p>}
        <div className="mt-5 flex flex-col gap-2">
          {actions.map((a) => (
            <button key={a.label} onClick={a.onClick} className={actionClass(a.variant)}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
