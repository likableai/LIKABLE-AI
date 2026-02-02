'use client';

import React from 'react';
import { User, Waves } from 'lucide-react';

export type VisualizationMode = 'character' | 'waves';

interface VisualizationToggleProps {
  mode: VisualizationMode;
  onChange: (mode: VisualizationMode) => void;
  className?: string;
}

export const VisualizationToggle: React.FC<VisualizationToggleProps> = ({
  mode,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={() => onChange('character')}
        className={`flex-1 p-4 border-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-md ${
          mode === 'character'
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/20 scale-[1.02]'
            : 'bg-neutral-800/60 text-neutral-400 border-neutral-700/60 hover:bg-neutral-800 hover:border-neutral-600/80 hover:shadow-lg active:scale-[0.98]'
        }`}
        aria-label="Character mode"
        aria-pressed={mode === 'character'}
      >
        <User className={`w-5 h-5 ${mode === 'character' ? 'text-emerald-300' : 'text-neutral-400'}`} />
        <span className="text-sm font-semibold">Character</span>
      </button>
      <button
        onClick={() => onChange('waves')}
        className={`flex-1 p-4 border-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-md ${
          mode === 'waves'
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/20 scale-[1.02]'
            : 'bg-neutral-800/60 text-neutral-400 border-neutral-700/60 hover:bg-neutral-800 hover:border-neutral-600/80 hover:shadow-lg active:scale-[0.98]'
        }`}
        aria-label="Waves mode"
        aria-pressed={mode === 'waves'}
      >
        <Waves className={`w-5 h-5 ${mode === 'waves' ? 'text-emerald-300' : 'text-neutral-400'}`} />
        <span className="text-sm font-semibold">Waves</span>
      </button>
    </div>
  );
};
