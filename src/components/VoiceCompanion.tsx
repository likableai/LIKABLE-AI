'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createVoiceSession, closeVoiceSession, getApiUrl } from '@/lib/api';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'error';

export interface UseVoiceCompanionReturn {
  state: VoiceState;
  sessionId: string | null;
  transcripts: Array<{ text: string; isUser: boolean; timestamp: number }>;
  startSession: () => Promise<void>;
  closeSession: () => Promise<void>;
  startListening: () => void;
  stopListening: () => void;
  isConnected: boolean;
  audioLevel: number;
  frequencyData: Uint8Array;
}

export interface UseVoiceCompanionOptions {
  onStateChange?: (state: VoiceState) => void;
  onTranscript?: (text: string, isUser: boolean) => void;
  onError?: (error: string) => void;
  voice?: 'Ara' | 'Rex' | 'Sal' | 'Eve' | 'Leo';
  model?: 'grok-4-1-fast-non-reasoning' | 'grok-4-1-fast-reasoning';
}

export const useVoiceCompanion = (options: UseVoiceCompanionOptions = {}): UseVoiceCompanionReturn => {
  const { connected, publicKey } = useWallet();
  const { onStateChange, onTranscript, onError, voice = 'Ara', model = 'grok-4-1-fast-non-reasoning' } = options;
  
  const [state, setState] = useState<VoiceState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Array<{ text: string; isUser: boolean; timestamp: number }>>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const currentAssistantTranscriptRef = useRef<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackTimeRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const playbackAnalyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const activeAudioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentResponseIdRef = useRef<number>(0);

  const sanitizeTranscript = useCallback((text: string): string => {
    if (!text) return text;
    let sanitized = text.replace(/\bGrok\b/gi, 'Likable');
    sanitized = sanitized.replace(/\bxAI\b/gi, 'Likable');
    sanitized = sanitized.replace(/I am Grok/gi, 'I am Likable');
    sanitized = sanitized.replace(/I'm Grok/gi, "I'm Likable");
    return sanitized;
  }, []);

  const updateState = useCallback((newState: VoiceState) => {
    setState(newState);
    onStateChange?.(newState);
  }, [onStateChange]);

  // Audio level and frequency detection
  const detectAudioLevel = useCallback(() => {
    // Use playback analyser when speaking, input analyser when listening/idle
    const activeAnalyser = state === 'speaking' && playbackAnalyserRef.current 
      ? playbackAnalyserRef.current 
      : analyserRef.current;

    if (!activeAnalyser) {
      return;
    }

    // Only stop if in error state - allow detection in idle/connected state
    if (state === 'error') {
      return;
    }

    const dataArray = new Uint8Array(activeAnalyser.frequencyBinCount);
    activeAnalyser.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 255, 1);
    
    setAudioLevel(normalizedLevel);
    setFrequencyData(new Uint8Array(dataArray));

    // Continue animation frame
    animationFrameRef.current = requestAnimationFrame(detectAudioLevel);
  }, [state]);

  // Initialize audio context and analyser
  const initializeAudio = useCallback(async () => {
    try {
      // Check if we already have a valid AudioContext
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        // AudioContext already exists and is valid, just ensure we have a stream
        if (mediaStreamRef.current) {
          return; // Already initialized
        }
      } else {
        // Reset references when creating a new AudioContext
        playbackAnalyserRef.current = null;
        analyserRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Only create a new AudioContext if we don't have a valid one
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        // Prefer a 24kHz AudioContext to match Grok Voice Agent default PCM rate
        // (helps avoid resampling artifacts / "chipmunk" / "double voice" effects)
        const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
        const audioContext = new AC({ sampleRate: 24000 } as any);
        audioContextRef.current = audioContext;
        playbackTimeRef.current = audioContext.currentTime;
        
        // Reset analyser references when creating new context
        playbackAnalyserRef.current = null;
        analyserRef.current = null;
      }

      const audioContext = audioContextRef.current;

      // Clean up old script processor if it exists
      const oldProcessor = (mediaRecorderRef as any).current;
      if (oldProcessor && typeof oldProcessor.disconnect === 'function') {
        try {
          oldProcessor.disconnect();
        } catch (e) {
          // Already disconnected, ignore
        }
        (mediaRecorderRef as any).current = null;
      }

      // Disconnect old analyser if it exists
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch (e) {
          // Already disconnected, ignore
        }
      }

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      // Create ScriptProcessorNode for PCM16 audio conversion
      // Note: ScriptProcessorNode is deprecated but works for this use case
      // With server_vad, audio streams continuously - the server detects speech automatically
      const bufferSize = 4096;
      const scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      // Grok expects 24kHz, but browser AudioContext is usually 44.1kHz or 48kHz
      const targetSampleRate = 24000;
      const sourceSampleRate = audioContext.sampleRate;
      const resampleRatio = targetSampleRate / sourceSampleRate;
      
      let audioSendCount = 0;
      scriptProcessor.onaudioprocess = (event) => {
        // Always send audio when WebSocket is open (server_vad handles speech detection)
        // Check WebSocket state before processing to avoid errors
        if (wsRef.current?.readyState === WebSocket.OPEN && mediaStreamRef.current) {
          try {
            const inputData = event.inputBuffer.getChannelData(0);
            
            // Resample from source rate to 24kHz (only if needed)
            const resampled =
              sourceSampleRate === targetSampleRate
                ? inputData
                : (() => {
                    const resampledLength = Math.floor(inputData.length * resampleRatio);
                    const out = new Float32Array(resampledLength);
                    // Simple linear interpolation resampling (good enough for speech)
                    for (let i = 0; i < resampledLength; i++) {
                      const srcIndex = i / resampleRatio;
                      const srcIndexFloor = Math.floor(srcIndex);
                      const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
                      const t = srcIndex - srcIndexFloor;
                      out[i] = inputData[srcIndexFloor] * (1 - t) + inputData[srcIndexCeil] * t;
                    }
                    return out;
                  })();
            
            // Convert Float32Array to Int16Array (PCM16)
            const pcm16 = new Int16Array(resampled.length);
            for (let i = 0; i < resampled.length; i++) {
              const s = Math.max(-1, Math.min(1, resampled[i]));
              pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            
            // Convert to base64
            const bytes = new Uint8Array(pcm16.buffer);
            const base64Audio = btoa(String.fromCharCode(...bytes));
            
            audioSendCount++;
            
            // Double-check WebSocket is still open before sending
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'audio',
                data: base64Audio,
              }));
            }
          } catch (err: any) {
            // WebSocket might be closed - silently fail
          }
        }
      };
      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      // Store script processor for cleanup
      (mediaRecorderRef as any).current = scriptProcessor;

      // Start audio level detection
      detectAudioLevel();
    } catch (err) {
      console.error('Error initializing audio:', err);
      updateState('error');
      onError?.('Failed to access microphone. Please check permissions.');
    }
  }, [detectAudioLevel, updateState, onError]);

  // Create voice session and connect WebSocket
  const startSession = useCallback(async () => {
    if (!connected || !publicKey) {
      const error = 'Please connect your wallet first';
      onError?.(error);
      throw new Error(error);
    }

    try {
      updateState('connecting');

      // Initialize audio first
      await initializeAudio();

      // Create voice session
      const session = await createVoiceSession({
        walletAddress: publicKey.toString(),
        voice: voice,
        model: model,
      });

      setSessionId(session.sessionId);

      // Connect WebSocket
      // session.wsUrl already includes /api, so we need the base URL without /api
      const normalizedApiUrl = getApiUrl();
      const baseUrl = normalizedApiUrl.replace(/\/api\/?$/, ''); // Remove trailing /api
      const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
      const wsBaseUrl = baseUrl.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProtocol}://${wsBaseUrl}${session.wsUrl}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        updateState('idle');
        detectAudioLevel();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'audio':
              // Play received PCM16 audio
              if (data.data && audioContextRef.current) {
                try {
                  const responseId = currentResponseIdRef.current;
                  
                  // Decode base64 PCM16 to Float32Array
                  const binaryString = atob(data.data);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const pcm16 = new Int16Array(bytes.buffer);
                  const float32 = new Float32Array(pcm16.length);
                  for (let i = 0; i < pcm16.length; i++) {
                    float32[i] = pcm16[i] / 32768.0;
                  }

                  // Queue playback (prevents overlapping chunks => "multiple voices" / garble)
                  const audioContext = audioContextRef.current;
                  const sampleRate = 24000; // Match Grok API config
                  const audioBuffer = audioContext.createBuffer(1, float32.length, sampleRate);
                  audioBuffer.copyToChannel(float32, 0);

                  // Create analyser for playback audio visualization
                  // Verify it belongs to the current AudioContext, recreate if needed
                  if (!playbackAnalyserRef.current || playbackAnalyserRef.current.context !== audioContext) {
                    // Disconnect old analyser if it exists and belongs to a different context
                    if (playbackAnalyserRef.current && playbackAnalyserRef.current.context !== audioContext) {
                      try {
                        playbackAnalyserRef.current.disconnect();
                      } catch (e) {
                        // Already disconnected, ignore
                      }
                    }
                    const playbackAnalyser = audioContext.createAnalyser();
                    playbackAnalyser.fftSize = 256;
                    playbackAnalyserRef.current = playbackAnalyser;
                    // Connect analyser to destination once when created
                    playbackAnalyserRef.current.connect(audioContext.destination);
                  }

                  const source = audioContext.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(playbackAnalyserRef.current);

                  // Track this source and remove when done
                  activeAudioSourcesRef.current.add(source);
                  source.onended = () => {
                    activeAudioSourcesRef.current.delete(source);
                    // Only update state if this is still the current response
                    if (responseId === currentResponseIdRef.current && activeAudioSourcesRef.current.size === 0) {
                      updateState('idle');
                    }
                  };

                  // Schedule sequential playback
                  const now = audioContext.currentTime;
                  const startAt = Math.max(playbackTimeRef.current, now + 0.02); // small jitter buffer
                  
                  // Only start if this is still the current response
                  if (responseId === currentResponseIdRef.current) {
                    source.start(startAt);
                    playbackTimeRef.current = startAt + audioBuffer.duration;
                    updateState('speaking');
                  } else {
                    // This audio is from an old response, don't play it
                    activeAudioSourcesRef.current.delete(source);
                  }
                } catch (err) {
                  console.error('Error playing audio:', err);
                }
              }
              break;

            case 'transcript':
              // Assistant transcript delta - accumulate text
              if (data.text) {
                const delta = sanitizeTranscript(data.text);
                currentAssistantTranscriptRef.current += delta;
                // Update the last assistant transcript or create new one
                setTranscripts((prev) => {
                  const newTranscripts = [...prev];
                  const lastIndex = newTranscripts.length - 1;
                  if (lastIndex >= 0 && !newTranscripts[lastIndex].isUser) {
                    // Update existing assistant transcript
                    newTranscripts[lastIndex] = {
                      ...newTranscripts[lastIndex],
                      text: currentAssistantTranscriptRef.current,
                    };
                  } else {
                    // Create new assistant transcript
                    newTranscripts.push({
                      text: currentAssistantTranscriptRef.current,
                      isUser: false,
                      timestamp: Date.now(),
                    });
                  }
                  return newTranscripts;
                });
                onTranscript?.(delta, false);
              }
              break;

            case 'transcript_done':
              // Assistant transcript complete - finalize it
              currentAssistantTranscriptRef.current = '';
              break;

            case 'user_transcript':
              // User's transcribed audio (from conversation.item.input_audio_transcription.completed)
              if (data.text) {
                // Cancel any ongoing audio playback when user speaks
                activeAudioSourcesRef.current.forEach(source => {
                  try {
                    source.stop();
                  } catch (e) {
                    // Source may already be stopped
                  }
                });
                activeAudioSourcesRef.current.clear();
                playbackTimeRef.current = audioContextRef.current?.currentTime || 0;
                
                // Increment response ID to invalidate old responses
                currentResponseIdRef.current++;
                
                // Reset assistant transcript accumulator when user speaks
                currentAssistantTranscriptRef.current = '';
                
                // Remove any incomplete assistant transcripts
                setTranscripts((prev) => {
                  const filtered = prev.filter(t => t.isUser || t.text.trim().length > 0);
                  return [...filtered, { text: data.text, isUser: true, timestamp: Date.now() }];
                });
                onTranscript?.(data.text, true);
              }
              break;

            case 'speech_started':
              updateState('listening');
              break;

            case 'speech_stopped':
              updateState('processing');
              break;

            case 'response_created':
              // Cancel any ongoing audio playback when new response starts
              activeAudioSourcesRef.current.forEach(source => {
                try {
                  source.stop();
                } catch (e) {
                  // Source may already be stopped
                }
              });
              activeAudioSourcesRef.current.clear();
              playbackTimeRef.current = audioContextRef.current?.currentTime || 0;
              
              // Increment response ID to invalidate old responses
              currentResponseIdRef.current++;
              
              // Clear incomplete assistant transcript
              currentAssistantTranscriptRef.current = '';
              
              // Remove any incomplete assistant transcripts
              setTranscripts((prev) => prev.filter(t => t.isUser || t.text.trim().length > 0));
              
              updateState('speaking');
              break;

            case 'response_done':
              // Wait for all audio sources to finish before going to idle
              // The onended handler will update state when all sources are done
              if (activeAudioSourcesRef.current.size === 0 && audioContextRef.current) {
                playbackTimeRef.current = audioContextRef.current.currentTime;
                updateState('idle');
              }
              break;

            case 'error':
              // Don't show "Session disconnected" as an error if it's a clean close
              const errorMsg = data.message || 'An error occurred';
              if (errorMsg === 'Session disconnected' && wsRef.current?.readyState === WebSocket.CLOSING) {
                // Session is already closing, just update state
                updateState('idle');
                setSessionId(null);
              } else {
                updateState('error');
                onError?.(errorMsg);
              }
              break;
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateState('error');
        onError?.('Connection error. Please try again.');
      };

      ws.onclose = (event) => {
        // Code 1000 = normal closure, 1001 = going away (server-initiated but expected)
        // Only treat unexpected closes as errors
        if (event.code !== 1000 && event.code !== 1001) {
          updateState('error');
          onError?.('Connection lost. Please reconnect.');
          setSessionId(null);
        } else {
          // Expected close - reset to idle
          updateState('idle');
          setSessionId(null);
        }
      };

      wsRef.current = ws;
    } catch (err: any) {
      console.error('Error starting session:', err);
      updateState('error');
      
      // Handle specific error cases
      if (err.response?.status === 503) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Voice service not configured';
        onError?.(errorMessage);
      } else if (err.response?.status === 402) {
        const errorMessage = err.response?.data?.error || 'Insufficient tokens';
        onError?.(errorMessage);
      } else {
        const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to start voice session';
        onError?.(errorMessage);
      }
    }
  }, [connected, publicKey, initializeAudio, updateState, onError, onTranscript, state, voice, model]);

  // Start/stop listening (with server_vad, these are mostly for UI state)
  const startListening = useCallback(() => {
    // With server_vad, audio is already streaming
    // This is just for UI feedback - the server will detect speech automatically
    if (state === 'idle' && wsRef.current?.readyState === WebSocket.OPEN) {
      detectAudioLevel();
    }
  }, [state, detectAudioLevel]);

  const stopListening = useCallback(() => {
    // With server_vad, we don't manually commit - the server does it automatically
    // This is just for UI state
    if (state === 'listening') {
      updateState('idle');
    }
  }, [state, updateState]);

  // Close session and cleanup
  const closeSession = useCallback(async () => {
    // Stop audio stream first (stops sending new audio)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Disconnect script processor (stops audio processing)
    const processor = (mediaRecorderRef as any).current;
    if (processor && typeof processor.disconnect === 'function') {
      try {
        processor.disconnect();
      } catch (err) {
        // Ignore errors
      }
      (mediaRecorderRef as any).current = null;
    }

    // Close WebSocket (with proper close code)
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      try {
        wsRef.current.close(1000, 'User disconnected');
      } catch (err) {
        console.error('Error closing WebSocket:', err);
      }
      wsRef.current = null;
    }

    // Close backend session
    const currentSessionId = sessionId;
    if (currentSessionId && publicKey) {
      try {
        await closeVoiceSession(currentSessionId, publicKey.toString());
      } catch (err) {
        console.error('Error closing voice session:', err);
      }
    }

    // Close audio context (after stopping streams)
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        await audioContextRef.current.close();
      } catch (err) {
        console.error('Error closing audio context:', err);
      }
      audioContextRef.current = null;
    }

    // Reset analyser references
    playbackAnalyserRef.current = null;
    analyserRef.current = null;

    // Stop all active audio sources
    activeAudioSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Source may already be stopped
      }
    });
    activeAudioSourcesRef.current.clear();
    
    // Reset state
    setSessionId(null);
    updateState('idle');
    setTranscripts([]);
    currentAssistantTranscriptRef.current = '';
    currentResponseIdRef.current = 0;
    
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [sessionId, publicKey, updateState]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close().catch(console.error);
        } catch (err) {
          // AudioContext might already be closed, ignore error
        }
      }
      // Disconnect script processor
      const processor = (mediaRecorderRef as any).current;
      if (processor && typeof processor.disconnect === 'function') {
        try {
          processor.disconnect();
        } catch (err) {
          // Ignore errors
        }
      }
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close();
      }
      // Close session on unmount
      const currentSessionId = sessionId;
      if (currentSessionId && publicKey) {
        closeVoiceSession(currentSessionId, publicKey.toString()).catch(console.error);
      }
    };
    // Only run cleanup on unmount, not when sessionId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = only on unmount

  return {
    state,
    sessionId,
    transcripts,
    startSession,
    closeSession,
    startListening,
    stopListening,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    audioLevel,
    frequencyData: frequencyData || new Uint8Array(0),
  };
};
