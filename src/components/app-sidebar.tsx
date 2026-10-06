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
import { AnimatedBadge } from "@/components/motion/animated-badge"
import { Button } from '@/components/motion/button';
import { NoteworthyIcon } from '@/components/icons';
import { FileText, Plus, Folder, PlusCircle, FolderPlus, Home, Clock, Search, Trash2, History, BookOpen, Settings, Pencil, Copy, Move } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
import { CenterMorphModal, CenterMorphModalContent } from '@/components/motion/center-morph-modal';
import { Input } from '@/components/motion/input';
import { Label } from './ui/label';
// Radix Select stays for the New-Note dialog: its portalled, collision-aware
// panel survives the modal's clip-path; beUI's in-panel dropdown would clip.
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
 * Notes are keyed by their FULL ROW id (`rowKey`, see the `noteRowKey`
 * helper below for canonical per-source-prefixed strings) rather than
 * just `note.id`. The same note can render in multiple sidebar sections
 * concurrently (recents AND root AND/OR inside an expanded folder), and
 * the previous `id`-only scheme caused every duplicate row to open its
 * DropdownMenu simultaneously, producing stacked popovers where only one
 * captured clicks correctly.
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

/**
 * Per-row identity helpers for note rows. Each factory returns a
 * `rowKey` that distinguishes the same note rendered in different
 * sidebar sections.
 *
 * INVARIANT — read this before adding a NEW section that lists notes
 * UNIQUE per-source prefix. NEVER key `openMenu` (or any future per-row
 * UI state — inline editors, row-level toggles, etc.) by `note.id`
 * alone. The same note can render in multiple sections simultaneously
 * (recents AND root AND/OR inside an expanded folder), and an `id`-only
 * key causes every duplicate row to open / activate its row-level UI
 * simultaneously.
 *
 * Once defined, the same `rowKey` value MUST be reused for the row's
 * `dragId`, its `menuOpen` discriminator check, and its `onOpenMenu` /
 * `onOpenChange` callbacks. The AppSidebar render code already extracts
 * `const rowKey = noteRowKey.X(...)` once per row to enforce this —
 * copy that shape.
 */
