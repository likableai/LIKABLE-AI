AI COMPANION WITH DEEPSEEK & GROK
Complete Technical Architecture

STAGE 0 — FIRST PRINCIPLES (Do This)
0.1 Define AI Boundaries (Non-Negotiable)
Your AI DOES:
Explains charts (RSI, MACD, trends, support/resistance)
Discusses scenarios and probabilities
Helps users emotionally process losses and discussion patnerand can assist in getting information from x
Teaches risk management concepts
Your AI DOES NOT:
Say "buy", "sell", "enter now"
Predict exact prices
Act as a financial advisor
0.2 Cost Guardrails (Critical with DeepSeek/Grok)
Before writing code, define:
Max voice session length: 2-3 minutes
Max response length: 120-180 words
Context window policy: Aggressive truncation
Free vs paid caps: Set hard limits
Model routing: DeepSeek for cheap, Grok for complex
If this isn't documented, you WILL overspend.
STAGE 1 — TECH STACK (Boring = Strong)
Backend
Node.js with Express.js
MongoDB for caching (session + token usage)
MongoDB for persistence (users, wallets, usage logs)
Frontend
Next.js (App Router)
Tailwind CSS
Web Audio API (voice capture & playback)
AI & Voice Stack (DeepSeek/Grok Integration)
Text Chat:
DeepSeek V3 (primary - $0.27/M input, $1.10/M output)
Grok-4.1 (complex analysis - higher cost)
Smart routing based on query complexity
Voice Processing:
Grok Voice Agent WebSocket API (all voice interactions)
Handles STT, LLM, and TTS in one real-time session
Low latency bidirectional audio streaming
Critical Separation: Text chat ≠ Voice processing (unified via Grok Voice Agent)

STAGE 2 — SYSTEM ARCHITECTURE
Voice Flow (Grok Voice Agent)
User speaks
  → Frontend records audio (Web Audio API)
  → Backend → Grok Voice Agent WebSocket
  → Real-time bidirectional audio streaming
  → Grok Voice Agent handles STT, LLM, TTS automatically
  → Audio streamed back in real-time
Text Flow
User types
  → Backend → DeepSeek/Grok LLM (routed by intent)
  → Response → Frontend
Voice and text are separate: Voice uses Grok Voice Agent, text uses DeepSeek/Grok chat APIs.

STAGE 3 — PROJECT STRUCTURE
Backend Structure
/src
  /api
    auth.routes.ts
    chat.routes.ts
    voice.routes.ts
  /services
    deepseek.service.ts      # DeepSeek API integration (text chat)
    grok.service.ts          # Grok API integration (text chat)
    grok-voice.service.ts    # Grok Voice Agent WebSocket (all voice)
    voice.service.ts         # Voice session management
    tokenMeter.service.ts    # Usage tracking
  /middleware
    auth.middleware.ts
    rateLimit.middleware.ts
  /models
    user.model.ts
    usage.model.ts
  /utils
    costCalculator.ts
    promptBuilder.ts
    modelRouter.ts           # Intelligent model selection
Frontend Structure (Next.js)
/app
  /chat
  /voice
  /dashboard
/components
  VoiceRecorder.tsx
  ChatWindow.tsx
  UsageMeter.tsx
  ModelIndicator.tsx        # Shows which AI is responding
/lib
  api.ts
  audioUtils.ts

STAGE 4 — PROMPT & MODEL ROUTING STRATEGY
Intelligent Model Routing
DeepSeek V3 (Default - Cheap & Fast)
Emotional support
Basic chart explanations
Quick clarifications
General trading education
Cost: ~$0.30 per 1M tokens combined
Grok-2 (Complex Analysis)
Multi-indicator synthesis
Advanced scenario modeling
Deep risk analysis
Paid tier only
Cost: Higher (route selectively)
Model Router Logic
// modelRouter.ts
export function selectModel(intent: string, userTier: string) {
  if (userTier === 'free') return 'deepseek-v3';
  
  const complexIntents = [
    'multi_indicator_analysis',
    'deep_scenario_modeling',
    'advanced_risk_assessment'
  ];
  
  return complexIntents.includes(intent) 
    ? 'grok-2' 
    : 'deepseek-v3';
}
Prompt Structure (Universal)
System Prompt for Both Models:
- Force concise responses (max 150 words)
- Use analyst language, not certainty
- Frame as scenarios, not predictions
- Avoid "buy/sell" language absolutely
- Emphasize probabilities over certainties

