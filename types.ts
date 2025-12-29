
export interface Dream {
  id: string;
  timestamp: number;
  transcript: string;
  audioBlobUrl?: string;
  imageUrl?: string;
  analysis?: DreamAnalysis;
  chatHistory: ChatMessage[];
}

export interface DreamAnalysis {
  summary: string;
  archetypes: Archetype[];
  emotionalTheme: string;
  keySymbols: {
    symbol: string;
    interpretation: string;
  }[];
}

export interface Archetype {
  name: string;
  description: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export type ImageSize = '1K' | '2K' | '4K';
