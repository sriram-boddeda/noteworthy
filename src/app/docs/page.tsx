
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BookOpen, Search, Type } from 'lucide-react';

const tocItems = [
  { id: 'introduction', label: 'Introduction', level: 1 },
  { id: 'user-interface', label: 'The User Interface', level: 1 },
  { id: 'sidebar', label: 'The Sidebar', level: 2 },
  { id: 'main-view', label: 'The Main View', level: 2 },
  { id: 'creating-content', label: 'Creating Content', level: 1 },
  { id: 'creating-note', label: 'Creating a New Note', level: 2 },
  { id: 'creating-folder', label: 'Creating a New Folder', level: 2 },
  { id: 'note-types', label: 'Note Types', level: 1 },
  { id: 'rich-text-notes', label: 'Rich Text Notes', level: 2 },
  { id: 'markdown-notes', label: 'Markdown Notes', level: 2 },
  { id: 'calculator-notes', label: 'Calculator Notes', level: 2 },
  { id: 'managing-notes', label: 'Managing Notes', level: 1 },
  { id: 'editing-and-ai', label: 'Editing, Tags & AI', level: 2 },
  { id: 'moving-and-deleting', label: 'Moving & Deleting', level: 2 },
  { id: 'version-history', label: 'Version History', level: 2 },
  { id: 'organizing', label: 'Organizing Your Workspace', level: 1 },
  { id: 'using-folders', label: 'Using Folders', level: 2 },
  { id: 'using-tags', label: 'Using Tags', level: 2 },
  { id: 'advanced-search', label: 'Advanced Search', level: 2 },
  { id: 'special-pages', label: 'Special Pages', level: 1 },
  { id: 'history-page', label: 'History Page', level: 2 },
  { id: 'trash-page', label: 'Trash Page', level: 2 },
  { id: 'customization', label: 'Customization', level: 1 },
  { id: 'switching-themes', label: 'Switching Themes', level: 2 },
];

