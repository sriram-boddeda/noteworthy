
'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { useAppContext } from '@/context/app-provider';
import { MarkdownNote } from '@/components/markdown-note';
import { CalculatorNote } from '@/components/calculator-note';
import { RichTextNote } from '@/components/rich-text-note';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Download, Loader2, Pencil, PlusCircle, Share, Sparkles, Tag, Trash2, Volume2, X, MoreVertical, Move, Copy } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Breadcrumbs } from '@/components/breadcrumbs';
import { marked } from 'marked';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { formatDistanceToNow } from 'date-fns';


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

function ListenButton() {
    const { pending } = useFormStatus();
    return (
         <Button variant="outline" size="sm" type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
            Listen
        </Button>
    )
}

function SummarizeButton() {
    const { pending } = useFormStatus();
    return (
        <Button variant="outline" size="sm" type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
            Summarize
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
        handleUndoDelete,
        handleTitleChange, 
        handleUpdateSummary,
        handleMoveNote,
        handleCopyNote,
        aiTagAction, 
        aiTagState,
        aiTtsAction,
        aiTtsState,
        aiSummaryAction,
        aiSummaryState,
        isDataLoaded 
    } = useAppContext();

    const [isTagEditorOpen, setTagEditorOpen] = useState(false);
    const [isMoveDialogOpen, setMoveDialogOpen] = useState(false);
    const [isCopyDialogOpen, setCopyDialogOpen] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const ttsFormRef = useRef<HTMLFormElement>(null);
    const lastTtsTimestamp = useRef<number | undefined>();
    const lastSummaryTimestamp = useRef<number | undefined>();
    const lastTagTimestamp = useRef<number | undefined>();


    // Directly use the note from context. This is the single source of truth.
    const activeNote = useMemo(() => getNoteById(noteId), [getNoteById, noteId]);

    // Redirect if note is not found after data has finished loading.
    useEffect(() => {
        if (isDataLoaded && !activeNote) {
            router.push('/');
        }
    }, [isDataLoaded, activeNote, router]);

    // Handle state changes from the TTS action
    useEffect(() => {
        if (aiTtsState.timestamp && aiTtsState.timestamp !== lastTtsTimestamp.current) {
            if (aiTtsState.audioData) {
                setAudioUrl(aiTtsState.audioData);
                ttsFormRef.current?.reset();
            }
            lastTtsTimestamp.current = aiTtsState.timestamp;
        }
    }, [aiTtsState]);

    // Handle state changes from the Summarization action
    useEffect(() => {
        if (aiSummaryState.timestamp && aiSummaryState.timestamp !== lastSummaryTimestamp.current) {
            if (aiSummaryState.summary && activeNote) {
                handleUpdateSummary(activeNote.id, aiSummaryState.summary);
            }
            lastSummaryTimestamp.current = aiSummaryState.timestamp;
        }
    }, [aiSummaryState, activeNote, handleUpdateSummary]);
    
    // Handle state changes from the Tag suggestion action
    useEffect(() => {
        // Prevent updates if the timestamp is the same
        if (aiTagState.timestamp && aiTagState.timestamp !== lastTagTimestamp.current) {
            lastTagTimestamp.current = aiTagState.timestamp;
        }
    }, [aiTagState]);


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

    const lastModifiedText = useMemo(() => {
        if (!activeNote || typeof activeNote.lastModified !== 'number') {
            return '';
        }
        return formatDistanceToNow(new Date(activeNote.lastModified), { addSuffix: true });
    }, [activeNote]);

    const onContentChange = useCallback((newContent: string) => {
        if (!activeNote) return;
        handleContentChange(activeNote.id, newContent);
    }, [activeNote, handleContentChange]);
    
    const onUpdateTags = useCallback((newTags: string[]) => {
        if (!activeNote) return;
        handleUpdateTags(activeNote.id, newTags);
    }, [activeNote, handleUpdateTags]);
    
    const onTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!activeNote) return;
        handleTitleChange(activeNote.id, e.target.value);
    }, [activeNote, handleTitleChange]);

    const onDelete = useCallback(() => {
        if (!activeNote) return;
        const noteTitle = activeNote.title;
        handleDeleteNote(activeNote.id);
        router.push('/');
        toast.success(`Moved "${noteTitle}" to Trash`, {
            action: {
                label: "Undo",
                onClick: () => handleUndoDelete(),
            }
        })
    }, [activeNote, handleDeleteNote, handleUndoDelete, router]);

    const onMoveNote = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!activeNote) return;
        const formData = new FormData(e.currentTarget);
        const folderId = formData.get('folderId') as string;
        handleMoveNote(activeNote.id, folderId === 'none' ? null : folderId);
        setMoveDialogOpen(false);
    }, [activeNote, handleMoveNote]);
    
    const onCopyNote = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!activeNote) return;
        const formData = new FormData(e.currentTarget);
        const folderId = formData.get('folderId') as string;
        const newNote = handleCopyNote(activeNote.id, folderId === 'none' ? null : folderId);
        setCopyDialogOpen(false);
        if (newNote) {
            router.push(`/note/${newNote.id}`);
        }
    }, [activeNote, handleCopyNote, router]);


    const handleExport = useCallback(async (format: 'html' | 'pdf' | 'docx') => {
        if (!activeNote) return;

        if (format === 'docx') {
            toast.info("Feature not available", {
                description: `Exporting to DOCX is not yet supported.`,
            });
            return;
        }

        let htmlBody = '';
        if (activeNote.type === 'richtext') {
            htmlBody = activeNote.content;
        } else if (activeNote.type === 'markdown') {
            htmlBody = await marked.parse(activeNote.content);
        } else { // calculator
            htmlBody = `<pre style="font-family: monospace; white-space: pre-wrap;">${activeNote.content}</pre>`;
        }
        
        const fullHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${activeNote.title}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
                    .render-container { padding: 20px; max-width: 800px; margin: 0 auto; background-color: #fff; }
                    h1, h2, h3, h4, h5, h6 { color: #111; }
                    pre { background-color: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; white-space: pre-wrap; word-wrap: break-word; }
                    code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
                    th, td { border: 1px solid #dfe2e5; padding: .75rem; }
                    th { font-weight: 600; }
                    blockquote { color: #6a737d; border-left: .25em solid #dfe2e5; padding: 0 1em; margin-left: 0; }
                </style>
            </head>
            <body>
                <div class="render-container">
                    <h1>${activeNote.title}</h1>
                    <hr>
                    ${htmlBody}
                </div>
            </body>
            </html>`;
            
        if (format === 'html') {
            const blob = new Blob([fullHtml], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activeNote.title.replace(/[/\\?%*:|"<>]/g, '-')}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Export Successful", {
                description: `"${activeNote.title}" has been downloaded as an HTML file.`,
            });
            return;
        }
        
        if (format === 'pdf') {
             toast.info("Generating PDF...", {
                description: "This may take a moment.",
            });
            
            const exportContainer = document.createElement('div');
            exportContainer.style.position = 'absolute';
            exportContainer.style.left = '-9999px';
            exportContainer.innerHTML = fullHtml;
            document.body.appendChild(exportContainer);
            
            const contentToRender = exportContainer.querySelector('.render-container') as HTMLElement;
            if (!contentToRender) {
                 toast.error("PDF Export Failed", {
                    description: "Could not find content to render.",
                });
                document.body.removeChild(exportContainer);
                return;
            }

            try {
                const canvas = await html2canvas(contentToRender, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                });
                
                const imgData = canvas.toDataURL('image/png');
                
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: 'a4',
                });
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = imgWidth / pdfWidth;
                const finalImgHeight = imgHeight / ratio;
                
                let heightLeft = finalImgHeight;
                let position = 0;
                
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, finalImgHeight);
                heightLeft -= pdfHeight;

                while (heightLeft > 0) {
                    position = -(finalImgHeight - heightLeft);
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, finalImgHeight);
                    heightLeft -= pdfHeight;
                }

                pdf.save(`${activeNote.title.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`);

                toast.success("Export Successful", {
                    description: `"${activeNote.title}" has been downloaded as a PDF file.`,
                });

            } catch (error) {
                console.error("PDF generation failed", error);
                toast.error("PDF Export Failed", {
                    description: "An error occurred while generating the PDF.",
                });
            } finally {
                document.body.removeChild(exportContainer);
            }
        }
    }, [activeNote]);

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
        <div className="flex h-full flex-col">
            <header className="sticky top-0 z-10 flex flex-col gap-4 border-b bg-background p-4">
                {/* Main responsive row for title and actions */}
                <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div className="flex-1 space-y-1 min-w-0">
                        <Breadcrumbs items={breadcrumbs} />
                        <Input 
                            value={activeNote.title} 
                            onChange={onTitleChange}
                            placeholder="Untitled Note"
                            className="h-auto w-full truncate border-none bg-transparent p-0 font-headline text-2xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0 lg:text-3xl"
                        />
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                        {activeNote.type !== 'calculator' && (
                            <>
                                <form action={aiSummaryAction}>
                                    <input type="hidden" name="noteContent" value={activeNote.content} />
                                    <input type="hidden" name="noteType" value={activeNote.type} />
                                    <SummarizeButton />
                                </form>
                                <form action={aiTtsAction} ref={ttsFormRef}>
                                    <input type="hidden" name="noteContent" value={activeNote.content} />
                                    <input type="hidden" name="noteType" value={activeNote.type} />
                                    <ListenButton />
                                </form>
                            </>
                        )}
                        <Button variant="default" size="sm">
                            <Share className="mr-2 size-4" />
                            Share
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                <Download className="mr-2 size-4" />
                                Export
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Export as</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => handleExport('pdf')}>PDF</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleExport('docx')}>DOCX</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleExport('html')}>HTML</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="size-9">
                                    <MoreVertical className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => setMoveDialogOpen(true)}>
                                    <Move className="mr-2 size-4" />
                                    <span>Move Note</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setCopyDialogOpen(true)}>
                                    <Copy className="mr-2 size-4" />
                                    <span>Create Copy</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Metadata and delete action row */}
                <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                        {activeNote.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="cursor-default">
                                <Tag className="size-3 mr-1.5" />
                                {tag}
                            </Badge>
                        ))}
                        <Popover open={isTagEditorOpen} onOpenChange={setTagEditorOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7 rounded-full">
                                    <Pencil className="size-3.5" />
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
                                        {aiTagState.suggestedTags && aiTagState.suggestedTags.length > 0 && aiTagState.timestamp === lastTagTimestamp.current && (
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
                     <div className="flex items-center gap-4">
                        <p className="text-muted-foreground">Last updated {lastModifiedText}</p>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive-outline" size="sm">
                                    <Trash2 className="mr-2 size-4" />
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Move to Trash?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will move the note to the trash. You can restore it from there later.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onDelete}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                 {audioUrl && (
                    <div className="w-full pt-2">
                        <audio controls autoPlay src={audioUrl} className="w-full h-10" onEnded={() => setAudioUrl(null)}>
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                )}
            </header>
            
            <main className="flex-1 overflow-auto p-4">
                {activeNote.summary && (
                    <Alert className="relative mb-4 bg-primary/5 border-primary/20 [&>svg]:text-primary">
                        <BrainCircuit className="h-4 w-4" />
                        <AlertTitle className="flex justify-between items-center text-foreground">
                            <span>AI Summary</span>
                            <button
                                onClick={() => handleUpdateSummary(activeNote.id, null)}
                                className="p-1 rounded-md hover:bg-muted"
                                aria-label="Dismiss"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </AlertTitle>
                        <AlertDescription className="text-foreground/80">
                            {activeNote.summary}
                        </AlertDescription>
                    </Alert>
                )}
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

            <Dialog open={isMoveDialogOpen} onOpenChange={setMoveDialogOpen}>
                <DialogContent>
                    <form onSubmit={onMoveNote}>
                        <DialogHeader>
                            <DialogTitle>Move Note</DialogTitle>
                            <DialogDescription>Select a new folder for &quot;{activeNote.title}&quot;.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="folderId">Destination Folder</Label>
                            <Select name="folderId" defaultValue={activeNote.folderId || 'none'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a folder" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">(No Folder)</SelectItem>
                                    {folders.map(f => (
                                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Move Note</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isCopyDialogOpen} onOpenChange={setCopyDialogOpen}>
                <DialogContent>
                    <form onSubmit={onCopyNote}>
                        <DialogHeader>
                            <DialogTitle>Create a Copy</DialogTitle>
                            <DialogDescription>Select a destination folder for the new copy.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="folderId">Destination Folder</Label>
                            <Select name="folderId" defaultValue={activeNote.folderId || 'none'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a folder" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">(No Folder)</SelectItem>
                                    {folders.map(f => (
                                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                             <Button type="button" variant="ghost" onClick={() => setCopyDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Create Copy</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
