'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export type VoiceOption = 'Ara' | 'Rex' | 'Sal' | 'Eve' | 'Leo';

interface VoiceSelectorDropdownProps {
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

export const VoiceSelectorDropdown: React.FC<VoiceSelectorDropdownProps> = ({
  selectedVoice,
  onVoiceChange,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = VOICE_OPTIONS.find((opt) => opt.value === selectedVoice);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-4 py-3 text-left flex items-center justify-between transition-all input"
        style={{
          fontFamily: "'Times New Roman', Times, serif",
          borderColor: 'var(--dropdown-border)',
          backgroundColor: 'var(--dropdown-bg)',
          color: 'var(--text)'
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.borderColor = 'var(--border-opacity-15)';
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.borderColor = 'var(--dropdown-border)';
        }}
        aria-label="Select voice"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span 
          className="text-sm leading-none"
          style={{ 
            fontFamily: "'Times New Roman', Times, serif",
            color: 'var(--text)'
          }}
        >
          {selectedOption?.label}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ml-3 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-opacity-60)' }}
        />
      </button>

      {isOpen && !disabled && (
        <div
          className="absolute w-full mt-2 backdrop-blur-md rounded-xl shadow-2xl overflow-y-auto"
          style={{
            zIndex: 'var(--z-dropdown)',
            backgroundColor: 'var(--dropdown-bg)',
            border: '2px solid var(--dropdown-border)',
            maxHeight: '16rem'
          }}
        >
          <div role="listbox" className="p-1.5">
            {VOICE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onVoiceChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all rounded-lg"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  backgroundColor: selectedVoice === option.value ? 'var(--dropdown-item-selected-bg)' : 'var(--dropdown-item-bg)',
                  color: selectedVoice === option.value ? 'var(--dropdown-item-selected-text)' : 'var(--text)',
                  border: selectedVoice === option.value ? `1px solid var(--dropdown-item-selected-border)` : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (selectedVoice !== option.value) {
                    e.currentTarget.style.backgroundColor = 'var(--dropdown-item-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedVoice !== option.value) {
                    e.currentTarget.style.backgroundColor = 'var(--dropdown-item-bg)';
                  }
                }}
                role="option"
                aria-selected={selectedVoice === option.value}
              >
                {selectedVoice === option.value && (
                  <Check 
                    className="w-5 h-5 flex-shrink-0" 
                    style={{ color: 'var(--color-info)' }}
                  />
                )}
                <div className="flex-1">
                  <div 
                    className="text-sm font-semibold"
                    style={{ 
                      fontFamily: "'Times New Roman', Times, serif"
                    }}
                  >
                    {option.label}
                  </div>
                  <div 
                    className="text-xs"
                    style={{ 
                      fontFamily: "'Times New Roman', Times, serif",
                      color: selectedVoice === option.value ? 'var(--text-opacity-80)' : 'var(--text-opacity-60)'
                    }}
                  >
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
