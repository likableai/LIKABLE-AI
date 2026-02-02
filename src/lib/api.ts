import axios from 'axios';

/**
 * Normalizes the API URL to always end with /api (without duplication)
 * @param url - The API URL from environment variable or default
 * @returns Normalized URL ending with /api
 */
function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  // Remove trailing slashes
  let normalized = envUrl.replace(/\/+$/, '');
  // Ensure it ends with /api (add if missing, don't duplicate)
  if (!normalized.endsWith('/api')) {
    normalized = `${normalized}/api`;
  }
  return normalized;
}

const API_URL = getApiBaseUrl();

// Export the normalized API URL for use in other components
export const getApiUrl = () => API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple auth token helpers (localStorage-based)
const AUTH_TOKEN_KEY = 'likable_auth_token';

export const setAuthToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (!token) {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } else {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const clearAuthToken = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
};

// Attach Authorization header automatically when token is present
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Voice Session APIs
export interface VoiceSessionConfig {
  walletAddress: string;
  userId?: string;
  voice?: 'Ara' | 'Rex' | 'Sal' | 'Eve' | 'Leo';
  model?: string;
  systemInstructions?: string;
  temperature?: number;
}

export interface VoiceSessionResponse {
  sessionId: string;
  message: string;
  wsUrl: string;
  maxDuration: number;
  estimatedCost: number;
}

export const createVoiceSession = async (config: VoiceSessionConfig): Promise<VoiceSessionResponse> => {
  try {
    const response = await api.post('/voice/session', config);
    return response.data;
  } catch (error: any) {
    // Re-throw with more context for better error handling
    if (error.response) {
      throw {
        ...error,
        response: {
          ...error.response,
          data: {
            ...error.response.data,
            error: error.response.data?.error || error.response.data?.message || 'Voice service error',
            message: error.response.data?.message || error.response.data?.error,
          },
        },
      };
    }
    throw error;
  }
};

export const getVoiceSession = async (sessionId: string) => {
  const response = await api.get(`/voice/session/${sessionId}`);
  return response.data;
};

export const closeVoiceSession = async (sessionId: string, walletAddress?: string) => {
  const config: any = {};
  if (walletAddress) {
    config.data = { walletAddress };
  }
  const response = await api.delete(`/voice/session/${sessionId}`, config);
  return response.data;
};

export const getVoiceCost = async () => {
  const response = await api.get('/voice/cost');
  return response.data;
};

// Chat APIs
export interface ChatMessageRequest {
  message: string;
  walletAddress: string;
  userTier?: 'free' | 'paid';
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userId?: string;
}

export interface ChatMessageResponse {
  reply: string;
  tokenInfo: {
    cost: number;
    costUsd: number;
    remainingBalance: number;
    llmUsage?: {
      inputTokens: number;
      outputTokens: number;
      model: string;
      provider: string;
      intent?: string;
    };
  };
  modelInfo?: {
    selectedModel: string;
    provider: string;
    intent?: string;
  };
}

export const sendChatMessage = async (request: ChatMessageRequest): Promise<ChatMessageResponse> => {
  const response = await api.post('/chat/message', request);
  return response.data;
};

export const getChatCost = async (userTier: 'free' | 'paid' = 'free') => {
  const response = await api.get('/chat/cost', { params: { userTier } });
  return response.data;
};

// Token APIs
export const getTokenBalance = async (walletAddress: string) => {
  const response = await api.get(`/token/balance/${walletAddress}`);
  return response.data;
};

export const getTokenPrice = async () => {
  const response = await api.get('/token/price');
  return response.data;
};

export const getTokenStats = async () => {
  const response = await api.get('/token/stats');
  return response.data;
};

/** Search tokens via Jupiter Ultra API (Explorer). */
export const searchTokens = async (query: string) => {
  const response = await api.get('/token/search', { params: { query } });
  return response.data;
};

/** Usage history for a wallet (for dashboard / tokens-used UI). */
export const getUsageHistory = async (walletAddress: string, limit = 50) => {
  const response = await api.get(`/token/usage-history/${walletAddress}`, { params: { limit } });
  return response.data;
};

/** Record a token deposit after on-chain transfer. Requires verified txHash. */
export interface RecordDepositRequest {
  walletAddress: string;
  amount: number;
  txHash: string;
}
export const recordDeposit = async (payload: RecordDepositRequest) => {
  const response = await api.post('/token/deposit', payload);
  return response.data;
};

/** Scan wallet ATA for recent incoming token transfers; verify and credit new ones. */
export interface ScanDepositsResponse {
  credited: Array<{ txHash: string; amount: number }>;
  alreadyProcessed: number;
}
export const scanDeposits = async (walletAddress: string): Promise<ScanDepositsResponse> => {
  const response = await api.post<ScanDepositsResponse>('/token/deposit/scan', { walletAddress });
  return response.data;
};

// Legacy function for backward compatibility (deprecated)
export const sendMessage = async (message: string, walletAddress: string) => {
  return sendChatMessage({ message, walletAddress });
};

export default api;
