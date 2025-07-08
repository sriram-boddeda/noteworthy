
'use client';

import { useMemo, useState } from 'react';
import type { Folder } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  const notesInFolder = useMemo(() => {
    const folderId = folderToRestore?.id || folderToDelete?.id;
    if (!folderId) return [];
    return getTrashedNotesByFolderId(folderId);
  }, [folderToRestore, folderToDelete, getTrashedNotesByFolderId]);

  const onRestoreClick = (folder: Folder) => {
    const notesInFolder = getTrashedNotesByFolderId(folder.id);
    if (notesInFolder.length > 0) {
      setFolderToRestore(folder);
    } else {
      handleRestoreFolder(folder.id, false);
    }
  };
  
  const onDeleteClick = (folder: Folder) => {
    const notesInFolder = getTrashedNotesByFolderId(folder.id);
    if (notesInFolder.length > 0) {
      setFolderToDelete(folder);
    } else {
      handlePermanentDeleteFolder(folder.id, false);
    }
  };

  const onRestoreConfirm = (restoreNotes: boolean) => {
    if (folderToRestore) {
      handleRestoreFolder(folderToRestore.id, restoreNotes);
    }
    setFolderToRestore(null);
  };
  
  const onDeleteConfirm = (deleteNotes: boolean) => {
    if (folderToDelete) {
      handlePermanentDeleteFolder(folderToDelete.id, deleteNotes);
    }
    setFolderToDelete(null);
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
              <Button variant="destructive-outline" size="sm" onClick={() => onDeleteClick(folder)}>
                <Trash2 className="mr-2 size-4" />
                Delete Forever
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!folderToRestore} onOpenChange={(open) => !open && setFolderToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              The folder &quot;{folderToRestore?.name}&quot; contains {notesInFolder.length} note(s) that are also in the trash.
              What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="secondary"
              onClick={() => onRestoreConfirm(false)}
            >
              Restore Folder Only
            </AlertDialogAction>
            <AlertDialogAction onClick={() => onRestoreConfirm(true)}>
              Restore Folder and Notes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The folder &quot;{folderToDelete?.name}&quot; contains {notesInFolder.length} note(s) in the trash.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
               variant="secondary"
              onClick={() => onDeleteConfirm(false)}
            >
              Delete Folder Only
            </AlertDialogAction>
            <AlertDialogAction 
                variant="destructive"
                onClick={() => onDeleteConfirm(true)}
            >
                Delete Folder & Notes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
