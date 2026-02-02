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
      <div className="inline-flex items-center gap-2 px-3 py-1.5 border rounded text-xs opacity-50">
        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span>Calculating...</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 border rounded text-xs opacity-70">
      <DollarSign className="w-3.5 h-3.5" />
      <span>Cost: {cost.costTokens.toFixed(4)} tokens ≈ ${cost.costUsd.toFixed(4)}</span>
    </div>
  );
};
