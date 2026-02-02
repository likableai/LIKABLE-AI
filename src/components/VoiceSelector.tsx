'use client';

import React from 'react';
import { Check } from 'lucide-react';

export type VoiceOption = 'Ara' | 'Rex' | 'Sal' | 'Eve' | 'Leo';

interface VoiceSelectorProps {
  selectedVoice: VoiceOption;
  onVoiceChange: (voice: VoiceOption) => void;
  disabled?: boolean;
  className?: string;
}

const VOICE_OPTIONS: Array<{ value: VoiceOption; label: string; description: string }> = [
  { value: 'Ara', label: 'Ara', description: 'Warm, friendly' },
  { value: 'Rex', label: 'Rex', description: 'Confident, clear' },
  { value: 'Sal', label: 'Sal', description: 'Smooth, balanced' },
  { value: 'Eve', label: 'Eve', description: 'Energetic, upbeat' },
  { value: 'Leo', label: 'Leo', description: 'Authoritative, strong' },
];

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onVoiceChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
        Voice
      </label>
      <div className="flex flex-wrap gap-2">
        {VOICE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => !disabled && onVoiceChange(option.value)}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
            } ${
              selectedVoice === option.value
                ? ''
                : ''
            }`}
            style={
              selectedVoice === option.value
                ? {
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    color: 'white',
                    boxShadow: 'var(--shadow-md)',
                  }
                : {
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(var(--blur-md))',
                    WebkitBackdropFilter: 'blur(var(--blur-md))',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text)',
                  }
            }
          >
            {selectedVoice === option.value && <Check className="w-4 h-4" />}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs opacity-60" style={{ color: 'var(--text-secondary)' }}>
        {VOICE_OPTIONS.find((v) => v.value === selectedVoice)?.description}
      </p>
    </div>
  );
};
