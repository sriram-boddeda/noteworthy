
'use client';

import { useParams } from 'next/navigation';
import { NoteList } from '@/components/note-list';
import { useAppContext } from '@/context/app-provider';
import { Tag } from 'lucide-react';
import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function TagPage() {
  const params = useParams();
  const tagName = useMemo(() => decodeURIComponent(params.tagName as string), [params.tagName]);
  const { getNotesByTag } = useAppContext();

  const notesWithTag = useMemo(() => getNotesByTag(tagName), [getNotesByTag, tagName]);
  
  const breadcrumbs = useMemo(() => {
    return [
      { href: '/', label: 'Home' },
      { href: `/tag/${tagName}`, label: tagName }
    ];
  }, [tagName]);

  return (
    <div>
      <header className="sticky top-0 z-10 flex flex-col items-start gap-4 border-b bg-background p-3">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Breadcrumbs items={breadcrumbs} />
          </div>
          <div className="flex items-center gap-2">
            <Tag className="size-6 text-muted-foreground" />
            <div>
              <h2 className="font-headline text-xl font-semibold">Notes tagged with &quot;{tagName}&quot;</h2>
              <p className="text-sm text-muted-foreground">{notesWithTag.length} notes found.</p>
            </div>
          </div>
      </header>
      <main className="flex-1 p-4">
        {notesWithTag.length > 0 ? (
          <NoteList notes={notesWithTag} />
        ) : (
           <div className="flex h-[calc(100vh-12rem)] items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
              <div className="text-center">
                  <p className="text-muted-foreground">No notes found with this tag.</p>
              </div>
          </div>
        )}
      </main>
    </div>
  );
}
