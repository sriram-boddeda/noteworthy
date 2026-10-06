'use client';

import { useMemo, useRef, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from 'monaco-editor';

import { Button } from '@/components/motion/button';
import {
  CenterMorphModal,
  CenterMorphModalContent,
  CenterMorphModalTrigger,
} from '@/components/motion/center-morph-modal';
import { Input } from '@/components/motion/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { evaluateNotebook } from '@/lib/calculator';
import { Loader2, Sparkles } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useAiContext } from '@/context/ai-provider';
import { useAiAction } from '@/hooks/use-ai-action';

interface CalculatorNoteProps {
  content: string;
  onContentChange: (newContent: string) => void;
}

export function CalculatorNote({ content, onContentChange }: CalculatorNoteProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [prompt, setPrompt] = useState('A trip with friends to split expenses');
  const { theme } = useTheme();
  const { isAiEnabled, generateCalculatorStarter } = useAiContext();
  const [generateState, doGenerate] = useAiAction(generateCalculatorStarter);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // useAiAction resolves with the result (or undefined on failure), so the
  // success side effects run right here instead of in an effect watching
  // derived state.
  const handleGenerate = useCallback(async () => {
    const result = await doGenerate(prompt);
    if (result !== undefined) {
      onContentChange(result);
      setDialogOpen(false);
      toast.success('Template Generated!', {
        description: 'Your calculator note is ready to use.',
      });
    } else {
      toast.error('Uh oh! Something went wrong.', {
        description: 'Could not generate a calculator template. Try again.',
      });
    }
  }, [doGenerate, prompt, onContentChange]);

  const { results, variables } = useMemo(() => evaluateNotebook(content), [content]);

  const outputLines = useMemo(() => {
    const lines = content.split('\n');
    return Array.from(results.keys())
      .sort((a, b) => a - b)
      .map(index => {
        return {
          line: lines[index],
          index,
          result: results.get(index),
        };
      });
  }, [content, results]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    monaco.languages.register({ id: 'calculator' });

    monaco.languages.setMonarchTokensProvider('calculator', {
      tokenizer: {
        root: [
          [/^#.*$/, 'comment'],
          [/[a-zA-Z_][\w]*/, 'identifier'],
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number'],
          [/\d+/, 'number'],
          [/[=+\-*/()]/, 'operator'],
        ],
      },
    });
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] overflow-hidden flex flex-col bg-card border rounded-lg">
      <div className="p-0 flex-1 flex">
        <div className="flex flex-col md:flex-row flex-1">
          {/* Left Panel: Input Editor */}
          <div className="relative w-full md:w-3/4 flex flex-col">
            {isAiEnabled && (
                <div className="absolute top-4 right-4 z-10">
                <CenterMorphModal open={isDialogOpen} onOpenChange={setDialogOpen}>
                    <CenterMorphModalTrigger>
                    <Button size="sm" variant="ghost" className="opacity-50 hover:opacity-100 transition-opacity">
                        <Sparkles className="mr-2 h-4 w-4 text-primary" />
                        Generate with AI
                    </Button>
                    </CenterMorphModalTrigger>
                    <CenterMorphModalContent ariaLabel="Generate calculator note" className="max-w-[425px]">
                        <div className="flex flex-col gap-2 p-6 pb-2">
                        <h2 className="text-lg font-semibold leading-none tracking-tight">Generate Calculator Note</h2>
                        <p className="text-sm text-muted-foreground">
                            Describe what you want to calculate, and we&apos;ll create a template for you.
                        </p>
                        </div>
                        <div className="grid gap-4 px-6 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="prompt" className="text-right">
                            Prompt
                            </Label>
                            <Input
                            id="prompt"
                            value={prompt}
                            onChange={setPrompt}
                            className="col-span-3"
                            />
                        </div>
                        </div>
                        <div className="flex flex-col-reverse gap-2 p-6 pt-2 sm:flex-row sm:justify-end">
                        <Button onClick={handleGenerate} disabled={generateState.isPending}>
                            {generateState.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate
                        </Button>
                        </div>
                    </CenterMorphModalContent>
                </CenterMorphModal>
                </div>
            )}
            <Editor
              height="100%"
              language="calculator"
              value={content}
              onMount={handleEditorDidMount}
              onChange={(value) => onContentChange(value || '')}
              theme={theme === 'dark' ? 'vs-dark' : 'vs'}
              loading={<Skeleton className="h-full w-full rounded-none" />}
              options={{
                fontFamily: "'Fira Code', monospace",
                fontSize: 14,
                lineHeight: 24,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'off',
                glyphMargin: false,
                folding: false,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 0,
                padding: {
                  top: 24,
                  bottom: 24
                }
              }}
            />
          </div>
          <Separator orientation="horizontal" className="md:hidden" />
          <Separator orientation="vertical" className="hidden md:block" />
          {/* Right Panel: Output/Results */}
          <div className="w-full md:w-1/4 p-4 bg-muted/20 font-mono text-sm overflow-auto">
            {/* Variables Section */}
            <div className="mb-6">
              <h3 className="font-headline font-semibold text-base mb-2 border-b pb-2 text-foreground/80">Variables</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                {variables.size > 0 ? (
                  Array.from(variables.entries()).map(([name, value]) => (
                    <div key={name} className="flex justify-between items-baseline text-xs p-1.5 rounded-md bg-background/50">
                      <code className="text-muted-foreground">{name}</code>
                      <span className="font-mono font-semibold text-primary">{value.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-center text-muted-foreground py-4">No variables defined.</p>
                )}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Results Section */}
            <div>
              <h3 className="font-headline font-semibold text-base mb-2 border-b pb-2 text-foreground/80">Live Output</h3>
              <div className="space-y-1">
                {outputLines.length > 0 ? (
                  outputLines.map(({ line, index, result }) => {
                    if (!result) return null;

                    const isAssignment = /^\s*[a-zA-Z_][\w]*\s*=/.test(line.trim());
                    if (isAssignment) {
                        return null;
                    }

                    return (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 rounded-md transition-colors hover:bg-background/50 group"
                      >
                        <div className="flex items-center gap-x-3">
                           <span className="w-5 text-right font-mono text-xs text-muted-foreground select-none">{index + 1}</span>
                           <code className="text-muted-foreground text-xs" title={line}>
                            {line.trim() || <span className="text-muted-foreground/50 italic">empty line</span>}
                          </code>
                        </div>
                        
                        {result.error ? (
                            <span className="font-medium text-destructive text-xs text-right" title={result.error}>
                              {result.error}
                            </span>
                        ) : (
                          <span className="font-mono font-bold text-accent text-right text-base">
                            = {result.value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-center text-muted-foreground py-4">
                    Output from calculations will appear here.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}