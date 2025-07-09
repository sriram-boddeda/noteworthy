
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

import { Textarea } from '@/components/ui/textarea';

interface MarkdownNoteProps {
  content: string;
  onContentChange: (newContent: string) => void;
}

export function MarkdownNote({ content, onContentChange }: MarkdownNoteProps) {
  return (
    <div className="min-h-[calc(100vh-12rem)] overflow-hidden bg-card border rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 h-full">
        {/* Editor Pane */}
        <div className="w-full relative h-full">
          <Textarea
            placeholder="Type your Markdown and LaTeX here..."
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="h-full min-h-[50vh] md:min-h-[calc(100vh-12rem)] border-0 resize-none focus-visible:ring-0 p-6 font-mono text-sm leading-6 bg-card"
          />
        </div>
        
        {/* Preview Pane */}
        <div className="w-full p-6 prose prose-sm dark:prose-invert max-w-none overflow-auto min-h-[50vh] md:min-h-full bg-muted/20 border-t md:border-t-0 md:border-l">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            components={{
              h1: ({node, ...props}) => <h1 className="border-b pb-2 font-headline" {...props} />,
              h2: ({node, ...props}) => <h2 className="border-b pb-2 font-headline" {...props} />,
              h3: ({node, ...props}) => <h3 className="border-b pb-1 font-headline" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground" {...props} />,
              a: ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
              code: ({node, inline, className, children, ...props}) => {
                if (inline) {
                   return (
                    <code className="bg-muted text-muted-foreground rounded-sm px-1.5 py-1 font-mono text-xs" {...props}>
                        {children}
                    </code>
                   );
                }
                const match = /language-(\w+)/.exec(className || '');
                return (
                  <div className="not-prose my-4 overflow-hidden rounded-lg bg-[#282c34] text-sm">
                    {match && (
                        <div className="flex items-center justify-between bg-gray-700/50 px-4 py-1.5 text-xs text-gray-400">
                            <span>{match[1]}</span>
                        </div>
                    )}
                    <pre className="p-4 overflow-x-auto">
                      <code className="!bg-transparent font-code" {...props}>
                          {children}
                      </code>
                    </pre>
                  </div>
                );
              },
              table: ({node, ...props}) => (
                <div className="my-4 overflow-x-auto rounded-md border">
                    <table className="w-full border-collapse" {...props} />
                </div>
              ),
              th: ({node, ...props}) => (
                <th className="border-b px-4 py-2 text-left font-semibold" {...props} />
              ),
              td: ({node, ...props}) => (
                <td className="border-b px-4 py-2 align-top" {...props} />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
