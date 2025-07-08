'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { evaluateNotebook } from '@/lib/calculator';
import { Loader2, Sparkles } from 'lucide-react';
import { generateNoteAction, type GenerateNoteState } from '@/app/actions';

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
  const { toast } = useToast();
  const [state, formAction] = useActionState(generateNoteAction, initialState);
  const [isDialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (state.starterTemplate) {
      onContentChange(state.starterTemplate);
      setDialogOpen(false);
      toast({
        title: 'Template Generated!',
        description: 'Your calculator note is ready to use.',
      });
    }
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: state.error,
      });
    }
  }, [state, toast, onContentChange]);

  const { results, variables } = useMemo(() => evaluateNotebook(content), [content]);
  const lines = useMemo(() => content.split('\n'), [content]);

  const outputLines = useMemo(() => {
    const assignmentRegex = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/;
    return lines
      .map((line, index) => ({ line, index, result: results.get(index) }))
      .filter(({ result, line }) => {
        if (!result) return false;
        const isAssignment = assignmentRegex.test(line);
        // Keep if it's not an assignment, or if it's an assignment with an error
        return !isAssignment || (isAssignment && !!result.error);
      });
  }, [lines, results]);

  return (
    <div className="min-h-[calc(100vh-12rem)] overflow-hidden flex flex-col bg-card border rounded-lg">
      <div className="p-0 flex-1 flex">
        <div className="flex flex-col md:flex-row flex-1">
          {/* Left Panel: Input Editor */}
          <div className="w-full md:w-3/4 p-4 flex flex-col">
            <div className="flex justify-end mb-4">
              <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
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
            <Textarea
              placeholder="Type your calculations here... e.g., rent = 1200"
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="flex-grow border-0 resize-none focus-visible:ring-0 p-4 font-mono text-sm leading-6 bg-muted/30 rounded-md"
            />
          </div>
          <Separator orientation="horizontal" className="md:hidden" />
          <Separator orientation="vertical" className="hidden md:block" />
          {/* Right Panel: Output/Results */}
          <div className="w-full md:w-1/4 p-6 bg-muted/20 font-mono text-sm overflow-auto">
            {/* Variables Section */}
            <div className="mb-6">
              <h3 className="font-headline font-semibold text-lg mb-3 border-b pb-2 text-foreground/80">Variables</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {variables.size > 0 ? (
                  Array.from(variables.entries()).map(([name, value]) => (
                    <div key={name} className="flex justify-between items-baseline text-xs p-2 rounded-md bg-background/50">
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
              <h3 className="font-headline font-semibold text-lg mb-3 border-b pb-2 text-foreground/80">Live Output</h3>
              <div className="space-y-1">
                {outputLines.length > 0 ? (
                  outputLines.map(({ line, index, result }) => {
                    if (!result) return null;

                    return (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2.5 rounded-md transition-colors hover:bg-background/50 group"
                      >
                        <div className="flex items-center gap-x-4">
                           <span className="w-5 text-right font-mono text-xs text-muted-foreground select-none">{index + 1}</span>
                           <code className="text-muted-foreground text-sm" title={line}>
                            {line.trim() || <span className="text-muted-foreground/50 italic">empty line</span>}
                          </code>
                        </div>
                        
                        {result.error ? (
                            <span className="font-medium text-destructive text-xs text-right" title={result.error}>
                              {result.error}
                            </span>
                        ) : (
                          <span className="font-mono font-bold text-accent text-right text-lg">
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
