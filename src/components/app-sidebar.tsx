
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/context/app-provider';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type Active,
} from '@dnd-kit/core';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button';
import { NoteworthyIcon } from '@/components/icons';
import { FileText, Plus, Folder, Tag, PlusCircle, FolderPlus, Home, Clock, Search, Trash2, History, Lock, Palette } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { noteTypeOptions, type Note, type Folder as FolderType } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { Skeleton } from './ui/skeleton';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';


// Reusable Draggable component
function Draggable({ id, data, children }: { id: string, data: Record<string, any>, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data });
    const style = {
        // Opacity is managed by a class for better transition control
    };
    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn(isDragging && 'opacity-50')}>
            {children}
        </div>
    );
}

// Reusable Droppable component
function Droppable({
  id,
  children,
  className,
  activeDragType,
}: {
  id: string
  children: React.ReactNode
  className?: string
  activeDragType?: 'note' | 'folder'
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  const isDraggingNote = activeDragType === 'note';
  const isDraggingFolder = activeDragType === 'folder';

  const isFolderTarget = id.startsWith('folder-');
  const isHomeTarget = id === 'home-dropzone';
  const isTrashTarget = id === 'trash-dropzone';

  let showHighlight = false;
  let showLock = false;

  if (isOver) {
    // Highlight trash for anything
    if (isTrashTarget) {
      showHighlight = true;
    }
    // Highlight home and folders only for notes
    if ((isHomeTarget || isFolderTarget) && isDraggingNote) {
      showHighlight = true;
    }
    // Lock folders when dragging a folder over them
    if (isFolderTarget && isDraggingFolder) {
      showLock = true;
    }
    // Lock home when dragging a folder over it
    if (isHomeTarget && isDraggingFolder) {
        showLock = true;
    }
  }
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        'relative',
        showHighlight && 'drop-indicator-folder'
      )}
    >
      {children}
      {showLock && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-destructive/20 backdrop-blur-sm">
          <Lock className="size-6 text-destructive" />
        </div>
      )}
    </div>
  );
}


// Item Preview for DragOverlay
function ItemPreview({ item, type }: { item: Note | FolderType, type: 'note' | 'folder' }) {
    const icon = type === 'note'
        ? noteTypeOptions.find((o) => o.value === (item as Note).type)?.icon ?? <FileText className="size-4" />
        : <Folder className="size-4" />;

    return (
        <div className="flex items-center gap-2 rounded-md bg-sidebar p-2 text-sidebar-foreground shadow-lg">
            {icon}
            <span className="text-sm font-medium">{item.name || (item as Note).title}</span>
        </div>
    );
}

const parseSearchQuery = (query: string) => {
  const textParts: string[] = [];
  const tags: string[] = [];
  const types: string[] = [];
  const folders: string[] = [];

  const regex = /(tag:|type:|in:)([\w-]+)|"([^"]+)"|(\S+)/g;
  let match;

  while ((match = regex.exec(query)) !== null) {
    if (match[1] && match[2]) {
      const key = match[1].toLowerCase();
      const value = match[2].toLowerCase();
      if (key === 'tag:') tags.push(value);
      else if (key === 'type:') types.push(value);
      else if (key === 'in:') folders.push(value);
    } else if (match[3]) {
      textParts.push(match[3]);
    } else if (match[4]) {
      textParts.push(match[4]);
    }
  }

  return {
    text: textParts.join(' ').toLowerCase(),
    tags,
    types: types.filter(t => noteTypeOptions.some(o => o.value === t)) as Note['type'][],
    folders,
  };
};


