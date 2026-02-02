'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export type ModelOption = 'grok-4-1-fast-non-reasoning' | 'grok-4-1-fast-reasoning';

interface ModelSelectorDropdownProps {
  selectedModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
  disabled?: boolean;
  className?: string;
}

const MODEL_OPTIONS: Array<{ value: ModelOption; label: string; description: string }> = [
  { value: 'grok-4-1-fast-non-reasoning', label: 'Grok 4.1 Fast (Non-Reasoning)', description: 'Faster responses' },
  { value: 'grok-4-1-fast-reasoning', label: 'Grok 4.1 Fast (Reasoning)', description: 'Enhanced reasoning' },
];

export const ModelSelectorDropdown: React.FC<ModelSelectorDropdownProps> = ({
  selectedModel,
  onModelChange,
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

  const selectedOption = MODEL_OPTIONS.find((opt) => opt.value === selectedModel);

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
        aria-label="Select model"
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
            {MODEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onModelChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all rounded-lg"
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  backgroundColor: selectedModel === option.value ? 'var(--dropdown-item-selected-bg)' : 'var(--dropdown-item-bg)',
                  color: selectedModel === option.value ? 'var(--dropdown-item-selected-text)' : 'var(--text)',
                  border: selectedModel === option.value ? `1px solid var(--dropdown-item-selected-border)` : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (selectedModel !== option.value) {
                    e.currentTarget.style.backgroundColor = 'var(--dropdown-item-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedModel !== option.value) {
                    e.currentTarget.style.backgroundColor = 'var(--dropdown-item-bg)';
                  }
                }}
                role="option"
                aria-selected={selectedModel === option.value}
              >
                {selectedModel === option.value && (
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
                      color: selectedModel === option.value ? 'var(--text-opacity-80)' : 'var(--text-opacity-60)'
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
