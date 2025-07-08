
'use server';

import { generateCalculatorNoteStarter } from "@/ai/flows/generate-calculator-note-starter";
import { summarizeNote } from "@/ai/flows/summarize-note";
import { suggestTags } from "@/ai/flows/suggest-tags";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { z } from "zod";

export type GenerateNoteState = {
    starterTemplate?: string;
    error?: string | null;
}

export async function generateNoteAction(prevState: GenerateNoteState, formData: FormData): Promise<GenerateNoteState> {
    const schema = z.object({
        prompt: z.string().min(1, { message: "Prompt cannot be empty." }),
    });

    const validatedFields = schema.safeParse({
        prompt: formData.get('prompt'),
    });

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors.prompt?.join(", "),
        };
    }

    try {
        const result = await generateCalculatorNoteStarter({ prompt: validatedFields.data.prompt });
        if (result.starterTemplate) {
            return { starterTemplate: result.starterTemplate, error: null };
        }
        return { error: "Failed to generate content from AI.", starterTemplate: "" };

    } catch (error) {
        console.error(error);
        return {
            error: "An unexpected error occurred. Please try again.",
        };
    }
}


export type SuggestTagsState = {
    suggestedTags?: string[];
    error?: string | null;
    timestamp?: number;
}

export async function suggestTagsAction(prevState: SuggestTagsState, formData: FormData): Promise<SuggestTagsState> {
    const schema = z.object({
        noteContent: z.string(),
        existingTags: z.string(), // Will be a comma-separated string from a hidden input
    });

    const validatedFields = schema.safeParse({
        noteContent: formData.get('noteContent'),
        existingTags: formData.get('existingTags'),
    });

    if (!validatedFields.success) {
        return {
            error: "Invalid input for tag suggestion.",
        };
    }
    
    if (!validatedFields.data.noteContent) {
        return { suggestedTags: [] }; // Don't run for empty notes
    }

    try {
        const existingTags = validatedFields.data.existingTags.split(',').filter(Boolean).map(t => t.toLowerCase());
        const result = await suggestTags({ noteContent: validatedFields.data.noteContent, existingTags });
        
        if (result.suggestedTags) {
            // Filter out any tags that might already exist, just in case
            const newSuggestions = result.suggestedTags.filter(tag => !existingTags.includes(tag.toLowerCase()));
            return { suggestedTags: newSuggestions, error: null, timestamp: Date.now() };
        }
        return { error: "Failed to generate tags from AI.", suggestedTags: [], timestamp: Date.now() };

    } catch (error) {
        console.error(error);
        return {
            error: "An unexpected error occurred while suggesting tags.",
            timestamp: Date.now()
        };
    }
}

export type TextToSpeechState = {
    audioData?: string | null;
    error?: string | null;
    timestamp?: number;
}

export async function textToSpeechAction(prevState: TextToSpeechState, formData: FormData): Promise<TextToSpeechState> {
    const schema = z.object({
        noteContent: z.string(),
        noteType: z.enum(['richtext', 'markdown', 'calculator']),
    });

    const validatedFields = schema.safeParse({
        noteContent: formData.get('noteContent'),
        noteType: formData.get('noteType'),
    });

    if (!validatedFields.success) {
        return { error: "Invalid input for text-to-speech.", timestamp: Date.now() };
    }

    const { noteContent, noteType } = validatedFields.data;

    if (!noteContent || noteContent.trim().length < 10) {
        return { error: "There is not enough content to read aloud.", timestamp: Date.now() };
    }
    
    // For rich text, strip HTML for better TTS.
    const cleanContent = noteType === 'richtext' ? noteContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : noteContent;

    try {
        const result = await textToSpeech({ query: cleanContent });
        if (result.media) {
            return { audioData: result.media, error: null, timestamp: Date.now() };
        }
        return { error: "Failed to generate audio from AI.", timestamp: Date.now() };

    } catch (error) {
        console.error(error);
        return {
            error: "An unexpected error occurred while generating audio.",
            timestamp: Date.now()
        };
    }
}


export type SummarizeNoteState = {
    summary?: string | null;
    error?: string | null;
    timestamp?: number;
}

export async function summarizeNoteAction(prevState: SummarizeNoteState, formData: FormData): Promise<SummarizeNoteState> {
    const schema = z.object({
        noteContent: z.string(),
        noteType: z.enum(['richtext', 'markdown', 'calculator']),
    });

    const validatedFields = schema.safeParse({
        noteContent: formData.get('noteContent'),
        noteType: formData.get('noteType'),
    });

    if (!validatedFields.success) {
        return { error: "Invalid input for summarization.", timestamp: Date.now() };
    }

    const { noteContent, noteType } = validatedFields.data;

    if (!noteContent || noteContent.trim().length < 50) {
        return { error: "There is not enough content to summarize.", timestamp: Date.now() };
    }

    try {
        const result = await summarizeNote({ noteContent, noteType });
        if (result.summary) {
            return { summary: result.summary, error: null, timestamp: Date.now() };
        }
        return { error: "Failed to generate summary from AI.", timestamp: Date.now() };

    } catch (error) {
        console.error(error);
        return {
            error: "An unexpected error occurred while generating the summary.",
            timestamp: Date.now()
        };
    }
}
