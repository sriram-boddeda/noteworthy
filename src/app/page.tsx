
'use client';

import { NoteList } from '@/components/note-list';
import { useAppContext } from '@/context/app-provider';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function Home() {
  const { notes: allNotes } = useAppContext();
  const breadcrumbs = [{ href: '/', label: 'Home' }];

  return (
    <div>
      <header className="sticky top-0 z-10 flex flex-col items-start gap-4 border-b bg-background p-3">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Breadcrumbs items={breadcrumbs} />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <h2 className="font-headline text-xl font-semibold">All Notes</h2>
              <p className="text-sm text-muted-foreground">A view of all your notes in one place.</p>
            </div>
          </div>
      </header>
      <main className="flex-1 p-4">
        {allNotes.length > 0 ? (
          <NoteList notes={allNotes} />
        ) : (
           <div className="flex h-[calc(100vh-12rem)] items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
              <div className="text-center">
                  <p className="text-muted-foreground">No notes yet.</p>
                  <p className="text-sm text-muted-foreground">Create a new one to get started.</p>
              </div>
          </div>
        )}
      </main>
    </div>
  )
}
