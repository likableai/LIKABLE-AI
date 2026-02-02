'use client';

import React, { useEffect, useRef } from 'react';

interface TranscriptItem {
  text: string;
  isUser: boolean;
  timestamp: number;
}

interface ConversationTranscriptProps {
  transcripts: TranscriptItem[];
  className?: string;
}

export const ConversationTranscript: React.FC<ConversationTranscriptProps> = ({
  transcripts,
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new transcripts arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  if (transcripts.length === 0) {
    return null;
  }

  return (
    <div
      ref={scrollRef}
      className={`flex-1 flex flex-col gap-8 overflow-y-auto ${className}`}
      style={{ 
        padding: 'var(--space-6)',
        maxHeight: '100%'
      }}
    >
      {transcripts.map((item, index) => (
        <div
          key={index}
          className={`flex flex-col ${item.isUser ? 'items-end' : 'items-start'}`}
        >
          {/* Label */}
          <div className="mb-2 px-1">
            <span
              className="text-xs font-normal uppercase tracking-wide"
              style={{ 
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text-opacity-50)'
              }}
            >
              {item.isUser ? 'You' : 'Likable AI'}
            </span>
          </div>

          {/* Message */}
          <div
            className={`rounded-2xl ${
              item.isUser ? '' : 'card'
            }`}
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              backgroundColor: item.isUser ? 'var(--accent-primary)' : undefined,
              color: item.isUser ? 'var(--bg)' : 'var(--text)',
              padding: item.isUser ? 'var(--space-3-5) var(--space-5)' : undefined,
              maxWidth: 'var(--max-width-transcript)'
            }}
          >
            <p
              className="text-base leading-relaxed whitespace-pre-wrap break-words"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              {item.text}
            </p>
          </div>

          {/* Timestamp */}
          <div className="mt-1 px-1">
            <span
              className="text-xs"
              style={{ 
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text-opacity-50)'
              }}
            >
              {new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
