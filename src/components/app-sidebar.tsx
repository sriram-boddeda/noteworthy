
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/context/app-provider';
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
import { FileText, Plus, Folder, Tag, PlusCircle, FolderPlus, Home, History, Search, Trash2, MoreHorizontal, Pencil } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { noteTypeOptions, type Note, type Folder as FolderType } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { Skeleton } from './ui/skeleton';
import { ThemeToggle } from './theme-toggle';


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
      handleRenameFolder,
      handleDeleteFolder,
  } = useAppContext();

  const pathname = usePathname();
  const router = useRouter();

  const [isNewFolderOpen, setNewFolderOpen] = useState(false);
  const [isNewNoteOpen, setNewNoteOpen] = useState(false);
  const [isRenameOpen, setRenameOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const rootNotes = useMemo(() => getNotesByFolderId(null), [getNotesByFolderId]);
  const folderIds = useMemo(() => folders.map(f => f.id), [folders]);

  const filteredData = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();

    if (!searchQuery) {
        return {
            folders: folders.map(folder => ({
                ...folder,
                notes: notes.filter(n => n.folderId === folder.id).sort((a,b) => a.title.localeCompare(b.title)),
            })),
            rootNotes: notes.filter(n => !n.folderId).sort((a,b) => a.title.localeCompare(b.title)),
        };
    }

    const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(lowerCaseQuery));
    const filteredRootNotes = filteredNotes.filter(n => !n.folderId);
    
    const filteredFolders = folders.map(folder => ({
        ...folder,
        notes: filteredNotes.filter(n => n.folderId === folder.id),
    })).filter(folder => 
        folder.name.toLowerCase().includes(lowerCaseQuery) || folder.notes.length > 0
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

  const handleRenameSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingFolder) {
      const formData = new FormData(e.currentTarget);
      const newName = formData.get('newFolderName') as string;
      handleRenameFolder(editingFolder.id, newName);
      setRenameOpen(false);
      setEditingFolder(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (editingFolder) {
      handleDeleteFolder(editingFolder.id);
      setDeleteOpen(false);
      setEditingFolder(null);
    }
  };

  if (!isDataLoaded) {
    return (
      <Sidebar variant="inset" side="left" collapsible="icon">
        <SidebarHeader>
          <Link href="/" className="flex h-12 items-center gap-2 p-2">
            <NoteworthyIcon className="size-8 text-primary shrink-0" />
            <span className="text-xl font-headline font-semibold group-data-[collapsible=icon]:hidden">
              Noteworthy
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <div className="mb-2 flex items-center justify-between px-2">
            <h2 className="text-base font-semibold group-data-[collapsible=icon]:hidden">Workspace</h2>
          </div>
          <SidebarMenu>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </SidebarMenu>
          <div className="px-2 mt-4">
            <h2 className="text-base font-semibold mb-2 group-data-[collapsible=icon]:hidden">Tags</h2>
            <div className="flex flex-wrap gap-1.5 group-data-[collapsible=icon]:hidden">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex h-14 items-center gap-2 p-2">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
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
      <Sidebar variant="inset" side="left" collapsible="icon">
        <SidebarHeader>
            <Link href="/" className="flex h-12 items-center gap-2 p-2">
                <NoteworthyIcon className="size-8 text-primary shrink-0" />
                <span className="text-xl font-headline font-semibold group-data-[collapsible=icon]:hidden">
                Noteworthy
                </span>
            </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
            <div className="mb-2 flex items-center justify-between px-2">
                <h2 className="text-base font-semibold group-data-[collapsible=icon]:hidden">Workspace</h2>
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
                    placeholder="Search..." 
                    className="pl-8 h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname === '/'}
                        tooltip={{ children: "Home", side: "right" }}
                    >
                        <Link href="/">
                            <Home />
                            <span>Home</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname === '/trash'}
                        tooltip={{ children: "Trash", side: "right" }}
                    >
                        <Link href="/trash">
                            <Trash2 />
                            <span>Trash</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>

            <Accordion type="single" collapsible className="w-full" defaultValue="recents">
                <AccordionItem value="recents" className="border-none">
                    <AccordionTrigger className="px-2 py-1.5 text-sm font-medium hover:bg-sidebar-accent rounded-md hover:no-underline [&[data-state=open]>svg]:rotate-90 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                        <div className="flex items-center gap-2">
                            <History className="size-4" />
                            <span className="group-data-[collapsible=icon]:hidden">Recent</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 group-data-[collapsible=icon]:hidden">
                    <SidebarMenu>
                        {recentNotes.map((note) => {
                            const icon = noteTypeOptions.find((o) => o.value === note.type)?.icon ?? <FileText className="size-4" />;
                            return (
                                <SidebarMenuItem key={note.id}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === `/note/${note.id}`}
                                        tooltip={{ children: note.title, side: "right" }}
                                        className="pl-7"
                                    >
                                        <Link href={`/note/${note.id}`}>
                                            {icon}
                                            <span>{note.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        })}
                         {recentNotes.length === 0 && <p className="text-xs text-muted-foreground p-2 text-center">No recent notes.</p>}
                    </SidebarMenu>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>


            <SidebarMenu>
                 {filteredData.rootNotes.map((note) => {
                    const icon = noteTypeOptions.find((o) => o.value === note.type)?.icon ?? <FileText className="size-4" />;
                    return (
                        <SidebarMenuItem key={note.id}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === `/note/${note.id}`}
                                tooltip={{ children: note.title, side: "right" }}
                            >
                                <Link href={`/note/${note.id}`}>
                                    {icon}
                                    <span>{note.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                 })}
            </SidebarMenu>


          <Accordion type="multiple" defaultValue={folderIds} className="w-full">
            {filteredData.folders.map((folder) => (
              <AccordionItem value={folder.id} key={folder.id} className="border-none relative group/folder-item">
                <AccordionTrigger className="px-2 py-1.5 text-sm font-medium hover:bg-sidebar-accent rounded-md [&[data-state=open]>svg]:rotate-90 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                    <Link href={`/folder/${folder.id}`} className="flex items-center gap-2 flex-grow min-w-0" onClick={(e) => e.stopPropagation()}>
                        <Folder className="size-4" />
                        <span className="group-data-[collapsible=icon]:hidden truncate">{folder.name}</span>
                    </Link>
                </AccordionTrigger>
                <div className="absolute right-8 top-1 z-10 opacity-0 group-hover/folder-item:opacity-100 group-focus-within/folder-item:opacity-100 group-data-[collapsible=icon]:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent onClick={(e) => e.stopPropagation()} align="end">
                      <DropdownMenuItem onSelect={() => { setEditingFolder(folder); setRenameOpen(true); }}>
                        <Pencil className="mr-2 size-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => { setEditingFolder(folder); setDeleteOpen(true); }}
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <AccordionContent className="pt-1 group-data-[collapsible=icon]:hidden">
                  <SidebarMenu>
                    {folder.notes.map((note) => {
                       const icon = noteTypeOptions.find((o) => o.value === note.type)?.icon ?? <FileText className="size-4" />;
                       return (
                         <SidebarMenuItem key={note.id}>
                             <SidebarMenuButton
                               asChild
                               isActive={pathname === `/note/${note.id}`}
                               tooltip={{ children: note.title, side: "right" }}
                               className="pl-7"
                             >
                               <Link href={`/note/${note.id}`}>
                                   {icon}
                                   <span>{note.title}</span>
                               </Link>
                           </SidebarMenuButton>
                         </SidebarMenuItem>
                       )
                    })}
                  </SidebarMenu>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="px-2 mt-4">
              <h2 className="text-base font-semibold mb-2 group-data-[collapsible=icon]:hidden">Tags</h2>
              <div className="flex flex-wrap gap-1.5 group-data-[collapsible=icon]:hidden">
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
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-medium">User</span>
                        <span className="text-xs text-muted-foreground">user@example.com</span>
                    </div>
                </div>
                <ThemeToggle />
            </div>
        </SidebarFooter>
      </Sidebar>

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
      
      <Dialog open={isRenameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <form onSubmit={handleRenameSubmit}>
            <DialogHeader>
              <DialogTitle>Rename Folder</DialogTitle>
              <DialogDescription>
                Enter a new name for the folder &quot;{editingFolder?.name}&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="newFolderName" className="sr-only">Folder Name</Label>
              <Input
                id="newFolderName"
                name="newFolderName"
                defaultValue={editingFolder?.name}
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
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the folder &quot;{editingFolder?.name}&quot;. All notes inside it will be moved to your main notes list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEditingFolder(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete Folder</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
