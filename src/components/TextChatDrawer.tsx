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
      
      const err402 = err.response?.status === 402;
      const errData = err.response?.data;
      const content = err402
        ? (errData?.message || errData?.error || 'Insufficient balance. Deposit at least $1 worth of tokens to use chat.')
        : 'Error: Could not reach the AI. Please try again.';
      const errorMessage: Message = {
        role: 'assistant',
        content,
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
        <div
          className="flex items-center justify-between border-b"
          style={{ padding: 'var(--space-4)', borderColor: 'var(--border-opacity-5)' }}
        >
          <h2 className="page-title text-xl">Text Chat</h2>
          <button
            type="button"
            onClick={onClose}
            className="nav-link rounded-lg p-1.5"
            style={{ padding: 'var(--space-1-5)' }}
            aria-label="Close chat"
          >
            <X style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)' }} />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto drawer-body"
          style={{ padding: 'var(--space-4)', gap: 'var(--space-4)' }}
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center" style={{ padding: 'var(--space-16) 0' }}>
              <p className="page-subtitle text-sm">Begin a conversation with Likable AI</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={msg.role === 'user' ? '' : 'card'}
                style={{
                  borderRadius: 'var(--radius-2xl)',
                  backgroundColor: msg.role === 'user' ? 'var(--accent-primary)' : undefined,
                  color: msg.role === 'user' ? 'var(--bg)' : 'var(--text)',
                  padding: msg.role === 'user' ? 'var(--space-2-5) var(--space-4)' : undefined,
                  maxWidth: 'var(--max-width-message)',
                }}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
              <span className="text-muted text-xs mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-start">
              <div className="card rounded-2xl" style={{ padding: 'var(--space-2-5) var(--space-4)', borderRadius: 'var(--radius-2xl)' }}>
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
