import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  MessageCircle,
  Palette,
  Pencil,
  Play,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Users,
  Vibrate,
  Volume2,
  VolumeX,
  Zap
} from 'lucide-react';
import { Player, GameSettings } from '../types/game';
import { StarlineMark } from './StarlineMark';

export const PRESET_COLORS = [
  { name: 'Cyan', color: '#5CE1FF', glow: 'rgba(92, 225, 255, 0.4)' },
  { name: 'Gold', color: '#FFD166', glow: 'rgba(255, 209, 102, 0.4)' },
  { name: 'Rose', color: '#FF6B8A', glow: 'rgba(255, 107, 138, 0.4)' },
  { name: 'Violet', color: '#B08CFF', glow: 'rgba(176, 140, 255, 0.4)' },
  { name: 'Emerald', color: '#6EF2B7', glow: 'rgba(110, 242, 183, 0.4)' },
  { name: 'Orange', color: '#FF9D5C', glow: 'rgba(255, 157, 92, 0.4)' },
  { name: 'Blue', color: '#7AA7FF', glow: 'rgba(122, 167, 255, 0.4)' },
  { name: 'Pink', color: '#FF5FB2', glow: 'rgba(255, 95, 178, 0.4)' },
  { name: 'Teal', color: '#2DD4BF', glow: 'rgba(45, 212, 191, 0.42)' },
  { name: 'Coral', color: '#FF7A59', glow: 'rgba(255, 122, 89, 0.42)' },
  { name: 'Indigo', color: '#6366F1', glow: 'rgba(99, 102, 241, 0.42)' },
  { name: 'Fuchsia', color: '#E879F9', glow: 'rgba(232, 121, 249, 0.42)' },
  { name: 'Lime', color: '#C6FF4A', glow: 'rgba(198, 255, 74, 0.42)' },
  { name: 'Ice', color: '#A5F3FC', glow: 'rgba(165, 243, 252, 0.42)' },
  { name: 'Sand', color: '#F2C879', glow: 'rgba(242, 200, 121, 0.42)' }
];

const MAX_PLAYERS = 15;

const NODE_COUNTS = [8, 12, 16, 20, 24, 30, 69];

const DARE_CATEGORIES = [
  {
    key: 'party' as const,
    label: 'Party',
    description: 'Silly group prompts',
    icon: Sparkles,
    color: 'var(--gold)'
  },
  {
    key: 'physical' as const,
    label: 'Action',
    description: 'Move or strike a pose',
    icon: Zap,
    color: 'var(--danger)'
  },
  {
    key: 'social' as const,
    label: 'Social',
    description: 'Stories and questions',
    icon: MessageCircle,
    color: 'var(--accent)'
  },
  {
    key: 'custom' as const,
    label: 'Custom',
    description: 'Your own inside jokes',
    icon: Palette,
    color: 'var(--violet)'
  }
];

interface SetupLobbyProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onStartGame: () => void;
  onOpenDareEditor: () => void;
  onOpenRules: () => void;
}

