import React from 'react';
import { Player } from '../types/game';
import { ArrowRight, HelpCircle, LogOut, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { StarlineMark } from './StarlineMark';

interface TurnHeaderProps {
  activePlayer: Player;
  currentNode: number;
  targetNode: number;
  totalNodes: number;
  completedStrokesCount: number;
  daresTriggeredCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onUndoLastStroke: () => void;
  canUndo: boolean;
  onExitToHome: () => void;
  onOpenRules: () => void;
}

export const TurnHeader: React.FC<TurnHeaderProps> = ({
  activePlayer,
  currentNode,
  targetNode,
  totalNodes,
  completedStrokesCount,
  daresTriggeredCount,
  soundEnabled,
  onToggleSound,
  onUndoLastStroke,
  canUndo,
  onExitToHome,
  onOpenRules
}) => {
  const progressPercent = Math.min(
    100,
    Math.round((completedStrokesCount / Math.max(1, totalNodes - 1)) * 100)
  );

  return (
    <header
      className="pointer-events-auto fixed inset-x-0 top-0 z-30 select-none border-b-2 border-[var(--line)] bg-[rgba(14,7,39,0.92)] backdrop-blur-xl"
      style={{
        backgroundImage: `radial-gradient(ellipse 38% 190% at 0% 50%, ${activePlayer.color}38, transparent 72%)`
      }}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-2.5 sm:gap-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <StarlineMark className="hidden h-6 w-6 shrink-0 text-[var(--lime)] sm:block" />

          <div
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/80 font-display text-sm text-[#140b23] shadow-[0_3px_0_rgba(2,0,10,0.5)]"
            style={{
              backgroundColor: activePlayer.color,
              boxShadow: `0 0 24px ${activePlayer.glowColor}, 0 3px 0 rgba(2,0,10,0.5)`
            }}
            aria-hidden="true"
          >
            {activePlayer.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex min-w-0 flex-col">
            <span className="text-[9px] font-bold uppercase leading-none tracking-[0.18em] text-[var(--lime)]">
              Your turn
            </span>
            <span className="mt-1 max-w-[76px] truncate text-sm font-bold leading-none text-[var(--ink)] sm:max-w-[180px] sm:text-base">
              {activePlayer.name}
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-xl border-2 border-[var(--line)] bg-black/25 px-3 py-1.5 md:flex">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--muted-2)]">
            Connect
          </span>
          <span
            className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg border border-white/30 px-1.5 font-display text-xs tabular-nums text-[#140b23]"
            style={{ backgroundColor: activePlayer.color }}
          >
            {currentNode}
          </span>
          <ArrowRight className="h-4 w-4 text-[var(--pink)]" />
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg border border-white/30 bg-[var(--gold)] px-1.5 font-display text-xs tabular-nums text-[#241500]">
            {targetNode}
          </span>
          <span className="text-[11px] font-semibold tabular-nums text-[var(--muted-2)]">
            / {totalNodes}
          </span>
          {daresTriggeredCount > 0 && (
            <span className="ml-1 rounded-full border border-[rgba(255,95,178,0.36)] bg-[var(--pink-soft)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--pink)]">
              {daresTriggeredCount} {daresTriggeredCount === 1 ? 'dare' : 'dares'}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
            title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
            className={`btn btn-ghost btn-icon border border-[var(--line)] bg-white/[0.05] hover:bg-white/10 ${
              soundEnabled ? 'text-[var(--lime)]' : 'text-[var(--muted-2)]'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onUndoLastStroke}
            disabled={!canUndo}
            aria-label="Undo last stroke"
            title="Undo last stroke"
            className="btn btn-ghost btn-icon border border-[var(--line)] bg-white/[0.05] text-[var(--muted)] hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onOpenRules}
            aria-label="How to play"
            title="How to play"
            className="btn btn-ghost btn-icon border border-[var(--line)] bg-white/[0.05] text-[var(--muted)] hover:bg-white/10"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onExitToHome}
            aria-label="Exit game to home lobby"
            title="Exit game to home lobby"
            className="btn btn-ghost btn-icon border border-[var(--line)] bg-white/[0.05] text-[var(--muted-2)] hover:border-[rgba(255,107,138,0.5)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger-text)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="h-1.5 w-full bg-black/35">
        <div
          className="h-full bg-[linear-gradient(90deg,var(--pink),var(--gold),var(--lime))] shadow-[0_0_16px_rgba(217,255,99,0.55)] transition-[width] duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  );
};
