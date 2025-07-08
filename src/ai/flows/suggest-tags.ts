'use server';
/**
 * @fileOverview A flow to suggest tags for a note.
 *
 * - suggestTags - A function that suggests tags based on note content.
 * - SuggestTagsInput - The input type for the suggestTags function.
 * - SuggestTagsOutput - The return type for the suggestTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTagsInputSchema = z.object({
  noteContent: z.string().describe('The content of the note to analyze.'),
  existingTags: z.array(z.string()).describe('A list of tags already applied to the note.'),
});
export type SuggestTagsInput = z.infer<typeof SuggestTagsInputSchema>;

const SuggestTagsOutputSchema = z.object({
  suggestedTags: z.array(z.string()).describe("A list of 3-5 relevant, concise, single-word (or two-word, e.g., 'project plan') tags."),
});
export type SuggestTagsOutput = z.infer<typeof SuggestTagsOutputSchema>;

export async function suggestTags(input: SuggestTagsInput): Promise<SuggestTagsOutput> {
  return suggestTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTagsPrompt',
  input: {schema: SuggestTagsInputSchema},
  output: {schema: SuggestTagsOutputSchema},
  prompt: `You are an expert organizer. Analyze the following note content and suggest a list of 3-5 relevant, concise, single-word (or two-word if necessary, like 'project plan') tags.

  The note already has these tags, so do not suggest them again: {{#if existingTags}}'{{#each existingTags}}'{{this}}'{{#if @last}}{{else}}, {{/if}}{{/each}}'{{/if}}.

  Note Content:
  ---
  {{{noteContent}}}
  ---

  Provide your suggestions in the 'suggestedTags' field.
`,
});

const suggestTagsFlow = ai.defineFlow(
  {
    name: 'suggestTagsFlow',
    inputSchema: SuggestTagsInputSchema,
    outputSchema: SuggestTagsOutputSchema,
  },
  async input => {
    // Strip HTML for better analysis, but keep basic structure.
    const cleanContent = input.noteContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanContent.length < 20) {
        return { suggestedTags: [] };
    }

    const {output} = await prompt({...input, noteContent: cleanContent});
    return output!;
  }
);
