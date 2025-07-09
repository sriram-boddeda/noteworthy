
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Folder, Note, ActionHistory, ActionDetail, NoteVersion } from '@/lib/data';
import { getInitialData } from '@/lib/data';
import { toast } from 'sonner';
import { suggestTagsAction, type SuggestTagsState, textToSpeechAction, type TextToSpeechState, summarizeNoteAction, type SummarizeNoteState } from '@/app/actions';
import type { Active, Over } from '@dnd-kit/core';

interface AppContextType {
  folders: Folder[];
  notes: Note[];
  trashedNotes: Note[];
  trashedFolders: Folder[];
  isDataLoaded: boolean;
  actionHistory: ActionHistory[];
  getNoteById: (id: string) => Note | undefined;
  getNotesByFolderId: (folderId: string | null) => Note[];
  getNotesByTag: (tag: string) => Note[];
  getTrashedNotesByFolderId: (folderId: string | null) => Note[];
  uniqueTags: string[];
  recentNotes: Note[];
  handleCreateFolder: (folderName: string) => void;
  handleCreateNote: (title: string, type: Note['type'], folderId: string | null) => Note | null;
  handleContentChange: (noteId: string, newContent: string) => void;
  handleUpdateTags: (noteId: string, newTags: string[]) => void;
  handleDeleteNote: (noteId: string) => void;
  handleUndoDelete: () => void;
  handleRestoreNote: (noteId: string) => void;
  handlePermanentDeleteNote: (noteId: string) => void;
  handleRetrieveItemFromHistory: (historyId: string, retrieveContained: boolean) => void;
  handleTitleChange: (noteId: string, newTitle: string) => void;
  handleUpdateSummary: (noteId: string, summary: string | null) => void;
  handleMoveNote: (noteId: string, folderId: string | null) => void;
  handleCopyNote: (noteId: string, folderId: string | null) => Note | null;
  handleRenameFolder: (folderId: string, newName: string) => void;
  handleDeleteFolder: (folderId: string, deleteNotes: boolean) => void;
  handleRestoreFolder: (folderId: string, restoreNotes: boolean) => void;
  handlePermanentDeleteFolder: (folderId: string, deleteContainedNotes: boolean) => void;
  handleDrop: (active: Active, over: Over | null) => void;
  handleRestoreVersion: (noteId: string, versionTimestamp: number) => void;
  aiTagState: SuggestTagsState;
  aiTagAction: (payload: FormData) => void;
  aiTtsState: TextToSpeechState;
  aiTtsAction: (payload: FormData) => void;
  aiSummaryState: SummarizeNoteState;
  aiSummaryAction: (payload: FormData) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [actionHistory, setActionHistory] = useState<ActionHistory[]>([]);
  const lastDeletedNote = useRef<Note | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [aiTagState, aiTagAction] = React.useActionState<SuggestTagsState, FormData>(suggestTagsAction, { suggestedTags: [], error: null });
  const [aiTtsState, aiTtsAction] = React.useActionState<TextToSpeechState, FormData>(textToSpeechAction, { audioData: null, error: null });
  const [aiSummaryState, aiSummaryAction] = React.useActionState<SummarizeNoteState, FormData>(summarizeNoteAction, { summary: null, error: null });

  const logAction = useCallback((
    entityType: 'note' | 'folder',
    entityId: string | null,
    entityName: string,
    action: ActionDetail,
    entityData: Note | Folder | null = null,
    containedEntitiesData: Note[] | null = null
  ) => {
    setActionHistory(prev => {
      const newHistoryEntry: ActionHistory = {
        id: uuidv4(),
        timestamp: Date.now(),
        entityType,
        entityId,
        entityName,
        action,
        entityData,
        containedEntitiesData,
      };
      const newState = [newHistoryEntry, ...prev];
      if (newState.length > 200) {
        return newState.slice(0, 200);
      }
      return newState;
    });
  }, []);
  
  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem('noteworthy-notes');
      const storedFolders = localStorage.getItem('noteworthy-folders');
      const storedHistory = localStorage.getItem('noteworthy-history');

