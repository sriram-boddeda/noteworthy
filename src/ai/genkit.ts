import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {env} from '@/lib/env';

export const ai = genkit({
  plugins: [env.isAiEnabled ? googleAI({apiKey: env.GOOGLE_API_KEY}) : googleAI({apiKey: 'dummy-key-for-genkit-compilation'})],
  model: 'googleai/gemini-2.0-flash',
});
