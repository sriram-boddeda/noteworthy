'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAiContext } from '@/context/ai-provider';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Loader2, Key, Trash2, Link } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { AiProvider, AiProviderConfig } from '@/ai/services/types';

const providerOptions: Record<AiProvider, string> = {
  gemini: 'Google Gemini',
  ollama: 'Ollama (Local)',
  openai: 'OpenAI',
};

const providerDefaults: Record<AiProvider, { model: string; baseUrl?: string }> = {
  gemini: { model: 'gemini-2.0-flash' },
  ollama: { model: 'llama3.2', baseUrl: 'http://localhost:11434' },
  openai: { model: 'gpt-4o-mini' },
};

const keyLabel: Record<AiProvider, string> = {
  gemini: 'Gemini API Key',
  ollama: 'Ollama API Key (if required)',
  openai: 'OpenAI API Key',
};

const keyPlaceholder: Record<AiProvider, string> = {
  gemini: 'AIzaSy...',
  ollama: '(optional)',
  openai: 'sk-...',
};

const docsUrl: Record<AiProvider, string> = {
  gemini: 'https://aistudio.google.com/apikey',
  ollama: 'https://ollama.ai/download',
  openai: 'https://platform.openai.com/api-keys',
};

export function AiSettings() {
  const { config, setConfig, clearConfig, testConnection, isAiEnabled } = useAiContext();

  const [provider, setProvider] = useState<AiProvider>(config?.provider || 'gemini');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [model, setModel] = useState(config?.model || providerDefaults.gemini.model);
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || '');
  const [isTesting, setIsTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [persistChecked, setPersistChecked] = useState(false);

  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setApiKey(config.apiKey);
      setModel(config.model);
      setBaseUrl(config.baseUrl || '');
    }
  }, [config]);

  const handleProviderChange = (value: string) => {
    const p = value as AiProvider;
    setProvider(p);
    const defaults = providerDefaults[p];
    setModel(defaults.model);
    setBaseUrl(defaults.baseUrl || '');
  };

  const handleSave = () => {
    if (!apiKey.trim() && provider !== 'ollama') {
      toast.error('Please enter an API key.');
      return;
    }

    const newConfig: AiProviderConfig = {
      provider,
      apiKey: apiKey.trim() || '',
      model: model.trim() || providerDefaults[provider].model,
      ...(baseUrl.trim() ? { baseUrl: baseUrl.trim() } : {}),
    };

    setConfig(newConfig);

    if (persistChecked) {
      try {
        localStorage.setItem('noteworthy-ai-config', JSON.stringify(newConfig));
        toast.success('AI configuration saved and persisted.');
      } catch {
        toast.error('Could not persist AI config to localStorage.');
      }
    } else {
      toast.success(`${providerOptions[provider]} configured for this session.`);
    }
  };

  const handleClear = () => {
    clearConfig();
    setApiKey('');
    setModel(providerDefaults[provider].model);
    setBaseUrl(providerDefaults[provider].baseUrl || '');
    setPersistChecked(false);
  };

  const handleTest = async () => {
    setIsTesting(true);
    await testConnection();
    setIsTesting(false);
  };

  const isKeyBased = provider !== 'ollama';

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="size-5" />
          AI Integration
        </CardTitle>
        <CardDescription>
          Configure an AI provider for summarization, tag suggestions, text-to-speech, and calculator generation.
          Your keys stay in your browser and are never sent to any server we control.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm font-medium">Security Notice — Use at your own risk</AlertTitle>
          <AlertDescription className="text-xs mt-1 space-y-1">
            <p>
              Your API keys are stored locally in your browser. By default, they persist only for the current session
              (cleared when you close the browser tab). If you enable persistence below, the key will be saved in
              <strong> browser localStorage</strong> — accessible to any JavaScript running on this domain.
            </p>
            <p>
              Never share this app with others while your API key is stored. API keys are sent directly from your browser
              to the third-party service (Gemini, OpenAI, or your local Ollama instance). We never see or store your key.
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="ai-provider">AI Provider</Label>
          <Select value={provider} onValueChange={handleProviderChange}>
            <SelectTrigger id="ai-provider">
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(providerOptions).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(isKeyBased) && (
          <div className="space-y-2">
            <Label htmlFor="ai-api-key">{keyLabel[provider]}</Label>
            <div className="relative">
              <Input
                id="ai-api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={keyPlaceholder[provider]}
                className="pr-20 font-mono text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? 'Hide' : 'Show'}
              </Button>
            </div>
            {provider !== 'ollama' && (
              <a
                href={docsUrl[provider]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <Link className="size-3" /> Get a {provider === 'gemini' ? 'Gemini' : 'OpenAI'} API Key
              </a>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="ai-model">Model (optional)</Label>
          <Input
            id="ai-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={providerDefaults[provider].model}
          />
          <p className="text-xs text-muted-foreground">
            Default: <code className="text-xs bg-muted px-1 rounded">{providerDefaults[provider].model}</code>
          </p>
        </div>

        {!isKeyBased && (
          <div className="space-y-2">
            <Label htmlFor="ai-base-url">Base URL</Label>
            <Input
              id="ai-base-url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={providerDefaults[provider].baseUrl}
            />
            <p className="text-xs text-muted-foreground">
              Your local Ollama instance URL. Make sure Ollama is running.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <input
            id="persist-config"
            type="checkbox"
            checked={persistChecked}
            onChange={(e) => setPersistChecked(e.target.checked)}
            className="rounded border-border"
          />
          <Label htmlFor="persist-config" className="text-muted-foreground cursor-pointer text-xs">
            Keep AI config after closing the browser (stores in localStorage — less secure)
          </Label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleSave} disabled={!apiKey.trim() && provider !== 'ollama'}>
            Save Configuration
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={isTesting}>
            {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test Connection
          </Button>
          {isAiEnabled && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="mr-2 size-4" />
                  Clear
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove AI Configuration?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove your API key and disable all AI features.
                    You will need to re-enter the key to use AI features again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClear}>Remove</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {isAiEnabled && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 ml-2">
              <CheckCircle2 className="size-3" /> AI Ready
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}