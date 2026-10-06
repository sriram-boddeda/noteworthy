
'use client';

import React from 'react';
import { Drawer } from '@/components/motion/drawer';
import type { Note } from '@/lib/data';
import { Button } from '@/components/motion/button';
import { ScrollArea } from './ui/scroll-area';
import { History, RotateCcw } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface NoteHistorySheetProps {
  note: Note | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRestore: (versionTimestamp: number) => void;
}

export function NoteHistorySheet({ note, isOpen, onOpenChange, onRestore }: NoteHistorySheetProps) {
  if (!note) return null;

  const allVersions = [...(note.versions || []), { timestamp: note.lastModified, content: note.content }]
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Drawer
      open={isOpen}
      onOpenChange={onOpenChange}
      side="right"
      ariaLabel="Version history"
      className="p-6 gap-4 sm:w-[28rem]"
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <History className="size-5" />
          Version History
        </h2>
        <p className="text-sm text-muted-foreground">
          Review and restore previous versions of &quot;{note.title}&quot;.
        </p>
      </div>
      <ScrollArea className="h-[calc(100%-8rem)] my-4 pr-4">
          <div className="space-y-4">
            {allVersions.length > 1 ? (
              allVersions.map((version, index) => (
                <div key={version.timestamp} className="flex items-start justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium text-sm">
                      {formatDistanceToNow(new Date(version.timestamp), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(version.timestamp), 'MMM d, yyyy, h:mm a')}
                    </p>
                    {index === 0 && (
                      <p className="text-xs font-semibold text-primary mt-1">(Current Version)</p>
                    )}
                  </div>
                  {index > 0 && (
                     <Button size="sm" variant="outline" onClick={() => onRestore(version.timestamp)}>
                        <RotateCcw className="mr-2 size-3.5" />
                        Restore
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground text-sm p-8">
                No previous versions found.
              </div>
            )}
          </div>
        </ScrollArea>
    </Drawer>
  );
}
