# Comprehensive Application Audit: Client-Side Next.js AI Notepad
**Date of Audit:** July 9, 2026
**Target File:** `.reports/audit.md`

---

## 1. Executive Summary

**Noteworthy** is a single-user, client-side Next.js 15 note-taking application with three note types (rich text via Tiptap, markdown with live preview, and a calculator notebook), folder organization, tagging, version history, activity logging, drag-and-drop sidebar management, and Gemini AI integration (summarization, tag suggestion, text-to-speech, and calculator template generation). It runs entirely via `localStorage` under four keys (`noteworthy-notes`, `noteworthy-folders`, `noteworthy-history`, `noteworthy-settings`) with no backend, database, or authentication layer.

**Strengths:**
- Clean component architecture with shadcn/ui, good separation of concerns via React Context
- Comprehensive editor features (task lists, code blocks with syntax highlighting, LaTeX math, text alignment, link handling)
- Full action history with retrieval from permanently deleted state
- Version history (up to 50 versions per note, 5-minute cooldown between snapshots)
- Export/import as JSON with full data round-trip
- AI features gracefully degrade when `GEMINI_API_KEY` is absent via `env.isAiEnabled` gates
- Drag-and-drop sidebar with visual feedback (highlight, lock overlay, dropzone indicators)
- Dark/light/system theme with HSL CSS variable customization at the color level

**Primary Bottlenecks & Risks:**
- **Critical data loss risk** — `localStorage` is synchronous, blocking, and limited to ~5–10MB per origin. The app serializes ALL notes, folders, history, and settings to JSON on EVERY keystroke. No debounce, no incremental save, no compaction.
- **API key bundled into client-accessible module** — `env.ts` is imported by the client component `app-provider.tsx`, meaning the `env` module and its `process.env` access pattern live in the client bundle. While Server Actions keep the actual key out of network traffic, this is a fragile layering violation.
- **No streaming AI** — All Gemini interactions are request/response with `useActionState`. No token-by-token streaming, no partial updates, no abort controller.
- **`new Function()` in calculator evaluator** — `src/lib/calculator.ts:67` uses `new Function('return ' + sanitizedExpr)` for expression evaluation, bypassing CSP directives.
- **Full provider re-render on every keystroke** — `handleContentChange` updates `allNotes`, causing the entire `AppProvider` tree to re-render, re-computing all derived `useMemo` values for every consumer (sidebar, note list, trash, history).
- **Non-functional "Share" button** — Present in the UI but has no `onClick` handler.
- **No service worker, no PWA manifest, no offline fallback** — Despite being entirely client-side.
- **No pagination or virtualization** — All notes live in memory and in the DOM simultaneously.

---

## 2. Design, UI/UX, & Visual Inconsistencies Audit

### 2.1 Visual Hierarchy & Typography
- **Font stack**: `PT Sans` (body), `Poppins` (headline), `Fira Code` (mono/calculator). Loaded from Google Fonts with `<link rel="preconnect">` — a deliberate, readable pairing. However, `PT Sans` at the default `font-body` weight 400 renders at 14px in `prose-sm`, which is below the ergonomic minimum for extended writing sessions.
- **Headline in note cards** (`note-list.tsx`): `font-headline text-lg` with `truncate`. The icon (rich text/markdown/calculator) sits inline with the title via `flex items-center gap-3`. On multi-word titles close to the truncation boundary, the icon wraps awkwardly.
- **Missing visual weight differentiation**: Note cards use the same font weight and size for title, description, tags, and timestamp. The only visual separator is `text-muted-foreground` for description/timestamp. A `font-medium` on the title with `text-base` for description would improve scannability.
- **Empty state design**: Pages (Home, History, Trash) show centered messages with dashed borders (`border-2 border-dashed bg-muted/50`). This is clean but lacks actionable CTAs — the Home empty state should show a "Create your first note" button.
- **Markdown editor split**: The 50/50 editor/preview split at `md:` breakpoint is correct. But there is no way to resize the panes, and no "Edit only" or "Preview only" toggle for mobile.

