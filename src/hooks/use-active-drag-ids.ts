'use client';

import { type Active } from '@dnd-kit/core';
import { type DragKind } from '@/components/dnd';

/**
 * Shape returned by {@link useActiveDragIds}. Mirrors the three ids any
 * DndContext dispatcher needs to drive drop-state UI:
 *   1. Droppable highlights via {@link activeDragType}
 *   2. Draggable dim of duplicate note listings via {@link activeNoteId}
 *   3. Draggable dim of the containing folder trigger via
 *      {@link dimmedFolderId} — which merges the "folder dragged" and
 *      "folder's-note dragged" cases so the parent folder visually feels
 *      picked up alongside its child note.
 *
 * `null` / `undefined` everywhere means "no drag in flight".
 */
export interface ActiveDragIds {
  activeDragType: DragKind | undefined;
  activeNoteId: string | null;
  dimmedFolderId: string | null;
}

/**
 * Pure derivation hook from @dnd-kit's `Active` object.
 *
 * The caller owns `activeDragItem` (typically via useState paired with the
 * DndContext's onDragStart/onDragEnd, cleared in onDragEnd). This hook is a
 * deterministic read — no internal state, no effects, safe to memoize at
 * the call site if desired.
 */
export function useActiveDragIds(activeDragItem: Active | null): ActiveDragIds {
  const activeData = activeDragItem?.data?.current;
  const draggedNoteFolderId =
    activeData?.type === 'note' ? activeData.item?.folderId ?? null : null;

  return {
    activeDragType: activeData?.type as DragKind | undefined,
    activeNoteId: activeData?.type === 'note' ? activeData.item?.id ?? null : null,
    dimmedFolderId:
      activeData?.type === 'folder'
        ? activeData.item?.id ?? null
        : draggedNoteFolderId,
  };
}
