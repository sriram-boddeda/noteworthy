
'use client';

import { useParams, useRouter } from 'next/navigation';
import { NoteList } from '@/components/note-list';
import { useAppContext } from '@/context/app-provider';
import { Folder, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;
  const { folders, getNotesByFolderId, handleRenameFolder, handleDeleteFolder } = useAppContext();

  const [isRenameOpen, setRenameOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [deleteNotes, setDeleteNotes] = useState(false);


  const folder = useMemo(() => folders.find(f => f.id === folderId), [folders, folderId]);
  const notesInFolder = useMemo(() => getNotesByFolderId(folderId), [getNotesByFolderId, folderId]);

  const breadcrumbs = useMemo(() => {
    const crumbs = [{ href: '/', label: 'Home' }];
    if (folder) {
      crumbs.push({ href: `/folder/${folder.id}`, label: folder.name });
    }
    return crumbs;
  }, [folder]);

  const onRenameSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (folder) {
      const formData = new FormData(e.currentTarget);
      const newName = formData.get('newFolderName') as string;
      handleRenameFolder(folder.id, newName);
      setRenameOpen(false);
    }
  }, [folder, handleRenameFolder]);

  const onDeleteConfirm = useCallback(() => {
    if (folder) {
      handleDeleteFolder(folder.id, deleteNotes);
      setDeleteOpen(false);
      setDeleteNotes(false); // Reset for next time
      router.push('/');
    }
  }, [folder, deleteNotes, handleDeleteFolder, router]);


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
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Breadcrumbs items={breadcrumbs} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
                <Pencil className="mr-2 size-4" />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setDeleteOpen(true)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                <span>Delete Folder</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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

      <Dialog open={isRenameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <form onSubmit={onRenameSubmit}>
            <DialogHeader>
              <DialogTitle>Rename Folder</DialogTitle>
              <DialogDescription>
                Enter a new name for the folder &quot;{folder.name}&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="newFolderName" className="sr-only">Folder Name</Label>
              <Input
                id="newFolderName"
                name="newFolderName"
                defaultValue={folder.name}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setRenameOpen(false)}>Cancel</Button>
              <Button type="submit">Rename</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will move the folder &quot;{folder.name}&quot; to the trash.
              What should be done with the notes inside?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 my-4">
            <Checkbox
              id="delete-notes-checkbox"
              checked={deleteNotes}
              onCheckedChange={(checked) => setDeleteNotes(!!checked)}
            />
            <Label htmlFor="delete-notes-checkbox" className="font-normal cursor-pointer">
              Also move all notes inside this folder to the trash.
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteNotes(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm}>Delete Folder</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
