
'use client';

import { useParams } from 'next/navigation';
import { NoteList } from '@/components/note-list';
import { useAppContext } from '@/context/app-provider';
import { Folder } from 'lucide-react';
import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';

export default function FolderPage() {
  const params = useParams();
  const folderId = params.folderId as string;
  const { folders, getNotesByFolderId } = useAppContext();

  const folder = useMemo(() => folders.find(f => f.id === folderId), [folders, folderId]);
  const notesInFolder = useMemo(() => getNotesByFolderId(folderId), [getNotesByFolderId, folderId]);

  const breadcrumbs = useMemo(() => {
    const crumbs = [{ href: '/', label: 'Home' }];
    if (folder) {
      crumbs.push({ href: `/folder/${folder.id}`, label: folder.name });
    }
    return crumbs;
  }, [folder]);

  if (!folder) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Folder not found.</p>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 flex flex-col items-start gap-4 border-b bg-background p-3">
          <Breadcrumbs items={breadcrumbs} />
          <div className="flex items-center gap-2">
            <Folder className="size-6 text-muted-foreground" />
            <div>
              <h2 className="font-headline text-xl font-semibold">{folder.name}</h2>
              <p className="text-sm text-muted-foreground">{notesInFolder.length} notes in this folder.</p>
            </div>
          </div>
      </header>
      <main className="flex-1 p-4">
        {notesInFolder.length > 0 ? (
          <NoteList notes={notesInFolder} />
        ) : (
           <div className="flex h-[calc(100vh-12rem)] items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
              <div className="text-center">
                  <p className="text-muted-foreground">This folder is empty.</p>
                  <p className="text-sm text-muted-foreground">Create a new note to add it here.</p>
              </div>
          </div>
        )}
      </main>
    </div>
  );
}