function TableOfContents({ activeId }: { activeId: string }) {
  return (
    <nav className="text-sm">
      <p className="mb-4 font-medium">On this page</p>
      <ul>
        {tocItems.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                'block py-1.5 transition-colors duration-200',
                item.level === 2 && 'pl-4',
                activeId === item.id
                  ? 'font-semibold text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function DocsPage() {
  const [activeId, setActiveId] = useState(tocItems[0].id);
  const observer = useRef<IntersectionObserver | null>(null);
  const headingElementsRef = useRef<Record<string, IntersectionObserverEntry>>({});

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
        headingElementsRef.current[entry.target.id] = entry;
    });

    const visibleHeadings = Object.values(headingElementsRef.current).filter(
        (entry) => entry.isIntersecting
    );
    
    // Find the heading that is closest to the top of the viewport
    if (visibleHeadings.length > 0) {
        const topMostVisible = visibleHeadings.reduce((prev, curr) => {
            return prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr;
        });
        setActiveId(topMostVisible.target.id);
    }
  }, []);

  useEffect(() => {
    observer.current = new IntersectionObserver(handleObserver, {
      rootMargin: '-20% 0px -35% 0px', // Adjust margins to better detect which element is "active"
    });

    const elements = tocItems.map(item => document.getElementById(item.id)).filter(Boolean);
    elements.forEach(el => observer.current?.observe(el as Element));

    return () => observer.current?.disconnect();
  }, [handleObserver]);

  return (
    <div className="bg-background text-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:gap-16">
          {/* Main Content */}
          <main className="w-full lg:w-3/4 py-10 prose prose-sm dark:prose-invert max-w-none">
            <header className="mb-12">
                <div className="flex items-center gap-4 mb-4">
                    <BookOpen className="size-10 text-primary" />
                    <div>
                        <h1 className="text-4xl font-bold font-headline mb-0">Noteworthy Docs</h1>
                        <p className="text-lg text-muted-foreground mt-2">
                        Welcome to the official guide. Learn how to master every feature of the app.
                        </p>
                    </div>
                </div>
            </header>

            <section id="introduction">
              <h2 className="font-headline">Introduction</h2>
              <p>
                Noteworthy is a modern, feature-rich note-taking application designed to boost your productivity and keep your ideas organized. This guide will walk you through every aspect of the app, from creating your first note to using advanced AI features.
              </p>
            </section>

            <section id="user-interface">
              <h2 className="font-headline">The User Interface</h2>
              <p>
                The interface is designed to be clean and intuitive, consisting of two main parts: the sidebar for navigation and the main view for your content.
              </p>
              <Card className="not-prose my-6">
                <CardContent className="p-4">
                    <Image
                        src="https://placehold.co/1200x750.png"
                        alt="Noteworthy App Interface"
                        width={1200}
                        height={750}
                        className="rounded-md"
                        data-ai-hint="app interface"
                    />
                </CardContent>
              </Card>
              <h3 id="sidebar">The Sidebar</h3>
              <p>
                The sidebar is your command center for navigation. Here you can:
              </p>
              <ul>
                <li>Access Home, History, and Trash pages.</li>
                <li>Create new notes and folders using the <Badge variant="secondary">+</Badge> button.</li>
                <li>Browse through your folders and the notes within them.</li>
                <li>View a list of all unique tags for quick filtering.</li>
                <li>Search your entire workspace.</li>
                <li>Drag and drop notes into folders or the trash.</li>
              </ul>
              <h3 id="main-view">The Main View</h3>
              <p>
                This is where your content lives. When you select a note, it will be displayed here in its respective editor. The header of the main view provides context through breadcrumbs and contains all actions related to the currently active note or page.
              </p>
            </section>

            <section id="creating-content">
              <h2 className="font-headline">Creating Content</h2>
              <h3 id="creating-note">Creating a New Note</h3>
              <ol>
                <li>Click the <Badge variant="secondary">+</Badge> button in the sidebar.</li>
                <li>Select "New Note" from the dropdown menu.</li>
                <li>In the dialog, provide a title, select a note type (Rich Text, Markdown, or Calculator), and optionally choose a folder.</li>
                <li>Click "Create Note", and you'll be taken directly to your new note.</li>
              </ol>
              <h3 id="creating-folder">Creating a New Folder</h3>
               <ol>
                <li>Click the <Badge variant="secondary">+</Badge> button in the sidebar.</li>
                <li>Select "New Folder" from the dropdown.</li>
                <li>Enter a name for your folder and click "Create Folder". It will immediately appear in your sidebar.</li>
              </ol>
            </section>

            <section id="note-types">
              <h2 className="font-headline">Note Types</h2>
              <p>Noteworthy supports three distinct note types to fit your needs.</p>
              
              <h3 id="rich-text-notes">Rich Text Notes</h3>
              <p>The Rich Text editor provides a familiar "what you see is what you get" (WYSIWYG) experience. Use the toolbar at the top to format your text with headings, bold, italics, lists, and more, just like in a standard word processor.</p>
              <Card className="not-prose my-6">
                <CardContent className="p-4">
                    <Image src="https://placehold.co/1200x600.png" alt="Rich Text Editor" width={1200} height={600} className="rounded-md" data-ai-hint="rich text editor" />
                </CardContent>
              </Card>

              <h3 id="markdown-notes">Markdown Notes</h3>
              <p>For those who prefer writing with lightweight syntax, the Markdown editor is perfect. It features a split-screen view with your raw Markdown on the left and a live preview on the right. It supports GitHub Flavored Markdown, including tables, code blocks, and more.</p>
              <Card className="not-prose my-6">
                <CardContent className="p-4">
                    <Image src="https://placehold.co/1200x600.png" alt="Markdown Editor" width={1200} height={600} className="rounded-md" data-ai-hint="markdown editor" />
                </CardContent>
              </Card>

              <h3 id="calculator-notes">Calculator Notes</h3>
              <p>This unique note type acts as a live calculator. Each line can be a comment (starting with <Badge variant="secondary">#</Badge>), a variable assignment (e.g., <Badge variant="secondary">rent = 1500</Badge>), or a mathematical expression. The live output panel on the right shows the results of your calculations in real-time. It's perfect for quick budgets, expense splitting, or any scenario involving numbers.</p>
              <Card className="not-prose my-6">
                <CardContent className="p-4">
                    <Image src="https://placehold.co/1200x600.png" alt="Calculator Note Editor" width={1200} height={600} className="rounded-md" data-ai-hint="calculator note" />
                </CardContent>
              </Card>
            </section>

            <section id="managing-notes">
              <h2 className="font-headline">Managing Notes</h2>
              <h3 id="editing-and-ai">Editing, Tags & AI Features</h3>
              <p>When viewing a note, the header provides several actions:</p>
              <ul>
                <li><strong>Title:</strong> Simply click on the title to rename your note.</li>
                <li><strong>Tags:</strong> Click the pencil icon next to the tags to add, edit, or remove them. You can also use the "Suggest Tags" AI feature to get smart recommendations based on your note's content.</li>
                <li><strong>AI Features:</strong> Use the "Summarize" button to generate a concise summary of your note, or "Listen" to have the note's content read aloud to you using text-to-speech.</li>
              </ul>
               <Card className="not-prose my-6">
                <CardContent className="p-4">
                    <Image src="https://placehold.co/1200x300.png" alt="Note actions header" width={1200} height={300} className="rounded-md" data-ai-hint="note actions header" />
                </CardContent>
              </Card>

              <h3 id="moving-and-deleting">Moving & Deleting</h3>
              <p>You can organize notes in two ways:</p>
              <ol>
                <li><strong>Drag and Drop:</strong> Simply drag a note from the sidebar and drop it onto a folder to move it. You can also drag it to the "Trash" item in the sidebar.</li>
                <li><strong>More Options Menu:</strong> Click the three-dots menu in the note header to find options to "Move Note", "Create Copy", or "Delete".</li>
              </ol>

              <h3 id="version-history">Version History</h3>
              <p>Noteworthy automatically saves versions of your notes as you work. From the three-dots menu, select "Version History" to open a panel showing all saved versions. You can view and restore any previous version, giving you peace of mind that your work is never lost.</p>
            </section>
            
            <section id="organizing">
                <h2 className="font-headline">Organizing Your Workspace</h2>
                <h3 id="using-folders">Using Folders</h3>
                <p>Folders are the primary way to structure your notes. Clicking on a folder in the sidebar will display only the notes contained within it. You can drag and drop notes between folders or into the "Home" view to un-folder them.</p>

                <h3 id="using-tags">Using Tags</h3>
                <p>Tags provide a flexible way to categorize notes across different folders. Clicking on a tag in the sidebar's tag list will show all notes with that tag, regardless of which folder they are in.</p>
                
                <h3 id="advanced-search">Advanced Search</h3>
                <p>The search bar is powerful. You can simply type to search titles and content, or you can use special filters for more precise results:</p>
                <ul>
                    <li><Badge variant="outline">tag:finance</Badge> - Finds all notes with the "finance" tag.</li>
                    <li><Badge variant="outline">type:markdown</Badge> - Finds all Markdown notes.</li>
                    <li><Badge variant="outline">in:work</Badge> - Finds all notes within the "work" folder.</li>
                </ul>
                <p>You can combine these filters, for example: <Badge variant="secondary">Project proposal tag:work type:markdown</Badge>.</p>
            </section>

             <section id="special-pages">
              <h2 className="font-headline">Special Pages</h2>
              <h3 id="history-page">History Page</h3>
              <p>
                The History page provides a complete audit log of all actions taken within the application, such as creating, renaming, moving, and deleting notes and folders. For permanently deleted items, you may have the option to retrieve them from this log.
              </p>
              <h3 id="trash-page">Trash Page</h3>
              <p>
                When you delete a note or folder, it's moved to the Trash. From here, you can either restore the item to its original location or delete it permanently. Items in the trash will be automatically deleted after 30 days.
              </p>
            </section>

            <section id="customization">
                <h2 className="font-headline">Customization</h2>
                <h3 id="switching-themes">Switching Themes</h3>
                <p>You can switch between light, dark, and system themes using the theme toggle at the bottom of the sidebar. This allows you to use the app in a way that's most comfortable for your eyes.</p>
            </section>

          </main>

          {/* Table of Contents */}
          <aside className="hidden lg:block w-1/4 py-10">
            <div className="sticky top-20">
              <TableOfContents activeId={activeId} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
