import {z} from 'zod';

const envSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
    ...parsedEnv,
    isAiEnabled: !!parsedEnv.GEMINI_API_KEY,
}
