
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
import { Calculator, FileText, Plus, Folder, Tag, PlusCircle, FolderPlus, Home } from 'lucide-react';
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
import { noteTypeOptions, type Note } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { Skeleton } from './ui/skeleton';


export function AppSidebar() {
  const { folders, getNotesByFolderId, uniqueTags, handleCreateFolder, handleCreateNote, isDataLoaded } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();

  const [isNewFolderOpen, setNewFolderOpen] = useState(false);
  const [isNewNoteOpen, setNewNoteOpen] = useState(false);
  
  const rootNotes = getNotesByFolderId(null);
  const folderIds = useMemo(() => folders.map(f => f.id), [folders]);

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
                 {rootNotes.map((note) => {
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
            {folders.map((folder) => (
              <AccordionItem value={folder.id} key={folder.id} className="border-none">
                <AccordionTrigger className="px-2 py-1.5 text-sm font-medium hover:bg-sidebar-accent rounded-md [&[data-state=open]>svg]:rotate-90 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                    <Link href={`/folder/${folder.id}`} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Folder className="size-4" />
                        <span className="group-data-[collapsible=icon]:hidden">{folder.name}</span>
                    </Link>
                </AccordionTrigger>
                <AccordionContent className="pt-1 group-data-[collapsible=icon]:hidden">
                  <SidebarMenu>
                    {getNotesByFolderId(folder.id).map((note) => {
                       const icon = noteTypeOptions.find((o) => o.value === note.type)?.icon ?? <FileText className="size-4" />;
                       return (
                         <SidebarMenuItem key={note.id}>
                             <SidebarMenuButton
                               asChild
                               isActive={pathname === `/note/${note.id}`}
                               tooltip={{ children: note.title, side: "right" }}
                               className="ml-5"
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
            <div className="flex h-14 items-center gap-2 p-2">
                 <Avatar className="size-8 shrink-0">
                    <AvatarImage src="https://placehold.co/40x40" alt="User" data-ai-hint="profile picture"/>
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium">User</span>
                    <span className="text-xs text-muted-foreground">user@example.com</span>
                </div>
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
    </>
  );
}
