
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
import { BrainCircuit, Download, Loader2, Pencil, PlusCircle, Share, Sparkles, Tag, Trash2, Volume2, X } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Breadcrumbs } from '@/components/breadcrumbs';
import { marked } from 'marked';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';


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
    const { toast } = useToast();
    
    const { 
        folders, 
        getNoteById, 
        handleContentChange, 
        handleUpdateTags, 
        handleDeleteNote, 
        handleTitleChange, 
        aiTagAction, 
        aiTagState,
        aiTtsAction,
        aiTtsState,
        aiSummaryAction,
        aiSummaryState,
        isDataLoaded 
    } = useAppContext();

    const [isTagEditorOpen, setTagEditorOpen] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const ttsFormRef = useRef<HTMLFormElement>(null);

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
        if (aiTtsState.audioData && aiTtsState.timestamp) {
            setAudioUrl(aiTtsState.audioData);
            ttsFormRef.current?.reset();
        }
    }, [aiTtsState]);

    // Handle state changes from the Summarization action
    useEffect(() => {
        if (aiSummaryState.summary && aiSummaryState.timestamp) {
            setSummary(aiSummaryState.summary);
        }
    }, [aiSummaryState]);


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
        handleDeleteNote(activeNote.id);
        router.push('/');
    }, [activeNote, handleDeleteNote, router]);

    const handleExport = useCallback(async (format: 'html' | 'pdf' | 'docx') => {
        if (!activeNote) return;

        if (format === 'docx') {
            toast({
                title: "Feature not available",
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

            toast({
                title: "Export Successful",
                description: `"${activeNote.title}" has been downloaded as an HTML file.`,
            });
            return;
        }
        
        if (format === 'pdf') {
             toast({
                title: "Generating PDF...",
                description: "This may take a moment.",
            });
            
            const exportContainer = document.createElement('div');
            exportContainer.style.position = 'absolute';
            exportContainer.style.left = '-9999px';
            exportContainer.innerHTML = fullHtml;
            document.body.appendChild(exportContainer);
            
            const contentToRender = exportContainer.querySelector('.render-container') as HTMLElement;
            if (!contentToRender) {
                 toast({
                    variant: "destructive",
                    title: "PDF Export Failed",
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

                toast({
                    title: "Export Successful",
                    description: `"${activeNote.title}" has been downloaded as a PDF file.`,
                });

            } catch (error) {
                console.error("PDF generation failed", error);
                toast({
                    variant: "destructive",
                    title: "PDF Export Failed",
                    description: "An error occurred while generating the PDF.",
                });
            } finally {
                document.body.removeChild(exportContainer);
            }
        }
    }, [activeNote, toast]);

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
                            <DropdownMenuItem onSelect={() => handleExport('pdf')}>PDF</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleExport('docx')}>DOCX</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleExport('html')}>HTML</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                 {audioUrl && (
                    <div className="w-full">
                        <audio controls autoPlay src={audioUrl} className="w-full h-10" onEnded={() => setAudioUrl(null)}>
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                )}
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
                {summary && (
                    <Alert className="relative mb-4">
                        <BrainCircuit className="h-4 w-4" />
                        <AlertTitle className="flex justify-between items-center">
                            <span>AI Summary</span>
                            <button
                                onClick={() => setSummary(null)}
                                className="p-1 rounded-md hover:bg-muted"
                                aria-label="Dismiss"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </AlertTitle>
                        <AlertDescription>
                            {summary}
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
        </>
    )
}
