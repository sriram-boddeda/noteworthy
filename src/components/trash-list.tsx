
'use client';

import type { Note } from '@/lib/data';
import { noteTypeOptions } from '@/lib/data';
import { AnimatedBadge } from '@/components/motion/animated-badge';
import { Button } from '@/components/motion/button';
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
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Tag, Trash2, Undo } from 'lucide-react';
import { useAppContext } from '@/context/app-provider';
import { toast } from 'sonner';

interface TrashListProps {
  notes: Note[];
}

export function TrashList({ notes }: TrashListProps) {
  const { handleRestoreNote, handlePermanentDeleteNote } = useAppContext();

  const onRestore = (note: Note) => {
    handleRestoreNote(note.id);
  };

  const onPermanentDelete = (note: Note) => {
    handlePermanentDeleteNote(note.id);
    toast.error(`Permanently deleted "${note.title}"`);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => {
        const icon = noteTypeOptions.find(opt => opt.value === note.type)?.icon || <FileText className="size-4 shrink-0" />;
        return (
          <Card key={note.id} className="flex flex-col">
            <CardHeader className="flex-grow">
              <CardTitle className="flex items-baseline gap-2">
                {icon} <span>{note.title}</span>
              </CardTitle>
              <CardDescription className="line-clamp-3 pt-2">
                {note.content.replace(/<[^>]*>?/gm, ' ').substring(0, 150)}...
              </CardDescription>
              <div className="flex flex-wrap gap-1 pt-2">
                {note.tags.map(tag => (
                  <AnimatedBadge key={tag} status="neutral" icon={<Tag className="size-3" />} size="sm">{tag}</AnimatedBadge>
                ))}
              </div>
            </CardHeader>
            <CardFooter className="flex justify-end flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => onRestore(note)}>
                <Undo className="mr-2 size-4" />
                Restore
              </Button>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                        <Trash2 className="mr-2 size-4" />
                        Delete Forever
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the
                          note from existence.
                      </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onPermanentDelete(note)}>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  );
}
