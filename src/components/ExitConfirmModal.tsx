import React from 'react';
import { AlertTriangle, LogOut, Play } from 'lucide-react';

interface ExitConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  onConfirm,
  onCancel
}) => {
  return (
    <div
      className="modal-overlay z-[60]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-confirm-title"
    >
      <div className="modal-panel relative flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col items-center overflow-y-auto p-5 text-center sm:p-6">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-1 rounded-full bg-gradient-to-r from-transparent via-[var(--danger)] to-transparent opacity-80" />

        <span className="sticker rotate-2 bg-[var(--danger)] text-[#24030b]">
          <AlertTriangle className="h-3 w-3" />
          Hold up
        </span>

        <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[rgba(255,107,138,0.42)] bg-[var(--danger-soft)] text-[var(--danger-text)] shadow-[0_3px_0_rgba(2,0,10,0.35)]">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h2
          id="exit-confirm-title"
          className="mt-4 font-display text-2xl leading-tight text-[var(--ink)]"
        >
          Quit the match?
        </h2>
        <p className="mt-2 max-w-xs text-xs leading-5 text-[var(--muted)]">
          This constellation disappears, but your crew and settings will be waiting in
          the lobby.
        </p>

        <div className="mt-5 flex w-full flex-col gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-primary w-full px-5 py-3"
          >
            <Play className="h-4 w-4" fill="currentColor" />
            Keep playing
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-danger w-full px-4 py-2.5 text-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            Quit to lobby
          </button>
        </div>
      </div>
    </div>
  );
};
