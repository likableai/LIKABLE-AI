'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { sendChatMessage, ChatMessageRequest } from '@/lib/api';
import { X, Send, Loader2 } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';

const USAGE_TOAST_DEBOUNCE_MS = 3000;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface TextChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TextChatDrawer: React.FC<TextChatDrawerProps> = ({ isOpen, onClose }) => {
  const { connected, publicKey } = useWallet();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastUsageToastAt = useRef<number>(0);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !connected || !publicKey) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const conversationHistory = messages
        .slice(-4)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const request: ChatMessageRequest = {
        message: userMessage.content,
        walletAddress: publicKey.toString(),
        userTier: 'free',
        conversationHistory,
      };

      const response = await sendChatMessage(request);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const now = Date.now();
      if (response.tokenInfo && now - lastUsageToastAt.current >= USAGE_TOAST_DEBOUNCE_MS) {
        lastUsageToastAt.current = now;
        const cost = response.tokenInfo.cost;
        const remaining = response.tokenInfo.remainingBalance;
        toast.success(`${cost.toFixed(2)} tokens used · ${remaining.toFixed(2)} left`);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.response?.data?.error || 'Failed to send message');
      
      const errorMessage: Message = {
        role: 'assistant',
        content: err.response?.status === 402
          ? 'Insufficient tokens. Please deposit more tokens to continue.'
          : 'Error: Could not reach the AI. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
          backgroundColor: 'var(--bg)',
          borderLeft: '1px solid var(--border-opacity-10)',
          zIndex: 'var(--z-drawer)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--border-opacity-5)' }}
        >
          <h2 
            className="text-xl font-normal"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              color: 'var(--text)'
            }}
          >
            Text Chat
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded transition-colors"
            style={{ 
              color: 'var(--text)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4" 
          style={{ 
            height: 'calc(100% - 160px)',
            maxHeight: '100%'
          }}
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p 
                className="text-sm"
                style={{ 
                  fontFamily: "'Times New Roman', Times, serif",
                  color: 'var(--text-opacity-60)'
                }}
              >
                Begin a conversation with Likable AI
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`rounded-2xl ${
                  msg.role === 'user'
                    ? ''
                    : 'card'
                }`}
                style={{ 
                  fontFamily: "'Times New Roman', Times, serif",
                  backgroundColor: msg.role === 'user' ? 'var(--accent-primary)' : undefined,
                  color: msg.role === 'user' ? 'var(--bg)' : 'var(--text)',
                  padding: msg.role === 'user' ? 'var(--space-2-5) var(--space-4)' : undefined,
                  maxWidth: 'var(--max-width-message)'
                }}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
              </div>
              <span
                className="text-xs mt-1 px-1"
                style={{ 
                  fontFamily: "'Times New Roman', Times, serif",
                  color: 'var(--text-opacity-50)'
                }}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-start">
              <div className="card px-4 py-2.5 rounded-2xl">
                <SkeletonLoader lines={2} />
              </div>
            </div>
          )}

          {error && (
            <div 
              className="p-4 rounded-xl text-sm"
              style={{ 
                fontFamily: "'Times New Roman', Times, serif",
                backgroundColor: 'var(--color-error-bg)',
                border: '1px solid var(--color-error)',
                color: 'var(--color-error-light)'
              }}
            >
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div 
          className="border-t p-4"
          style={{ borderColor: 'var(--border-opacity-5)' }}
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={connected ? "Type your message..." : "Connect wallet to chat..."}
              disabled={loading || !connected}
              className="input flex-1 rounded-full"
              style={{ 
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 'var(--font-sm)'
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !connected || !input.trim()}
              className="btn-primary rounded-full"
              style={{ 
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 'var(--font-sm)',
                padding: 'var(--space-2-5) var(--space-4)'
              }}
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
