'use server';
/**
 * @fileOverview A flow to summarize a note.
 *
 * - summarizeNote - A function that generates a summary for a note.
 * - SummarizeNoteInput - The input type for the summarizeNote function.
 * - SummarizeNoteOutput - The return type for the summarizeNote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeNoteInputSchema = z.object({
  noteContent: z.string().describe('The content of the note to summarize.'),
  noteType: z.enum(['richtext', 'markdown', 'calculator']).describe('The type of the note.'),
});
export type SummarizeNoteInput = z.infer<typeof SummarizeNoteInputSchema>;

const SummarizeNoteOutputSchema = z.object({
  summary: z.string().describe('A concise, 1-3 sentence summary of the note.'),
});
export type SummarizeNoteOutput = z.infer<typeof SummarizeNoteOutputSchema>;

export async function summarizeNote(input: SummarizeNoteInput): Promise<SummarizeNoteOutput> {
  return summarizeNoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeNotePrompt',
  input: {schema: SummarizeNoteInputSchema},
  output: {schema: SummarizeNoteOutputSchema},
  prompt: `You are an expert summarizer. Analyze the following note content and generate a concise, 1-3 sentence summary that captures the key points.

  Note Content:
  ---
  {{{noteContent}}}
  ---

  Provide your summary in the 'summary' field.
`,
});

const summarizeNoteFlow = ai.defineFlow(
  {
    name: 'summarizeNoteFlow',
    inputSchema: SummarizeNoteInputSchema,
    outputSchema: SummarizeNoteOutputSchema,
  },
  async ({noteContent, noteType}) => {
    // For rich text, strip HTML for better analysis.
    const cleanContent = noteType === 'richtext' ? noteContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : noteContent;

    if (cleanContent.length < 50) { // Don't summarize very short notes
        return { summary: "Note is too short to summarize." };
    }

    const {output} = await prompt({noteContent: cleanContent, noteType});
    return output!;
  }
);
