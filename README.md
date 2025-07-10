# Noteworthy - A Modern Note-Taking Application

Welcome to Noteworthy, a feature-rich, AI-powered note-taking application built with Next.js and designed for productivity and organization. This application provides a seamless and intuitive experience for creating, managing, and organizing your thoughts and ideas.

## ✨ Key Features

- **Multiple Note Types**: Choose the best format for your needs.
    - **Rich Text**: A familiar WYSIWYG editor for beautifully formatted documents.
    - **Markdown**: A split-screen editor with live preview for developers and writers who love clean syntax.
    - **Calculator Note**: A unique, live scratchpad for calculations, perfect for budgeting, planning, or quick math.
- **AI-Powered Assistance**: Leverage the power of AI to enhance your workflow.
    - **AI Summarization**: Get a concise summary of any note with a single click.
    - **Tag Suggestions**: Let AI analyze your note's content and suggest relevant tags.
    - **Text-to-Speech**: Have your notes read aloud to you.
    - **Calculator Templates**: Describe a calculation (e.g., "trip budget"), and AI will generate a starter template for you.
- **Robust Organization**:
    - **Folders**: Structure your notes in a hierarchical folder system.
    - **Tags**: Add tags to categorize notes across different folders.
    - **Drag & Drop**: Intuitively move notes between folders, into the "Home" view, or to the trash.
- **Advanced Functionality**:
    - **Powerful Search**: Find exactly what you're looking for with filters like `tag:`, `type:`, and `in:`.
    - **Version History**: Automatically saves versions of your notes, allowing you to view and restore previous states.
    - **Trash System**: Deleted items are moved to the trash, where they can be restored or permanently deleted.
    - **Audit Log**: A history page tracks all actions taken within the app.
- **Customization**:
    - **Theming**: Switch between light, dark, and system-default themes.

## 🚀 Getting Started

This project is designed to run in a cloud-based development environment like Firebase Studio.

### Prerequisites

- Node.js
- npm (or your preferred package manager)

### Running the Application

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Set Up Environment Variables**:
    Create a `.env` file in the root of the project by copying the `.env.example` file (if one exists) or creating a new one. To enable the AI features, you will need a Google AI API key.

    ```.env
    # Get your key from https://aistudio.google.com/app/apikey
    GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```
    If the `GEMINI_API_KEY` is not provided, the application will run with all AI features gracefully disabled.

3.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

The application will now be running. Open your browser to the specified local URL to start using Noteworthy.

## 🛠️ Built With

- **Framework**: [Next.js](https://nextjs.org/)
- **UI**: [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- **AI**: [Google AI & Genkit](https://firebase.google.com/docs/genkit)
- **State Management**: React Context API
- **Persistence**: Browser `localStorage` for client-side storage.
