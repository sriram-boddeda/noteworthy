import type { AiService, AiProviderConfig } from './types';

export function createGeminiService(config: AiProviderConfig): AiService {
  const apiKey = config.apiKey;
  const model = config.model || 'gemini-2.0-flash';
  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  async function request(endpoint: string, body: Record<string, unknown>) {
    const response = await fetch(
      `${baseUrl}/models/${model}:${endpoint}?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${err}`);
    }
    return response.json();
  }

  async function generateContent(prompt: string): Promise<string> {
    const data = await request('generateContent', {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  return {
    async summarize(noteContent: string, noteType: string) {
      const cleanContent = noteType === 'richtext'
        ? noteContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        : noteContent;
      const prompt = `You are an expert summarizer. Analyze the following note content and generate a concise, 1-3 sentence summary that captures the key points.\n\nNote Content:\n---\n${cleanContent}\n---\n\nProvide only the summary text, nothing else.`;
      return generateContent(prompt);
    },

    async suggestTags(noteContent: string, existingTags: string[]) {
      const cleanContent = noteContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const existing = existingTags.length > 0 ? `The note already has these tags: ${existingTags.join(', ')}. Do NOT suggest them again.` : '';
      const prompt = `You are an expert organizer. Analyze the following note content and suggest 3-5 relevant, concise tags (single-word or two-word like 'project plan'). ${existing}\n\nNote Content:\n---\n${cleanContent}\n---\n\nReturn ONLY a comma-separated list of tags, nothing else.`;
      const result = await generateContent(prompt);
      return result.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    },

    async textToSpeech(text: string) {
      const response = await fetch(
        `${baseUrl}/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text }] }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } },
              },
            },
          }),
        }
      );
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini TTS error (${response.status}): ${err}`);
      }
      const data = await response.json();
      const media = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (!media?.data) throw new Error('No audio data returned from Gemini.');
      return `data:${media.mimeType};base64,${media.data}`;
    },

    async generateCalculatorStarter(prompt: string) {
      const promptText = `You are an expert note-taking assistant specializing in creating calculator notes. A calculator note is a plain text document where each line is either a comment (starting with #), a variable assignment (e.g., \`rent = 1200\`), or a mathematical expression (e.g., \`rent * 12\`).\n\nBased on the user's prompt, generate a starter template for a calculator note. The template should include example variables and calculations related to the prompt.\n\nUser Prompt: ${prompt}\n\nThe content you generate must be a multi-line string that follows the calculator note syntax. Include a brief description as comments at the beginning. End with a few blank lines for the user to begin writing.\n\nReturn ONLY the calculator note content, nothing else.`;
      return generateContent(promptText);
    },

    async testConnection() {
      try {
        const data = await request('generateContent', {
          contents: [{ role: 'user', parts: [{ text: 'Reply with just the word: ok' }] }],
        });
        return !!data.candidates?.[0]?.content?.parts?.[0]?.text;
      } catch {
        return false;
      }
    },
  };
}