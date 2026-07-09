import type { AiService, AiProviderConfig } from './types';

export function createOllamaService(config: AiProviderConfig): AiService {
  const baseUrl = (config.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
  const model = config.model || 'llama3.2';

  async function generate(prompt: string): Promise<string> {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Ollama error (${response.status}): ${err}`);
    }
    const data = await response.json();
    return data.response || '';
  }

  return {
    async summarize(noteContent: string, noteType: string) {
      const cleanContent = noteType === 'richtext'
        ? noteContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        : noteContent;
      const prompt = `You are an expert summarizer. Analyze the following note content and generate a concise, 1-3 sentence summary that captures the key points.\n\nNote Content:\n---\n${cleanContent}\n---\n\nProvide only the summary text, nothing else.`;
      return generate(prompt);
    },

    async suggestTags(noteContent: string, existingTags: string[]) {
      const cleanContent = noteContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const existing = existingTags.length > 0 ? `The note already has these tags: ${existingTags.join(', ')}. Do NOT suggest them again.` : '';
      const prompt = `You are an expert organizer. Analyze the following note content and suggest 3-5 relevant, concise tags (single-word or two-word like 'project plan'). ${existing}\n\nNote Content:\n---\n${cleanContent}\n---\n\nReturn ONLY a comma-separated list of tags, nothing else.`;
      const result = await generate(prompt);
      return result.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    },

    async textToSpeech(_text: string) {
      throw new Error('Text-to-speech is not supported with Ollama. Use the Gemini provider for TTS.');
    },

    async generateCalculatorStarter(prompt: string) {
      const promptText = `You are an expert note-taking assistant specializing in creating calculator notes. A calculator note is a plain text document where each line is either a comment (starting with #), a variable assignment, or a mathematical expression.\n\nBased on the user's prompt, generate a starter template for a calculator note.\n\nUser Prompt: ${prompt}\n\nReturn ONLY the calculator note content, nothing else.`;
      return generate(promptText);
    },

    async testConnection() {
      try {
        const response = await fetch(`${baseUrl}/api/tags`);
        return response.ok;
      } catch {
        return false;
      }
    },
  };
}