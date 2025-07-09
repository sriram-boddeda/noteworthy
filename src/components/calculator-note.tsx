'use client';

import { useActionState, useEffect, useMemo, useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useTheme } from 'next-themes';
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from 'monaco-editor';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { evaluateNotebook } from '@/lib/calculator';
import { Loader2, Sparkles } from 'lucide-react';
import { generateNoteAction, type GenerateNoteState } from '@/app/actions';
import { Skeleton } from './ui/skeleton';

const initialState: GenerateNoteState = {
  starterTemplate: '',
  error: null,
};

function GenerateButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Generate
    </Button>
  );
}

interface CalculatorNoteProps {
  content: string;
  onContentChange: (newContent: string) => void;
}

export function CalculatorNote({ content, onContentChange }: CalculatorNoteProps) {
  const [state, formAction] = useActionState(generateNoteAction, initialState);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const { theme } = useTheme();

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<any | null>(null);

  useEffect(() => {
    if (state.starterTemplate) {
      onContentChange(state.starterTemplate);
      setDialogOpen(false);
      toast.success('Template Generated!', {
        description: 'Your calculator note is ready to use.',
      });
    }
    if (state.error) {
      toast.error('Uh oh! Something went wrong.', {
        description: state.error,
      });
    }
  }, [state, onContentChange]);

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
    monacoRef.current = monaco;

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

    monaco.editor.defineTheme('calculator-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'identifier', foreground: '9CDCFE' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'operator', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.background': 'hsl(var(--card))',
        'editor.lineHighlightBackground': 'hsl(var(--muted) / 0.5)',
      },
    });

    monaco.editor.defineTheme('calculator-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000' },
        { token: 'identifier', foreground: '0000FF' },
        { token: 'number', foreground: '098658' },
        { token: 'operator', foreground: 'A31515' },
      ],
      colors: {
        'editor.background': 'hsl(var(--card))',
         'editor.lineHighlightBackground': 'hsl(var(--muted) / 0.5)',
      },
    });
  };

  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme === 'dark' ? 'calculator-dark' : 'calculator-light');
    }
  }, [theme]);

  return (
    <div className="min-h-[calc(100vh-12rem)] overflow-hidden flex flex-col bg-card border rounded-lg">
      <div className="p-0 flex-1 flex">
        <div className="flex flex-col md:flex-row flex-1">
          {/* Left Panel: Input Editor */}
          <div className="relative w-full md:w-3/4 flex flex-col">
            <div className="absolute top-4 right-4 z-10">
              <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="opacity-50 hover:opacity-100 transition-opacity">
                    <Sparkles className="mr-2 h-4 w-4 text-primary" />
                    Generate with AI
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form action={formAction}>
                    <DialogHeader>
                      <DialogTitle>Generate Calculator Note</DialogTitle>
                      <DialogDescription>
                        Describe what you want to calculate, and we&apos;ll create a template for you.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="prompt" className="text-right">
                          Prompt
                        </Label>
                        <Input
                          id="prompt"
                          name="prompt"
                          defaultValue="A trip with friends to split expenses"
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <GenerateButton />
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Editor
              height="100%"
              language="calculator"
              value={content}
              onMount={handleEditorDidMount}
              onChange={(value) => onContentChange(value || '')}
              theme={theme === 'dark' ? 'calculator-dark' : 'calculator-light'}
              loading={<Skeleton className="h-full w-full rounded-none" />}
              options={{
                fontFamily: "'Fira Code', monospace",
                fontSize: 14,
                lineHeight: 24,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                glyphMargin: false,
                folding: false,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
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
