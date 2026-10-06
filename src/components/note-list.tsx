
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Note } from '@/lib/data';
import { noteTypeOptions } from '@/lib/data';
import { AnimatedBadge } from '@/components/motion/animated-badge';
import { FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NoteListProps {
  notes: Note[];
}

export function NoteList({ notes }: NoteListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => {
        const icon = noteTypeOptions.find(opt => opt.value === note.type)?.icon || <FileText className="size-5 shrink-0" />;
        const description = note.summary || note.content.replace(/<[^>]*>?/gm, ' ').substring(0, 150);

        const lastModifiedText =
          note.lastModified && typeof note.lastModified === 'number'
            ? formatDistanceToNow(new Date(note.lastModified), { addSuffix: true })
            : null;

        return (
            <Link href={`/note/${note.id}`} key={note.id} className="block h-full">
            <Card className="group flex h-full flex-col border-border/60 transition-[translate,box-shadow,border-color] duration-(--duration-fast) ease-(--ease-smooth-out) hover:-translate-y-1 hover:border-border hover:shadow-xl">
                <div className="flex h-full flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            {icon}
                            <span className="truncate font-headline text-lg">{note.title}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow pb-4">
                         <CardDescription className="line-clamp-3 text-sm">
                            {description}{description.length >= 150 && '...'}
                        </CardDescription>
                    </CardContent>
                    <CardFooter className="flex justify-between items-end text-xs text-muted-foreground pt-0">
                        <div className="flex flex-wrap items-center gap-1">
                            {note.tags.slice(0, 2).map(tag => (
                                <AnimatedBadge key={tag} status="neutral" showIcon={false} size="sm" className="font-normal">{tag}</AnimatedBadge>
                            ))}
                            {note.tags.length > 2 && (
                                <AnimatedBadge status="neutral" showIcon={false} size="sm" className="font-normal text-muted-foreground">+{note.tags.length - 2}</AnimatedBadge>
                            )}
                        </div>
                        {lastModifiedText && <span>{lastModifiedText}</span>}
                    </CardFooter>
                </div>
            </Card>
            </Link>
        )
      })}
    </div>
  );
}
