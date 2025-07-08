
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
  handleCreateFolder: (folderName: string) => void;
  handleCreateNote: (title: string, type: Note['type'], folderId: string | null) => Note | null;
  handleContentChange: (noteId: string, newContent: string) => void;
  handleUpdateTags: (noteId: string, newTags: string[]) => void;
  handleDeleteNote: (noteId: string) => void;
  handleTitleChange: (noteId: string, newTitle: string) => void;
  handleUpdateSummary: (noteId: string, summary: string | null) => void;
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
        };
        setNotes(prev => [...prev, newNote]);
        toast({ title: 'Note Created', description: `Successfully created "${title}".` });
        return newNote;
    }
    return null;
  }, [toast]);

  const handleContentChange = useCallback((noteId: string, newContent: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: newContent } : n));
  }, []);

  const handleTitleChange = useCallback((noteId: string, newTitle: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, title: newTitle } : n));
  }, []);
  
  const handleUpdateTags = useCallback((noteId: string, newTags: string[]) => {
    const updatedTags = [...new Set(newTags)].filter(Boolean).map(t => t.trim().toLowerCase());
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, tags: updatedTags } : n));
  }, []);

  const handleDeleteNote = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    toast({ title: 'Note Deleted', variant: 'destructive' });
  }, [toast]);

  const handleUpdateSummary = useCallback((noteId: string, summary: string | null) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, summary } : n));
  }, []);

  const value = useMemo(() => ({
    folders,
    notes,
    isDataLoaded,
    getNoteById,
    getNotesByFolderId,
    getNotesByTag,
    uniqueTags,
    handleCreateFolder,
    handleCreateNote,
    handleContentChange,
    handleUpdateTags,
    handleDeleteNote,
    handleTitleChange,
    handleUpdateSummary,
    aiTagState,
    aiTagAction,
    aiTtsState,
    aiTtsAction,
    aiSummaryState,
    aiSummaryAction,
  }), [
    folders, notes, isDataLoaded, getNoteById, getNotesByFolderId, getNotesByTag, uniqueTags,
    handleCreateFolder, handleCreateNote, handleContentChange, handleUpdateTags, handleDeleteNote, handleTitleChange, handleUpdateSummary,
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
