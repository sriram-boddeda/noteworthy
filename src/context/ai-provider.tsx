'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { AiProvider, AiProviderConfig, AiService } from '@/ai/services/types';
import { createGeminiService } from '@/ai/services/gemini';
import { createOllamaService } from '@/ai/services/ollama';
import { toast } from 'sonner';

const AI_CONFIG_KEY = 'noteworthy-ai-config';

interface AiContextType {
  config: AiProviderConfig | null;
  isAiEnabled: boolean;
  setConfig: (config: AiProviderConfig | null) => void;
  clearConfig: () => void;
  testConnection: () => Promise<boolean>;
  summarize: (noteContent: string, noteType: string) => Promise<string>;
  suggestTags: (noteContent: string, existingTags: string[]) => Promise<string[]>;
  textToSpeech: (text: string) => Promise<string>;
  generateCalculatorStarter: (prompt: string) => Promise<string>;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

function createService(config: AiProviderConfig): AiService {
  switch (config.provider) {
    case 'gemini':
      return createGeminiService(config);
    case 'ollama':
      return createOllamaService(config);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

function loadConfig(): AiProviderConfig | null {
  try {
    const stored = sessionStorage.getItem(AI_CONFIG_KEY) || localStorage.getItem(AI_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.provider && parsed.apiKey) {
        return parsed as AiProviderConfig;
      }
    }
  } catch {}
  return null;
}

function saveConfig(config: AiProviderConfig | null) {
  if (config) {
    sessionStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
  } else {
    sessionStorage.removeItem(AI_CONFIG_KEY);
    localStorage.removeItem(AI_CONFIG_KEY);
  }
}

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<AiProviderConfig | null>(null);
  const serviceRef = useRef<AiService | null>(null);

  useEffect(() => {
    const loaded = loadConfig();
    if (loaded) {
      setConfigState(loaded);
      serviceRef.current = createService(loaded);
    }
  }, []);

  const setConfig = useCallback((newConfig: AiProviderConfig | null) => {
    setConfigState(newConfig);
    if (newConfig) {
      serviceRef.current = createService(newConfig);
      saveConfig(newConfig);
    } else {
      serviceRef.current = null;
      saveConfig(null);
    }
  }, []);

  const clearConfig = useCallback(() => {
    setConfig(null);
    toast.info('AI configuration cleared.');
  }, [setConfig]);

  const getService = useCallback((): AiService => {
    if (!serviceRef.current) {
      throw new Error('AI is not configured. Please set up an AI provider in Settings.');
    }
    return serviceRef.current;
  }, []);

  const testConnection = useCallback(async () => {
    try {
      const svc = getService();
      const ok = await svc.testConnection();
      if (ok) {
        toast.success('Connection successful!');
      } else {
        toast.error('Connection failed. Check your configuration.');
      }
      return ok;
    } catch (e: any) {
      toast.error('Connection error', { description: e.message });
      return false;
    }
  }, [getService]);

  const summarize = useCallback(async (noteContent: string, noteType: string) => {
    const svc = getService();
    return svc.summarize(noteContent, noteType);
  }, [getService]);

  const suggestTags = useCallback(async (noteContent: string, existingTags: string[]) => {
    const svc = getService();
    return svc.suggestTags(noteContent, existingTags);
  }, [getService]);

  const textToSpeech = useCallback(async (text: string) => {
    const svc = getService();
    return svc.textToSpeech(text);
  }, [getService]);

  const generateCalculatorStarter = useCallback(async (prompt: string) => {
    const svc = getService();
    return svc.generateCalculatorStarter(prompt);
  }, [getService]);

  return (
    <AiContext.Provider
      value={{
        config,
        isAiEnabled: !!config,
        setConfig,
        clearConfig,
        testConnection,
        summarize,
        suggestTags,
        textToSpeech,
        generateCalculatorStarter,
      }}
    >
      {children}
    </AiContext.Provider>
  );
}

export function useAiContext() {
  const context = useContext(AiContext);
  if (context === undefined) {
    throw new Error('useAiContext must be used within an AiProvider');
  }
  return context;
}