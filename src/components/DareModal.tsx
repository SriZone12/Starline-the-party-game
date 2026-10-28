import React, { useState } from 'react';
import { Player, DareItem } from '../types/game';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Flame,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Star
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface DareModalProps {
  player: Player;
  nextPlayer: Player;
  dare: DareItem;
  fromNode: number;
  toNode: number;
  onConfirmMatchNodes: () => void;
  onDeclineMatchNodes: (passTurnToNext: boolean) => void;
  onSwapDare: () => void;
  allowSwap: boolean;
}

export const DareModal: React.FC<DareModalProps> = ({
  player,
  nextPlayer,
  dare,
  fromNode,
  toNode,
  onConfirmMatchNodes,
  onDeclineMatchNodes,
  onSwapDare,
  allowSwap
}) => {
  const [step, setStep] = useState<'DARE' | 'MATCH_DECISION'>('DARE');

  const getCategoryInfo = (category: DareItem['category']) => {
    switch (category) {
      case 'party':
        return { label: 'Party', icon: Flame, color: 'var(--gold)' };
      case 'physical':
        return { label: 'Action', icon: Activity, color: 'var(--danger)' };
      case 'social':
        return { label: 'Social', icon: MessageCircle, color: 'var(--accent)' };
      case 'custom':
      default:
        return { label: 'Custom', icon: Star, color: 'var(--violet)' };
    }
  };

  const category = getCategoryInfo(dare.category);
  const Icon = category.icon;

  const handleFinishDare = () => {
    soundEngine.playDareCompleted();
    setStep('MATCH_DECISION');
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dare-title"
    >
      <div className="modal-panel relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[30rem] flex-col overflow-y-auto p-5 sm:p-7">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-1 rounded-full bg-gradient-to-r from-transparent via-[var(--pink)] to-transparent opacity-80" />

        {step === 'DARE' ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="sticker -rotate-2 bg-[var(--pink)] text-[#21051a]">
                <Flame className="h-3 w-3" fill="currentColor" />
                Dare unlocked
              </span>
              <span className="rounded-full border border-[var(--line)] bg-black/25 px-2 py-1 font-display text-[10px] tabular-nums text-[var(--gold)]">
                {fromNode} → {toNode}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white/80 font-display text-sm text-[#140b23]"
                style={{
                  backgroundColor: player.color,
                  boxShadow: `0 0 24px ${player.glowColor}, 0 3px 0 rgba(2,0,10,0.45)`
                }}
              >
                {player.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <h2 id="dare-title" className="font-display text-xl leading-tight text-[var(--ink)]">
                  Line collision.
                </h2>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  {player.name} hit another line or star. Complete the dare to keep the sky alive.
                </p>
              </div>
            </div>

            <div className="my-5 rounded-2xl border-2 border-[var(--line-strong)] bg-black/25 p-4 shadow-[0_4px_0_rgba(2,0,10,0.35)] sm:my-6 sm:p-5">
              <div
                className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{
                  color: category.color,
                  borderColor: `color-mix(in srgb, ${category.color} 38%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${category.color} 10%, transparent)`
                }}
              >
                <Icon className="h-3 w-3" />
                {category.label}
              </div>
              <p className="mt-3 text-xl font-bold leading-snug tracking-[-0.015em] text-[var(--ink)] sm:text-2xl">
                &ldquo;{dare.text}&rdquo;
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleFinishDare}
                className="btn btn-primary w-full px-5 py-3"
              >
                <CheckCircle2 className="h-4 w-4" />
                Dare done
              </button>

              {allowSwap && (
                <button
                  type="button"
                  onClick={onSwapDare}
                  className="btn btn-secondary w-full px-4 py-2.5 text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Swap the dare
                </button>
              )}
            </div>

            <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-2)] sm:mt-4">
              Finish it together. Then lock in your line.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="sticker rotate-1 bg-[var(--lime)] text-[#142000]">
                <CheckCircle2 className="h-3 w-3" />
                Dare cleared
              </span>
              <span className="section-label">Pick your move</span>
            </div>

            <h2
              id="dare-title"
              className="mt-5 font-display text-2xl leading-tight text-[var(--ink)]"
            >
              Lock in the line?
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
              The dare is done. Connect these stars now, or send the phone on and try a
              different route later.
            </p>

            <div className="my-5 flex items-center justify-center gap-3 rounded-2xl border-2 border-[var(--line-strong)] bg-black/25 p-4 shadow-[0_4px_0_rgba(2,0,10,0.35)]">
              <span
                className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border-2 border-white/40 px-2 font-display text-base tabular-nums text-[#140b23]"
                style={{ backgroundColor: player.color }}
              >
                {fromNode}
              </span>
              <ArrowRight className="h-5 w-5 text-[var(--pink)]" />
              <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border-2 border-white/40 bg-[var(--gold)] px-2 font-display text-base tabular-nums text-[#241500]">
                {toNode}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onConfirmMatchNodes}
                className="btn btn-primary w-full px-5 py-3"
              >
                <CheckCircle2 className="h-4 w-4" />
                Connect {fromNode} → {toNode}
              </button>

              <button
                type="button"
                onClick={() => onDeclineMatchNodes(false)}
                className="btn btn-secondary w-full px-4 py-2.5 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Weave again as {player.name}
              </button>

              <button
                type="button"
                onClick={() => onDeclineMatchNodes(true)}
                className="btn btn-ghost w-full px-4 py-2.5 text-xs"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Pass to {nextPlayer.name}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
