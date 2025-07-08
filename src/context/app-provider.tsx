
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Folder, Note } from '@/lib/data';
import { getInitialData } from '@/lib/data';
import { toast } from 'sonner';
import { suggestTagsAction, type SuggestTagsState, textToSpeechAction, type TextToSpeechState, summarizeNoteAction, type SummarizeNoteState } from '@/app/actions';

interface AppContextType {
  folders: Folder[];
  notes: Note[];
  trashedNotes: Note[];
  isDataLoaded: boolean;
  getNoteById: (id: string) => Note | undefined;
  getNotesByFolderId: (folderId: string | null) => Note[];
  getNotesByTag: (tag: string) => Note[];
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
  handleTitleChange: (noteId: string, newTitle: string) => void;
  handleUpdateSummary: (noteId: string, summary: string | null) => void;
  handleMoveNote: (noteId: string, folderId: string | null) => void;
  handleCopyNote: (noteId: string, folderId: string | null) => Note | null;
  aiTagState: SuggestTagsState;
  aiTagAction: (payload: FormData) => void;
  aiTtsState: TextToSpeechState;
  aiTtsAction: (payload: FormData) => void;
  aiSummaryState: SummarizeNoteState;
  aiSummaryAction: (payload: FormData) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [lastDeletedNote, setLastDeletedNote] = useState<Note | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [aiTagState, aiTagAction] = React.useActionState<SuggestTagsState, FormData>(suggestTagsAction, { suggestedTags: [], error: null });
  const [aiTtsState, aiTtsAction] = React.useActionState<TextToSpeechState, FormData>(textToSpeechAction, { audioData: null, error: null });
  const [aiSummaryState, aiSummaryAction] = React.useActionState<SummarizeNoteState, FormData>(summarizeNoteAction, { summary: null, error: null });


  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem('noteworthy-notes');
      const storedFolders = localStorage.getItem('noteworthy-folders');

