'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Player } from '@/domain/types';
import type { GameInfo } from '@/lib/games';
import { AVATAR_PRESETS, COLOR_PRESETS, defaultAvatar, defaultColor, softColor } from '@/lib/presets';
import { listPlayers, savePlayer, deletePlayer, newId } from '@/lib/repo';
import { Avatar } from '@/components/Avatar';
import { EmojiPicker } from '@/components/EmojiPicker';
import { Dialog } from '@/components/Dialog';

interface Props {
  game: GameInfo;
  /** Valor inicial do campo de meta (ex.: 200 no Flip 7, 10 no Catan). */
  defaultTarget: number;
  targetLabel: string;
  targetHint: string;
  /** Cria a partida e devolve o id; o componente navega para /partida. */
  onCreate: (players: Player[], target: number) => Promise<string>;
}

/**
 * Tela de "Nova partida" compartilhada entre os jogos: montagem dos jogadores
 * (novo jogador com emoji/cor, salvos com apagar) + meta de pontuação.
 */
export function MatchSetup({ game, defaultTarget, targetLabel, targetHint, onCreate }: Props) {
  const router = useRouter();
  const savedPlayers = useLiveQuery(() => listPlayers(), []) ?? [];

  const [participants, setParticipants] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(defaultAvatar(0));
  const [color, setColor] = useState(defaultColor(0));
  const [target, setTarget] = useState(defaultTarget);
  const [starting, setStarting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savedToDelete, setSavedToDelete] = useState<Player | null>(null);

  const count = participants.length;
  const canAdd = name.trim().length > 0;
  const canStart = count >= game.minPlayers && count <= game.maxPlayers;

  function addNewPlayer() {
    if (!canAdd) return;
    const player: Player = { id: newId(), name: name.trim(), avatar, color };
    void savePlayer(player);
    setParticipants((prev) => [...prev, player]);
    setName('');
    const next = count + 1;
    setAvatar(defaultAvatar(next));
    setColor(defaultColor(next));
  }
  function addExisting(player: Player) {
    setParticipants((prev) => (prev.some((p) => p.id === player.id) ? prev : [...prev, player]));
  }
  function removeParticipant(id: string) {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }
  async function start() {
    if (!canStart || starting) return;
    setStarting(true);
    const id = await onCreate(participants, target);
    // replace (não push) para que "voltar" da partida vá direto ao Início, sem passar pelo setup.
    router.replace(`/partida?id=${id}`);
  }

  const availableSaved = savedPlayers.filter((sp) => !participants.some((p) => p.id === sp.id));

  return (
    <div className="pb-28">
      {/* Voltar + título */}
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/"
          aria-label="Voltar ao início"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-lg text-muted ring-1 ring-border transition-colors hover:text-ink"
        >
          ←
        </Link>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">Nova partida</h1>
          <p className="text-sm text-muted">
            {game.name} · {game.minPlayers}–{game.maxPlayers} jogadores
          </p>
        </div>
      </div>

      {/* Participantes */}
      <section className="mb-6">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Jogadores ({count})</h2>
        {count === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            Ninguém ainda — adicione os jogadores abaixo. 👇
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {participants.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2">
                <Avatar emoji={p.avatar} color={p.color} />
                <span className="flex-1 font-medium text-ink">{p.name}</span>
                <button
                  onClick={() => removeParticipant(p.id)}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                  aria-label={`Remover ${p.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Novo jogador */}
      <section className="mb-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Novo jogador</h2>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="relative shrink-0"
            aria-label="Escolher emoji"
          >
            <span
              className="grid h-14 w-14 place-items-center rounded-2xl text-3xl"
              style={{ backgroundColor: softColor(color) }}
            >
              {avatar}
            </span>
            <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-success text-xs text-success-fg ring-2 ring-surface">
              ✎
            </span>
          </button>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNewPlayer()}
            placeholder="Nome do jogador"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-ink outline-none placeholder:text-muted focus:border-primary"
          />
        </div>

        <div className="mt-3">
          <div className="mb-1.5 text-[11px] font-semibold text-muted">Emoji rápido</div>
          <div className="flex flex-wrap gap-1.5">
            {AVATAR_PRESETS.slice(0, 10).map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`grid h-9 w-9 place-items-center rounded-lg text-lg transition ${
                  avatar === a ? 'bg-success/15 ring-2 ring-success' : 'bg-bg ring-1 ring-border hover:bg-surface-2'
                }`}
              >
                {a}
              </button>
            ))}
            <button
              onClick={() => setPickerOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg bg-bg text-sm text-muted ring-1 ring-border transition hover:bg-surface-2"
              aria-label="Todos os emojis"
            >
              ＋
            </button>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 text-[11px] font-semibold text-muted">Cor</div>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full transition ${
                  color === c ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : ''
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Cor ${c}`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={addNewPlayer}
          disabled={!canAdd}
          className="mt-4 w-full rounded-xl bg-success py-2.5 font-semibold text-success-fg transition hover:brightness-105 disabled:opacity-40"
        >
          Adicionar jogador
        </button>
      </section>

      {/* Salvos */}
      {availableSaved.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Jogadores salvos</h2>
          <div className="flex flex-wrap gap-2">
            {availableSaved.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-0.5 rounded-full border border-border bg-surface py-1 pl-1 pr-1 text-sm text-ink"
              >
                <button
                  onClick={() => addExisting(p)}
                  className="flex items-center gap-1.5 pr-1 transition hover:text-success"
                >
                  <Avatar emoji={p.avatar} color={p.color} size="sm" />
                  {p.name}
                  <span className="text-muted">＋</span>
                </button>
                <button
                  onClick={() => setSavedToDelete(p)}
                  aria-label={`Apagar ${p.name}`}
                  className="grid h-6 w-6 place-items-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Meta */}
      <section className="mb-6">
        <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{targetLabel}</h2>
        <input
          type="number"
          value={target}
          min={1}
          onChange={(e) => setTarget(Math.max(1, Number(e.target.value) || 0))}
          className="w-28 rounded-xl border border-border bg-bg px-3 py-2.5 text-ink outline-none focus:border-primary"
        />
        <p className="mt-1 text-xs text-muted">{targetHint}</p>
      </section>

      {/* Começar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <span className="text-sm text-muted">
            {canStart ? `${count} jogadores` : `Mínimo de ${game.minPlayers} jogadores`}
          </span>
          <button
            onClick={start}
            disabled={!canStart || starting}
            className="rounded-xl bg-success px-6 py-2.5 font-semibold text-success-fg transition hover:brightness-105 disabled:opacity-40"
          >
            {starting ? 'Começando…' : 'Começar partida'}
          </button>
        </div>
      </div>

      {pickerOpen && (
        <EmojiPicker
          onSelect={(e) => {
            setAvatar(e);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {savedToDelete && (
        <Dialog
          title="Apagar jogador salvo?"
          message={`"${savedToDelete.name}" sai da lista de salvos. As partidas antigas dele continuam no histórico.`}
          onClose={() => setSavedToDelete(null)}
          actions={[
            {
              label: 'Apagar',
              variant: 'danger',
              onClick: () => {
                void deletePlayer(savedToDelete.id);
                setSavedToDelete(null);
              },
            },
            { label: 'Cancelar', variant: 'ghost', onClick: () => setSavedToDelete(null) },
          ]}
        />
      )}
    </div>
  );
}