Example output:
"Here's what typically happens in this RSI setup. Not a prediction, 
but historically 65% of cases showed continuation. Consider your 
risk tolerance."

Voice Companion Persona (Grok Voice Agent)
- Voice uses a Companion persona only (no toggle): companion/friend, not assistant. Never "AI" language.
- Brevity: 1–3 sentences per turn; follow-up questions over monologues.
- Comprehensive arsenal of filler words and reactions for relatability (see AI.md, grok-voice.service.ts).

STAGE 5 — DEEPSEEK & GROK API INTEGRATION
DeepSeek Service Implementation
// deepseek.service.ts
import axios from 'axios';

export class DeepSeekService {
  private apiKey = process.env.DEEPSEEK_API_KEY;
  private baseUrl = 'https://api.deepseek.com/v1';

  async chat(messages: Message[], model = 'deepseek-chat') {
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model,
        messages,
        max_tokens: 500,
        temperature: 0.7,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      text: response.data.choices[0].message.content,
      usage: response.data.usage,
      cost: this.calculateCost(response.data.usage)
    };
  }

  private calculateCost(usage: any) {
    // DeepSeek V3 pricing
    const inputCost = (usage.prompt_tokens / 1_000_000) * 0.27;
    const outputCost = (usage.completion_tokens / 1_000_000) * 1.10;
    return inputCost + outputCost;
  }

  async transcribe(audioBuffer: Buffer) {
    // DeepSeek STT endpoint
    const formData = new FormData();
    formData.append('file', audioBuffer);
    formData.append('model', 'whisper-1');
    
    const response = await axios.post(
      `${this.baseUrl}/audio/transcriptions`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      }
    );
    
    return response.data.text;
  }

  async speak(text: string, voice = 'alloy') {
    const response = await axios.post(
      `${this.baseUrl}/audio/speech`,
      {
        model: 'tts-1',
        input: text,
        voice
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        responseType: 'arraybuffer'
      }
    );
    
    return response.data;
  }
}
Grok Service Implementation
// grok.service.ts
import axios from 'axios';

export class GrokService {
  private apiKey = process.env.GROK_API_KEY;
  private baseUrl = 'https://api.x.ai/v1';

  async chat(messages: Message[], model = 'grok-4-1-fast-non-reasoning') {
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model,
        messages,
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      text: response.data.choices[0].message.content,
      usage: response.data.usage,
      cost: this.calculateCost(response.data.usage, model)
    };
  }

  private calculateCost(usage: any, model: string) {
    // Grok pricing (adjust based on actual rates)
    const rates = {
      'grok-4-1-fast-reasoning': { input: 2.0, output: 10.0 },
      'grok-4-1-fast-non-reasoning': { input: 1.0, output: 5.0 },
      'grok-2': { input: 2.0, output: 10.0 }, // Legacy fallback
      'grok-2-mini': { input: 1.0, output: 5.0 } // Legacy fallback
    };
    
    const rate = rates[model] || rates['grok-4-1-fast-non-reasoning'];
    const inputCost = (usage.prompt_tokens / 1_000_000) * rate.input;
    const outputCost = (usage.completion_tokens / 1_000_000) * rate.output;
    return inputCost + outputCost;
  }
}

STAGE 6 — TOKEN & COST CONTROL
Internal Metering (Critical)
Track everything:
DeepSeek/Grok input tokens (text chat)
DeepSeek/Grok output tokens (text chat)
Grok Voice Agent session minutes (voice)
Model used per request
Store per user, per session.
Token Economics
Internal Token = Prepaid Usage Credit

1 AI Token = X USD equivalent

USD Cost Breakdown:
  - Text Chat LLM: $0.27-$1.10/M tokens (DeepSeek) or $1.0-$10.0/M tokens (Grok)
  - Voice Session: ~$0.10 per 3-minute session (Grok Voice Agent - handles STT, LLM, TTS)
  