### 2.2 Color Palette & Contrast
- **Light mode**: Background `0 0% 96.1%` (~#F5F5F5), foreground `240 10% 3.9%` (~#0A0A0A). Contrast ratio ~15.5:1 — passes WCAG AAA.
- **Dark mode**: Background `240 6% 10%` (~#18181B), foreground `0 0% 98%` (~#FAFAFA). Contrast ~17.2:1 — passes WCAG AAA.
- **Primary color**: `231 48% 48%` — muted indigo. Works as accent/border/ring but is too dark to use as small text on dark backgrounds.
- **`--muted-foreground` FAILS WCAG AA**: `240 3.8% 46.1%` (~#75757A). On `--background` (96.1%) the contrast ratio is ~3.2:1 — below the 4.5:1 minimum for small text. This affects breadcrumbs, description text, timestamps, and icon labels throughout the app. This is the most pervasive accessibility issue.
- **Sidebar dark mode**: `--sidebar-background: 240 5% 12%` (~#1C1C1F) with `--sidebar-foreground: 0 0% 98%` (~#FAFAFA). The sidebar accent `--sidebar-accent: 240 4% 18%` (~#2C2C30) is too close to the background — active/hover states lack sufficient differentiation.
- **Code block styling**: The markdown preview renders code blocks with `bg-[#282c34]` (Atom One Dark) which is hardcoded. In light mode, this dark rectangle on a white background is visually jarring — code blocks should respect the theme.

### 2.3 Component & UI Inconsistencies
- **Border radius mismatch**: Global `--radius: 0.5rem` (8px). `rounded-lg` computes to 10px, `rounded-md` to 6px, `rounded-sm` to 4px. The sidebar container uses `rounded-lg`, sidebar items use `rounded-md`, editor cards use `rounded-lg`, toolbar uses `rounded-t-lg`. Some toggles use `rounded-full`. There is no single radius system applied uniformly.
- **Search icon/input alignment** (`app-sidebar.tsx:367-375`): The search icon uses `left-4` (absolute, 16px from left) and the `Input` uses `pl-8` (32px left padding). The icon sits at 16px within the `relative` wrapper, but the input's text starts at 32px — creating an asymmetric 16px gap.
- **Card hover double-animation** (`note-list.tsx:30-31`): `hover:scale-[1.02]` on the `<Card>` and `group-hover:scale-[.98]` on the inner `<div>`. This creates an undesirable "scale in, then scale back" effect. The hover also triggers `[transform:translateZ(0)]` — a GPU compositing hack that can cause text rendering glitches on some browsers.
- **Sidebar accordion padding**: The `Accordion` in the sidebar uses `px-2 py-1.5` for triggers, but the note items within use `pl-7`. The nested hierarchy indentation (7× 4px = 28px) is arbitrary and not aligned to any spacing scale.
- **Tag badge consistency**: Tags render as `<Badge variant="secondary">` in the note header, `<Badge variant={pathname === ... ? "default" : "outline"}>` in the sidebar, and `<Badge variant="secondary">` again in the note list card footer. Three different visual treatments for the same data type.
- **Avatar as placeholder**: The sidebar footer shows a hardcoded `<Avatar>` with `src="https://placehold.co/40x40"` and `alt="User"` with `"User"` and `"user@example.com"`. This is clearly placeholder data that should either be removed or configurable.
- **Missing close button on mobile sidebar**: The sidebar `Sheet` component has `[&>button]:hidden` which hides the default close button. There is no custom close button, so on mobile the only way to close the sidebar is to tap the overlay.

### 2.4 Layout & Responsiveness
- **Desktop (≥1024px)**: Sidebar at `16rem` (256px) with `collapsible="offcanvas"`. The note editor area fills remaining space. The 50/50 markdown split is comfortable. The calculator 75/25 split works.
- **Tablet (768–1024px)**: Sidebar collapses to offcanvas overlay. The `md:` breakpoint correctly switches markdown to single column and calculator to column layout. The note grid switches from 3 columns to 2.
- **Mobile (<768px)**: The most problematic breakpoint.
  - Sidebar Sheet opens at `18rem` (288px) — many phones are 360–414px wide, leaving only 72–126px for the overlay backdrop, making the sidebar feel cramped.
  - The note editor header (`sticky top-0 z-10 p-3`) + toolbar + AI buttons + action buttons consume ~200px of vertical space before the editor content begins.
  - On screens under 400px height (landscape mode), the editor is essentially unusable.
  - The calculator output panel renders above the editor on mobile — users must scroll past the entire output to continue typing.
  - The `min-h-[50vh]` on both markdown panes causes both to fill at least half the viewport, pushing the bottom pane below the fold even if it's empty.
- **No print styles**: The app has no `@media print` styles. Printing a note would render the sidebar overlay toolbar, and header as-is.

### 2.5 Micro-interactions & State Feedback
- **Loading states**: The sidebar shows `Skeleton` components for workspace, tags, and user area — excellent. The note editor shows a full-page `Loader2` spinner — acceptable for initial load.
- **AI loading**: All AI actions use `useFormStatus().pending` with `Loader2` + `animate-spin` on buttons. This is standard and functional. However, there is no visual indicator that an AI action is IN PROGRESS after clicking — the button shows a spinner, but the editor gives no feedback that the note was sent to the AI.
- **Drag and drop**: The best-micro interaction in the app.
  - `Draggable` component sets `opacity-50` on the dragged item.
  - `Droppable` highlights valid targets with `bg-primary/10`.
  - Invalid targets show a `Lock` icon overlay with `bg-destructive/20 backdrop-blur-sm`.
  - `DragOverlay` shows a floating preview of the item with `shadow-lg`.
  - Activation constraint is `8px` distance — prevents accidental drags.
  - This is polished and production-ready.
- **Version restore**: There is no confirmation dialog before restoring a version, and no way to preview what content will be restored.
- **Tag live update**: `onUpdateTags` fires on every keystroke in the tag input, immediately saving to localStorage. If the user types "travel, foo", the note immediately gets `["travel,", "foo"]` — the comma is included in the tag string.
- **Toast positioning**: `position="top-right"` in the layout. On mobile, top-right toasts can be clipped by the browser's address bar or Notch.

---

## 3. UI/UX Redesign & Layout Suggestions

### 3.1 The Editor Interface
- **Zen/Distraction-Free Mode**: Add `Cmd+Shift+Z` (or `Esc` when not in a dialog) to toggle a mode where: sidebar collapses, header collapses to a thin 32px bar showing only breadcrumbs, toolbar hides and reappears on mouseover at the top, and the editor fills the full viewport. Add a toggle button ("Focus Mode") in the action bar. Persist preference in settings.
- **Toolbar group**: The current Tiptap toolbar wraps poorly on mid-width screens. Group into logical clusters:
  1. **Typography**: H1, H2, H3, Bold, Italic, Underline, Strike
  2. **Alignment**: Left, Center, Right, Justify
  3. **List**: Bullet, Ordered, Task
  4. **Insert**: Link, Code Block, Highlight, Divider
  5. **History**: Undo, Redo
  Each group separated by a `Separator`. On screens <600px, collapse groups beyond the first 3 into a "More" (`...`) dropdown.
- **Font size increase**: Change the Tiptap editor content from `prose prose-sm` (14px) to `prose prose-base` (16px). Add a settings slider for font size (14, 16, 18, 20px) and pass it as a CSS variable to the editor.
- **Markdown editor toolbar**: Add a minimal toolbar above the markdown textarea with buttons that insert syntax at cursor: `**bold**`, `*italic*`, `## heading`, `[text](url)`, `` `code` ``, `> blockquote`, `- list`, `1. list`. Reduces the learning curve for markdown beginners.
- **Markdown pane toggle**: Add a toggle button (icons: `Edit` / `Eye` / `Columns`) to switch between "Edit only", "Preview only", and "Split view". On mobile, default to "Edit only" with a swipe-to-preview gesture.
- **Calculator note**: Change the output panel from a `w-1/4` fixed-width sidebar to a toggleable bottom drawer that slides up from the bottom. This would give the calculator notebook editor the full width for editing while keeping results accessible.

### 3.2 AI Integration UX
- **Inline `/` command menu**: Inspired by Notion/Linear. When the user types `/` in the Tiptap editor (or in the markdown editor), show a popover with:
  - `/summarize` — Summarize this note
  - `/suggest-tags` — Suggest 3–5 tags
  - `/translate` — Translate to [language]
  - `/explain` — Explain selected text
  - `/rewrite` — Rewrite selected text
  - `/generate-calculator` — Open the calculator generator
  This keeps AI interactions within the writing flow without requiring the user to reach for header buttons.
- **Floating AI sidebar (toggleable with Cmd+.)**: A resizable right panel showing:
  - AI Summary (with regenerate button)
  - Suggested Tags (clickable to add)
  - AI Action History (last 5 actions for this note)
  - TTS player (last generated audio)
  - This replaces the current popover modals and alert boxes.
- **Context-aware selection bubble**: When the user selects text in the Tiptap editor, show a floating action bar above the selection with: "Summarize", "Explain", "Translate", "Rewrite". This is the most discoverable AI interaction pattern.
- **Streaming output**: Replace `useActionState` with a streaming API route + `useSWRSubscription` or native `ReadableStream`. Show AI responses token-by-token in a typewriter-style output box within the AI sidebar.
- **AI summary placement**: The current `Alert` at the top of the editor is functional but visually heavy. Move it to the AI sidebar or render it as a collapsible callout strip that can be dismissed and re-shown.

### 3.3 Navigation & Note Management
- **Cmd+K Command Palette**: Global shortcut to open a search/palette dialog. Shows:
  - Recent notes (with keyboard selection)
  - Folder navigation
  - Tag filtering
  - AI actions (/summarize, /suggest-tags)
  - Settings
  - Matches `algolia/cmdk` or `pacocoursey/cmdk` library.
- **Pinned notes**: Add `pinned` boolean to the `Note` interface. Pinned notes render in a dedicated "Pinned" accordion at the top of the sidebar, above recents. Drag a note to the "Pinned" section to pin it.
- **Nested folders**: Change `Folder` to have `parentId?: string | null` instead of flat organization. The sidebar accordion should render nested folders recursively. Breadcrumbs should reflect the full path.
- **Tag management page**: Add `/tags` route (accessible from the sidebar Tags section) with:
  - List of all tags with note count
  - Click to rename a tag across all notes
  - Checkbox to merge tags
  - Delete to remove from all notes
  - Search/filter tags
- **Bulk actions (checkbox mode)**: On the note grid (`Home`, `folder/[folderId]`, `tag/[tagName]`), add a "Select" button that toggles checkbox mode. With selected notes, show a floating action bar at the bottom: "Move to Folder...", "Add Tags...", "Delete", "Copy to...".
- **Virtual list for sidebar and grid**: For 500+ notes, the sidebar's full DOM presence causes scroll jank. Implement `@tanstack/react-virtual` for infinite scrolling in both the note grid and the sidebar lists. Window the DOM to ~30 items at a time.
- **Search inside individual folder/tag**: The current search in the sidebar searches globally. Add a scoped search toggle: "Search current folder" / "Search tag: tagName" / "Search all".

---

## 4. Technical Architecture & Storage Audit

### 4.1 State Management & Persistence

**Current flow:**
1. `AppProvider` holds `allNotes`, `allFolders`, `actionHistory`, `settings` in React state via `useState`.
2. A `useEffect` on mount (`app-provider.tsx:100-130`) reads all 4 keys from `localStorage` at once.
3. A second `useEffect` (`app-provider.tsx:132-146`) writes ALL 4 keys on EVERY change to any of the 4 state arrays — using a single `useEffect` dependency array (`[allNotes, allFolders, actionHistory, settings, isDataLoaded]`).
4. Derive `notes`, `folders`, `trashedNotes`, `trashedFolders` via `useMemo` to filter out trashed items.

**Critical issues:**

- **Synchronous blocking writes**: `localStorage.setItem` is synchronous and blocks the main thread. `JSON.stringify` a 2MB state object takes ~10–50ms. During rapid typing, this introduces frame drops.
- **No write debouncing**: `handleContentChange` is called on every keystroke. React 18's automatic batching means state coalesces, but the `useEffect` fires once per commit. If the user types 15 WPM (60 keystrokes in 60 seconds, roughly 1 per second), the app serializes and saves all 4 keys 60 times in 60 seconds.
- **Write amplification**: A tag change on 1 note triggers all 4 keys to be serialized and written — including all other notes, all history, and all settings.
- **Race condition on rapid load**: If the user opens the app, immediately navigates, and the component tree loads faster than the first `useEffect` mount + read, `isDataLoaded` is false and the save effect doesn't fire, but yet the app shows empty data.
- **Quote/backup import mutates state unsafely**: `handleImportData` (line 614-649) iterates imported notes and folders and SETS them by ID on the current state via `Map.set`. If the imported file has a note with the same ID as an existing note, it silently overwrites. There's no confirmation dialog, no diff view, no conflict resolution.
- **Version history memory**: Up to 50 versions per note, each storing the full content string. For a rich text note with 50KB of HTML content, that's 2.5MB per note in memory + localStorage. Across 10 such notes, that's 25MB of overhead.
- **History buffer capped at 200 entries** (line 93-94): Action history is limited to 200 entries. For power users making 50+ actions per day, history rolls off in 4 days. There should be no cap or a configurable cap.
- **No storage quota monitoring**: `localStorage` has a ~5MB limit (varies by browser). `QuotaExceededError` is caught but only shows a generic toast. The app provides no way to view current storage usage, no warning before hitting the limit, and no cleanup mechanism beyond manual deletion.

### 4.2 Next.js Client-Side Performance

- **Provider tree re-render storm**: Every `handleContentChange` call updates `allNotes` state. This causes:
  1. `AppProvider` re-renders
  2. All `useMemo` derivations re-run (`notes`, `folders`, `trashedNotes`, `trashedFolders`, `uniqueTags`, `recentNotes`)
  3. The context `value` object is re-memoized — since all derived arrays are new references, the `useMemo` on `value` recomputes
  4. Every consumer (`AppSidebar`, `NotePage`, `HistoryPage`, `TrashPage`, `NoteList`, etc.) re-renders
  5. The sidebar re-computes `filteredData` (which iterates every note, matches against all folders, filters by search query, sorts)

- **`filteredData` recalculation**: In `app-sidebar.tsx`, `filteredData` is a `useMemo` dependent on `notes` and `searchQuery`. Since `notes` changes on every keystroke, `filteredData` recomputes, which maps ALL folders and filters ALL notes — even though the sidebar is not visible (collapsed).

- **No `React.memo` on heavy components**: `NoteList`, `TrashList`, `HistoryList`, and the folder accordion items all receive `notes` as props. Since `notes` is a new reference on every render, none of these components skip re-renders. A `React.memo` on `NoteList` would save significant work.

- **Calculator `evaluateNotebook` runs on every render**: `CalculatorNote.tsx:73` calls `evaluateNotebook(content)` inside `useMemo` — this is correct. But the `outputLines` memo and `variables` memo also run on content changes. The evaluation function (`new Function`) is compiled on every keystroke.

- **Tiptap `setContent` on every external content update**: `rich-text-note.tsx:280-284` calls `editor.commands.setContent(content, false)` whenever the `content` prop changes. If the parent re-renders (which it does on every keystroke in another note), the editor content is reset. The guard `editor.getHTML() !== content` helps but HTML string comparison is fragile.

- **No route-level code splitting beyond CalculatorNote**: Only `CalculatorNote` is dynamically imported. `MarkdownNote` and `RichTextNote` are bundled into the main chunk. With `next/dynamic` on all three note editors, the initial bundle could be reduced by ~200KB.

- **Unused/imported heavy libraries**:
  - `monaco-editor` (full bundle, ~2MB+) — only used for calculator notes
  - `jspdf` + `html2canvas` — used for PDF export
  - `recharts` — imported but never used in any component (dead code)
  - `embla-carousel-react` — imported but never used
  - `@dnd-kit/core + modifiers + utilities` — three packages for DnD
  - Full `chart.tsx` component with `recharts` + `dangerouslySetInnerHTML` — dead code

- **CSS bundle size**: Tailwind's `globals.css` with `@tailwind base/components/utilities` generates ~200KB CSS. The shadcn/ui import of 30+ components pulls in all their styles. The custom scrollbar styles, Tiptap task list overrides, and placeholder styles add more. Tree-shaking is not possible with Tailwind in the same way as CSS Modules or CSS-in-JS.

### 4.3 Data Flow & Rendering Architecture Diagram (Text)

```
Keystroke (onUpdate/onChange)
  → NotePage.onContentChange()
    → AppContext.handleContentChange(noteId, content)
      → setAllNotes(prev => prev.map(...))  // new array reference
        → React batches + commits
          → useEffect (localStorage write): JSON.stringify 4 keys → setItem × 4
          → AppProvider re-renders
            → useMemo: notes, folders, trashedNotes, trashedFolders (new refs)
            → useMemo: uniqueTags, recentNotes (new refs)
            → useMemo: context value (new refs)
              → AppSidebar re-renders
                → useMemo: filteredData (iterates ALL notes × folders)
                → Re-renders all accordion items
              → NotePage re-renders
                → useMemo: activeNote
                → useMemo: breadcrumb
                → RichTextNote re-renders
                  → useEffect: editor.setContent() (resets editor content)
                  → EditorContent re-renders entire DOM
```

### 4.4 Detailed File-by-File Audit

| File | Issue | Severity | Line |
|------|-------|----------|------|
| `src/lib/calculator.ts` | `new Function('return ' + sanitizedExpr)` — CSP bypass, XSS vector | **Critical** | 67 |
| `src/context/app-provider.tsx` | All 4 localStorage writes in one try/catch — 1 failure nukes all | **Critical** | 133-138 |
| `src/context/app-provider.tsx` | No debounce on `handleContentChange` — synchronous save on every keystroke | **Critical** | 247-275 |
| `src/context/app-provider.tsx` | `importedNotes.forEach(n => noteMap.set(n.id, n))` — silent overwrite on import | **High** | 634 |
| `src/context/app-provider.tsx` | `lastDeletedNote` ref only holds last deleted note — can't undo earlier deletion | **High** | 65 |
| `src/context/app-provider.tsx` | Action history cap 200 is too low for power users | **Medium** | 93 |
| `src/lib/env.ts` | `env.ts` imported by client component `app-provider.tsx` — potential bundler leak | **High** | 1-12 |
| `src/components/rich-text-note.tsx` | `editor.getHTML() !== content` — fragile string comparison, false content resets | **Medium** | 281 |
| `src/app/note/[noteId]/page.tsx` | No abort controller on AI actions — navigating away while AI runs leaves stale callback | **Medium** | 154-181 |
| `src/components/note-list.tsx` | Nested scale transforms on hover causing visual glitches | **Low** | 30-31 |
| `src/components/app-sidebar.tsx` | `filteredData` recomputes on every render even when sidebar is collapsed | **Medium** | 211-256 |
| `src/components/markdown-note.tsx` | `rehype-raw` plugin allows raw HTML injection into markdown preview (XSS) | **High** | 36 |
| `src/components/trash-list.tsx` | `v-destructive-outline" variant used but not registered in any style config | **Low** | 66 |
| `src/components/calculator-note.tsx` | `evaluateNotebook` called in useMemo — parsing on every keystroke even if editor is not focused | **Low** | 73 |
| `src/app/actions.ts` | No request size limit on `noteContent` — could send 10MB HTML to Gemini API | **Medium** | 54, 101, 148 |
| `src/app/settings/_components/settings-form.tsx` | `localSettings` state syncs from `settings` via `useEffect` — unnecessary useEffect, should derive | **Low** | 16-20 |

---

## 5. Security & Gemini AI Integration Audit

### 5.1 API Key Vulnerability Analysis

**Current architecture:**
```
.env file → process.env.GEMINI_API_KEY
  → src/lib/env.ts (Zod-validated, exports env object)
    → src/context/app-provider.tsx (CLIENT COMPONENT — imports `env` for `isAiEnabled`)
    → src/ai/genkit.ts (Server-only — creates `googleAI({apiKey: env.GEMINI_API_KEY})`)
      → src/app/actions.ts ('use server' — Server Actions, server-only)
      → src/ai/flows/*.ts ('use server' — Server Action flows)
```

**Key exposure risk assessment:**

| Path | Risk | Explanation |
|------|------|-------------|
| Server Actions (`app/actions.ts`) | **Safe** | Runs on server, never serialized to client. The output is only the return value. |
| `env.ts` imported in `app-provider.tsx` | **MODERATE RISK** | `app-provider.tsx` is a `'use client'` component. When `env.ts` is imported, Webpack/Next.js bundles it. The `process.env.GEMINI_API_KEY` reference should be replaced at build time by Next.js with the actual value. If a developer adds a `console.log(process.env)` anywhere in the client bundle, the key is exposed. |
| `genkit.ts` imported by Server Actions | **Safe** | Server Actions are never bundled for the client. |
| Network tab inspection | **Safe** | No API key appears in XHR/fetch requests because Server Actions use a POST to `/_next/__nextjs_actions__` which is internally routed (not a standard fetch where headers could leak). |
| Bundle inspection (`next build && grep -r GEMINI .next/`) | **Should verify** | If the key appears anywhere in the `.next/static/chunks/` output, it's exposed. Without running the build, we cannot 100% confirm, but the architecture suggests Server Actions should keep it server-side. |

**Recommendation**: The current approach works but is architecturally fragile. The `env.ts` import from a client component is a layering violation. Even if safe today, it's one refactoring away from leaking.

### 5.2 Server Action Security Concerns

- **No authentication**: Server Actions are server-side but there is no authentication. Any visitor can call `summarizeNoteAction` with arbitrary `noteContent`. This is a cost exposure.
- **No rate limiting**: A malicious actor could call `textToSpeechAction` 1000 times, generating 1000 Gemini TTS requests (~1000 tokens each) — costing ~$0.20 per request on Gemini 2.5 Flash TTS, totaling $200+ in a brief attack.
- **Input size abuse**: The Zod schema validates `noteContent` is a string but imposes no max length. A 1MB HTML string sent to the summarization flow would incur significant Gemini token costs.
- **`rehype-raw` in markdown rendering**: `src/components/markdown-note.tsx:36` uses `rehypeRaw`, which allows raw HTML to pass through markdown. If a user creates a note containing `<script>alert('xss')</script>`, it will execute when the markdown preview renders. This is a HIGH severity XSS vulnerability within the app itself (though it requires the attacker to have access to the user's notes — which in this single-user app means self-inflicted).

### 5.3 Gemini AI Integration Quality

- **Model selection**: `gemini-2.0-flash` for text generation (summarization, tag suggestion, calculator template) and `gemini-2.5-flash-preview-tts` for TTS. Both are appropriate choices. The TTS uses `voiceName: 'Algenib'` — a good default.
- **Prompt engineering**:
  - `summarizeNotePrompt`: Clean, specific, produces structured output via `output: {schema: SummarizeNoteOutputSchema}`. Good.
  - `suggestTagsPrompt`: Handles existing tags with Handlebars `{{#if existingTags}}` — correctly deduplicates.
  - `generateCalculatorNoteStarterPrompt`: Clear instructions about calculator note syntax. The multiline output directive is explicit.
  - `textToSpeechFlow`: Uses `responseModalities: ['AUDIO']` correctly. The PCM-to-WAV conversion via `wav` package is appropriate.
- **Tag deduplication** (`suggestTagsAction.ts:79`): The server action filters out existing tags client-side after AI returns them. Good safety net.
- **No chunking for long notes**: If a note exceeds the model's context window (1M tokens for Gemini 2.0 Flash — unlikely to be hit, but possible with 500KB+ notes), the call would fail with a 400 error. The current error handler would show "An unexpected error occurred" — not helpful.

### 5.4 Other Security Vectors

- **XSS via HTML notes**: Rich text notes store HTML content. This HTML is rendered via Tiptap which uses `dangerouslySetInnerHTML` internally. The `rehype-sanitize` plugin is NOT used in the markdown pipeline — `rehype-raw` allows all HTML through.
- **Calculator note injection**: The `new Function()` evaluator allows expressions like `1+1` but the regex `[^0-9.\-+*/()]` blocks letters. However, Unicode characters and certain escape sequences may bypass this filter.
- **No Content Security Policy**: The app has no `Content-Security-Policy` header. If a script tag is injected into a note's HTML (via the Tiptap editor or markdown), it will execute.
- **localStorage → all data accessible**: Any browser extension or third-party script loaded on the page can read all 4 localStorage keys and access all user data, including the full content of every note.

---

## 6. Actionable Implementation Roadmap

### Phase 1: Critical Fixes (Immediate — Days 1–5)

| # | Task | File(s) | Impact | Verification |
|---|------|---------|--------|-------------|
| 1.1 | Replace `new Function()` with `mathjs` expression parser | `src/lib/calculator.ts` | Eliminates CSP bypass, closes XSS vector | `npm audit`, run calculator tests |
| 1.2 | Split localStorage writes into isolated try/catch per key | `src/context/app-provider.tsx:133-138` | 1 failed key no longer nukes all data | Prase fault into one key, verify others persist |
| 1.3 | Add 500ms debounce to `handleContentChange` | `src/context/app-provider.tsx:247-275` | Reduces saves from ~120/min to ~12/min | Console.log save count during rapid typing |
| 1.4 | Add `rehype-sanitize` to markdown renderer | `src/components/markdown-note.tsx:36` | Prevents XSS via markdown HTML injection | Test `<script>alert(1)</script>` in markdown |
| 1.5 | Remove the non-functional "Share" button or implement `navigator.share` | `src/app/note/[noteId]/page.tsx:492-495` | Fixes dead button | Click the button — either works or is gone |
| 1.6 | Add max-length validation to AI input schemas (e.g., `noteContent: z.string().max(100000)`) | `src/app/actions.ts:54,101,147` | Prevents abuse of Gemini API | Send 1MB string — should get validation error |
| 1.7 | Add `.env.example` file | Root | Onboarding DX | New developer setup time |
| 1.8 | Fix tag live-update: add "Save Tags" button, remove `onChange` autosave | `src/app/note/[noteId]/page.tsx:446` | Prevents partial tag saves | Type "travel, fo" → tags should NOT save |

### Phase 2: UI/UX Refinement & Polish (Week 2–3)

| Priority | Task | File(s) | Effort | Verification |
|----------|------|---------|-------|-------------|
| 2.1 | Fix `--muted-foreground` contrast to meet WCAG AA | `src/app/globals.css:37` | Change 46.1% → 35% | WCAG Contrast Checker |
| 2.2 | Remove nested card hover scale animation | `src/components/note-list.tsx:30-31` | Remove hover:scale-[1.02] and group-hover:scale-[.98] | Visual inspection |
| 2.3 | Fix search icon/input alignment | `src/components/app-sidebar.tsx:367-375` | Change left-4 to left-3, pl-8 to pl-9 | Visual inspection |
| 2.4 | Increase editor body font to 16px | `src/components/rich-text-note.tsx:272` | Change prose-sm → prose-base | Visual inspection |
| 2.5 | Add close button to mobile sidebar Sheet | `src/components/ui/sidebar.tsx:197-213` | Remove `[&>button]:hidden` | Mobile test |
| 2.6 | Make calculator output panel collapsible on mobile | `src/components/calculator-note.tsx:180` | Add useState for output visibility | Mobile test |
| 2.7 | Replace placeholder avatar with removable/editable UI | `src/components/app-sidebar.tsx:567-574` | Remove or make configurable | Settings integration |
| 2.8 | Add "Create your first note" CTA on Home empty state | `src/app/page.tsx:34-37` | Add Button linking to create dialog | Click the CTA |
| 2.9 | Add font size setting | `src/app/settings/_components/settings-form.tsx` + editor components | New slider for 14–20px | Editor reflects size |
| 2.10 | Custom audio player component | New file `src/components/audio-player.tsx` | Replace native <audio> | Audio plays, styled |

### Phase 3: Advanced AI & Feature Enhancements (Week 4–8)

| Priority | Task | Files | Effort |
|----------|------|-------|--------|
| 3.1 | API route proxy for Gemini | `src/app/api/ai/*/route.ts` | Remove server actions, add rate limiting |
| 3.2 | AI streaming (SSE/ReadableStream) | `src/app/api/ai/*/route.ts` + client hooks | Token-by-token display |
| 3.3 | `/` slash command menu in editor | New Tiptap extension | Notion-style inline AI commands |
| 3.4 | Cmd+K command palette | New component + `cmdk` package | Global search + actions |
| 3.5 | Select text → AI actions | Tiptap bubble menu extension | "Summarize selection" etc. |
| 3.6 | IndexedDB migration | `src/lib/db.ts` using `idb-keyval` or `Dexie.js` | Async storage, quota-aware |
| 3.7 | Virtual scrolling | `@tanstack/react-virtual` for sidebar + note list | 1000+ notes no DOM bloat |
| 3.8 | Pinned notes | Add `pinned: boolean` to Note type, sidebar section | Drag to pin |
| 3.9 | Nested folder support | Change Folder.parentId | Recursive accordion |
| 3.10 | Tag manager page | New route + page | Rename, merge, delete tags globally |
| 3.11 | Bulk actions (checkbox + toolbar) | Multiple list components | Multi-select + action bar |
| 3.12 | PWA + offline service worker | `next-pwa` or `@serwist/next` | Offline note editing |
| 3.13 | Full-text search with `minisearch` | `src/lib/search.ts` | Type-aware search indexing |
| 3.14 | Auto-backup scheduler | Settings + timed Blob download | Export every N minutes |
| 3.15 | Encrypted storage (optional) | Web Crypto API + IndexedDB | Passphrase-derived AES-GCM key |

### Phase 4: Architecture Hardening (Ongoing)

- [ ] Add `React.memo` to `NoteList`, `TrashList`, `FolderPage`, `HistoryList`
- [ ] Memoize expensive sidebar computations — only recompute `filteredData` when `searchQuery` explicitly changes, not on every note content change
- [ ] Add `lucide-react` tree-shaking (switch to individual imports instead of full library import)
- [ ] Remove unused chart/calendar components from the UI bundle (they are imported but never rendered)
- [ ] Add `@media print` styles for note pages
- [ ] Add `Content-Security-Policy` meta tag (or via `next.config.ts` headers)
- [ ] Batch localStorage writes into a single `requestIdleCallback` call to avoid blocking the main thread during active typing
- [ ] Add storage quota monitoring utility with a UI indicator in settings