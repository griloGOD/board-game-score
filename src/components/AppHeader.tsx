import Link from 'next/link';
import Image from 'next/image';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-ink"
        >
          <Image src="/logo.png" alt="" width={32} height={32} className="rounded-lg shadow-sm" priority />
          Board Game Score
        </Link>
      </div>
    </header>
  );
}
