
'use client';

import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Note } from '@/lib/data';
import { noteTypeOptions } from '@/lib/data';
import { Badge } from './ui/badge';
import { FileText, Tag } from 'lucide-react';

interface NoteListProps {
  notes: Note[];
}

export function NoteList({ notes }: NoteListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => {
        const icon = noteTypeOptions.find(opt => opt.value === note.type)?.icon || <FileText className="size-4" />;
        return (
            <Link href={`/note/${note.id}`} key={note.id}>
            <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader>
                <CardTitle className="flex items-baseline gap-2">
                    {icon} <span>{note.title}</span>
                </CardTitle>
                <CardDescription className="line-clamp-3 pt-2">
                    {note.content.replace(/<[^>]*>?/gm, ' ').substring(0, 150)}...
                </CardDescription>
                <div className="flex flex-wrap gap-1 pt-2">
                    {note.tags.map(tag => (
                    <Badge key={tag} variant="secondary"><Tag className="size-3 mr-1" />{tag}</Badge>
                    ))}
                </div>
                </CardHeader>
            </Card>
            </Link>
        )
      })}
    </div>
  );
}
