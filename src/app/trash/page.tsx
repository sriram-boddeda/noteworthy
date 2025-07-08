
'use client';

import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { TrashList } from '@/components/trash-list';
import { useAppContext } from '@/context/app-provider';
import { Trash2 } from 'lucide-react';

export default function TrashPage() {
  const { trashedNotes } = useAppContext();
  
  const breadcrumbs = useMemo(() => {
    return [
      { href: '/', label: 'Home' },
      { href: `/trash`, label: 'Trash' }
    ];
  }, []);

  return (
    <div>
      <header className="sticky top-0 z-10 flex flex-col items-start gap-4 border-b bg-background p-3">
          <Breadcrumbs items={breadcrumbs} />
          <div className="flex items-center gap-2">
            <Trash2 className="size-6 text-muted-foreground" />
            <div>
              <h2 className="font-headline text-xl font-semibold">Trash</h2>
              <p className="text-sm text-muted-foreground">
                Notes in trash will be permanently deleted after 30 days.
              </p>
            </div>
          </div>
      </header>
      <main className="flex-1 p-4">
        {trashedNotes.length > 0 ? (
          <TrashList notes={trashedNotes} />
        ) : (
           <div className="flex h-[calc(100vh-12rem)] items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
              <div className="text-center">
                  <p className="text-muted-foreground">The trash is empty.</p>
              </div>
          </div>
        )}
      </main>
    </div>
  );
}