Total cost per voice session (3 min):
  - Grok Voice Agent: ~$0.10 per session (all-inclusive)
  
Add margin: 2x = $0.20 per session
Convert to tokens based on token USD price
Hard Stop Logic
async function checkBalance(userId: string, estimatedCost: number) {
  const balance = await getTokenBalance(userId);
  const required = estimatedCost / TOKEN_USD_PRICE;
  
  if (balance < required) {
    throw new Error('Insufficient token balance');
  }
  
  return true;
}

STAGE 7 — UI/UX RECOMMENDATIONS
Chat UI
Dark mode default
Model indicator badge (DeepSeek/Grok)
Compact messages
Expandable analysis
Cost per message visible
Voice UI
Push-to-talk (not open mic)
Visible timer (max 3 min)
Clear "thinking" state
Model being used indicator
Auto-end session at limit
This cuts abuse by 50%+

STAGE 8 — MVP DEVELOPMENT ORDER
Week 1 (Must-Have)
Text chat with DeepSeek
Token usage tracking
Model routing logic
Hard limits enforcement
Week 2
Grok Voice Agent integration
WebSocket voice session management
Session duration caps
Cost calculations accurate
Week 3
Grok integration for complex queries
Wallet integration
Token burn logic
Tiered access (free/paid)
Do NOT start with voice. Earn the right.

STAGE 9 — COST AVOIDANCE RULES
Burn Prevention Tactics:
1.Summarize context every 3-4 turns
2.Kill idle sessions after 2 minutes
3.Limit free users aggressively (5 msgs/day)
4.Cache common chart explanations
5.Never stream long responses by default
6.Route to DeepSeek unless complexity requires Grok
7.Limit voice sessions to 3 minutes max
8.Use Grok Voice Agent for all voice (simpler, more efficient)
These save thousands monthly.

SOLANA TOKEN INTEGRATION
Token Design
SPL Token (Solana standard)
Decimals: 6 (match USDC)
Supply: 10M - 50M fixed
Burn Model: 50% burn / 50% treasury
Token Flow
AI Usage Event:
  User → Tokens deducted from balance
  → 50% burned (permanent scarcity)
  → 50% to treasury (operational costs)
  
Treasury Usage:
  → Swap to USDC via Jupiter
  → Pay DeepSeek/Grok API bills
  → Infrastructure costs
Pricing Formula
C_usd = AI cost + margin (e.g., $0.01)
P_token = token price USD (TWAP from Jupiter)
B_tokens = C_usd / P_token

Split:
  Burn = 0.5 × B_tokens
  Treasury = 0.5 × B_tokens
Smart Contract Architecture
Contract 1: SPL Token Mint
Standard SPL token
No custom logic
Fixed supply
Contract 2: Usage Settlement Program
// Responsibilities only:
1. Accept token transfers
2. Split deterministically:
   - 50% → SPL burn
   - 50% → treasury wallet
3. No pricing logic
4. No oracle integration
Wallet Integration
Solana Wallet Adapter
Supports: Phantom, Solflare, Backpack, OKX
No custody model
Direct balance reads from chain

CRITICAL REMINDERS
Cost Control
DeepSeek first, Grok when necessary
Track every API call's cost
Enforce hard stops at token depletion
Use TWAP pricing, never spot
Regulatory Safety
Never say "buy/sell/invest"
Frame as educational scenarios
Disclaim predictions
Track all advice given
Technical Discipline
1.Separate voice from LLM processing
2.Meter everything obsessively
3.Enforce limits early
4.Route models intelligently
5.Cache aggressively

THE TRUTH
This product succeeds on discipline, not intelligence.
With DeepSeek's low costs and Grok's power for complex tasks, you have:
Sustainable economics (DeepSeek ~90% cheaper than GPT-4)
Intelligent routing (cheap for most, premium when needed)
Real utility (token has actual consumption value)
Market compatibility (tradable, burnable, valuable)
Build the boring infrastructure right. Let the AI quality speak for itself. Let the tokenomics reward usage, not promises.
Ship something serious and sustainable.
