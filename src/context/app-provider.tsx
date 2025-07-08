
'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Folder, Note } from '@/lib/data';
import { getInitialData, noteTypeOptions } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { suggestTagsAction, type SuggestTagsState, textToSpeechAction, type TextToSpeechState, summarizeNoteAction, type SummarizeNoteState } from '@/app/actions';

interface AppContextType {
  folders: Folder[];
  notes: Note[];
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
  const [notes, setNotes] = useState<Note[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { toast } = useToast();

  const [aiTagState, aiTagAction] = React.useActionState<SuggestTagsState, FormData>(suggestTagsAction, { suggestedTags: [], error: null });
  const [aiTtsState, aiTtsAction] = React.useActionState<TextToSpeechState, FormData>(textToSpeechAction, { audioData: null, error: null });
  const [aiSummaryState, aiSummaryAction] = React.useActionState<SummarizeNoteState, FormData>(summarizeNoteAction, { summary: null, error: null });


  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem('noteworthy-notes');
      const storedFolders = localStorage.getItem('noteworthy-folders');

      if (storedNotes && storedFolders) {
        setNotes(JSON.parse(storedNotes));
        setFolders(JSON.parse(storedFolders));
      } else {
        // If no data, use initial data
        const { notes: initialNotes, folders: initialFolders } = getInitialData();
        setNotes(initialNotes);
        setFolders(initialFolders);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage, using initial data.", error);
      const { notes: initialNotes, folders: initialFolders } = getInitialData();
      setNotes(initialNotes);
      setFolders(initialFolders);
    } finally {
        setIsDataLoaded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isDataLoaded) {
      try {
        localStorage.setItem('noteworthy-notes', JSON.stringify(notes));
        localStorage.setItem('noteworthy-folders', JSON.stringify(folders));
      } catch (error) {
        console.error("Failed to save data to localStorage", error);
        toast({
            variant: "destructive",
            title: "Could not save data",
            description: "Your changes might not be saved.",
        });
      }
    }
  }, [notes, folders, isDataLoaded, toast]);

   useEffect(() => {
    if(aiTagState.error && aiTagState.timestamp) {
        toast({
            variant: "destructive",
            title: "AI Suggestion Failed",
            description: aiTagState.error,
        })
    }
  }, [aiTagState, toast]);

  useEffect(() => {
    if(aiTtsState.error && aiTtsState.timestamp) {
        toast({
            variant: "destructive",
            title: "AI Text-to-Speech Failed",
            description: aiTtsState.error,
        })
    }
  }, [aiTtsState, toast]);

  useEffect(() => {
    if (aiSummaryState.error && aiSummaryState.timestamp) {
      toast({
        variant: 'destructive',
        title: 'AI Summarization Failed',
        description: aiSummaryState.error,
      });
    } else if (aiSummaryState.summary && aiSummaryState.timestamp) {
      toast({
        title: 'Summary Generated',
        description: 'The AI summary has been created successfully.',
      });
    }
  }, [aiSummaryState, toast]);

  const uniqueTags = useMemo(() => {
    const allTags = notes.flatMap(note => note.tags);
    return [...new Set(allTags)].sort();
  }, [notes]);
  
  const recentNotes = useMemo(() => {
    return [...notes].sort((a, b) => b.lastModified - a.lastModified).slice(0, 5);
  }, [notes]);

  const getNoteById = useCallback((id: string) => {
    return notes.find(note => note.id === id);
  }, [notes]);

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
      toast({ title: 'Folder Created', description: `Successfully created "${folderName}".` });
    }
  }, [toast]);

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
            lastModified: Date.now(),
        };
        setNotes(prev => [...prev, newNote]);
        toast({ title: 'Note Created', description: `Successfully created "${title}".` });
        return newNote;
    }
    return null;
  }, [toast]);

  const handleContentChange = useCallback((noteId: string, newContent: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: newContent, lastModified: Date.now() } : n));
  }, []);

  const handleTitleChange = useCallback((noteId: string, newTitle: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, title: newTitle, lastModified: Date.now() } : n));
  }, []);
  
  const handleUpdateTags = useCallback((noteId: string, newTags: string[]) => {
    const updatedTags = [...new Set(newTags)].filter(Boolean).map(t => t.trim().toLowerCase());
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, tags: updatedTags, lastModified: Date.now() } : n));
  }, []);

  const handleDeleteNote = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    toast({ title: 'Note Deleted', variant: 'destructive' });
  }, [toast]);

  const handleUpdateSummary = useCallback((noteId: string, summary: string | null) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, summary, lastModified: Date.now() } : n));
  }, []);

  const handleMoveNote = useCallback((noteId: string, folderId: string | null) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, folderId, lastModified: Date.now() } : n));
      toast({ title: 'Note Moved', description: `"${note.title}" was moved successfully.` });
    }
  }, [notes, toast]);

  const handleCopyNote = useCallback((noteId: string, folderId: string | null) => {
    const noteToCopy = notes.find(n => n.id === noteId);
    if (!noteToCopy) return null;

    const newNote: Note = {
      ...noteToCopy,
      id: uuidv4(),
      title: `Copy of ${noteToCopy.title}`,
      folderId,
      lastModified: Date.now(),
    };

    setNotes(prev => [...prev, newNote]);
    toast({ title: 'Note Copied', description: `A copy of "${noteToCopy.title}" was created.` });
    return newNote;
  }, [notes, toast]);

  const value = useMemo(() => ({
    folders,
    notes,
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
    folders, notes, isDataLoaded, getNoteById, getNotesByFolderId, getNotesByTag, uniqueTags, recentNotes,
    handleCreateFolder, handleCreateNote, handleContentChange, handleUpdateTags, handleDeleteNote, handleTitleChange, handleUpdateSummary,
    handleMoveNote, handleCopyNote,
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
