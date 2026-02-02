'use client';

import React from 'react';

interface UsageSummaryProps {
  consumedAmount: number;
  tokenPrice?: number;
}

export const UsageSummary: React.FC<UsageSummaryProps> = ({
  consumedAmount,
  tokenPrice = 0,
}) => {
  const usdValue = tokenPrice > 0 ? consumedAmount * tokenPrice : 0;

  return (
    <div
      className="card"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <p 
        className="text-sm font-medium"
        style={{ 
          fontFamily: "'Times New Roman', Times, serif",
          color: 'var(--text-opacity-90)'
        }}
      >
        Tokens used
      </p>
      <p 
        className="mt-1 text-lg font-normal"
        style={{ 
          fontFamily: "'Times New Roman', Times, serif",
          color: 'var(--text)'
        }}
      >
        {consumedAmount.toFixed(2)}
        <span 
          className="ml-1.5 text-sm"
          style={{ color: 'var(--text-opacity-60)' }}
        >
          tokens
        </span>
      </p>
      {usdValue > 0 && (
        <p 
          className="mt-0.5 text-sm"
          style={{ 
            fontFamily: "'Times New Roman', Times, serif",
            color: 'var(--text-opacity-60)'
          }}
        >
          ≈ ${usdValue.toFixed(2)}
        </p>
      )}
    </div>
  );
};
