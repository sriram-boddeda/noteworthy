'use server';

/**
 * @fileOverview A flow to generate a starter template for calculator notes.
 *
 * - generateCalculatorNoteStarter - A function that generates a starter template for calculator notes.
 * - GenerateCalculatorNoteStarterInput - The input type for the generateCalculatorNoteStarter function.
 * - GenerateCalculatorNoteStarterOutput - The return type for the generateCalculatorNoteStarter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCalculatorNoteStarterInputSchema = z.object({
  prompt: z.string().describe('A prompt describing the desired calculator note.'),
});
export type GenerateCalculatorNoteStarterInput = z.infer<typeof GenerateCalculatorNoteStarterInputSchema>;

const GenerateCalculatorNoteStarterOutputSchema = z.object({
  starterTemplate: z.string().describe('The generated starter template for the calculator note.'),
});
export type GenerateCalculatorNoteStarterOutput = z.infer<typeof GenerateCalculatorNoteStarterOutputSchema>;

export async function generateCalculatorNoteStarter(input: GenerateCalculatorNoteStarterInput): Promise<GenerateCalculatorNoteStarterOutput> {
  return generateCalculatorNoteStarterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCalculatorNoteStarterPrompt',
  input: {schema: GenerateCalculatorNoteStarterInputSchema},
  output: {schema: GenerateCalculatorNoteStarterOutputSchema},
  prompt: `You are an expert note-taking assistant specializing in creating calculator notes. A calculator note is a plain text document where each line is either a comment (starting with #), a variable assignment (e.g., \`rent = 1200\`), or a mathematical expression (e.g., \`rent * 12\`).

  Based on the user's prompt, generate a starter template for a calculator note. The template should include example variables and calculations related to the prompt.

  User Prompt: {{{prompt}}}

  The content you generate for the 'starterTemplate' field must be a multi-line string that follows the calculator note syntax. It should not be a JSON object or any other format.
  It should be well-formatted and easy to understand.
  Include a brief description or title as comments at the beginning of the note.
  End the note with a few blank lines for the user to begin writing.

  Provide the complete starter template in the 'starterTemplate' field.
`,
});

const generateCalculatorNoteStarterFlow = ai.defineFlow(
  {
    name: 'generateCalculatorNoteStarterFlow',
    inputSchema: GenerateCalculatorNoteStarterInputSchema,
    outputSchema: GenerateCalculatorNoteStarterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
