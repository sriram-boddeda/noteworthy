'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkEmoji from 'remark-emoji';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

import { Mermaid } from './mermaid';
import { CopyButton } from './copy-button';
import { Textarea } from '@/components/ui/textarea';
import type { Components } from 'react-markdown';

function extractCodeText(children: React.ReactNode): string {
  let text = '';
  React.Children.forEach(children, (child) => {
    if (typeof child === 'string') text += child;
    else if (child && typeof child === 'object' && 'props' in child) {
      text += extractCodeText((child as any).props.children);
    }
  });
  return text.replace(/\n$/, '');
}

function splitMermaidBlocks(content: string) {
  const parts: { type: 'markdown' | 'mermaid'; content: string }[] = [];
  let lastIndex = 0;
  const regex = /```mermaid\s*\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'markdown', content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'mermaid', content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'markdown', content: content.slice(lastIndex) });
  }

  return parts;
}

const components: Components = {
  h1: (props) => <h1 className="border-b pb-2 font-headline" {...props} />,
  h2: (props) => <h2 className="border-b pb-2 font-headline" {...props} />,
  h3: (props) => <h3 className="border-b pb-1 font-headline" {...props} />,
  blockquote: (props) => (
    <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground" {...props} />
  ),
  a: (props) => <a className="text-primary hover:underline" {...props} />,
  code: (props) => {
    const { className, children, ...rest } = props;
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-muted text-muted-foreground rounded-sm px-1.5 py-1 font-mono text-xs" {...rest}>
          {children}
        </code>
      );
    }
    return (
      <code className={`font-code ${className || ''}`} {...rest}>
        {children}
      </code>
    );
  },
  pre: (props) => {
    const { children, ...rest } = props;
    const codeChild = Array.isArray(children) ? children[0] : children;
    const codeText = extractCodeText(codeChild);
    const lang = (codeChild as any)?.props?.className?.match(/language-(\w+)/)?.[1];
    return (
      <div className="not-prose my-4 overflow-hidden rounded-lg bg-[#282c34] text-sm">
        <div className="flex items-center justify-between bg-gray-700/50 px-4 py-1.5 text-xs text-gray-400">
          <span>{lang || 'code'}</span>
          <CopyButton text={codeText} />
        </div>
        <pre className="p-4 overflow-x-auto" {...rest}>
          {children}
        </pre>
      </div>
    );
  },
  table: (props) => (
    <div className="not-prose my-4 overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full border-collapse" {...props} />
    </div>
  ),
  thead: (props) => (
    <thead className="bg-muted/50" {...props} />
  ),
  tbody: (props) => (
    <tbody className="[&_tr:last-child]:border-b-0" {...props} />
  ),
  tr: (props) => (
    <tr className="border-b border-border" {...props} />
  ),
  th: (props) => (
    <th className="px-4 py-2.5 text-left text-sm font-semibold whitespace-nowrap" {...props} />
  ),
  td: (props) => (
    <td className="px-4 py-2.5 text-sm" {...props} />
  ),
};

export function MarkdownNote({ content, onContentChange }: MarkdownNoteProps) {
  const blocks = splitMermaidBlocks(content);

  return (
    <div className="min-h-[calc(100vh-12rem)] overflow-hidden bg-card border rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 h-full">
        {/* Editor Pane */}
        <div className="w-full relative h-full">
          <Textarea
            placeholder="Type your Markdown, LaTeX, and Mermaid diagrams here..."
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="h-full min-h-[50vh] md:min-h-[calc(100vh-12rem)] border-0 resize-none focus-visible:ring-0 p-6 font-mono text-sm leading-6 bg-card"
          />
        </div>

        {/* Preview Pane */}
        <div className="w-full p-6 prose prose-sm dark:prose-invert max-w-none overflow-auto min-h-[50vh] md:min-h-full bg-muted/20 border-t md:border-t-0 md:border-l">
          {blocks.map((block, i) =>
            block.type === 'mermaid' ? (
              <Mermaid key={i} chart={block.content} />
            ) : (
              <ReactMarkdown
                key={i}
                remarkPlugins={[remarkGfm, remarkMath, remarkEmoji]}
                rehypePlugins={[rehypeKatex, rehypeRaw, rehypeHighlight]}
                components={components}
              >
                {block.content}
              </ReactMarkdown>
            )
          )}
        </div>
      </div>
    </div>
  );
}

interface MarkdownNoteProps {
  content: string;
  onContentChange: (newContent: string) => void;
}