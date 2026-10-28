import React, { useState } from 'react';
import { DareItem } from '../types/game';
import { Plus, RotateCcw, Sparkles, Trash2, X } from 'lucide-react';
import { DEFAULT_DARES } from '../utils/dares';

interface DareEditorModalProps {
  customDares: DareItem[];
  onSaveCustomDares: (dares: DareItem[]) => void;
  onClose: () => void;
}

export const DareEditorModal: React.FC<DareEditorModalProps> = ({
  customDares,
  onSaveCustomDares,
  onClose
}) => {
  const [newDareText, setNewDareText] = useState('');
  const [activeTab, setActiveTab] = useState<'custom' | 'all'>('custom');

  const handleAddDare = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = newDareText.trim();
    if (!trimmed) return;

    const newDare: DareItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category: 'custom',
      text: trimmed,
      isCustom: true
    };

    onSaveCustomDares([newDare, ...customDares]);
    setNewDareText('');
  };

  const handleDeleteDare = (id: string) => {
    onSaveCustomDares(customDares.filter(dare => dare.id !== id));
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset custom dares to defaults?')) {
      onSaveCustomDares([
        {
          id: 'custom_1',
          category: 'custom',
          text: 'Take a silly group selfie with the phone!',
          isCustom: true
        },
        {
          id: 'custom_2',
          category: 'custom',
          text: 'Speak only in questions until your next turn!',
          isCustom: true
        }
      ]);
    }
  };

  const getCategoryLabel = (category: DareItem['category']) => {
    switch (category) {
      case 'party':
        return { label: 'Party', color: 'var(--gold)' };
      case 'physical':
        return { label: 'Action', color: 'var(--danger)' };
      case 'social':
        return { label: 'Social', color: 'var(--accent)' };
      case 'custom':
      default:
        return { label: 'Custom', color: 'var(--violet)' };
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dare-editor-title"
    >
      <div className="modal-panel flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6">
          <div>
            <span className="sticker -rotate-2 bg-[var(--violet)] text-[#170b2b]">
              <Sparkles className="h-3 w-3" />
              Dare deck
            </span>
            <h2
              id="dare-editor-title"
              className="mt-3 font-display text-2xl leading-none text-[var(--ink)]"
            >
              Build your deck
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">
              Add inside jokes. The built-in chaos stays as backup.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dare editor"
            className="btn btn-ghost btn-icon -mr-1 -mt-1 border border-[var(--line)] bg-white/[0.05]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 px-5 pb-3 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`rounded-full border-2 px-3 py-1.5 text-[11px] font-bold transition ${
              activeTab === 'custom'
                ? 'border-[#f3ffc2] bg-[var(--lime)] text-[#142000]'
                : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Custom
            <span className="ml-1.5 tabular-nums opacity-70">{customDares.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`rounded-full border-2 px-3 py-1.5 text-[11px] font-bold transition ${
              activeTab === 'all'
                ? 'border-[rgba(92,225,255,0.6)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Built-in
            <span className="ml-1.5 tabular-nums opacity-70">{DEFAULT_DARES.length}</span>
          </button>
        </div>

        {activeTab === 'custom' && (
          <form onSubmit={handleAddDare} className="flex gap-2 px-5 py-3 sm:px-6">
            <input
              type="text"
              value={newDareText}
              onChange={event => setNewDareText(event.target.value)}
              placeholder="Add a custom dare..."
              maxLength={120}
              className="input min-w-0 flex-1 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={!newDareText.trim()}
              className="btn btn-primary shrink-0 px-4 py-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </form>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-6">
          {activeTab === 'custom' ? (
            customDares.length === 0 ? (
              <div className="mb-2 flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--line-strong)] bg-black/10 px-4 py-10 text-center">
                <Sparkles className="h-6 w-6 text-[var(--violet)]" />
                <p className="text-xs font-semibold text-[var(--muted)]">
                  Deck empty. Add the first cursed prompt above.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 pb-3">
                {customDares.map((dare, index) => (
                  <div
                    key={dare.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-[var(--line)] bg-black/15 px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 -rotate-3 items-center justify-center rounded-md bg-[var(--violet)] font-display text-[9px] tabular-nums text-[#170b2b]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <p className="text-sm leading-5 text-[var(--ink)]">
                        {dare.text}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDare(dare.id)}
                      className="rounded-md p-1.5 text-[var(--muted-2)] transition hover:bg-[var(--danger-soft)] hover:text-[var(--danger-text)]"
                      title="Delete dare"
                      aria-label={`Delete dare: ${dare.text}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-1.5 pb-3">
              {DEFAULT_DARES.map(dare => {
                const badge = getCategoryLabel(dare.category);
                return (
                  <div
                    key={dare.id}
                    className="flex items-start gap-2.5 rounded-xl border border-[var(--line)] bg-black/15 px-3 py-2.5"
                  >
                    <span
                      className="mt-0.5 w-12 shrink-0 rounded-full border border-[var(--line-strong)] px-1.5 py-1 text-center text-[8px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: badge.color }}
                    >
                      {badge.label}
                    </span>
                    <p className="text-sm leading-5 text-[var(--ink)]">
                      {dare.text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-3 sm:px-6">
          {activeTab === 'custom' ? (
            <button
              type="button"
              onClick={handleResetDefaults}
              className="btn btn-ghost px-2 py-2 text-[11px]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset defaults
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary px-5 py-2.5"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
