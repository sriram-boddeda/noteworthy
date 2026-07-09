import { v4 as uuidv4 } from 'uuid';
import { Calculator, FileText, FileType } from 'lucide-react';
import React from 'react';

export interface NoteVersion {
  timestamp: number;
  content: string;
}

export interface Note {
  id: string;
  title: string;
  type: 'richtext' | 'markdown' | 'calculator';
  tags: string[];
  content: string;
  folderId?: string | null;
  summary?: string | null;
  lastModified: number;
  isTrashed?: boolean;
  versions: NoteVersion[];
}

export interface Folder {
  id: string;
  name: string;
  isTrashed?: boolean;
}

export type ActionDetail =
  | { type: 'CREATE'; destination?: string }
  | { type: 'RENAME'; from: string; to: string }
  | { type: 'DELETE' }
  | { type: 'RESTORE'; from?: string }
  | { type: 'RESTORE_VERSION' }
  | { type: 'PERMANENT_DELETE' }
  | { type: 'MOVE'; from: string; to: string }
  | { type: 'COPY'; destination: string }
  | { type: 'RETRIEVE' };

export interface ActionHistory {
  id: string;
  timestamp: number;
  entityType: 'note' | 'folder';
  entityId: string | null;
  entityName: string;
  action: ActionDetail;
  entityData?: Note | Folder | null;
  containedEntitiesData?: Note[] | null;
}

export interface UserSettings {
  defaultNoteType: Note['type'];
  recentNotesCount: number;
}

export const noteTypeOptions = [
  {
    value: 'richtext',
    label: 'Rich Text Note',
    icon: React.createElement(FileText, { className: 'size-4 shrink-0' })
  },
  {
    value: 'markdown',
    label: 'Markdown Note',
    icon: React.createElement(FileType,   { className: 'size-4 shrink-0' })
  },
  {
    value: 'calculator',
    label: 'Calculator Note',
    icon: React.createElement(Calculator, { className: 'size-4 shrink-0' })
  },
];

export const defaultSettings: UserSettings = {
  defaultNoteType: 'richtext',
  recentNotesCount: 5,
};

export function getInitialData(): { notes: Note[]; folders: Folder[] } {
  const initialFolders: Folder[] = [
    { id: 'folder-prod-1',  name: 'Productivity', isTrashed: false },
    { id: 'folder-pers-1',  name: 'Personal',     isTrashed: false },
    { id: 'folder-drafts-1',name: 'Drafts',       isTrashed: false },
  ];

  const now = Date.now();

  const initialNotes: Note[] = [
    {
      id: uuidv4(),
      title: 'Welcome — Rich Text',
      type: 'richtext',
      tags: ['richtext', 'example', 'features'],
      content: `<h1>Welcome to Noteworthy Rich Text</h1>
<p>This note showcases what the <strong>Rich Text editor</strong> can do. Feel free to edit or delete it.</p>

<h2>Text Formatting</h2>
<p>You can use <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strikethrough</s>, <mark>highlight</mark>, and <code>inline code</code>.</p>

<h2>Headings</h2>
<h3>This is an H3</h3>
<h4>This is an H4</h4>
<h5>This is an H5</h5>

<h2>Lists</h2>
<h3>Unordered</h3>
<ul>
  <li>Apples</li>
  <li>Bananas</li>
  <li>Cherries</li>
</ul>
<h3>Ordered</h3>
<ol>
  <li>First step</li>
  <li>Second step</li>
  <li>Third step</li>
</ol>

<h2>Task List</h2>
<ul data-type="taskList">
  <li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked><span></span></label><div><p>Create a note</p></div></li>
  <li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked><span></span></label><div><p>Try different formatting</p></div></li>
  <li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>Explore the app</p></div></li>
</ul>

<h2>Blockquote</h2>
<blockquote><p>The best way to predict the future is to create it. — Peter Drucker</p></blockquote>

<h2>Code Block</h2>
<pre><code class="language-typescript">function greet(name: string) {
  return "Hello, " + name + "!";
}
console.log(greet("Noteworthy"));</code></pre>

<h2>Table</h2>
<table>
  <thead><tr><th>Feature</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>Rich Text</td><td>Full</td></tr>
    <tr><td>Markdown</td><td>Full</td></tr>
    <tr><td>Calculator</td><td>Available</td></tr>
  </tbody>
</table>

<h2>Link</h2>
<p>Visit <a href="https://example.com">example.com</a> for more info.</p>`,
      folderId: null,
      summary: 'A demo note covering all Rich Text features — headings, lists, tasks, tables, code, and formatting.',
      lastModified: now - 1000 * 60 * 5,
      isTrashed:   false,
      versions:    []
    },
    {
      id: uuidv4(),
      title: 'Welcome — Markdown',
      type: 'markdown',
      tags: ['markdown', 'example', 'features'],
      content: `# Welcome to Noteworthy Markdown

This note showcases everything the **Markdown editor** supports. Edit or delete it freely.

---

## Text Formatting

**Bold**, *italic*, ~~strikethrough~~, \`inline code\`, and :smile: emoji shortcodes.

## LaTeX Formulas

Inline: $E = mc^2$

Block:

$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

## Code Block with Syntax Highlighting

\`\`\`python
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

print(list(fibonacci(10)))
\`\`\`

\`\`\`javascript
// Click handler
document.querySelector('button')
  .addEventListener('click', () => alert('Clicked!'));
\`\`\`

\`\`\`css
.card {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}
\`\`\`

## Tables

| Feature | Supported |
|---------|-----------|
| GFM | ✅ |
| LaTeX | ✅ |
| Mermaid | ✅ |

## Task List

- [x] Write markdown note
- [x] Add LaTeX support
- [ ] Add more diagrams

## Blockquote

> Any sufficiently advanced technology is indistinguishable from magic.
> — Arthur C. Clarke

## Mermaid Diagram

\`\`\`mermaid
flowchart LR
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Ship it!]
    B -->|No| D[Debug]
    D --> B
\`\`\`

## Links

Visit [GitHub](https://github.com) for more.
`,
      folderId: null,
      summary: 'A demo note covering all Markdown features: GFM, LaTeX, syntax highlighting, tables, Mermaid diagrams, and emoji shortcodes.',
      lastModified: now - 1000 * 60 * 3,
      isTrashed:   false,
      versions:    []
    },
    {
      id: uuidv4(),
      title: 'Welcome — Calculator',
      type: 'calculator',
      tags: ['calculator', 'example', 'demo'],
      content: `# Simple Calculator
# Edit variables and re-run to see results

# --- Inputs ---
length = 10
width  = 5
height = 3

# --- Calculations ---
area   = length * width
volume = length * width * height
perimeter = 2 * (length + width)

# --- Outputs ---
area
volume
perimeter
`,
      folderId: null,
      summary: null,
      lastModified: now,
      isTrashed:   false,
      versions:    []
    }
  ];

  return { notes: initialNotes, folders: initialFolders };
}
