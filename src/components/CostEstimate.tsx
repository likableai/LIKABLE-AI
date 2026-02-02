'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DollarSign } from 'lucide-react';
import { getApiUrl } from '@/lib/api';

interface CostEstimateProps {
  requestType: 'chat' | 'voice';
}

interface CostData {
  costUsd: number;
  costTokens: number;
  tokenPrice: number;
}

export const CostEstimate: React.FC<CostEstimateProps> = ({ requestType }) => {
  const [cost, setCost] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCost = async () => {
      try {
        const response = await axios.get(
          `${getApiUrl()}/${requestType}/cost`
        );
        setCost(response.data);
      } catch (error) {
        console.error('Failed to fetch cost:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCost();

    const interval = setInterval(fetchCost, 60000);
    return () => clearInterval(interval);
  }, [requestType]);

  if (loading || !cost) {
    return (
      <div
        className="inline-flex items-center rounded text-muted border border-opacity-10"
        style={{
          gap: 'var(--space-2)',
          padding: 'var(--space-1-5) var(--space-3)',
          fontSize: 'var(--font-xs)',
          borderColor: 'var(--border-opacity-10)',
        }}
      >
        <div
          className="border-2 border-current border-t-transparent rounded-full animate-spin"
          style={{ width: 'var(--icon-sm)', height: 'var(--icon-sm)' }}
        />
        <span>Calculating...</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center rounded text-muted border"
      style={{
        gap: 'var(--space-2)',
        padding: 'var(--space-1-5) var(--space-3)',
        fontSize: 'var(--font-xs)',
        opacity: 0.9,
        borderColor: 'var(--border-opacity-10)',
      }}
    >
      <DollarSign style={{ width: 'var(--font-sm)', height: 'var(--font-sm)' }} />
      <span>Cost: {cost.costTokens.toFixed(4)} tokens ≈ ${cost.costUsd.toFixed(4)}</span>
    </div>
  );
};
