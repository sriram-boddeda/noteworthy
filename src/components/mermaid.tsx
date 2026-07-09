'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

export function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      mermaid.run({ nodes: [ref.current] });
    }
  }, [chart]);

  return (
    <div className="my-4 flex justify-center overflow-x-auto">
      <div ref={ref} className="mermaid not-prose">
        {chart}
      </div>
    </div>
  );
}