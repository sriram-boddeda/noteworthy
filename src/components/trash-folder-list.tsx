
'use client';

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
  const { handleRestoreFolder, handlePermanentDeleteFolder } = useAppContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {folders.map((folder) => (
        <Card key={folder.id} className="flex flex-col">
          <CardHeader className="flex-grow">
            <CardTitle className="flex items-center gap-2">
              <FolderIcon className="size-5" /> {folder.name}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleRestoreFolder(folder.id)}>
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
  );
}