      if (storedNotes && storedFolders) {
        setAllNotes(JSON.parse(storedNotes));
        setFolders(JSON.parse(storedFolders));
      } else {
        // If no data, use initial data
        const { notes: initialNotes, folders: initialFolders } = getInitialData();
        setAllNotes(initialNotes);
        setFolders(initialFolders);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage, using initial data.", error);
      const { notes: initialNotes, folders: initialFolders } = getInitialData();
      setAllNotes(initialNotes);
      setFolders(initialFolders);
    } finally {
        setIsDataLoaded(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isDataLoaded) {
      try {
        localStorage.setItem('noteworthy-notes', JSON.stringify(allNotes));
        localStorage.setItem('noteworthy-folders', JSON.stringify(folders));
      } catch (error) {
        console.error("Failed to save data to localStorage", error);
        toast.error("Could not save data", {
            description: "Your changes might not be saved.",
        });
      }
    }
  }, [allNotes, folders, isDataLoaded]);

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
  const trashedNotes = useMemo(() => allNotes.filter(n => n.isTrashed), [allNotes]);

  const uniqueTags = useMemo(() => {
    const allTags = notes.flatMap(note => note.tags);
    return [...new Set(allTags)].sort();
  }, [notes]);
  
  const recentNotes = useMemo(() => {
    return [...notes].sort((a, b) => b.lastModified - a.lastModified).slice(0, 5);
  }, [notes]);

  const getNoteById = useCallback((id: string) => {
    // Allows viewing a trashed note if accessed directly by URL
    return allNotes.find(note => note.id === id);
  }, [allNotes]);

  const getNotesByFolderId = useCallback((folderId: string | null) => {
    return notes.filter(note => note.folderId === folderId).sort((a, b) => a.title.localeCompare(b.title));
  }, [notes]);

  const getNotesByTag = useCallback((tag: string) => {
    return notes.filter(note => note.tags.includes(tag));
  }, [notes]);

  const handleCreateFolder = useCallback((folderName: string) => {
    if (folderName) {
      const newFolder: Folder = {
        id: uuidv4(),
        name: folderName,
      };
      setFolders(prev => [...prev, newFolder]);
      toast.success('Folder Created', { description: `Successfully created "${folderName}".` });
    }
  }, []);

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
        };
        setAllNotes(prev => [...prev, newNote]);
        toast.success('Note Created', { description: `Successfully created "${title}".` });
        return newNote;
    }
    return null;
  }, []);

  const handleContentChange = useCallback((noteId: string, newContent: string) => {
    setAllNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: newContent, lastModified: Date.now() } : n));
  }, []);

  const handleTitleChange = useCallback((noteId: string, newTitle: string) => {
    setAllNotes(prev => prev.map(n => n.id === noteId ? { ...n, title: newTitle, lastModified: Date.now() } : n));
  }, []);
  
  const handleUpdateTags = useCallback((noteId: string, newTags: string[]) => {
    const updatedTags = [...new Set(newTags)].filter(Boolean).map(t => t.trim().toLowerCase());
    setAllNotes(prev => prev.map(n => n.id === noteId ? { ...n, tags: updatedTags, lastModified: Date.now() } : n));
  }, []);

  const handleDeleteNote = useCallback((noteId: string) => {
    const noteToDelete = allNotes.find(n => n.id === noteId);
    if(noteToDelete) {
        setLastDeletedNote(noteToDelete); // For quick undo
        setAllNotes(prev => prev.map(n => n.id === noteId ? { ...n, isTrashed: true, lastModified: Date.now() } : n));
    }
  }, [allNotes]);

  const handleUndoDelete = useCallback(() => {
    if (lastDeletedNote) {
      setAllNotes(prev => prev.map(n => n.id === lastDeletedNote.id ? { ...n, isTrashed: false, lastModified: Date.now() } : n));
      toast.success(`Restored "${lastDeletedNote.title}"`);
      setLastDeletedNote(null);
    }
  }, [lastDeletedNote]);
  
  const handleRestoreNote = useCallback((noteId: string) => {
      setAllNotes(prev => prev.map(n => n.id === noteId ? { ...n, isTrashed: false, lastModified: Date.now() } : n));
  }, []);

  const handlePermanentDeleteNote = useCallback((noteId: string) => {
    setAllNotes(prev => prev.filter(n => n.id !== noteId));
  }, []);

  const handleUpdateSummary = useCallback((noteId: string, summary: string | null) => {
    setAllNotes(prev => prev.map(n => n.id === noteId ? { ...n, summary, lastModified: Date.now() } : n));
  }, []);

  const handleMoveNote = useCallback((noteId: string, folderId: string | null) => {
    const note = allNotes.find(n => n.id === noteId);
    if (note) {
      setAllNotes(prev => prev.map(n => n.id === noteId ? { ...n, folderId, lastModified: Date.now() } : n));
      toast.success('Note Moved', { description: `"${note.title}" was moved successfully.` });
    }
  }, [allNotes]);

  const handleCopyNote = useCallback((noteId: string, folderId: string | null) => {
    const noteToCopy = allNotes.find(n => n.id === noteId);
    if (!noteToCopy) return null;

    const newNote: Note = {
      ...noteToCopy,
      id: uuidv4(),
      title: `Copy of ${noteToCopy.title}`,
      folderId,
      lastModified: Date.now(),
    };

    setAllNotes(prev => [...prev, newNote]);
    toast.success('Note Copied', { description: `A copy of "${noteToCopy.title}" was created.` });
    return newNote;
  }, [allNotes]);

  const value = useMemo(() => ({
    folders,
    notes,
    trashedNotes,
    isDataLoaded,
    getNoteById,
    getNotesByFolderId,
    getNotesByTag,
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
    handleTitleChange,
    handleUpdateSummary,
    handleMoveNote,
    handleCopyNote,
    aiTagState,
    aiTagAction,
    aiTtsState,
    aiTtsAction,
    aiSummaryState,
    aiSummaryAction,
  }), [
    folders, notes, trashedNotes, isDataLoaded, getNoteById, getNotesByFolderId, getNotesByTag, uniqueTags, recentNotes,
    handleCreateFolder, handleCreateNote, handleContentChange, handleUpdateTags, handleDeleteNote, handleUndoDelete, handleRestoreNote, handlePermanentDeleteNote,
    handleTitleChange, handleUpdateSummary, handleMoveNote, handleCopyNote,
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
