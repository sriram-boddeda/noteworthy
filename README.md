# Noteworthy - A Modern Note-Taking Application

Welcome to Noteworthy, a feature-rich, AI-powered note-taking application built with Next.js and designed for productivity and organization.

## Key Features

- **Multiple Note Types**: Rich Text (WYSIWYG with Tiptap), Markdown (split-screen with live preview), Calculator Note (live scratchpad with Monaco Editor)
- **AI-Powered Assistance** (user-provided API keys, stored client-side):
  - **AI Summarization**: Get a concise summary of any note
  - **Tag Suggestions**: AI analyzes content and suggests relevant tags
  - **Text-to-Speech**: Have your notes read aloud (Gemini only)
  - **Calculator Templates**: Describe a calculation and AI generates a starter template
  - **Multiple Providers**: Google Gemini, Ollama (local), OpenAI
- **Robust Organization**: Folders, tags, drag-and-drop, powerful search with `tag:` / `type:` / `in:` filters
- **Version History**: Automatic snapshots with restore capability
- **Trash System**: 30-day retention, bulk restore/delete
- **Audit Log**: Full action history with retrieval from permanent deletion
- **Dark/Light/System Themes**

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Running the Application

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run the Development Server**:
   ```bash
   npm run dev
   ```

3. **Open in Browser**: Navigate to `http://localhost:9002`

4. **Configure AI (optional)**:
   Go to **Settings > AI Integration** and enter your API key:
   - **Gemini**: Get a key at https://aistudio.google.com/apikey
   - **Ollama**: Run `ollama serve` locally (no API key needed)
   - **OpenAI**: Get a key at https://platform.openai.com/api-keys

   All AI features are disabled until a provider is configured. Your API key stays in your browser and is never sent to any server we control.

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server on port 9002 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

## Built With

- **Framework**: Next.js 15 (App Router)
- **UI**: React 18, shadcn/ui, Tailwind CSS, Framer Motion
- **Rich Text**: Tiptap (ProseMirror-based)
- **AI**: Google Gemini API, Ollama, OpenAI (all client-side via direct `fetch()`)
- **State Management**: React Context API
- **Persistence**: Browser `localStorage`
- **Icons**: Lucide React

## Security

- AI API keys are stored in `sessionStorage` by default (cleared when you close the tab)
- Optional persistence to `localStorage` with an explicit opt-in warning
- Keys are never sent to our servers — they go directly from your browser to the AI provider
- No backend, no database, no authentication layer — this is a single-user local-first app