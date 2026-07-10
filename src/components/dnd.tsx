'use client';

import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { FileText, Folder as FolderIcon, Lock } from 'lucide-react';
import { noteTypeOptions, type Note, type Folder } from '@/lib/data';
import { cn } from '@/lib/utils';

/** Discriminator for items this app considers draggable. */
export type DragKind = 'note' | 'folder';

/** Discriminated payload attached to a Draggable. */
export type DraggableData =
  | { type: 'note'; item: Note }
  | { type: 'folder'; item: Folder };

interface DraggableProps {
  /** Unique id within the DndContext. Use a per-source prefix to avoid collisions when listings share the same item. */
  id: string;
  data: DraggableData;
  children: React.ReactNode;
  /** App-wide active drag kind, used to dim duplicates of the same item. Must match the kind of the actual active drag. */
  activeType: DragKind | null;
  /** App-wide active drag id, used to dim duplicates of the same item. Root notes (folderId === null) intentionally yield null and never match. */
  activeId: string | null;
}

/**
 * Wraps a draggable sidebar item with the @dnd-kit draggable primitives.
 *
 * Dims the wrapper when EITHER (a) this is the active drag source, OR
 * (b) this represents the same item being dragged elsewhere in the sidebar
 * (duplicate listings of the same note/folder). The type guard prevents a
 * note and a folder from ever cross-matching if activeType and activeId
 * drift out of sync.
 */
export function Draggable({ id, data, children, activeType, activeId }: DraggableProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data });
  const isCloneOfActive =
    activeId !== null && activeType !== null && data.type === activeType && data.item.id === activeId;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("relative", (isDragging || isCloneOfActive) && 'opacity-50')}
    >
      {children}
    </div>
  );
}

interface DroppableProps {
  /**
   * Unique id within the DndContext, identifying both the type of zone and
   * the specific target. Conventions used by AppSidebar:
   *   - 'home-dropzone'      → root notes / Home row
   *   - 'trash-dropzone'     → Trash row
   *   - 'folder-<folderId>'  → a folder accordion item (header + nested notes)
   */
  id: string;
  children: React.ReactNode;
  className?: string;
  /** Discriminator that drives the highlight / lock overlays. */
  activeDragType?: DragKind;
}

/**
 * Wraps a sidebar drop target with @dnd-kit. Highlights while hovered by a
 * valid droppable. Locks when a folder is dragged onto a folder or onto the
 * Home row (folder-into-folder / folder-into-home is not allowed).
 */
export function Droppable({ id, children, className, activeDragType }: DroppableProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  const isDraggingNote = activeDragType === 'note';
  const isDraggingFolder = activeDragType === 'folder';

  const isFolderTarget = id.startsWith('folder-');
  const isHomeTarget = id === 'home-dropzone';
  const isTrashTarget = id === 'trash-dropzone';

  let showHighlight = false;
  let showLock = false;

  if (isOver) {
    // Trash accepts anything.
    if (isTrashTarget) {
      showHighlight = true;
    }
    // Home and folders only accept notes.
    if ((isHomeTarget || isFolderTarget) && isDraggingNote) {
      showHighlight = true;
    }
    // Folder-into-folder / folder-into-home is locked out.
    if (isFolderTarget && isDraggingFolder) {
      showLock = true;
    }
    if (isHomeTarget && isDraggingFolder) {
      showLock = true;
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        'relative transition-colors duration-200',
        showHighlight && 'rounded-md bg-primary/10'
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

/**
 * Props for ItemPreview. Takes the same discriminated payload that Draggable
 * already exposes via {@link DraggableData}, so the discriminant (type) flows
 * through end-to-end without the call site needing to re-pair `item` and
 * `type`. `undefined` is allowed because @dnd-kit's Active.data.current is
 * optional at the type level.
 */
interface ItemPreviewProps {
  data: DraggableData | undefined;
}

/**
 * Floating card rendered inside a @dnd-kit DragOverlay that represents the
 * item currently being dragged. Mirrors the visual style of the sidebar row
 * so the drag feels like a card pickup.
 */
export function ItemPreview({ data }: ItemPreviewProps) {
  if (!data) return null;
  const icon =
    data.type === 'note'
      ? noteTypeOptions.find((o) => o.value === data.item.type)?.icon ?? <FileText className="size-4" />
      : <FolderIcon className="size-4" />;
  const label = data.type === 'note' ? data.item.title : data.item.name;
  return (
    <div className="flex items-center gap-2 rounded-md bg-sidebar p-2 text-sidebar-foreground shadow-lg">
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
