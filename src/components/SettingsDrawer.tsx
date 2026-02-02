'use client';

import React from 'react';
import { X } from 'lucide-react';
import { VoiceSelectorDropdown, VoiceOption } from './VoiceSelectorDropdown';
import { VisualizationToggle, VisualizationMode } from './VisualizationToggle';
import { ModelSelectorDropdown, ModelOption } from './ModelSelectorDropdown';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: VoiceOption;
  onVoiceChange: (voice: VoiceOption) => void;
  selectedModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
  visualizationMode: VisualizationMode;
  onVisualizationModeChange: (mode: VisualizationMode) => void;
  isSessionActive: boolean;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  selectedVoice,
  onVoiceChange,
  selectedModel,
  onModelChange,
  visualizationMode,
  onVisualizationModeChange,
  isSessionActive,
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="drawer-backdrop"
          onClick={onClose}
          aria-hidden="true"
          style={{ zIndex: 'var(--z-drawer-backdrop)' }}
        />
      )}

      {/* Drawer */}
      <div
        className={`drawer-content ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ 
          backgroundColor: 'var(--bg-secondary)',
          zIndex: 'var(--z-drawer)'
        }}
      >
        {/* Close Button - Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded transition-colors"
          style={{ 
            color: 'var(--text-opacity-60)',
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text)';
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-opacity-60)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Close settings"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="h-full overflow-y-auto px-6 py-8">
          {/* Voice Section */}
          <section className="mb-10">
            <h3 
              className="text-sm font-medium mb-4"
              style={{ 
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text)'
              }}
            >
              Voice
            </h3>
            <VoiceSelectorDropdown
              selectedVoice={selectedVoice}
              onVoiceChange={onVoiceChange}
              disabled={isSessionActive}
            />
          </section>

          {/* Model Section */}
          <section className="mb-10">
            <h3 
              className="text-sm font-medium mb-4"
              style={{ 
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text)'
              }}
            >
              Model
            </h3>
            <ModelSelectorDropdown
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              disabled={isSessionActive}
            />
          </section>

          {/* Visualization Section */}
          <section className="mb-10">
            <h3 
              className="text-sm font-medium mb-4"
              style={{ 
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text)'
              }}
            >
              Display Mode
            </h3>
            <div className="mb-3">
              <VisualizationToggle
                mode={visualizationMode}
                onChange={onVisualizationModeChange}
              />
            </div>
            <p 
              className="text-xs mt-2"
              style={{ 
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text-opacity-60)'
              }}
            >
              {visualizationMode === 'character'
                ? 'Showing character avatar and expressions'
                : 'Showing audio waveform visualization'}
            </p>
          </section>

          {/* Session Active Banner */}
          {isSessionActive && (
            <div 
              className="mb-10 flex items-center gap-3 px-4 py-3"
              style={{ 
                backgroundColor: 'var(--color-warning-bg)',
                border: '1px solid var(--color-warning)'
              }}
            >
              <div 
                className="w-2 h-2 animate-pulse flex-shrink-0 rounded-full"
                style={{ backgroundColor: 'var(--color-warning)' }}
              />
              <span 
                className="text-sm font-medium"
                style={{ 
                  fontFamily: "'Times New Roman', Times, serif",
                  color: 'var(--color-warning-light)'
                }}
              >
                Session active
              </span>
            </div>
          )}

          {/* Footer Actions */}
          <div 
            className="sticky bottom-0 pt-8 pb-6 mt-8"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-opacity-10)'
            }}
          >
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="btn-secondary"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
