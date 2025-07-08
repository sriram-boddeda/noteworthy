
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { useAppContext } from '@/context/app-provider';
import { MarkdownNote } from '@/components/markdown-note';
import { CalculatorNote } from '@/components/calculator-note';
import { RichTextNote } from '@/components/rich-text-note';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Pencil, PlusCircle, Share, Sparkles, Tag, Trash2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
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
import { Breadcrumbs } from '@/components/breadcrumbs';


const noteComponentMap = {
  calculator: CalculatorNote,
  markdown: MarkdownNote,
  richtext: RichTextNote,
};

function AiSuggestButton() {
    const { pending } = useFormStatus();
    return (
        <Button size="sm" type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Suggest Tags
        </Button>
    )
}

export default function NotePage() {
    const params = useParams();
    const router = useRouter();
    const noteId = params.noteId as string;
    
    const { 
        folders, 
        getNoteById, 
        handleContentChange, 
        handleUpdateTags, 
        handleDeleteNote, 
        handleTitleChange, 
        aiTagAction, 
        aiTagState,
        isDataLoaded 
    } = useAppContext();

    const [isTagEditorOpen, setTagEditorOpen] = useState(false);

    // Directly use the note from context. This is the single source of truth.
    const activeNote = getNoteById(noteId);

    // Redirect if note is not found after data has finished loading.
    useEffect(() => {
        if (isDataLoaded && !activeNote) {
            router.push('/');
        }
    }, [isDataLoaded, activeNote, router]);


    const breadcrumbs = useMemo(() => {
        if (!activeNote) return [];
        const crumbs = [{ href: '/', label: 'Home' }];
        if (activeNote.folderId) {
            const folder = folders.find(f => f.id === activeNote.folderId);
            if (folder) {
                crumbs.push({ href: `/folder/${folder.id}`, label: folder.name });
            }
        }
        crumbs.push({ href: `/note/${activeNote.id}`, label: activeNote.title.length > 25 ? `${activeNote.title.substring(0, 25)}...` : activeNote.title });
        return crumbs;
    }, [activeNote, folders]);

    const onContentChange = (newContent: string) => {
        if (!activeNote) return;
        handleContentChange(activeNote.id, newContent);
    };
    
    const onUpdateTags = (newTags: string[]) => {
        if (!activeNote) return;
        handleUpdateTags(activeNote.id, newTags);
    }
    
    const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!activeNote) return;
        handleTitleChange(activeNote.id, e.target.value);
    }

    const onDelete = () => {
        if (!activeNote) return;
        handleDeleteNote(activeNote.id);
        router.push('/');
    }

    const ActiveNoteComponent = activeNote ? noteComponentMap[activeNote.type] : null;

    // Show a loader while data is loading from localStorage or if the note doesn't exist yet.
    if (!isDataLoaded || !activeNote) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <>
            <header className="sticky top-0 z-10 flex flex-col items-start gap-4 border-b bg-background p-3">
                <Breadcrumbs items={breadcrumbs} />
                <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex items-baseline gap-2">
                            <Input 
                                value={activeNote.title} 
                                onChange={onTitleChange}
                                className="font-headline text-xl font-semibold border-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive-outline" size="sm">
                                    <Trash2 className="mr-2 size-4" />
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your
                                    note and remove your data from our servers.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onDelete}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button variant="outline" size="sm">
                        <Share className="mr-2 size-4" />
                        Share
                        </Button>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="default" size="sm">
                            <Download className="mr-2 size-4" />
                            Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Export as</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>PDF</DropdownMenuItem>
                            <DropdownMenuItem>DOCX</DropdownMenuItem>
                            <DropdownMenuItem>HTML</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>
            <div className="p-4 border-b">
                 <div className="flex items-center gap-2">
                    {activeNote.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                            <Tag className="size-3 mr-1" />
                            {tag}
                        </Badge>
                    ))}
                    <Popover open={isTagEditorOpen} onOpenChange={setTagEditorOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-6">
                                <Pencil className="size-3" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <form action={aiTagAction} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tags-input">Edit Tags</Label>
                                    <p className="text-sm text-muted-foreground">Separate tags with a comma.</p>
                                    <Input 
                                        id="tags-input"
                                        defaultValue={activeNote.tags.join(', ')}
                                        onChange={(e) => onUpdateTags(e.target.value.split(','))}
                                    />
                                </div>
                                <input type="hidden" name="noteContent" value={activeNote.content} />
                                <input type="hidden" name="existingTags" value={activeNote.tags.join(',')} />
                                <div className="flex flex-col space-y-2">
                                    <AiSuggestButton />
                                    {aiTagState.suggestedTags && aiTagState.suggestedTags.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Suggestions:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {aiTagState.suggestedTags.map(tag => (
                                                    <Button type="button" key={tag} size="sm" variant="outline" onClick={() => onUpdateTags([...activeNote.tags, tag])}>
                                                        <PlusCircle className="mr-2 size-3" />
                                                        {tag}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <main className="flex-1 p-4">
                {ActiveNoteComponent ? (
                    <ActiveNoteComponent 
                        key={activeNote.id}
                        content={activeNote.content}
                        onContentChange={onContentChange}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
                        <div className="text-center">
                            <p className="text-muted-foreground">Select a note from the sidebar</p>
                        </div>
                    </div>
                )}
            </main>
        </>
    )
}
