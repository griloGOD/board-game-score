import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-ink"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-sm shadow-sm" aria-hidden>
            🎲
          </span>
          Board Game Score
        </Link>
      </div>
    </header>
  );
}
