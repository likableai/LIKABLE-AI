'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useVoiceCompanion } from './VoiceCompanion';
import { VoiceVisualization } from './VoiceVisualization';
import { VisualizationMode } from './VisualizationToggle';
import { ConversationTranscript } from './ConversationTranscript';
import { TextChatDrawer } from './TextChatDrawer';
import { SettingsDrawer } from './SettingsDrawer';
import { AppLayout } from './AppLayout';
import { TokenBalance } from './TokenBalance';
import { WalletButton } from './WalletButton';
import { Mic, Square, Loader2, Radio } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { VoiceOption } from './VoiceSelectorDropdown';
import { ModelOption } from './ModelSelectorDropdown';

export const CompanionInterface: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('character');
  const [isTextChatOpen, setIsTextChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>('Ara');
  const [selectedModel, setSelectedModel] = useState<ModelOption>('grok-4-1-fast-non-reasoning');

  // Open drawers when navigated with a query flag (used by universal mobile nav).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const drawer = params.get('drawer');
    if (drawer === 'chat') setIsTextChatOpen(true);
    if (drawer === 'settings') setIsSettingsOpen(true);
  }, []);

  // Load preferences from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('visualizationMode') as VisualizationMode;
    if (savedMode === 'character' || savedMode === 'waves') {
      setVisualizationMode(savedMode);
    }

    const savedVoice = localStorage.getItem('selectedVoice') as VoiceOption;
    if (savedVoice && ['Ara', 'Rex', 'Sal', 'Eve', 'Leo'].includes(savedVoice)) {
      setSelectedVoice(savedVoice);
    }

    const savedModel = localStorage.getItem('selectedModel') as ModelOption;
    if (savedModel && ['grok-4-1-fast-non-reasoning', 'grok-4-1-fast-reasoning'].includes(savedModel)) {
      setSelectedModel(savedModel);
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('visualizationMode', visualizationMode);
  }, [visualizationMode]);

  useEffect(() => {
    localStorage.setItem('selectedVoice', selectedVoice);
  }, [selectedVoice]);

  useEffect(() => {
    localStorage.setItem('selectedModel', selectedModel);
  }, [selectedModel]);

  const {
    state,
    transcripts,
    startSession,
    closeSession,
    startListening,
    stopListening,
    isConnected,
    audioLevel,
    frequencyData,
  } = useVoiceCompanion({
    voice: selectedVoice,
    model: selectedModel,
    onStateChange: (newState) => {
      if (newState === 'listening') {
        setIsListening(true);
        setErrorMessage(null);
      } else if (newState === 'idle') {
        setIsListening(false);
        setErrorMessage(null);
      } else if (newState === 'error') {
        setIsListening(false);
      }
    },
    onTranscript: (text, isUser) => {
      // Transcripts are automatically added to the transcripts array
    },
    onError: (error) => {
      console.error('Voice companion error:', error);
      setErrorMessage(error);
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  const handleVoiceToggle = async () => {
    if (!connected || !publicKey) {
      return;
    }

    if (!isConnected) {
      setErrorMessage(null);
      try {
        await startSession();
      } catch (error: any) {
        console.error('Failed to start session:', error);
        setErrorMessage(error?.message || 'Failed to start voice session');
      }
    } else if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const hasConversationStarted = transcripts.length > 0;

  return (
    <AppLayout
      onTextChatOpen={() => setIsTextChatOpen(true)}
      onSettingsOpen={() => setIsSettingsOpen(true)}
    >
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        {/* Header - Wallet UI in top right */}
        <header 
          className="flex items-center justify-end gap-3 p-4 flex-shrink-0"
          style={{ 
            zIndex: 'var(--z-header)',
            backgroundColor: 'var(--bg)',
            borderBottom: '1px solid var(--border-opacity-10)'
          }}
        >
          <div className="flex items-center gap-3">
            <TokenBalance />
            <WalletButton />
          </div>
        </header>

        {/* Content Area - reserve space for fixed bottom nav on mobile (safe-area aware) */}
        <div
          className="flex-1 overflow-hidden pb-[max(5rem,calc(5rem+env(safe-area-inset-bottom)))] lg:pb-0"
        >
          <div className={`h-full flex transition-all duration-500 ${
          hasConversationStarted 
            ? 'flex-col lg:flex-row' // Split view when conversation started
            : 'flex-col items-center justify-center' // Centered view initially
        }`}>
          {/* Left Section - Voice Control */}
          <div 
            className={`flex-1 flex flex-col items-center justify-center p-8 lg:p-12 transition-all duration-500 ${
              hasConversationStarted 
                ? 'border-b lg:border-b-0 lg:border-r' 
                : ''
            }`}
            style={{ 
              borderColor: hasConversationStarted ? 'var(--border-opacity-10)' : 'transparent'
            }}
          >
            <div className="w-full max-w-md space-y-8">
              {/* Voice Visualization */}
              <VoiceVisualization
                mode={visualizationMode}
                state={state}
                audioLevel={audioLevel}
                frequencyData={frequencyData}
                className="w-full"
                characterImageUrl="/companioni.jpg"
              />

              {/* Controls */}
              {connected && publicKey ? (
                <div className="space-y-4">
                  <button
                    onClick={handleVoiceToggle}
                    disabled={state === 'connecting' || state === 'error'}
                    className={`w-full rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-primary btn-md ${
                      isListening ? 'btn-danger' : ''
                    }`}
                    style={{ 
                      fontFamily: "'Times New Roman', Times, serif", 
                      fontSize: 'var(--font-base)',
                      boxShadow: isListening ? 'none' : 'var(--shadow-white-sm)'
                    }}
                  >
                    {state === 'connecting' && 'Connecting...'}
                    {state === 'idle' && isConnected && (
                      <>
                        <Radio className="w-5 h-5" />
                        <span>Start Talking</span>
                      </>
                    )}
                    {state === 'idle' && !isConnected && (
                      <>
                        <Radio className="w-5 h-5" />
                        <span>Connect Voice</span>
                      </>
                    )}
                    {isListening && (
                      <>
                        <Square className="w-5 h-5" />
                        <span>Stop Listening</span>
                      </>
                    )}
                    {state === 'processing' && (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    )}
                    {state === 'speaking' && (
                      <>
                        <Radio className="w-5 h-5 animate-pulse" />
                        <span>Speaking...</span>
                      </>
                    )}
                    {state === 'error' && 'Error - Try Again'}
                  </button>

                  {isConnected && (
                    <button
                      onClick={closeSession}
                      className="w-full btn-secondary"
                      style={{ 
                        fontFamily: "'Times New Roman', Times, serif", 
                        fontSize: 'var(--font-sm)'
                      }}
                      aria-label="Disconnect voice session"
                    >
                      <Square className="w-4 h-4" />
                      <span>Disconnect</span>
                    </button>
                  )}
                </div>
              ) : (
                <div 
                  className="p-6 rounded-xl text-center card"
                  style={{ fontFamily: "'Times New Roman', Times, serif" }}
                >
                  <p 
                    className="text-sm"
                    style={{ 
                      fontFamily: "'Times New Roman', Times, serif",
                      color: 'var(--text)'
                    }}
                  >
                    Connect your wallet to start using the voice companion
                  </p>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div 
                  className="p-4 rounded-xl text-center"
                  style={{ 
                    backgroundColor: 'var(--color-error-bg)',
                    border: '1px solid var(--color-error)',
                    fontFamily: "'Times New Roman', Times, serif"
                  }}
                >
                  <p 
                    className="text-sm"
                    style={{ 
                      fontFamily: "'Times New Roman', Times, serif",
                      color: 'var(--color-error-light)'
                    }}
                  >
                    {errorMessage}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Transcript (only show when conversation started) */}
          {hasConversationStarted && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <ConversationTranscript transcripts={transcripts} />
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        visualizationMode={visualizationMode}
        onVisualizationModeChange={setVisualizationMode}
        isSessionActive={isConnected}
      />

      {/* Text Chat Drawer */}
      <TextChatDrawer isOpen={isTextChatOpen} onClose={() => setIsTextChatOpen(false)} />
    </AppLayout>
  );
};
