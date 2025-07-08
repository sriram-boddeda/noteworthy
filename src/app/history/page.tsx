
'use client';

import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { useAppContext } from '@/context/app-provider';
import { History } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { HistoryList } from '@/components/history-list';

export default function HistoryPage() {
  const { actionHistory } = useAppContext();
  
  const breadcrumbs = useMemo(() => {
    return [
      { href: '/', label: 'Home' },
      { href: `/history`, label: 'History' }
    ];
  }, []);


  return (
    <div>
      <header className="sticky top-0 z-10 flex flex-col items-start gap-4 border-b bg-background p-3">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Breadcrumbs items={breadcrumbs} />
          </div>
          <div className="flex items-center gap-2">
            <History className="size-6 text-muted-foreground" />
            <div>
              <h2 className="font-headline text-xl font-semibold">Activity History</h2>
              <p className="text-sm text-muted-foreground">
                A log of all recent actions taken in the application.
              </p>
            </div>
          </div>
      </header>
      <main className="flex-1 p-4">
        {actionHistory.length > 0 ? (
          <HistoryList history={actionHistory} />
        ) : (
           <div className="flex h-[calc(100vh-12rem)] items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
              <div className="text-center">
                  <p className="text-muted-foreground">No activity has been recorded yet.</p>
              </div>
          </div>
        )}
      </main>
    </div>
  );
}
