/**
 * Meme Studio types and style fallback.
 * Templates and styles are loaded from the backend API.
 */

export type MemeFormat = 'image' | 'gif' | 'video';

export const MEME_STYLES = ['Classic', 'DeFi', 'NGMI', 'WAGMI', 'Stonks', 'Diamond Hands'] as const;
export type MemeStyle = (typeof MEME_STYLES)[number];