      if (storedNotes && storedFolders) {
        setAllNotes(JSON.parse(storedNotes));
        setAllFolders(JSON.parse(storedFolders));
      } else {
        const { notes: initialNotes, folders: initialFolders } = getInitialData();
        setAllNotes(initialNotes);
        setAllFolders(initialFolders);
      }
      if (storedHistory) {
        setActionHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage, using initial data.", error);
      const { notes: initialNotes, folders: initialFolders } = getInitialData();
      setAllNotes(initialNotes);
      setAllFolders(initialFolders);
    } finally {
        setIsDataLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      try {
        localStorage.setItem('noteworthy-notes', JSON.stringify(allNotes));
        localStorage.setItem('noteworthy-folders', JSON.stringify(allFolders));
        localStorage.setItem('noteworthy-history', JSON.stringify(actionHistory));
      } catch (error) {
        console.error("Failed to save data to localStorage", error);
        toast.error("Could not save data", {
            description: "Your changes might not be saved.",
        });
      }
    }
  }, [allNotes, allFolders, actionHistory, isDataLoaded]);

   useEffect(() => {
    if(aiTagState.error && aiTagState.timestamp) {
        toast.error("AI Suggestion Failed", {
            description: aiTagState.error,
        })
    }
  }, [aiTagState]);

  useEffect(() => {
    if(aiTtsState.error && aiTtsState.timestamp) {
        toast.error("AI Text-to-Speech Failed", {
            description: aiTtsState.error,
        })
    }
  }, [aiTtsState]);

  useEffect(() => {
    if (aiSummaryState.error && aiSummaryState.timestamp) {
      toast.error('AI Summarization Failed', {
        description: aiSummaryState.error,
      });
    } else if (aiSummaryState.summary && aiSummaryState.timestamp) {
      toast.success('Summary Generated', {
        description: 'The AI summary has been created successfully.',
      });
    }
  }, [aiSummaryState]);
  
  const notes = useMemo(() => allNotes.filter(n => !n.isTrashed), [allNotes]);
  const folders = useMemo(() => allFolders.filter(f => !f.isTrashed), [allFolders]);
  const trashedNotes = useMemo(() => allNotes.filter(n => n.isTrashed), [allNotes]);
  const trashedFolders = useMemo(() => allFolders.filter(f => !f.isTrashed), [allFolders]);

  const uniqueTags = useMemo(() => {
    const allTags = notes.flatMap(note => note.tags);
    return [...new Set(allTags)].sort();
  }, [notes]);
  
  const recentNotes = useMemo(() => {
    return [...notes].sort((a, b) => b.lastModified - a.lastModified).slice(0, 5);
  }, [notes]);

  const getNoteById = useCallback((id: string) => {
    return allNotes.find(note => note.id === id);
  }, [allNotes]);

  const getNotesByFolderId = useCallback((folderId: string | null) => {
    return notes.filter(note => note.folderId === folderId).sort((a, b) => a.title.localeCompare(b.title));
  }, [notes]);

  const getNotesByTag = useCallback((tag: string) => {
    return notes.filter(note => note.tags.includes(tag));
  }, [notes]);

  const getTrashedNotesByFolderId = useCallback((folderId: string | null) => {
    return trashedNotes.filter(note => note.folderId === folderId);
  }, [trashedNotes]);

  const handleCreateFolder = useCallback((folderName: string) => {
    if (folderName) {
      const newFolder: Folder = {
        id: uuidv4(),
        name: folderName,
        isTrashed: false,
      };
      setAllFolders(prev => [...prev, newFolder]);
      logAction('folder', newFolder.id, newFolder.name, { type: 'CREATE' });
      toast.success('Folder Created', { description: `Successfully created "${folderName}".` });
    }
  }, [logAction]);

  const handleCreateNote = useCallback((title: string, type: Note['type'], folderId: string | null) => {
     if(title && type) {
        const newNote: Note = {
            id: uuidv4(),
            title,
            type,
            tags: [],
            content: `# ${title}\n\nStart writing here...`,
            folderId: folderId,
            summary: null,
            isTrashed: false,
            lastModified: Date.now(),
            versions: [],
        };
        const destFolder = folderId ? allFolders.find(f => f.id === folderId) : null;
        setAllNotes(prev => [...prev, newNote]);
        logAction('note', newNote.id, newNote.title, {
          type: 'CREATE',
          destination: destFolder ? destFolder.name : 'Home'
        });
        toast.success('Note Created', { description: `Successfully created "${title}".` });
        return newNote;
    }
    return null;
  }, [allFolders, logAction]);

  const handleContentChange = useCallback((noteId: string, newContent: string) => {
    setAllNotes(prev => prev.map(n => {
        if (n.id === noteId) {
            const now = Date.now();
            const lastVersion = n.versions[n.versions.length - 1];
            
            // Only save a version if content actually changed and it's been > 5 mins since last version
            const shouldSaveVersion = n.content !== newContent && (!lastVersion || now - lastVersion.timestamp > 5 * 60 * 1000);

            const newVersions = shouldSaveVersion 
                ? [...n.versions, { timestamp: n.lastModified, content: n.content }] 
                : n.versions;
            
            // Limit to 50 versions
            if (newVersions.length > 50) {
                newVersions.shift();
            }

            return { 
                ...n, 
                content: newContent, 
                lastModified: now,
                versions: newVersions
            };
        }
        return n;
    }));
  }, []);

  const handleTitleChange = useCallback((noteId: string, newTitle: string) => {
    const note = allNotes.find(n => n.id === noteId);
    if(note && note.title !== newTitle) {
      logAction('note', note.id, newTitle, { type: 'RENAME', from: note.title, to: newTitle });
      setAllNotes(prev => prev.map(n => n.id === noteId ? { ...n, title: newTitle, lastModified: Date.now() } : n));
    }
  }, [allNotes, logAction]);
  
  const handleUpdateTags = useCallback((noteId: string, newTags: string[]) => {
    const updatedTags = [...new Set(newTags)].filter(Boolean).map(t => t.trim().toLowerCase());
    setAllNotes(prev => prev.map(n => n.id === noteId ? { ...n, tags: updatedTags, lastModified: Date.now() } : n));
  }, []);

  const handleDeleteNote = useCallback((noteId: string) => {
    let noteToDelete: Note | undefined;
    setAllNotes(prev => {
        noteToDelete = prev.find(n => n.id === noteId);
        return prev.map(n => n.id === noteId ? { ...n, isTrashed: true, lastModified: Date.now() } : n)
    });

    if (noteToDelete) {
        logAction('note', noteId, noteToDelete.title, { type: 'DELETE' });
        lastDeletedNote.current = noteToDelete;
    }
  }, [logAction]);

  const handleUndoDelete = useCallback(() => {
    const noteToRestore = lastDeletedNote.current;
    if (noteToRestore) {
      logAction('note', noteToRestore.id, noteToRestore.title, { type: 'RESTORE' });
      setAllNotes(prev => prev.map(n => n.id === noteToRestore.id ? { ...n, isTrashed: false, lastModified: Date.now() } : n));
      toast.success(`Restored "${noteToRestore.title}"`);
      lastDeletedNote.current = null;
    }
  }, [logAction]);
  
  const handleRestoreNote = useCallback((noteId: string) => {
      const noteToRestore = allNotes.find(n => n.id === noteId);
      if (!noteToRestore) return;

      const parentFolder = noteToRestore.folderId ? allFolders.find(f => f.id === noteToRestore.folderId) : null;

      if (parentFolder && parentFolder.isTrashed) {
          logAction('note', noteId, noteToRestore.title, { type: 'RESTORE', from: 'Trash (Orphaned)' });
          setAllNotes(prev => prev.map(n => n.id === noteId ? { ...n, isTrashed: false, folderId: null, lastModified: Date.now() } : n));
          toast.warning(`Restored "${noteToRestore.title}" to Home`, {
            description: "Its original folder is still in the trash."
          });
      } else {
         logAction('note', noteId, noteToRestore.title, { type: 'RESTORE' });
         setAllNotes(prev => prev.map(n => n.id === noteId ? { ...n, isTrashed: false, lastModified: Date.now() } : n));
         toast.success(`Restored "${noteToRestore.title}"`);
      }
  }, [allNotes, allFolders, logAction]);

  const handlePermanentDeleteNote = useCallback((noteId: string) => {
    const note = allNotes.find(n => n.id === noteId);
    if(note) {
      logAction('note', note.id, note.title, { type: 'PERMANENT_DELETE' }, note);
      setAllNotes(prev => prev.filter(n => n.id !== noteId));
    }
  }, [allNotes, logAction]);

  const handleRetrieveItemFromHistory = useCallback((historyId: string, retrieveContained: boolean) => {
    const historyItem = actionHistory.find(h => h.id === historyId);
    if (!historyItem || !historyItem.entityData) {
      toast.error("Retrieval Failed", { description: "The historical data for this item is incomplete." });
      return;
    }

    const restoreItem = (item: Note | Folder, type: 'note' | 'folder') => {
      const itemExists = type === 'note'
        ? allNotes.some(n => n.id === item.id)
        : allFolders.some(f => f.id === item.id);

      if (itemExists) {
        toast.warning("Retrieval Skipped", { description: `An item named "${item.title || item.name}" with the same ID already exists.` });
        return false;
      }
      
      const restoredItem = { ...item, isTrashed: false };

      if (type === 'note') {
        setAllNotes(prev => [...prev, restoredItem as Note]);
      } else {
        setAllFolders(prev => [...prev, restoredItem as Folder]);
      }
      logAction(type, restoredItem.id, restoredItem.title || restoredItem.name, { type: 'RETRIEVE' });
      return true;
    }

    const folderToRestore = historyItem.entityData as Folder;
    if (historyItem.entityType === 'folder') {
      if (restoreItem(folderToRestore, 'folder')) {
        let restoredNotesCount = 0;
        if (retrieveContained && historyItem.containedEntitiesData) {
          historyItem.containedEntitiesData.forEach(noteData => {
            if (restoreItem(noteData, 'note')) {
              restoredNotesCount++;
            }
          });
        }
        toast.success("Folder Retrieved", {
          description: `"${folderToRestore.name}" has been restored. ${restoredNotesCount > 0 ? `${restoredNotesCount} note(s) also restored.` : ''}`
        });
      }
    } else {
      const noteToRestore = historyItem.entityData as Note;
      if (restoreItem(noteToRestore, 'note')) {
        toast.success("Note Retrieved", { description: `"${noteToRestore.title}" has been restored.` });
      }
    }
  }, [actionHistory, allFolders, allNotes, logAction]);

  const handleUpdateSummary = useCallback((noteId: string, summary: string | null) => {
    setAllNotes(prev => prev.map(n => n.id === noteId ? { ...n, summary, lastModified: Date.now() } : n));
  }, []);

  const handleMoveNote = useCallback((noteId: string, folderId: string | null) => {
    const note = allNotes.find(n => n.id === noteId);
    if (note) {
      const sourceFolder = note.folderId ? allFolders.find(f => f.id === note.folderId) : null;
      const destFolder = folderId ? allFolders.find(f => f.id === folderId) : null;

      logAction('note', noteId, note.title, {
        type: 'MOVE',
        from: sourceFolder ? sourceFolder.name : 'Home',
        to: destFolder ? destFolder.name : 'Home'
      });

      setAllNotes(prev => prev.map(n => n.id === noteId ? { ...n, folderId, lastModified: Date.now() } : n));
      toast.success('Note Moved', { description: `"${note.title}" was moved successfully.` });
    }
  }, [allNotes, allFolders, logAction]);

  const handleCopyNote = useCallback((noteId: string, folderId: string | null) => {
    const noteToCopy = allNotes.find(n => n.id === noteId);
    if (!noteToCopy) return null;

    const newNote: Note = {
      ...noteToCopy,
      id: uuidv4(),
      title: `Copy of ${noteToCopy.title}`,
      folderId,
      lastModified: Date.now(),
      versions: [...noteToCopy.versions] // Also copy version history
    };
    
    const destFolder = folderId ? allFolders.find(f => f.id === folderId) : null;

    logAction('note', newNote.id, newNote.title, {
      type: 'COPY',
      destination: destFolder ? destFolder.name : 'Home'
    });

    setAllNotes(prev => [...prev, newNote]);
    toast.success('Note Copied', { description: `A copy of "${noteToCopy.title}" was created.` });
    return newNote;
  }, [allNotes, allFolders, logAction]);

  const handleRenameFolder = useCallback((folderId: string, newName: string) => {
    if (newName.trim()) {
      const folder = allFolders.find(f => f.id === folderId);
      if (folder && folder.name !== newName.trim()) {
        logAction('folder', folderId, newName.trim(), { type: 'RENAME', from: folder.name, to: newName.trim() });
        setAllFolders(prev => prev.map(f => (f.id === folderId ? { ...f, name: newName.trim() } : f)));
        toast.success('Folder Renamed', { description: `Folder was successfully renamed to "${newName.trim()}".` });
      }
    }
  }, [allFolders, logAction]);
  
  const handleDeleteFolder = useCallback((folderId: string, deleteNotes: boolean) => {
    const folder = allFolders.find(f => f.id === folderId);
    if (!folder) return;

    logAction('folder', folderId, folder.name, { type: 'DELETE' });
    setAllFolders(prev => prev.map(f => (f.id === folderId ? { ...f, isTrashed: true } : f)));

    if (deleteNotes) {
      setAllNotes(prev => prev.map(n => (n.folderId === folderId ? { ...n, isTrashed: true, lastModified: Date.now() } : n)));
      toast.success(`Moved "${folder.name}" and its notes to trash.`);
    } else {
      setAllNotes(prev => prev.map(n => (n.folderId === folderId ? { ...n, folderId: null, lastModified: Date.now() } : n)));
      toast.success(`Moved "${folder.name}" to trash.`, {
        description: 'Notes inside were moved to Home.',
      });
    }
  }, [allFolders, logAction]);

  const handleRestoreFolder = useCallback((folderId: string, restoreNotes: boolean) => {
    const folder = allFolders.find(f => f.id === folderId);
    if (!folder) return;

    logAction('folder', folderId, folder.name, { type: 'RESTORE' });
    setAllFolders(prev => prev.map(f => f.id === folderId ? { ...f, isTrashed: false } : f));

    if (restoreNotes) {
      const notesInFolder = allNotes.filter(n => n.folderId === folderId && n.isTrashed);
      const noteIdsToRestore = notesInFolder.map(n => n.id);
      
      noteIdsToRestore.forEach(noteId => {
        const note = allNotes.find(n => n.id === noteId);
        if(note) {
          logAction('note', noteId, note.title, { type: 'RESTORE', from: `Folder "${folder.name}"` });
        }
      });
      
      setAllNotes(prev => prev.map(n => noteIdsToRestore.includes(n.id) ? { ...n, isTrashed: false, lastModified: Date.now() } : n));
      toast.success(`Restored folder "${folder.name}" and its notes.`);
    } else {
      toast.success(`Restored folder "${folder.name}".`);
    }
  }, [allFolders, allNotes, logAction]);

  const handlePermanentDeleteFolder = useCallback((folderId: string, deleteContainedNotes: boolean) => {
    const folder = allFolders.find(f => f.id === folderId && f.isTrashed);
    if (!folder) return;
  
    const notesInside = allNotes.filter(n => n.folderId === folderId && n.isTrashed);
    logAction('folder', folder.id, folder.name, { type: 'PERMANENT_DELETE' }, folder, notesInside);
  
    if (deleteContainedNotes) {
      const noteIdsToDelete = notesInside.map(n => n.id);
      setAllNotes(prev => prev.filter(n => !noteIdsToDelete.includes(n.id)));
      setAllFolders(prev => prev.filter(f => f.id !== folderId));
      toast.error(`Folder "${folder.name}" and ${notesInside.length} note(s) permanently deleted.`);
    } else {
      setAllNotes(prev => prev.map(n => n.folderId === folderId ? { ...n, folderId: null } : n));
      setAllFolders(prev => prev.filter(f => f.id !== folderId));
      toast.error(`Folder "${folder.name}" permanently deleted. Its notes remain in trash.`);
    }
  }, [allFolders, allNotes, logAction]);

  const handleDrop = useCallback((active: Active, over: Over | null) => {
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    // Prevent dropping on itself
    if (activeId === overId) return;

    const activeType = active.data.current?.type;
    const item = active.data.current?.item;
    
    if (!activeType || !item) return;

    if (activeType === 'note') {
        const noteId = item.id;
        const note = getNoteById(noteId);
        if (!note) return;

        if (overId.startsWith('folder-')) {
            const targetFolderId = overId.replace('folder-', '');
            if (note.folderId !== targetFolderId) {
                handleMoveNote(noteId, targetFolderId);
            }
        } else if (overId === 'home-dropzone') {
            if (note.folderId !== null) {
                handleMoveNote(noteId, null);
            }
        } else if (overId === 'trash-dropzone') {
            handleDeleteNote(noteId);
            toast.success(`Moved "${note.title}" to Trash`, {
                action: {
                    label: 'Undo',
                    onClick: () => handleUndoDelete(),
                }
            });
        }
    } else if (activeType === 'folder') {
        const folderId = item.id;
        if (overId === 'trash-dropzone') {
            handleDeleteFolder(folderId, true);
        }
    }
  }, [getNoteById, handleMoveNote, handleDeleteNote, handleDeleteFolder, handleUndoDelete]);

  const handleRestoreVersion = useCallback((noteId: string, versionTimestamp: number) => {
    setAllNotes(prev => prev.map(n => {
      if (n.id === noteId) {
        const versionToRestore = n.versions.find(v => v.timestamp === versionTimestamp);
        if (!versionToRestore) {
          toast.error("Version not found.");
          return n;
        }

        // Add the current content as a new version before overwriting it
        const newVersions = [...n.versions, { timestamp: n.lastModified, content: n.content }];
        if (newVersions.length > 50) newVersions.shift();

        logAction('note', noteId, n.title, { type: 'RESTORE_VERSION' });
        toast.success("Note version restored.");

        return {
          ...n,
          content: versionToRestore.content,
          versions: newVersions,
          lastModified: Date.now()
        };
      }
      return n;
    }));
  }, [logAction]);


  const value = useMemo(() => ({
    folders,
    notes,
    trashedNotes,
    trashedFolders,
    isDataLoaded,
    actionHistory,
    getNoteById,
    getNotesByFolderId,
    getNotesByTag,
    getTrashedNotesByFolderId,
    uniqueTags,
    recentNotes,
    handleCreateFolder,
    handleCreateNote,
    handleContentChange,
    handleUpdateTags,
    handleDeleteNote,
    handleUndoDelete,
    handleRestoreNote,
    handlePermanentDeleteNote,
    handleRetrieveItemFromHistory,
    handleTitleChange,
    handleUpdateSummary,
    handleMoveNote,
    handleCopyNote,
    handleRenameFolder,
    handleDeleteFolder,
    handleRestoreFolder,
    handlePermanentDeleteFolder,
    handleDrop,
    handleRestoreVersion,
    aiTagState,
    aiTagAction,
    aiTtsState,
    aiTtsAction,
    aiSummaryState,
    aiSummaryAction,
  }), [
    folders, notes, trashedNotes, trashedFolders, isDataLoaded, actionHistory, getNoteById, getNotesByFolderId, getNotesByTag, getTrashedNotesByFolderId, uniqueTags, recentNotes,
    handleCreateFolder, handleCreateNote, handleContentChange, handleUpdateTags, handleDeleteNote, handleUndoDelete, handleRestoreNote, handlePermanentDeleteNote, handleRetrieveItemFromHistory,
    handleTitleChange, handleUpdateSummary, handleMoveNote, handleCopyNote, handleRenameFolder, handleDeleteFolder, handleRestoreFolder, handlePermanentDeleteFolder, handleDrop,
    handleRestoreVersion,
    aiTagState, aiTagAction, aiTtsState, aiTtsAction, aiSummaryState, aiSummaryAction
  ]);


  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
