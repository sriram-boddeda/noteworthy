'use client';

import React, { useCallback, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-provider';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
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
  SidebarSeparator,
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
import { FileText, Plus, Folder, PlusCircle, FolderPlus, Home, Clock, Search, Trash2, History, BookOpen, Settings, Pencil, Copy, Move } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import { Draggable, Droppable, ItemPreview, type DraggableData, type DragKind } from '@/components/dnd';
import { useActiveDragIds } from '@/hooks/use-active-drag-ids';
import { Skeleton } from './ui/skeleton';
import { ThemeToggle } from './theme-toggle';
import { NoteHistorySheet } from './note-history-sheet';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';


// Draggable, Droppable, and ItemPreview now live in @/components/dnd so they
// can be reused and tested in isolation.


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


// =============================================================================
// Per-row components
// =============================================================================
//
// Each row component owns its own lightweight state (`usePathname`,
// `useRouter`, `useAppContext`) so AppSidebar's hook count stays constant
// regardless of how many sibling rows exist (this prevents the
// "Rendered more hooks than during the previous render" rules-of-hooks
// error that the previous implementation triggered when AccordionItems
// collapsed). The interaction model is: single click navigates, right-click
// (or two-finger trackpad tap) opens the row's context menu via the
// controlled `open={menuOpen}` Radix DropdownMenu.

/**
 * Discriminated payload identifying which row's context menu is open.
 *
 * Notes are keyed by their FULL ROW id (`rowKey`) — the per-source-prefixed
 * dragId string (`recent-note-{id}`, `root-note-{id}`, or
 * `folder-{fid}-note-{nid}`) — rather than just `note.id`. The same note
 * can render in multiple sidebar sections concurrently (recents AND root
 * AND/OR inside an expanded folder), and the previous `id`-only scheme
 * caused every duplicate row to open its DropdownMenu simultaneously,
 * producing stacked popovers where only one captured clicks correctly.
 *
 * Folders and trash are keyed by `id` / discriminator alone, because each
 * is rendered at most once in the sidebar (one AccordionItem per folder,
 * one Trash row total).
 */
type OpenMenu =
  | { kind: 'note'; rowKey: string }
  | { kind: 'folder'; id: string }
  | { kind: 'trash' }
  | null;

interface SidebarTrashRowProps {
  menuOpen: boolean;
  /** Force-open this row's menu (called from the row's `onContextMenu`). */
  onOpenMenu: () => void;
  /** React to Radix's onOpenChange (click outside, Esc, programmatic close). */
  onOpenChange: (open: boolean) => void;
  trashedCount: number;
  /** Parent-provided: opens the confirm-Empty-Trash dialog. */
  onRequestEmptyTrash: () => void;
}

function SidebarTrashRow({
  menuOpen,
  onOpenMenu,
  onOpenChange,
  trashedCount,
  onRequestEmptyTrash,
}: SidebarTrashRowProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname === '/trash';
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={(e) => {
          // macOS trackpad "Tap to click" + "Secondary click with two
          // fingers" can fire BOTH `click` and `contextmenu` from the same
          // gesture. Ignore any non-primary button so right-click / two-finger
          // tap opens the menu without also navigating.
          if (e.button !== 0) return;
          router.push('/trash');
        }}
        onContextMenu={(e) => {
          // Suppress the OS / browser context menu and open our Radix
          // dropdown instead.
          e.preventDefault();
          onOpenMenu();
        }}
        className={cn(
          'font-semibold select-none',
          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
        )}
      >
        <Trash2 />
        <span>Trash</span>
        {trashedCount > 0 && (
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {trashedCount}
          </span>
        )}
      </SidebarMenuButton>
      <DropdownMenu open={menuOpen} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger
          // Anchor used by Radix Popper for floating-content positioning.
          // `absolute inset-0` fills the row (and the surrounding SidebarMenuItem
          // already has `position: relative`); `opacity-0 pointer-events-none`
          // keeps it invisible AND ensures all clicks pass through to the
          // SidebarMenuButton above (right-click is handled on the button).
          className="absolute inset-0 opacity-0 pointer-events-none"
          tabIndex={-1}
          aria-label="Trash actions"
        />
        <DropdownMenuContent side="right" align="start" className="w-48">
          <DropdownMenuItem
            onSelect={onRequestEmptyTrash}
            disabled={trashedCount === 0}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive data-[disabled]:opacity-50 data-[disabled]:pointer-events-none"
          >
            <Trash2 className="mr-2 size-4" />
            Empty Trash
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

interface SidebarNoteRowProps {
  note: Note;
  /** Per-source-prefixed unique drag id (e.g. `recent-note-{id}`, `folder-{fid}-note-{nid}`). */
  dragId: string;
  /** Active note drag id, used by Draggable to dim clones. */
  activeNoteId: string | null;
  menuOpen: boolean;
  onOpenMenu: () => void;
  onOpenChange: (open: boolean) => void;
  /** Parent-provided: opens the version-history sheet for this note. */
  onRequestVersionHistory: (note: Note) => void;
  /** Extra classes to merge onto the SidebarMenuButton (e.g. `pl-7` for in-folder rows). */
  extraClassName?: string;
}

function SidebarNoteRow({
  note,
  dragId,
  activeNoteId,
  menuOpen,
  onOpenMenu,
  onOpenChange,
  onRequestVersionHistory,
  extraClassName,
}: SidebarNoteRowProps) {
  const pathname = usePathname();
  const router = useRouter();
  // Pulled in here so the row can render a "Move to..." submenu of available
  // folders and dispatch Create-Copy without prop-drilling through AppSidebar.
  const {
    handleDeleteNote,
    handleUndoDelete,
    handleCopyNote,
    handleMoveNote,
    folders,
  } = useAppContext();
  const isActive = pathname === `/note/${note.id}`;
  const icon =
    noteTypeOptions.find((o) => o.value === note.type)?.icon ??
    <FileText className="size-4" />;
  return (
    <SidebarMenuItem>
      <Draggable
        id={dragId}
        data={{ type: 'note', item: note }}
        activeType="note"
        activeId={activeNoteId}
      >
        <SidebarMenuButton
          isActive={isActive}
          onClick={(e) => {
            if (e.button !== 0) return;
            router.push(`/note/${note.id}`);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            onOpenMenu();
          }}
          className={cn(
            extraClassName,
            'select-none',
            isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold',
          )}
        >
          {icon}
          <span>{note.title}</span>
        </SidebarMenuButton>
        <DropdownMenu open={menuOpen} onOpenChange={onOpenChange}>
          <DropdownMenuTrigger
            className="absolute inset-0 opacity-0 pointer-events-none"
            tabIndex={-1}
            aria-label={`Actions for ${note.title}`}
          />
          <DropdownMenuContent side="right" align="start" className="w-48">
            <DropdownMenuItem
              onSelect={() => {
                // `note.folderId` is `string | null | undefined` (the `?` in
                // data.ts makes it optional); handleCopyNote expects
                // `string | null`, so coerce `undefined` to `null`.
                const copy = handleCopyNote(note.id, note.folderId ?? null);
                onOpenChange(false);
                if (copy) router.push(`/note/${copy.id}`);
              }}
            >
              <Copy className="mr-2 size-4" />
              Create a Copy
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Move className="mr-2 size-4" />
                Move to
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                <DropdownMenuItem
                  onSelect={() => {
                    handleMoveNote(note.id, null);
                    onOpenChange(false);
                  }}
                  disabled={note.folderId == null}
                >
                  <Home className="mr-2 size-4" />
                  Home
                </DropdownMenuItem>
                {folders.map((f) => (
                  <DropdownMenuItem
                    key={f.id}
                    onSelect={() => {
                      handleMoveNote(note.id, f.id);
                      onOpenChange(false);
                    }}
                    disabled={f.id === note.folderId}
                  >
                    <Folder className="mr-2 size-4" />
                    {f.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem
              onSelect={() => {
                onOpenChange(false);
                onRequestVersionHistory(note);
              }}
            >
              <History className="mr-2 size-4" />
              Version History
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                handleDeleteNote(note.id);
                toast.success(`Moved "${note.title}" to Trash`, {
                  action: { label: 'Undo', onClick: () => handleUndoDelete() },
                });
                onOpenChange(false);
              }}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Move to Trash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Draggable>
    </SidebarMenuItem>
  );
}

interface SidebarFolderRowProps {
  /** Folder with its currently-filtered `notes` array already resolved by the parent. */
  folder: FolderType & { notes: Note[] };
  dimmedFolderId: string | null;
  activeDragType: DragKind | undefined;
  activeNoteId: string | null;
  /** This folder's own menu state (parent-derived boolean). */
  menuOpen: boolean;
  onOpenMenu: () => void;
  onOpenChange: (open: boolean) => void;
  onRequestRename: (folder: FolderType) => void;
  onRequestDelete: (folder: FolderType) => void;
  /** Parent-provided: opens the New-Note dialog pre-targeted to this folder. */
  onRequestNewNoteInFolder: (folder: FolderType) => void;
  /**
   * Shared `openMenu` discriminated-union + setter, threaded through so the
   * inner note rows rendered inside this folder's AccordionContent can each
   * derive their own per-note boolean + open callbacks.
   */
  openMenu: OpenMenu;
  setOpenMenu: (m: OpenMenu) => void;
  /** Forwarded so inner note rows can open the version-history sheet. */
  onRequestVersionHistory: (note: Note) => void;
}

function SidebarFolderRow({
  folder,
  dimmedFolderId,
  activeDragType,
  activeNoteId,
  menuOpen,
  onOpenMenu,
  onOpenChange,
  onRequestRename,
  onRequestDelete,
  onRequestNewNoteInFolder,
  openMenu,
  setOpenMenu,
  onRequestVersionHistory,
}: SidebarFolderRowProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname.startsWith(`/folder/${folder.id}`);
  return (
    <Droppable id={`folder-${folder.id}`} activeDragType={activeDragType}>
      <AccordionItem value={folder.id} className="border-none relative group/folder-item">
        <Draggable
          id={`folder-${folder.id}`}
          data={{ type: 'folder', item: folder }}
          activeType="folder"
          activeId={dimmedFolderId}
        >
          <AccordionTrigger
            onClick={(e) => {
              if (e.button !== 0) return;
              router.push(`/folder/${folder.id}`);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              onOpenMenu();
            }}
            className={cn(
              'w-full justify-start rounded-md px-2 py-2 text-sm font-medium hover:bg-sidebar-accent [&[data-state=open]>svg]:rotate-90 select-none',
              isActive && 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground',
            )}
          >
            <div className="flex flex-1 items-center gap-2">
              <Folder className="size-4" />
              <span className="truncate">{folder.name}</span>
            </div>
          </AccordionTrigger>
          <DropdownMenu open={menuOpen} onOpenChange={onOpenChange}>
            <DropdownMenuTrigger
              className="absolute inset-0 opacity-0 pointer-events-none"
              tabIndex={-1}
              aria-label={`Actions for folder ${folder.name}`}
            />
            <DropdownMenuContent side="right" align="start" className="w-48">
              <DropdownMenuItem
                onSelect={() => {
                  onOpenChange(false);
                  onRequestNewNoteInFolder(folder);
                }}
              >
                <FolderPlus className="mr-2 size-4" />
                New Note in this Folder
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => { onRequestRename(folder); onOpenChange(false); }}
              >
                <Pencil className="mr-2 size-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => { onRequestDelete(folder); onOpenChange(false); }}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                Move to Trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Draggable>
        {folder.notes.length > 0 && (
          <AccordionContent className="pt-1">
            <SidebarMenu>
              {folder.notes.map((note) => {
                // Per-row identity keyed by the same dragId we attach to the
                // Draggable, so duplicate listings (recents AND inside-folder)
                // don't open their DropdownMenu simultaneously.
                const rowKey = `folder-${folder.id}-note-${note.id}`;
                return (
                  <SidebarNoteRow
                    key={note.id}
                    note={note}
                    dragId={rowKey}
                    activeNoteId={activeNoteId}
                    menuOpen={openMenu?.kind === 'note' && openMenu.rowKey === rowKey}
                    onOpenMenu={() => setOpenMenu({ kind: 'note', rowKey })}
                    onOpenChange={(open) =>
                      setOpenMenu(open ? { kind: 'note', rowKey } : null)
                    }
                    onRequestVersionHistory={onRequestVersionHistory}
                    extraClassName="pl-7"
                  />
                );
              })}
            </SidebarMenu>
          </AccordionContent>
        )}
      </AccordionItem>
    </Droppable>
  );
}


export function AppSidebar() {
  const {
      folders,
      notes,
      trashedNotes,
      trashedFolders,
      uniqueTags,
      handleCreateFolder,
      handleCreateNote,
      handleDeleteFolder,
      handleRenameFolder,
      handleEmptyTrash,
      isDataLoaded,
      recentNotes,
      handleDrop,
      handleRestoreVersion,
      settings,
  } = useAppContext();

  const pathname = usePathname();
  const router = useRouter();

  const [isNewFolderOpen, setNewFolderOpen] = useState(false);
  const [isNewNoteOpen, setNewNoteOpen] = useState(false);
  /** When non-null, the New-Note dialog opens with `<Select name="folderId">` defaulting to this folder. */
  const [newNoteFolderPrefill, setNewNoteFolderPrefill] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDragItem, setActiveDragItem] = useState<Active | null>(null);
  // See useActiveDragIds for full semantics; wires up the dim/highlight
  // signals consumed by every Droppable / Draggable in this sidebar.
  const { activeDragType, activeNoteId, dimmedFolderId } =
    useActiveDragIds(activeDragItem);

  // Discriminated-union state for which row's right-click menu is open.
  // AppSidebar owns it; each row receives a per-row derived boolean +
  // open-change callback so the discriminator shape stays here.
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  // Confirmation / rename dialogs, hoisted out of the row maps so each is
  // mounted exactly once regardless of row count.
  const [folderToRename, setFolderToRename] = useState<FolderType | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<FolderType | null>(null);
  const [pendingEmptyTrash, setPendingEmptyTrash] = useState(false);
  /** When non-null, the NoteHistorySheet is open and showing this note. */
  const [historyNote, setHistoryNote] = useState<Note | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

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
      setNewNoteFolderPrefill(null);
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

  const handleConfirmFolderDelete = () => {
    if (!folderToDelete) return;
    handleDeleteFolder(folderToDelete.id, true);
    setFolderToDelete(null);
  };

  const handleConfirmFolderRename = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!folderToRename) return;
    const newName = (new FormData(e.currentTarget).get('newFolderName') as string) ?? '';
    if (newName.trim()) {
      handleRenameFolder(folderToRename.id, newName.trim());
    }
    setFolderToRename(null);
  };

  const handleConfirmEmptyTrash = () => {
    handleEmptyTrash();
    setPendingEmptyTrash(false);
  };

  /** Open the New-Note dialog prefilled with this folder. */
  const requestNewNoteInFolder = useCallback((folder: FolderType) => {
    setNewNoteFolderPrefill(folder.id);
    setNewNoteOpen(true);
  }, []);

  /** Open the NoteHistorySheet for `note`. */
  const requestVersionHistory = useCallback((note: Note) => {
    setHistoryNote(note);
  }, []);

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
          <div className="flex h-14 items-center justify-end gap-2 p-2">
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </SidebarFooter>
      </Sidebar>
    );
  }

  const trashedCount = trashedNotes.length + trashedFolders.length;

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
                                <PlusCircle className="mr-2 size-4" /> New Note
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setNewFolderOpen(true)}>
                               <FolderPlus className="mr-2 size-4" /> New Folder
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
                                className={cn("font-semibold", pathname === '/' && "bg-sidebar-accent text-sidebar-accent-foreground")}
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
                            className={cn("font-semibold", pathname === '/history' && "bg-sidebar-accent text-sidebar-accent-foreground")}
                        >
                            <Link href="/history">
                                <History />
                                <span>History</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <Droppable id="trash-dropzone" activeDragType={activeDragType}>
                      <SidebarTrashRow
                        menuOpen={openMenu?.kind === 'trash'}
                        onOpenMenu={() => setOpenMenu({ kind: 'trash' })}
                        onOpenChange={(open) => setOpenMenu(open ? { kind: 'trash' } : null)}
                        trashedCount={trashedCount}
                        onRequestEmptyTrash={() => setPendingEmptyTrash(true)}
                      />
                    </Droppable>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname === '/docs'}
                            className={cn("font-semibold", pathname === '/docs' && "bg-sidebar-accent text-sidebar-accent-foreground")}
                        >
                            <Link href="/docs">
                                <BookOpen />
                                <span>Docs</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <SidebarSeparator className="my-2 mx-2" />

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
                            {recentNotes.map((note) => {
                              // Per-row identity keyed by the same dragId we
                              // attach to the Draggable, so duplicate listings
                              // (recents AND root AND/OR inside an expanded
                              // folder) don't open their DropdownMenu simultaneously.
                              const rowKey = `recent-note-${note.id}`;
                              return (
                                <SidebarNoteRow
                                  key={note.id}
                                  note={note}
                                  dragId={rowKey}
                                  activeNoteId={activeNoteId}
                                  extraClassName="pl-7"
                                  menuOpen={openMenu?.kind === 'note' && openMenu.rowKey === rowKey}
                                  onOpenMenu={() => setOpenMenu({ kind: 'note', rowKey })}
                                  onOpenChange={(open) => setOpenMenu(open ? { kind: 'note', rowKey } : null)}
                                  onRequestVersionHistory={requestVersionHistory}
                                />
                              );
                            })}
                            {recentNotes.length === 0 && (
                              <p className="text-xs text-muted-foreground p-2 text-center">No recent notes.</p>
                            )}
                          </SidebarMenu>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <SidebarMenu>
                    {filteredData.rootNotes.map((note) => {
                      // Per-row identity key (same dragId we attach to the
                      // Draggable) — see recents map comment for the
                      // duplicate-render rationale.
                      const rowKey = `root-note-${note.id}`;
                      return (
                        <SidebarNoteRow
                          key={note.id}
                          note={note}
                          dragId={rowKey}
                          activeNoteId={activeNoteId}
                          menuOpen={openMenu?.kind === 'note' && openMenu.rowKey === rowKey}
                          onOpenMenu={() => setOpenMenu({ kind: 'note', rowKey })}
                          onOpenChange={(open) => setOpenMenu(open ? { kind: 'note', rowKey } : null)}
                          onRequestVersionHistory={requestVersionHistory}
                        />
                      );
                    })}
                </SidebarMenu>

                <Accordion type="multiple" defaultValue={folderIds} className="w-full">
                    {filteredData.folders.map((folder) => (
                      <SidebarFolderRow
                        key={folder.id}
                        folder={folder}
                        dimmedFolderId={dimmedFolderId}
                        activeDragType={activeDragType}
                        activeNoteId={activeNoteId}
                        menuOpen={openMenu?.kind === 'folder' && openMenu.id === folder.id}
                        onOpenMenu={() => setOpenMenu({ kind: 'folder', id: folder.id })}
                        onOpenChange={(open) => setOpenMenu(open ? { kind: 'folder', id: folder.id } : null)}
                        onRequestRename={setFolderToRename}
                        onRequestDelete={setFolderToDelete}
                        onRequestNewNoteInFolder={requestNewNoteInFolder}
                        openMenu={openMenu}
                        setOpenMenu={setOpenMenu}
                        onRequestVersionHistory={requestVersionHistory}
                      />
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
            <SidebarFooter className="p-2">
                <SidebarSeparator className="mb-2" />
                <div className="flex items-center justify-between">
                    <Link
                        href="/settings"
                        className={cn(
                            "flex items-center justify-center size-9 rounded-full transition-colors",
                            pathname === '/settings'
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                    >
                        <Settings className="h-4 w-4" />
                    </Link>
                    <ThemeToggle />
                </div>
            </SidebarFooter>
        </Sidebar>
        <DragOverlay>
            {activeDragItem ? (
              // Cast: @dnd-kit's Active.data.current is typed loosely as AnyData;
              // the value is the DraggableData we attached via useDraggable.
              <ItemPreview data={activeDragItem.data.current as DraggableData | undefined} />
            ) : null}
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
                        <Select name="type" defaultValue={settings.defaultNoteType}>
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
                        <Select name="folderId" defaultValue={newNoteFolderPrefill ?? 'none'}>
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

      {/* Folder rename dialog — triggered from right-click menu on a folder. */}
      <Dialog
        open={folderToRename !== null}
        onOpenChange={(open) => { if (!open) setFolderToRename(null); }}
      >
        <DialogContent>
          <form onSubmit={handleConfirmFolderRename}>
            <DialogHeader>
              <DialogTitle>Rename Folder</DialogTitle>
              <DialogDescription>
                Enter a new name for the folder &quot;{folderToRename?.name}&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="newFolderName" className="sr-only">Folder Name</Label>
              <Input
                id="newFolderName"
                name="newFolderName"
                defaultValue={folderToRename?.name ?? ''}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setFolderToRename(null)}>Cancel</Button>
              <Button type="submit">Rename</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Folder delete confirmation — triggered from right-click menu on a folder. */}
      <AlertDialog
        open={folderToDelete !== null}
        onOpenChange={(open) => { if (!open) setFolderToDelete(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Move &quot;{folderToDelete?.name}&quot; and all its notes to the Trash. You can restore them later from the Trash page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmFolderDelete}>
              Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty trash confirmation — triggered from right-click menu on Trash row. */}
      <AlertDialog
        open={pendingEmptyTrash}
        onOpenChange={setPendingEmptyTrash}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Empty trash?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete all {trashedNotes.length} note{plur(trashedNotes.length)} and {trashedFolders.length} folder{plur(trashedFolders.length)} in trash. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEmptyTrash}>
              Empty Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Version history — opened from right-click menu on a note row,
          or from inside a folder's expanded notes. */}
      <NoteHistorySheet
        note={historyNote}
        isOpen={historyNote !== null}
        onOpenChange={(open) => { if (!open) setHistoryNote(null); }}
        onRestore={(timestamp) => {
          if (historyNote) handleRestoreVersion(historyNote.id, timestamp);
        }}
      />
    </>
  );
}

function plur(n: number): string {
  return n === 1 ? '' : 's';
}