export function AppSidebar() {
  const { 
      folders, 
      notes, 
      getNotesByFolderId, 
      uniqueTags, 
      handleCreateFolder, 
      handleCreateNote, 
      isDataLoaded, 
      recentNotes,
      handleDrop,
  } = useAppContext();

  const pathname = usePathname();
  const router = useRouter();

  const [isNewFolderOpen, setNewFolderOpen] = useState(false);
  const [isNewNoteOpen, setNewNoteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDragItem, setActiveDragItem] = useState<Active | null>(null);
  const activeDragType = activeDragItem?.data.current?.type as 'note' | 'folder' | undefined;
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const rootNotes = useMemo(() => getNotesByFolderId(null), [getNotesByFolderId]);
  const folderIds = useMemo(() => folders.map(f => f.id), [folders]);

  const filteredData = useMemo(() => {
    const { text, tags, types, folders: inFolders } = parseSearchQuery(searchQuery);

    if (!searchQuery) {
        return {
            folders: folders.map(folder => ({
                ...folder,
                notes: notes.filter(n => n.folderId === folder.id).sort((a,b) => a.title.localeCompare(b.title)),
            })),
            rootNotes: notes.filter(n => !n.folderId).sort((a,b) => a.title.localeCompare(b.title)),
        };
    }
    
    let filteredNotes = notes;

    if (tags.length > 0) {
      filteredNotes = filteredNotes.filter(note => tags.every(tag => note.tags.some(t => t.toLowerCase() === tag)));
    }
    if (types.length > 0) {
      filteredNotes = filteredNotes.filter(note => types.includes(note.type));
    }
    if (inFolders.length > 0) {
      const targetFolderIds = folders
        .filter(f => inFolders.includes(f.name.toLowerCase()))
        .map(f => f.id);
      filteredNotes = filteredNotes.filter(note => note.folderId && targetFolderIds.includes(note.folderId));
    }
    if (text) {
        filteredNotes = filteredNotes.filter(n => 
            n.title.toLowerCase().includes(text) || 
            n.content.toLowerCase().includes(text)
        );
    }
    
    const filteredRootNotes = filteredNotes.filter(n => !n.folderId);
    
    const filteredFolders = folders.map(folder => ({
        ...folder,
        notes: filteredNotes.filter(n => n.folderId === folder.id),
    })).filter(folder => 
        folder.name.toLowerCase().includes(text) || folder.notes.length > 0
    );

    return { folders: filteredFolders, rootNotes: filteredRootNotes };

  }, [searchQuery, notes, folders]);

  const handleCreateFolderSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const folderName = formData.get('folderName') as string;
    handleCreateFolder(folderName);
    setNewFolderOpen(false);
  };
  
  const handleCreateNoteSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const type = formData.get('type') as Note['type'];
    const folderId = formData.get('folderId') as string;
    
    const newNote = handleCreateNote(title, type, folderId === 'none' ? null : folderId);
    if (newNote) {
      setNewNoteOpen(false);
      router.push(`/note/${newNote.id}`);
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveDragItem(event.active);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    handleDrop(active, over);
    setActiveDragItem(null);
  };

  if (!isDataLoaded) {
    return (
      <Sidebar variant="floating" side="left" collapsible="offcanvas">
        <SidebarHeader>
          <Link href="/" className="flex h-12 items-center gap-2 p-2">
            <NoteworthyIcon className="size-8 text-primary shrink-0" />
            <span className="text-xl font-headline font-semibold">
              Noteworthy
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <div className="mb-2 flex items-center justify-between px-2">
            <h2 className="text-base font-semibold">Workspace</h2>
          </div>
          <SidebarMenu>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </SidebarMenu>
          <div className="px-2 mt-4">
            <h2 className="text-base font-semibold mb-2">Tags</h2>
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex h-14 items-center gap-2 p-2">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
    );
  }
  
  return (
    <>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <Sidebar variant="floating" side="left" collapsible="offcanvas">
            <SidebarHeader>
                <Link href="/" className="flex h-12 items-center gap-2 p-2">
                    <NoteworthyIcon className="size-8 text-primary shrink-0" />
                    <span className="text-xl font-headline font-semibold">
                    Noteworthy
                    </span>
                </Link>
            </SidebarHeader>
            <SidebarContent className="p-2">
                <div className="mb-2 flex items-center justify-between px-2">
                    <h2 className="text-base font-semibold">Workspace</h2>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 shrink-0">
                                <Plus className="size-4" />
                                <span className="sr-only">New</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => setNewNoteOpen(true)}>
                                <PlusCircle className="mr-2 size-4" />
                                New Note
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setNewFolderOpen(true)}>
                               <FolderPlus className="mr-2 size-4" />
                                New Folder
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="relative mb-2 px-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search notes..." 
                        className="pl-8 h-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            
                <SidebarMenu>
                    <Droppable id="home-dropzone" activeDragType={activeDragType}>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === '/'}
                            >
                                <Link href="/">
                                    <Home />
                                    <span>Home</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </Droppable>
                     <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname === '/history'}
                        >
                            <Link href="/history">
                                <History />
                                <span>History</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <Droppable id="trash-dropzone" activeDragType={activeDragType}>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === '/trash'}
                            >
                                <Link href="/trash">
                                    <Trash2 />
                                    <span>Trash</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </Droppable>
                </SidebarMenu>

                <Accordion type="single" collapsible className="w-full" defaultValue="recents">
                    <AccordionItem value="recents" className="border-none">
                        <AccordionTrigger className="px-2 py-1.5 text-sm font-medium hover:bg-sidebar-accent rounded-md hover:no-underline [&[data-state=open]>svg]:rotate-90">
                            <div className="flex items-center gap-2">
                                <Clock className="size-4" />
                                <span>Recent Notes</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1">
                        <SidebarMenu>
                            {recentNotes.map((note) => (
                                <SidebarMenuItem key={note.id}>
                                    <Draggable id={`note-${note.id}`} data={{ type: 'note', item: note }}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === `/note/${note.id}`}
                                            className="pl-7"
                                        >
                                            <Link href={`/note/${note.id}`}>
                                                {noteTypeOptions.find((o) => o.value === note.type)?.icon ?? <FileText className="size-4" />}
                                                <span>{note.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </Draggable>
                                </SidebarMenuItem>
                            ))}
                             {recentNotes.length === 0 && <p className="text-xs text-muted-foreground p-2 text-center">No recent notes.</p>}
                        </SidebarMenu>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <Droppable id="home-dropzone" activeDragType={activeDragType}>
                    <SidebarMenu>
                         {filteredData.rootNotes.map((note) => {
                            const icon = noteTypeOptions.find((o) => o.value === note.type)?.icon ?? <FileText className="size-4" />;
                            return (
                                <SidebarMenuItem key={note.id}>
                                    <Draggable id={`note-${note.id}`} data={{ type: 'note', item: note }}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === `/note/${note.id}`}
                                        >
                                            <Link href={`/note/${note.id}`}>
                                                {icon}
                                                <span>{note.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </Draggable>
                                </SidebarMenuItem>
                            )
                         })}
                    </SidebarMenu>
                </Droppable>


              <Accordion type="multiple" defaultValue={folderIds} className="w-full">
                {filteredData.folders.map((folder) => (
                  <Droppable key={folder.id} id={`folder-${folder.id}`} activeDragType={activeDragType}>
                    <AccordionItem value={folder.id} className="border-none relative group/folder-item">
                       <Draggable id={`folder-${folder.id}`} data={{ type: 'folder', item: folder }}>
                          <AccordionTrigger className="px-2 py-1.5 text-sm font-medium hover:bg-sidebar-accent rounded-md [&[data-state=open]>svg]:rotate-90">
                              <Link href={`/folder/${folder.id}`} className="flex items-center gap-2 flex-grow min-w-0" onClick={(e) => e.stopPropagation()}>
                                  <Folder className="size-4" />
                                  <span className="truncate">{folder.name}</span>
                              </Link>
                          </AccordionTrigger>
                      </Draggable>
                      <AccordionContent className="pt-1">
                        <SidebarMenu>
                          {folder.notes.map((note) => {
                             const icon = noteTypeOptions.find((o) => o.value === note.type)?.icon ?? <FileText className="size-4" />;
                             return (
                               <SidebarMenuItem key={note.id}>
                                  <Draggable id={`note-${note.id}`} data={{ type: 'note', item: note }}>
                                    <SidebarMenuButton
                                     asChild
                                     isActive={pathname === `/note/${note.id}`}
                                     className="pl-7"
                                   >
                                     <Link href={`/note/${note.id}`}>
                                         {icon}
                                         <span>{note.title}</span>
                                     </Link>
                                 </SidebarMenuButton>
                                 </Draggable>
                               </SidebarMenuItem>
                             )
                          })}
                        </SidebarMenu>
                      </AccordionContent>
                    </AccordionItem>
                  </Droppable>
                ))}
              </Accordion>
              <div className="px-2 mt-4">
                  <h2 className="text-base font-semibold mb-2">Tags</h2>
                  <div className="flex flex-wrap gap-1.5">
                      {uniqueTags.map(tag => (
                          <Link href={`/tag/${tag}`} key={tag}>
                            <Badge variant={pathname === `/tag/${tag}` ? "default" : "outline"} className="cursor-pointer hover:bg-sidebar-accent">{tag}</Badge>
                          </Link>
                      ))}
                  </div>
              </div>
            </SidebarContent>
            <SidebarFooter>
                <div className="flex h-14 items-center justify-between gap-2 p-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Avatar className="size-8 shrink-0">
                            <AvatarImage src="https://placehold.co/40x40" alt="User" data-ai-hint="profile picture"/>
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">User</span>
                            <span className="text-xs text-muted-foreground">user@example.com</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <ThemeToggle />
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
        <DragOverlay>
            {activeDragItem ? <ItemPreview item={activeDragItem.data.current?.item} type={activeDragItem.data.current?.type} /> : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={isNewFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
            <form onSubmit={handleCreateFolderSubmit}>
                <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                    <DialogDescription>Enter a name for your new folder.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="folderName">Folder Name</Label>
                    <Input id="folderName" name="folderName" autoFocus />
                </div>
                <DialogFooter>
                    <Button type="submit">Create Folder</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isNewNoteOpen} onOpenChange={setNewNoteOpen}>
        <DialogContent>
            <form onSubmit={handleCreateNoteSubmit}>
                <DialogHeader>
                    <DialogTitle>Create New Note</DialogTitle>
                    <DialogDescription>Fill in the details for your new note.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Note Title</Label>
                        <Input id="title" name="title" autoFocus />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Note Type</Label>
                        <Select name="type" defaultValue="richtext">
                            <SelectTrigger>
                                <SelectValue placeholder="Select a note type" />
                            </SelectTrigger>
                            <SelectContent>
                                {noteTypeOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="folderId">Folder</Label>
                        <Select name="folderId" defaultValue="none">
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
                </div>
                <DialogFooter>
                    <Button type="submit">Create Note</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
