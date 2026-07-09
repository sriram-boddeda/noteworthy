export type AiProvider = 'gemini' | 'ollama' | 'openai';

export interface AiProviderConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface AiService {
  summarize(noteContent: string, noteType: string): Promise<string>;
  suggestTags(noteContent: string, existingTags: string[]): Promise<string[]>;
  textToSpeech(text: string): Promise<string>;
  generateCalculatorStarter(prompt: string): Promise<string>;
  testConnection(): Promise<boolean>;
}

export interface AiActionState<T> {
  data: T | null;
  error: string | null;
  isPending: boolean;
  timestamp: number | null;
}