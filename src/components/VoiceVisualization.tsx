'use client';

import React from 'react';
import { AudioWaveform } from './AudioWaveform';
import { CharacterAvatar } from './CharacterAvatar';
import { VisualizationMode } from './VisualizationToggle';
import { VoiceState } from './VoiceCompanion';

interface VoiceVisualizationProps {
  mode: VisualizationMode;
  state: VoiceState;
  audioLevel: number;
  frequencyData?: Uint8Array;
  className?: string;
  characterImageUrl?: string;
}

export const VoiceVisualization: React.FC<VoiceVisualizationProps> = ({
  mode,
  state,
  audioLevel,
  frequencyData,
  className = '',
  characterImageUrl,
}) => {
  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Visualization Container */}
      <div
        className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-full overflow-hidden transition-all duration-500"
        style={{
          background: mode === 'character' 
            ? 'transparent'
            : 'linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary))',
          boxShadow: state === 'speaking' 
            ? `0 0 60px var(--voice-glow-speaking-strong), 0 0 120px var(--voice-glow-speaking-weak)`
            : state === 'listening'
            ? `0 0 40px var(--voice-glow-listening-strong), 0 0 80px var(--voice-glow-listening-weak)`
            : `0 0 20px var(--voice-glow-idle-strong), 0 0 40px var(--voice-glow-idle-weak)`,
        }}
      >
        {mode === 'character' ? (
          <CharacterAvatar
            state={state === 'connecting' ? 'idle' : state}
            imageUrl={characterImageUrl}
            className="w-full h-full"
          />
        ) : (
          <AudioWaveform
            audioLevel={audioLevel}
            frequencyData={frequencyData}
            state={state}
            className="w-full h-full"
          />
        )}
      </div>

      {/* State Indicator Text */}
      <div className="mt-6 text-center">
        <p
          className="text-sm font-normal uppercase tracking-wider"
          style={{ 
            fontFamily: "'Times New Roman', Times, serif",
            color: state === 'error' ? 'var(--color-error)' : 'var(--text)',
            opacity: state === 'idle' ? 0.7 : 1,
          }}
        >
          {state === 'idle' && 'Ready to talk'}
          {state === 'connecting' && 'Connecting...'}
          {state === 'listening' && 'Listening...'}
          {state === 'processing' && 'Processing...'}
          {state === 'speaking' && 'Speaking...'}
          {state === 'error' && 'Error occurred'}
        </p>
      </div>
    </div>
  );
};
