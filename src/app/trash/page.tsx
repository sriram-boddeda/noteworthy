
'use client';

import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { TrashList } from '@/components/trash-list';
import { useAppContext } from '@/context/app-provider';
import { Folder, Trash2 } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { TrashFolderList } from '@/components/trash-folder-list';

export default function TrashPage() {
  const { trashedNotes, trashedFolders } = useAppContext();
  
  const breadcrumbs = useMemo(() => {
    return [
      { href: '/', label: 'Home' },
      { href: `/trash`, label: 'Trash' }
    ];
  }, []);

  const hasContent = trashedNotes.length > 0 || trashedFolders.length > 0;

  return (
    <div>
      <header className="sticky top-0 z-10 flex flex-col items-start gap-4 border-b bg-background p-3">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Breadcrumbs items={breadcrumbs} />
          </div>
          <div className="flex items-center gap-2">
            <Trash2 className="size-6 text-muted-foreground" />
            <div>
              <h2 className="font-headline text-xl font-semibold">Trash</h2>
              <p className="text-sm text-muted-foreground">
                Items in trash will be permanently deleted after 30 days.
              </p>
            </div>
          </div>
      </header>
      <main className="flex-1 p-4">
        {hasContent ? (
          <div className="space-y-8">
            {trashedFolders.length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <Folder className="size-5 text-muted-foreground" />
                  Trashed Folders
                </h3>
                <TrashFolderList folders={trashedFolders} />
              </div>
            )}
             {trashedNotes.length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <Trash2 className="size-5 text-muted-foreground" />
                  Trashed Notes
                </h3>
                <TrashList notes={trashedNotes} />
              </div>
            )}
          </div>
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