const Toggle: React.FC<{
  enabled: boolean;
  onChange: () => void;
  label: string;
}> = ({ enabled, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    aria-label={label}
    onClick={onChange}
    className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
      enabled
        ? 'border-[var(--lime)] bg-[var(--lime)]'
        : 'border-[var(--line-strong)] bg-black/30'
    }`}
  >
    <span
      className={`absolute left-[2px] top-[2px] h-4 w-4 rounded-full border border-black/20 transition-transform ${
        enabled ? 'translate-x-4 bg-[#162000]' : 'bg-[var(--muted)]'
      }`}
    />
  </button>
);

const PanelHead: React.FC<{
  icon: React.ReactNode;
  kicker: string;
  title: string;
  color: string;
  right?: React.ReactNode;
}> = ({ icon, kicker, title, color, right }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex min-w-0 items-center gap-3">
      <span
        className="flex h-10 w-10 shrink-0 -rotate-3 items-center justify-center rounded-xl border-2 border-black/25 shadow-[0_3px_0_rgba(2,0,10,0.45)]"
        style={{ backgroundColor: color, color: '#140b23' }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="section-label">{kicker}</p>
        <h2 className="mt-1 truncate font-display text-lg leading-none text-[var(--ink)] sm:text-xl">
          {title}
        </h2>
      </div>
    </div>
    {right}
  </div>
);

export const SetupLobby: React.FC<SetupLobbyProps> = ({
  players,
  onUpdatePlayers,
  settings,
  onUpdateSettings,
  onStartGame,
  onOpenDareEditor,
  onOpenRules
}) => {
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!colorPickerFor) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setColorPickerFor(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [colorPickerFor]);

  const addPlayer = () => {
    if (players.length >= MAX_PLAYERS) return;
    const usedColors = players.map(p => p.color);
    const availableColor =
      PRESET_COLORS.find(c => !usedColors.includes(c.color)) ||
      PRESET_COLORS[players.length % PRESET_COLORS.length];
    const newPlayer: Player = {
      id: `p${Date.now()}`,
      name: `Player ${players.length + 1}`,
      color: availableColor.color,
      glowColor: availableColor.glow
    };
    onUpdatePlayers([...players, newPlayer]);
  };

  const removePlayer = (id: string) => {
    if (players.length <= 2) return;
    if (colorPickerFor === id) setColorPickerFor(null);
    onUpdatePlayers(players.filter(p => p.id !== id));
  };

  const updatePlayerName = (id: string, name: string) => {
    onUpdatePlayers(players.map(p => (p.id === id ? { ...p, name } : p)));
  };

  const updatePlayerColor = (id: string, color: string) => {
    const preset = PRESET_COLORS.find(c => c.color === color);
    onUpdatePlayers(
      players.map(p =>
        p.id === id
          ? { ...p, color, glowColor: preset ? preset.glow : p.glowColor }
          : p
      )
    );
    setColorPickerFor(null);
  };

  const toggleCategory = (category: keyof typeof settings.enabledCategories) => {
    onUpdateSettings({
      ...settings,
      enabledCategories: {
        ...settings.enabledCategories,
        [category]: !settings.enabledCategories[category]
      }
    });
  };

  const enabledCategoryCount = DARE_CATEGORIES.filter(
    ({ key }) => settings.enabledCategories[key]
  ).length;

  return (
    <div className="h-dvh w-full overflow-y-auto pb-safe">
      <div aria-hidden className="star-dust pointer-events-none fixed inset-0 opacity-70" />
      <div
        aria-hidden
        className="pointer-events-none fixed -left-48 -top-64 h-[34rem] w-[34rem] rounded-full bg-[var(--pink)] opacity-[0.14] blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -right-40 top-24 h-[30rem] w-[30rem] rounded-full bg-[var(--accent)] opacity-[0.11] blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -bottom-64 left-1/3 h-[32rem] w-[32rem] rounded-full bg-[var(--violet)] opacity-[0.14] blur-[130px]"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-6 pt-safe sm:px-6">
        <header className="relative py-5 sm:py-6">
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="sticker -rotate-2 bg-[var(--lime)] text-[#142000]">
                  <StarlineMark className="h-3 w-3" />
                  Cosmic party game
                </span>
                <span className="sticker rotate-1 bg-[var(--pink)] text-[#21051a]">
                  2–15 players
                </span>
                <span className="sticker -rotate-1 bg-[var(--surface-2)] text-[var(--muted)]">
                  One device
                </span>
              </div>

              <h1 className="title-pop mt-4 font-display text-[3rem] leading-[0.86] text-[var(--ink)] sm:text-[4.5rem]">
                Starline
              </h1>
              <p className="mt-3 max-w-2xl text-base font-medium leading-6 text-[var(--muted)] sm:text-lg sm:leading-7">
                Pass the phone. Connect the stars. Try not to cross the line.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 lg:flex-col lg:items-end lg:pb-1">
              <button
                type="button"
                onClick={onOpenRules}
                className="btn btn-secondary px-4 py-2.5"
              >
                <BookOpen className="h-4 w-4 text-[var(--accent)]" />
                How to play
              </button>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-2)] lg:text-right">
                No scores. No losers. Just dares.
              </span>
            </div>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <section className="panel p-4 sm:p-5">
            <PanelHead
              icon={<Users className="h-5 w-5" />}
              kicker="Player select"
              title="Pick your crew"
              color="var(--pink)"
              right={
                <div className="shrink-0 text-right">
                  <p className="font-display text-2xl leading-none text-[var(--lime)]">
                    {players.length}
                    <span className="text-sm text-[var(--muted-2)]">/{MAX_PLAYERS}</span>
                  </p>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--muted-2)]">
                    in the party
                  </p>
                </div>
              }
            />

            <div className="mt-4 grid grid-cols-2 gap-2">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="relative flex min-w-0 items-center gap-2 rounded-xl border p-2 sm:gap-2.5 sm:p-2.5"
                  style={{
                    borderColor: `${player.color}66`,
                    background: `linear-gradient(115deg, ${player.color}24, rgba(255,255,255,0.025) 62%)`
                  }}
                >
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() =>
                        setColorPickerFor(current =>
                          current === player.id ? null : player.id
                        )
                      }
                      aria-label={`Choose ${player.name}'s color`}
                      aria-expanded={colorPickerFor === player.id}
                      className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white/70 font-display text-[10px] text-[#140b23] transition sm:h-10 sm:w-10 sm:text-xs ${
                        colorPickerFor === player.id
                          ? 'scale-105 shadow-[0_0_0_3px_rgba(255,255,255,0.15)]'
                          : 'hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: player.color,
                        boxShadow: `0 0 22px ${player.glowColor}`
                      }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#140b23] bg-[var(--lime)] text-[#142000] sm:h-4 sm:w-4">
                        <Palette className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                      </span>
                    </button>

                    {colorPickerFor === player.id && (
                      <div
                        ref={pickerRef}
                        className={`absolute top-12 z-40 grid w-[10.5rem] grid-cols-5 gap-2 rounded-xl border-2 border-[var(--line-strong)] bg-[var(--surface-2)] p-2 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.95)] ${index % 2 === 0 ? 'left-0' : 'right-0'}`}
                      >
                        {PRESET_COLORS.map(preset => (
                          <button
                            key={preset.color}
                            type="button"
                            onClick={() => updatePlayerColor(player.id, preset.color)}
                            aria-label={`Set ${player.name} color to ${preset.name}`}
                            aria-pressed={player.color === preset.color}
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 ${
                              player.color === preset.color
                                ? 'border-white/90'
                                : 'border-black/30'
                            }`}
                            style={{ backgroundColor: preset.color }}
                          >
                            {player.color === preset.color && (
                              <Check className="h-3 w-3 text-[#140b23]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--muted-2)] sm:text-[9px] sm:tracking-[0.16em]">
                      P{index + 1} · ready
                    </p>
                    <input
                      type="text"
                      value={player.name}
                      onChange={(event) => updatePlayerName(player.id, event.target.value)}
                      onFocus={() => setColorPickerFor(null)}
                      maxLength={20}
                      aria-label={`Player ${index + 1} name`}
                      className="mt-0.5 w-full min-w-0 rounded-md bg-transparent py-0.5 text-xs font-bold text-[var(--ink)] sm:text-sm outline-none transition-colors placeholder:text-[var(--muted-2)] focus:bg-black/20 focus:px-1.5 focus:ring-1 focus:ring-[rgba(217,255,99,0.4)]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removePlayer(player.id)}
                    disabled={players.length <= 2}
                    aria-label={`Remove ${player.name}`}
                    className="shrink-0 rounded-lg p-1 text-[var(--muted-2)] transition hover:bg-[var(--danger-soft)] hover:text-[var(--danger-text)] disabled:cursor-not-allowed disabled:opacity-20 sm:p-1.5"
                  >
                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addPlayer}
                disabled={players.length >= MAX_PLAYERS}
                className="flex min-h-[4.5rem] items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--line-strong)] bg-black/15 px-2 text-[10px] font-bold uppercase tracking-[0.1em] sm:px-3 sm:text-xs sm:tracking-[0.12em] text-[var(--muted)] transition hover:border-[var(--lime)] hover:bg-[var(--lime)]/10 hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Plus className="h-4 w-4" />
                {players.length >= MAX_PLAYERS ? 'Crew full' : 'Join the party'}
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-[var(--line)] bg-black/15 px-3 py-2 text-[11px] text-[var(--muted-2)]">
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--pink)]" />
              Turns pass left to right. Hand over the phone after every line.
            </div>
          </section>

          <div className="flex min-w-0 flex-col gap-4">
            <section className="panel p-4 sm:p-5">
              <PanelHead
                icon={<Star className="h-5 w-5" />}
                kicker="Level select"
                title="Build the sky"
                color="var(--accent)"
              />

              <div className="mt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="section-label">How many stars?</p>
                  <span className="rounded-full border border-[var(--line)] bg-black/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--gold)]">
                    {settings.nodeCount} stars
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {NODE_COUNTS.map(count => {
                    const selected = settings.nodeCount === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => onUpdateSettings({ ...settings, nodeCount: count })}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-2.5 text-sm font-bold tabular-nums transition ${
                          selected
                            ? 'border-[#f3ffc2] bg-[var(--lime)] text-[#142000] shadow-[0_3px_0_#6b8714]'
                            : 'border-[var(--line)] bg-black/20 text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]'
                        }`}
                      >
                        <Star
                          className="h-3 w-3"
                          fill="currentColor"
                          strokeWidth={selected ? 2 : 1.5}
                        />
                        {count}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3">
                <p className="section-label">Star size</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as const).map(size => {
                    const selected = settings.nodeSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => onUpdateSettings({ ...settings, nodeSize: size })}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-2 text-[11px] font-bold uppercase tracking-[0.08em] transition ${
                          selected
                            ? 'border-[rgba(92,225,255,0.6)] bg-[var(--accent-soft)] text-[var(--accent)]'
                            : 'border-[var(--line)] bg-black/20 text-[var(--muted)] hover:text-[var(--ink)]'
                        }`}
                      >
                        <span
                          className={`rounded-full bg-current ${
                            size === 'small'
                              ? 'h-1.5 w-1.5'
                              : size === 'medium'
                                ? 'h-2.5 w-2.5'
                                : 'h-3.5 w-3.5'
                          }`}
                        />
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-black/20 px-2.5 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {settings.soundEnabled ? (
                      <Volume2 className="h-3.5 w-3.5 shrink-0 text-[var(--lime)]" />
                    ) : (
                      <VolumeX className="h-3.5 w-3.5 shrink-0 text-[var(--muted-2)]" />
                    )}
                    <span className="text-[11px] font-semibold text-[var(--ink)]">Sound</span>
                  </div>
                  <Toggle
                    enabled={settings.soundEnabled}
                    onChange={() =>
                      onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })
                    }
                    label="Toggle sound"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-black/20 px-2.5 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Vibrate className="h-3.5 w-3.5 shrink-0 text-[var(--pink)]" />
                    <span className="text-[11px] font-semibold text-[var(--ink)]">Rumble</span>
                  </div>
                  <Toggle
                    enabled={settings.vibrateEnabled}
                    onChange={() =>
                      onUpdateSettings({ ...settings, vibrateEnabled: !settings.vibrateEnabled })
                    }
                    label="Toggle vibration"
                  />
                </div>
              </div>
            </section>

            <section className="panel p-4 sm:p-5">
              <PanelHead
                icon={<Sparkles className="h-5 w-5" />}
                kicker="Chaos cards"
                title="Dare deck"
                color="var(--violet)"
                right={
                  <button
                    type="button"
                    onClick={onOpenDareEditor}
                    className="btn btn-ghost -mr-2 -mt-1 px-2.5 py-1.5 text-[11px]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                }
              />

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {DARE_CATEGORIES.map(({ key, label, description, icon: Icon, color }) => {
                  const enabled = settings.enabledCategories[key];
                  const customCount = key === 'custom' ? settings.customDares.length : 0;

                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 rounded-xl border p-2 transition ${
                        enabled
                          ? 'border-[var(--line-strong)] bg-white/[0.045]'
                          : 'border-[var(--line)] bg-black/15 opacity-60'
                      }`}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/20"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                          color
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[var(--ink)]">{label}</p>
                        <p className="mt-0.5 truncate text-[10px] leading-tight text-[var(--muted-2)]">
                          {key === 'custom' ? `${customCount} saved dares` : description}
                        </p>
                      </div>
                      <Toggle
                        enabled={enabled}
                        onChange={() => toggleCategory(key)}
                        label={`Toggle ${label} dares`}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        <div className="marquee-stripe relative mt-4 overflow-hidden rounded-[1.5rem] border-2 border-[var(--line-strong)] bg-[linear-gradient(110deg,rgba(255,95,178,0.2),rgba(92,225,255,0.12)_48%,rgba(217,255,99,0.16))] p-4 shadow-[0_8px_0_rgba(2,0,10,0.55),0_30px_70px_-42px_rgba(0,0,0,0.95)] sm:p-5">
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="sticker -rotate-2 bg-[var(--ink)] text-[#140b23]">
                Ready?
              </span>
              <div>
                <p className="font-display text-lg leading-none text-[var(--ink)] sm:text-xl">
                  The sky is waiting
                </p>
                <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)] sm:text-[11px]">
                  {players.length} players · {settings.nodeCount} stars ·{' '}
                  {enabledCategoryCount} dare {enabledCategoryCount === 1 ? 'deck' : 'decks'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartGame}
              disabled={players.length < 2}
              className="btn btn-primary w-full px-6 py-4 text-sm sm:w-auto sm:min-w-[16rem]"
            >
              <Play className="h-4 w-4" fill="currentColor" />
              Start the party
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
