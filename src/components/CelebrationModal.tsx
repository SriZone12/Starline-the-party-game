import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player, DrawnStroke } from '../types/game';
import { Download, Eye, Home, RotateCcw } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { StarlineMark } from './StarlineMark';

interface CelebrationModalProps {
  players: Player[];
  completedStrokes: DrawnStroke[];
  totalDaresCount: number;
  playerDareCounts: Record<string, number>;
  totalNodes: number;
  onPlayAgain: () => void;
  onInspectArt: () => void;
  onExitToHome: () => void;
}

const CONFETTI_COLORS = ['#D9FF63', '#5CE1FF', '#FF5FB2', '#FFD166', '#B08CFF'];

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  players,
  completedStrokes,
  totalDaresCount,
  playerDareCounts,
  totalNodes,
  onPlayAgain,
  onInspectArt,
  onExitToHome
}) => {
  useEffect(() => {
    soundEngine.playVictoryFanfare();

    try {
      confetti({
        particleCount: 110,
        spread: 78,
        origin: { y: 0.58 },
        colors: CONFETTI_COLORS
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 65,
          angle: 58,
          spread: 58,
          origin: { x: 0 },
          colors: CONFETTI_COLORS
        });
        confetti({
          particleCount: 65,
          angle: 122,
          spread: 58,
          origin: { x: 1 },
          colors: CONFETTI_COLORS
        });
      }, 320);

      return () => clearTimeout(timer);
    } catch {}
  }, []);

  const playerStats = players.map(player => {
    const lines = completedStrokes.filter(
      stroke => stroke.playerId === player.id
    ).length;
    const dares = playerDareCounts[player.id] || 0;
    return { player, lines, dares };
  });
  const denseRoster = players.length > 8;

  const handleDownloadSnapshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `starline_art_${Date.now()}.png`;
      link.click();
    } catch {}
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div className="modal-panel relative flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-y-auto p-4 sm:p-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[var(--pink)] opacity-[0.18] blur-[90px]" />
          <div className="absolute -bottom-32 right-0 h-56 w-56 rounded-full bg-[var(--accent)] opacity-[0.1] blur-[90px]" />
        </div>

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="sticker -rotate-2 bg-[var(--lime)] text-[#142000]">
              <StarlineMark className="h-3 w-3" />
              Sky complete
            </span>
            <span className="sticker rotate-1 bg-[var(--gold)] text-[#241500]">GG</span>
          </div>

          <h2
            id="celebration-title"
            className="title-pop mt-4 max-w-md font-display text-3xl leading-[0.95] text-[var(--ink)] sm:text-4xl"
          >
            The sky is yours!
          </h2>
          <p className="mt-3 max-w-md text-sm font-medium leading-6 text-[var(--muted)]">
            Your crew connected all {totalNodes} stars into a one-of-a-kind cosmic mess.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl border-2 border-[rgba(92,225,255,0.34)] bg-[var(--accent-soft)] px-2 py-2.5 text-center shadow-[0_3px_0_rgba(2,0,10,0.35)]">
            <p className="font-display text-2xl leading-none tabular-nums text-[var(--accent)]">
              {totalNodes}
            </p>
            <p className="section-label mt-2">Stars</p>
          </div>
          <div className="rounded-xl border-2 border-[rgba(176,140,255,0.34)] bg-[var(--violet-soft)] px-2 py-2.5 text-center shadow-[0_3px_0_rgba(2,0,10,0.35)]">
            <p className="font-display text-2xl leading-none tabular-nums text-[var(--violet)]">
              {completedStrokes.length}
            </p>
            <p className="section-label mt-2">Lines</p>
          </div>
          <div className="rounded-xl border-2 border-[rgba(255,209,102,0.34)] bg-[var(--gold-soft)] px-2 py-2.5 text-center shadow-[0_3px_0_rgba(2,0,10,0.35)]">
            <p className="font-display text-2xl leading-none tabular-nums text-[var(--gold)]">
              {totalDaresCount}
            </p>
            <p className="section-label mt-2">Dares</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="section-label">Crew scoreboard</p>
            {denseRoster && (
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--muted-2)]">
                L lines · D dares
              </p>
            )}
          </div>
          <div className={`mt-2 grid gap-1.5 ${denseRoster ? 'grid-cols-2 gap-1' : 'grid-cols-1'}`}>
            {playerStats.map(({ player, lines, dares }) => (
              <div
                key={player.id}
                title={`${player.name}: ${lines} ${lines === 1 ? 'line' : 'lines'}, ${dares} ${dares === 1 ? 'dare' : 'dares'}`}
                className={`flex items-center justify-between rounded-xl border border-[var(--line)] bg-black/15 ${
                  denseRoster ? 'gap-2 px-2 py-1' : 'gap-3 px-3 py-1.5'
                }`}
              >
                <div className={`flex min-w-0 items-center ${denseRoster ? 'gap-1.5' : 'gap-2.5'}`}>
                  <span
                    className={`flex shrink-0 items-center justify-center rounded-full border border-white/50 font-display text-[#140b23] ${
                      denseRoster ? 'h-6 w-6 text-[9px]' : 'h-7 w-7 text-[10px]'
                    }`}
                    style={{
                      backgroundColor: player.color,
                      boxShadow: `0 0 12px ${player.glowColor}`
                    }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                  <span className={`truncate font-bold text-[var(--ink)] ${denseRoster ? 'text-xs' : 'text-sm'}`}>
                    {player.name}
                  </span>
                </div>

                <div className={`flex shrink-0 items-center font-semibold tabular-nums text-[var(--muted-2)] ${
                  denseRoster ? 'gap-1 text-[9px]' : 'gap-2 text-[11px]'
                }`}>
                  <span>
                    {lines}{denseRoster ? 'L' : ` ${lines === 1 ? 'line' : 'lines'}`}
                  </span>
                  <span className="text-[var(--line-strong)]">·</span>
                  <span className={`rounded-full border border-[rgba(255,209,102,0.3)] bg-[var(--gold-soft)] text-[var(--gold)] ${
                    denseRoster ? 'px-1 py-0.5' : 'px-1.5 py-0.5'
                  }`}>
                    {dares}{denseRoster ? 'D' : ` ${dares === 1 ? 'dare' : 'dares'}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onPlayAgain}
            className="btn btn-primary w-full px-5 py-3"
          >
            <RotateCcw className="h-4 w-4" />
            Play another round
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onInspectArt}
              className="btn btn-secondary px-3 py-2.5 text-xs"
            >
              <Eye className="h-3.5 w-3.5" />
              Inspect art
            </button>
            <button
              type="button"
              onClick={handleDownloadSnapshot}
              className="btn btn-secondary px-3 py-2.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Save PNG
            </button>
          </div>

          <button
            type="button"
            onClick={onExitToHome}
            className="btn btn-ghost w-full px-4 py-2.5 text-xs"
          >
            <Home className="h-3.5 w-3.5" />
            Back to lobby
          </button>
        </div>
      </div>
    </div>
  );
};
