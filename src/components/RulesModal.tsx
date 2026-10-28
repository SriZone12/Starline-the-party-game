import React from 'react';
import { X } from 'lucide-react';
import { StarlineMark } from './StarlineMark';

interface RulesModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    number: '1',
    title: 'Take turns in order',
    body: 'Pass the device to the player shown in the header. Your line and active star match that player\'s signature color.'
  },
  {
    number: '2',
    title: 'Drag between numbers',
    body: 'Touch the current star and drag to the target star in ascending order. Release inside the target to complete the line.'
  },
  {
    number: '3',
    title: 'Weave around lines and stars',
    body: 'Bend and steer your line to avoid every drawn line and every star except your start and destination.'
  },
  {
    number: '4',
    title: 'Collisions trigger a dare',
    body: 'If your line crosses another line or touches another star, pause and complete the dare. Then decide whether to connect the stars or try weaving again.',
    danger: true
  },
  {
    number: '5',
    title: 'No losers, only teamwork',
    body: 'Every connection builds the shared constellation. Reach the final star together to complete the round.'
  }
];

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-title"
    >
      <div className="modal-panel flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-y-auto p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="sticker -rotate-2 bg-[var(--accent)] text-[#04202a]">
              <StarlineMark className="h-3 w-3" />
              Field guide
            </span>
            <h2
              id="rules-title"
              className="mt-3 font-display text-2xl leading-none text-[var(--ink)]"
            >
              How to play
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rules"
            className="btn btn-ghost btn-icon -mr-1 -mt-1 border border-[var(--line)] bg-white/[0.05]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {STEPS.map(step => (
            <div
              key={step.number}
              className={`flex items-start gap-3 rounded-xl border p-3 ${
                step.danger
                  ? 'border-[rgba(255,107,138,0.4)] bg-[var(--danger-soft)]'
                  : 'border-[var(--line)] bg-black/15'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 -rotate-3 items-center justify-center rounded-lg border-2 border-black/25 font-display text-xs tabular-nums shadow-[0_2px_0_rgba(2,0,10,0.35)] ${
                  step.danger
                    ? 'bg-[var(--danger)] text-[#24030b]'
                    : 'bg-[var(--lime)] text-[#142000]'
                }`}
              >
                {step.number}
              </span>
              <div>
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="btn btn-primary mt-5 w-full py-3"
        >
          Let&rsquo;s play
        </button>
      </div>
    </div>
  );
};
