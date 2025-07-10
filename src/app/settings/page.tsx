
'use client';

import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Settings } from 'lucide-react';
import { SettingsForm } from './_components/settings-form';

export default function SettingsPage() {
    
  const breadcrumbs = useMemo(() => {
    return [
      { href: '/', label: 'Home' },
      { href: `/settings`, label: 'Settings' }
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
            <Settings className="size-6 text-muted-foreground" />
            <div>
              <h2 className="font-headline text-xl font-semibold">Settings</h2>
              <p className="text-sm text-muted-foreground">
                Manage your application preferences.
              </p>
            </div>
          </div>
      </header>
      <main className="flex-1 p-4">
        <div className="mx-auto max-w-2xl space-y-8">
            <SettingsForm />
        </div>
      </main>
    </div>
  );
}