// Each return is `as const` so the inferred type is a narrow template-
// literal (`` `recent-note-${string}` ``, etc.) instead of a generic
// `string`. The per-section prefix is then visible in IDE hover /
// intellisense, and a future discriminated-callback signature can
// constrain rowKey by section without an extra cast.
const noteRowKey = {
  recent: (noteId: string) => `recent-note-${noteId}` as const,
  root: (noteId: string) => `root-note-${noteId}` as const,
  folder: (folderId: string, noteId: string) =>
    `folder-${folderId}-note-${noteId}` as const,
};

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
          'font-semibold select-none transition-colors',
          // While the row's menu is open, treat the row as fully
          // 'selected' too — same fill + foreground + weight as the
          // active-route treatment — so right-clicked rows read as the
          // unambiguous source of the menu regardless of route state.
          // Ring is additive; a single `bg-` rule avoids the
          // order-dependent CSS conflict the previous split had.
          (isActive || menuOpen) && 'bg-sidebar-accent text-sidebar-accent-foreground',
          menuOpen && 'ring-2 ring-sidebar-ring/60',
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
        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={0}
          // `rounded-l-none` keeps the dropdown's left edge sharp so it
          // sits flush against the source row, forming a continuous visual
          // chain rather than two close-but-separate shapes. The 2px left
          // accent (`border-l-sidebar-ring/60`) matches the row's ring
          // color, completing the accent line.
          className="w-48 rounded-r-md rounded-l-none border-l-2 border-l-sidebar-ring/60"
        >
          <DropdownMenuLabel className="px-2 pt-2 pb-1 flex items-center gap-1.5 min-w-0 text-xs font-semibold text-muted-foreground">
            <Trash2 className="size-3 shrink-0" />
            <span>Trash</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
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
  // Clone the row's type-specific icon at size 3 for the dropdown header
  // so the menu label visually keys to the same icon the user right-clicked
  // (matches the Trash `Trash2` and Folder `Folder` icon header pattern).
  // The double-cast (`as unknown as`) is defensive against `noteTypeOptions`
  // `.icon` being typed as a wider `ReactNode` union — TS can't otherwise
  // narrow from `ReactNode` directly.
  const menuLabelIcon = React.isValidElement(icon)
    ? React.cloneElement(
        icon as unknown as React.ReactElement<{ className?: string }>,
        { className: 'size-3 shrink-0' },
      )
    : icon;
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
            'select-none transition-colors',
            // Mirror of the trash + folder anchor pattern: when the
            // row's menu is open, mirror the active-route style so the
            // source row reads as fully selected. Single `bg-` rule
            // keeps the rendered stylesheet unambiguous; ring is
            // additive for the open-menu signal.
            (isActive || menuOpen) && 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold',
            menuOpen && 'ring-2 ring-sidebar-ring/60',
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
          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={0}
            // `rounded-l-none` keeps the dropdown's left edge sharp so it
            // sits flush against the source row, forming a continuous visual
            // chain. The 2px left accent (`border-l-sidebar-ring/60`)
            // matches the row's ring color, completing the accent line.
            className="w-48 rounded-r-md rounded-l-none border-l-2 border-l-sidebar-ring/60"
          >
            <DropdownMenuLabel className="px-2 pt-2 pb-1 flex items-center gap-1.5 min-w-0 text-xs font-semibold text-muted-foreground">
              {menuLabelIcon}
              <span className="truncate max-w-[14rem]">{note.title}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
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
              'w-full justify-start rounded-md px-2 py-2 text-sm font-medium hover:bg-sidebar-accent [&[data-state=open]>svg]:rotate-90 select-none transition-colors',
              // Mirror of the note + trash row anchor pattern: when the
              // folder row's menu is open, mirror the active-route style
              // so the source row reads as fully selected. Single `bg-`
              // rule keeps the rendered stylesheet unambiguous; the
              // base `font-medium` upgrades to `font-semibold` here.
              (isActive || menuOpen) && 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground',
              menuOpen && 'ring-2 ring-sidebar-ring/60',
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
            <DropdownMenuContent
              side="right"
              align="start"
              sideOffset={0}
              // `rounded-l-none` keeps the dropdown's left edge sharp so it
              // sits flush against the source folder row, forming a
              // continuous visual chain. The 2px left accent
              // (`border-l-sidebar-ring/60`) matches the row's ring color.
              className="w-48 rounded-r-md rounded-l-none border-l-2 border-l-sidebar-ring/60"
            >
              <DropdownMenuLabel className="px-2 pt-2 pb-1 flex items-center gap-1.5 min-w-0 text-xs font-semibold text-muted-foreground">
                <Folder className="size-3 shrink-0" />
                <span className="truncate max-w-[14rem]">{folder.name}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
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
                // Per-row identity from the canonical helper (see
                // noteRowKey above). Same value feeds this row's
                // `dragId`, `menuOpen`, and open/openChange callbacks.
                const rowKey = noteRowKey.folder(folder.id, note.id);
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

  // Dropping outside every droppable fires no onDragEnd, so a drag that ends
  // over the page or is cancelled (Esc) left the source row dimmed forever.
  const onDragCancel = () => {
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
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
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

                <div className="mb-2 px-2">
                    <Input
                        placeholder="Search notes..."
                        leftIcon={<Search className="size-4" />}
                        value={searchQuery}
                        onChange={setSearchQuery}
                        classNames={{ field: 'h-10' }}
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
                              // Per-row identity from the canonical helper
                              // (see noteRowKey above). Same value feeds
                              // this row's `dragId`, `menuOpen`, and
                              // open/openChange callbacks.
                              const rowKey = noteRowKey.recent(note.id);
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
                      // Per-row identity from the canonical helper
                      // (see noteRowKey above). Same value feeds this
                      // row's `dragId`, `menuOpen`, and open/openChange
                      // callbacks.
                      const rowKey = noteRowKey.root(note.id);
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
                              <AnimatedBadge
                                status={pathname === `/tag/${tag}` ? "info" : "neutral"}
                                showIcon={false}
                                size="sm"
                                className="cursor-pointer hover:bg-sidebar-accent"
                              >
                                {tag}
                              </AnimatedBadge>
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

      <CenterMorphModal open={isNewFolderOpen} onOpenChange={setNewFolderOpen}>
        <CenterMorphModalContent ariaLabel="Create new folder">
            <form onSubmit={handleCreateFolderSubmit}>
                <div className="flex flex-col gap-2 p-6 pb-2">
                    <h2 className="text-lg font-semibold leading-none tracking-tight">Create New Folder</h2>
                    <p className="text-sm text-muted-foreground">Enter a name for your new folder.</p>
                </div>
                <div className="px-6 py-4">
                    <Label htmlFor="folderName">Folder Name</Label>
                    <Input id="folderName" name="folderName" autoFocus />
                </div>
                <div className="flex flex-col-reverse gap-2 p-6 pt-2 sm:flex-row sm:justify-end">
                    <Button type="submit">Create Folder</Button>
                </div>
            </form>
        </CenterMorphModalContent>
      </CenterMorphModal>

      <CenterMorphModal open={isNewNoteOpen} onOpenChange={setNewNoteOpen}>
        <CenterMorphModalContent ariaLabel="Create new note" className="sm:max-w-lg">
            <form onSubmit={handleCreateNoteSubmit}>
                <div className="flex flex-col gap-2 p-6 pb-2">
                    <h2 className="text-lg font-semibold leading-none tracking-tight">Create New Note</h2>
                    <p className="text-sm text-muted-foreground">Fill in the details for your new note.</p>
                </div>
                <div className="grid gap-4 px-6 py-4">
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
                            {/* z-[200]: portal must stack above the beUI modal's
                                z-[100] backdrop or it renders hidden behind the blur. */}
                            <SelectContent className="z-[200]">
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
                            <SelectContent className="z-[200]">
                                <SelectItem value="none">(No Folder)</SelectItem>
                                {folders.map(f => (
                                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex flex-col-reverse gap-2 p-6 pt-2 sm:flex-row sm:justify-end">
                    <Button type="submit">Create Note</Button>
                </div>
            </form>
        </CenterMorphModalContent>
      </CenterMorphModal>

      {/* Folder rename dialog — triggered from right-click menu on a folder. */}
      <CenterMorphModal
        open={folderToRename !== null}
        onOpenChange={(open) => { if (!open) setFolderToRename(null); }}
      >
        <CenterMorphModalContent ariaLabel="Rename folder">
          <form onSubmit={handleConfirmFolderRename}>
            <div className="flex flex-col gap-2 p-6 pb-2">
              <h2 className="text-lg font-semibold leading-none tracking-tight">Rename Folder</h2>
              <p className="text-sm text-muted-foreground">
                Enter a new name for the folder &quot;{folderToRename?.name}&quot;.
              </p>
            </div>
            <div className="px-6 py-4">
              <Label htmlFor="newFolderName" className="sr-only">Folder Name</Label>
              <Input
                id="newFolderName"
                name="newFolderName"
                defaultValue={folderToRename?.name ?? ''}
                autoFocus
              />
            </div>
            <div className="flex flex-col-reverse gap-2 p-6 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setFolderToRename(null)}>Cancel</Button>
              <Button type="submit">Rename</Button>
            </div>
          </form>
        </CenterMorphModalContent>
      </CenterMorphModal>

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
