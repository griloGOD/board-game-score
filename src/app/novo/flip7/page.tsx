'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Player } from '@/domain/types';
import { AVATAR_PRESETS, COLOR_PRESETS, defaultAvatar, defaultColor } from '@/lib/presets';
import { listPlayers, savePlayer, createFlip7Match, newId } from '@/lib/repo';
import { getGame } from '@/lib/games';

const FLIP7 = getGame('flip7')!;

export default function NewFlip7MatchPage() {
  const router = useRouter();
  const savedPlayers = useLiveQuery(() => listPlayers(), []) ?? [];

  const [participants, setParticipants] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(defaultAvatar(0));
  const [color, setColor] = useState(defaultColor(0));
  const [target, setTarget] = useState(200);
  const [starting, setStarting] = useState(false);

  const count = participants.length;
  const canAdd = name.trim().length > 0;
  const canStart = count >= FLIP7.minPlayers && count <= FLIP7.maxPlayers;

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
    const id = await createFlip7Match(participants, target);
    router.push(`/partida?id=${id}`);
  }

  const availableSaved = savedPlayers.filter((sp) => !participants.some((p) => p.id === sp.id));

  return (
    <div className="pb-24">
      <h1 className="text-2xl font-bold tracking-tight">Flip 7 — nova partida</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Adicione de {FLIP7.minPlayers} a {FLIP7.maxPlayers} jogadores.
      </p>

      {/* Participantes */}
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Jogadores ({count})
          </h2>
        </div>
        {count === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700">
            Nenhum jogador ainda. Adicione abaixo.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {participants.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                  style={{ backgroundColor: p.color + '33' }}
                >
                  {p.avatar}
                </span>
                <span className="flex-1 font-medium">{p.name}</span>
                <button
                  onClick={() => removeParticipant(p.id)}
                  className="px-2 text-zinc-400 hover:text-red-500"
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
      <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Novo jogador
        </h2>

        <label className="mb-1 block text-xs text-zinc-500">Avatar</label>
        <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
          {AVATAR_PRESETS.map((a) => (
            <button
              key={a}
              onClick={() => setAvatar(a)}
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-lg ${
                avatar === a ? 'ring-2 ring-indigo-500' : 'bg-zinc-100 dark:bg-zinc-800'
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-xs text-zinc-500">Cor</label>
        <div className="mb-3 flex gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-7 w-7 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-white dark:ring-offset-zinc-900' : ''}`}
              style={{ backgroundColor: c }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNewPlayer()}
            placeholder="Nome do jogador"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            onClick={addNewPlayer}
            disabled={!canAdd}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Adicionar
          </button>
        </div>
      </section>

      {/* Reaproveitar salvos */}
      {availableSaved.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Jogadores salvos
          </h2>
          <div className="flex flex-wrap gap-2">
            {availableSaved.map((p) => (
              <button
                key={p.id}
                onClick={() => addExisting(p)}
                className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ backgroundColor: p.color + '33' }}
                >
                  {p.avatar}
                </span>
                {p.name}
                <span className="text-zinc-400">+</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Meta */}
      <section className="mb-6">
        <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Pontuação para encerrar
        </label>
        <input
          type="number"
          value={target}
          min={1}
          onChange={(e) => setTarget(Math.max(1, Number(e.target.value) || 0))}
          className="w-28 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <p className="mt-1 text-xs text-zinc-500">Padrão do Flip 7: 200.</p>
      </section>

      {/* Começar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white/90 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <span className="text-sm text-zinc-500">
            {canStart
              ? `${count} jogadores`
              : `Mínimo de ${FLIP7.minPlayers} jogadores`}
          </span>
          <button
            onClick={start}
            disabled={!canStart || starting}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white disabled:opacity-40"
          >
            {starting ? 'Começando…' : 'Começar partida'}
          </button>
        </div>
      </div>
    </div>
  );
}
