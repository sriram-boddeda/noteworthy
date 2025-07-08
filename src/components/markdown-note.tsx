'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface MarkdownNoteProps {
  content: string;
  onContentChange: (newContent: string) => void;
}

export function MarkdownNote({ content, onContentChange }: MarkdownNoteProps) {
  return (
    <div className="min-h-[calc(100vh-12rem)] overflow-hidden bg-card border rounded-lg">
      <div className="flex flex-col md:flex-row h-full">
        <div className="w-full md:w-1/2 relative">
          <Textarea
            placeholder="Type your Markdown and LaTeX here..."
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="h-full min-h-[50vh] md:min-h-[calc(100vh-12rem)] border-0 resize-none focus-visible:ring-0 p-4 font-mono text-sm leading-6 bg-card"
          />
        </div>
        <Separator orientation="horizontal" className="md:hidden" />
        <Separator orientation="vertical" className="hidden md:block" />
        <div className="w-full md:w-1/2 p-6 prose prose-sm dark:prose-invert max-w-none overflow-auto min-h-[50vh] md:min-h-full bg-card">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            components={{
              table: ({node, ...props}) => <table className="table-auto w-full" {...props} />,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
