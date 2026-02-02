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
        <button
          type="button"
          onClick={onClose}
          className="nav-link absolute flex items-center justify-center rounded-lg transition-colors"
          style={{
            top: 'var(--space-4)',
            right: 'var(--space-4)',
            width: 'var(--space-8)',
            height: 'var(--space-8)',
            color: 'var(--text-opacity-60)',
          }}
          aria-label="Close settings"
        >
          <X style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)' }} />
        </button>

        <div className="h-full overflow-y-auto" style={{ padding: 'var(--space-8) var(--space-6)' }}>
          <section className="section-spacing">
            <h3 className="section-title mb-4">Voice</h3>
            <VoiceSelectorDropdown
              selectedVoice={selectedVoice}
              onVoiceChange={onVoiceChange}
              disabled={isSessionActive}
            />
          </section>

          <section className="section-spacing">
            <h3 className="section-title mb-4">Model</h3>
            <ModelSelectorDropdown
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              disabled={isSessionActive}
            />
          </section>

          <section className="section-spacing">
            <h3 className="section-title mb-4">Display Mode</h3>
            <div className="mb-3" style={{ marginBottom: 'var(--space-3)' }}>
              <VisualizationToggle
                mode={visualizationMode}
                onChange={onVisualizationModeChange}
              />
            </div>
            <p className="text-muted text-xs mt-2">
              {visualizationMode === 'character'
                ? 'Showing character avatar and expressions'
                : 'Showing audio waveform visualization'}
            </p>
          </section>

          {/* Session Active Banner */}
          {isSessionActive && (
            <div
              className="section-spacing flex items-center gap-3 rounded-lg"
              style={{
                padding: 'var(--space-3) var(--space-4)',
                gap: 'var(--space-3)',
                backgroundColor: 'var(--color-warning-bg)',
                border: '1px solid var(--color-warning)',
              }}
            >
              <div
                className="animate-pulse flex-shrink-0 rounded-full"
                style={{ width: 'var(--space-2)', height: 'var(--space-2)', backgroundColor: 'var(--color-warning)' }}
              />
              <span className="section-title text-sm" style={{ color: 'var(--color-warning-light)' }}>
                Session active
              </span>
            </div>
          )}

          <div
            className="sticky bottom-0 flex justify-end border-t"
            style={{
              paddingTop: 'var(--space-8)',
              paddingBottom: 'var(--space-6)',
              marginTop: 'var(--space-8)',
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-opacity-10)',
            }}
          >
            <button type="button" onClick={onClose} className="btn-secondary">
              Save changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
