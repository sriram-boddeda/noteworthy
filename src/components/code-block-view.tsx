'use client';

import React, { useState } from 'react';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { Check, Clipboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const CodeBlockView = ({ node, updateAttributes, extension }: NodeViewProps) => {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (node.textContent) {
      navigator.clipboard.writeText(node.textContent).then(() => {
        setIsCopied(true);
        toast({ title: 'Code copied to clipboard!' });
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      });
    }
  };
  
  const languages = extension.options.lowlight.listLanguages();

  return (
    <NodeViewWrapper className="code-block-wrapper not-prose relative my-4 rounded-lg bg-[#282c34] text-sm text-gray-400">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <select
          contentEditable={false}
          defaultValue={node.attrs.language || 'auto'}
          onChange={(event) => updateAttributes({ language: event.target.value })}
          className="rounded-md border border-transparent bg-gray-600/80 px-2 py-1 text-xs text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="auto">auto</option>
          <option disabled>—</option>
          {languages.map((lang: string) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <button
          onClick={handleCopy}
          className="rounded-md bg-gray-600/80 p-1.5 text-white backdrop-blur-sm hover:bg-gray-500/80 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Copy code"
        >
          {isCopied ? <Check className="h-4 w-4 text-green-400" /> : <Clipboard className="h-4 w-4" />}
        </button>
      </div>
      <pre className="p-4">
        <NodeViewContent as="code" className="!bg-transparent font-code" />
      </pre>
    </NodeViewWrapper>
  );
};
