
'use client';

import { useMemo, useState } from 'react';
import type { Folder } from '@/lib/data';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder as FolderIcon, Trash2, Undo } from 'lucide-react';
import { useAppContext } from '@/context/app-provider';

interface TrashFolderListProps {
  folders: Folder[];
}

export function TrashFolderList({ folders }: TrashFolderListProps) {
  const { handleRestoreFolder, handlePermanentDeleteFolder, getTrashedNotesByFolderId } = useAppContext();
  const [folderToRestore, setFolderToRestore] = useState<Folder | null>(null);

  const notesInFolderToRestore = useMemo(() => {
    if (!folderToRestore) return [];
    return getTrashedNotesByFolderId(folderToRestore.id);
  }, [folderToRestore, getTrashedNotesByFolderId]);

  const onRestoreClick = (folder: Folder) => {
    const notesInFolder = getTrashedNotesByFolderId(folder.id);
    if (notesInFolder.length > 0) {
      setFolderToRestore(folder);
    } else {
      handleRestoreFolder(folder.id, false);
    }
  };

  const onRestoreConfirm = (restoreNotes: boolean) => {
    if (folderToRestore) {
      handleRestoreFolder(folderToRestore.id, restoreNotes);
    }
    setFolderToRestore(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {folders.map((folder) => (
          <Card key={folder.id} className="flex flex-col">
            <CardHeader className="flex-grow">
              <CardTitle className="flex items-baseline gap-2">
                <FolderIcon className="size-5 shrink-0" /> <span>{folder.name}</span>
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex justify-end flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => onRestoreClick(folder)}>
                <Undo className="mr-2 size-4" />
                Restore
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive-outline" size="sm">
                    <Trash2 className="mr-2 size-4" />
                    Delete Forever
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the folder
                      and ALL notes inside it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handlePermanentDeleteFolder(folder.id)}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!folderToRestore} onOpenChange={(open) => !open && setFolderToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              The folder &quot;{folderToRestore?.name}&quot; contains {notesInFolderToRestore.length} note(s) that are also in the trash.
              What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
             <Button variant="outline" onClick={() => onRestoreConfirm(false)}>
              Restore Folder Only
            </Button>
            <AlertDialogAction onClick={() => onRestoreConfirm(true)}>
              Restore Folder and Notes
            </Button>
            <AlertDialogCancel className="sm:ml-auto mt-2 sm:mt-0">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
