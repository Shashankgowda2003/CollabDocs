# CollabDocs

**Real-time collaborative document editor with block-based editing, AI-powered writing, and granular role-based permissions.**

Built with [Next.js 16](https://nextjs.org), [Yjs](https://yjs.dev), [TipTap](https://tiptap.dev), and the [Vercel AI SDK](https://sdk.vercel.ai).

---

## Features

### Real-Time Collaboration
- **CRDT-based sync** via Yjs — all clients converge to the same document state without a central conflict resolver.
- **Live cursors & presence** — see collaborators' cursor positions, selections, and online status in real time.
- **WebSocket transport** via `y-websocket` for low-latency updates.

### Block-Based Editor
- Rich block types: paragraph, heading, image, table, code block, checklist, quote, equation, callout, embed, and AI-generated content.
- Drag-to-reorder blocks with drag handles.
- Nested block hierarchy (blocks within blocks).
- `/` slash command menu for quick block insertion.
- `@mention` autocomplete for linking to users.
- `[[wikilink]]` autocomplete for cross-document links.
- File drag-and-drop zone.
- Word and character count.

### Database Blocks
- Embed structured databases inside documents.
- Multiple views: **Table**, **Kanban Board**, **Calendar**.
- Schema editor for defining columns and types.

### Workspaces & Organization
- Hierarchical structure: **Workspaces** contain **Folders** and **Documents**.
- Unlimited nesting: folders within folders to any depth.
- Tags for cross-hierarchy organization.
- Document graph visualization (React Flow) showing backlinks and relationships.
- Trash with restore and permanent delete.

### Permissions & Sharing
- Five role levels: **Owner**, **Admin**, **Editor**, **Commenter**, **Viewer**.
- Cascading permission inheritance (Workspace → Folder → Document) with overrides.
- Share links per document with optional password protection and expiration.
- External user invitations for single-document access.
- Public document publishing (read-only via `/p/[slug]`).

### AI-Powered Writing
- **Rewrite** — rephrase or improve selected text.
- **Summarize** — condense a section or document.
- **Translate** — translate content between languages.
- **Generate** — create content from prompts.
- **Answer questions** — ask questions about document content.
- **Extract action items** — pull tasks from meeting notes.
- **Suggest replies** — AI-assisted comment responses.
- BYOK (Bring Your Own Key) support for OpenAI and Anthropic.
- Usage-based quota tracking per user and per workspace.

### Comments & Discussions
- **Inline comments** anchored to specific text ranges.
- **Block-level comments** on entire blocks.
- Threaded replies with status tracking (Open / Resolved / Reopened).
- `@mentions` trigger notifications.

### Suggestions (Track Changes)
- Propose edits without modifying the original text.
- Per-suggestion accept/reject with diff highlighting.
- Suggestion status tracking (pending / accepted / rejected).

### Version History
- Operation-based history — every edit is recorded with user, timestamp, and payload.
- Periodic snapshots (every 500 operations or 30 minutes) for fast restoration.
- Browse and replay any historical version.

### Offline Support
- IndexedDB-powered local storage for offline editing.
- Automatic sync when connectivity is restored.
- Conflict resolution via CRDT merge.

### Search
- Full-text search across workspaces, folders, documents, blocks, comments, and tags.
- Powered by Meilisearch.
- Permission-aware: results are filtered to only content the user can access.

### Notifications
- Events for mentions, comments, replies, shares, permission changes, document restores, AI completions, and workspace invitations.
- Granular muting at workspace, folder, document, and thread levels.

### Templates
- Create reusable document templates at the workspace level.
- Start new documents from saved templates.

### Import & Export
- Import Markdown, HTML, and plain text files.
- Export documents as Markdown, HTML, or PDF.

### Authentication
- Email/password credentials.
- OAuth providers: Google, GitHub, Microsoft.
- Password reset flow.
- Invite-based registration for shared documents.

### Activity Feed
- Per-workspace activity timeline.
- Tracks document creation, edits, comments, shares, and more.

### Command Palette
- `Cmd/Ctrl + K` to search and navigate across workspaces, documents, and commands.

### Keyboard Shortcuts
- Full set of keyboard shortcuts for common actions.
- Built-in reference dialog.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19 + Tailwind CSS v4 |
| **Editor** | TipTap (ProseMirror-based) |
| **Real-Time Sync** | Yjs (CRDT) + y-websocket |
| **Database** | SQLite via better-sqlite3 + Prisma 7 |
| **Authentication** | NextAuth v5 |
| **Search** | Meilisearch |
| **AI** | Vercel AI SDK (OpenAI + Anthropic) |
| **Email** | Resend |
| **State Management** | Zustand |
| **Offline Sync** | IndexedDB via idb |
| **Graph Visualization** | @xyflow/react (React Flow) |
| **Animation** | Framer Motion |
| **Validation** | Zod v4 |
| **Testing** | Vitest + Testing Library + jsdom |
| **Language** | TypeScript 5 |

---

## Getting Started

### Prerequisites

- **Node.js** 20 or later
- **Meilisearch** instance (see [Meilisearch Cloud](https://www.meilisearch.com/cloud) or run locally)
- **WebSocket server** (`y-websocket`) runs alongside the dev server

### Installation

```bash
git clone https://github.com/your-username/collab-docs.git
cd collab-docs
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
AUTH_SECRET="your-secret-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# WebSocket
NEXT_PUBLIC_WS_URL="ws://localhost:1234"

# OAuth Providers (optional)
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
AUTH_MICROSOFT_ID=""
AUTH_MICROSOFT_SECRET=""
NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED="false"
NEXT_PUBLIC_OAUTH_GITHUB_ENABLED="false"

# AI (optional)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# Email (optional)
RESEND_API_KEY=""
RESEND_FROM=""

# Search
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY=""
```

### Database Setup

```bash
npx prisma generate
npx prisma db push
```

### Running the Dev Server

Start both the Next.js app and the Yjs WebSocket server:

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — WebSocket server (for real-time collaboration)
npm run dev:ws
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Meilisearch

If running Meilisearch locally:

```bash
# Download and run (see https://www.meilisearch.com/docs/learn/getting_started/installation)
./meilisearch --master-key=your-master-key
```

---

## Project Structure

```
collab-editor/
├── docs/
│   └── adr/                       # Architecture Decision Records
│       ├── 001-block-based-content-model.md
│       ├── 002-crdt-over-ot.md
│       ├── 003-operation-based-version-history.md
│       ├── 004-cascading-permission-inheritance.md
│       ├── 005-hybrid-commenting-model.md
│       └── 006-meilisearch-over-postgres-fts.md
├── prisma/
│   ├── schema.prisma              # 28 models: User, Workspace, Document, Block, etc.
│   └── migrations/
├── src/
│   ├── app/                       # Next.js App Router pages & API routes
│   │   ├── (auth)/                # Login, register, forgot-password
│   │   ├── (dashboard)/           # Workspaces, documents, folders, trash, members
│   │   ├── api/                   # API route handlers (auth, ai, search, upload, etc.)
│   │   └── p/[slug]/              # Public published documents
│   ├── components/
│   │   ├── ai/                    # AI panel & BYOK settings
│   │   ├── collaboration/         # Avatars & remote cursors
│   │   ├── comments/              # Comment panels & forms
│   │   ├── editor/                # Block editor, slash menu, mentions, database blocks
│   │   ├── graph/                 # Document relationship graph
│   │   ├── notifications/         # Notification bell
│   │   ├── search/                # Search bar
│   │   ├── sharing/               # Share dialog
│   │   ├── sidebar/               # Dashboard & mobile sidebars
│   │   ├── suggestions/           # Track changes UI
│   │   ├── templates/             # Template picker
│   │   ├── version/               # Version history panel
│   │   └── ui/                    # Shared UI components
│   ├── lib/
│   │   ├── ai/                    # AI SDK integration
│   │   ├── collaboration/         # Yjs / WebSocket setup
│   │   ├── offline/               # IndexedDB sync engine
│   │   ├── permissions/           # Cascading permission resolution
│   │   ├── search/                # Meilisearch client
│   │   ├── auth.ts                # NextAuth configuration
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── mail.ts                # Resend email service
│   │   └── types.ts               # Shared TypeScript types
│   └── server/
│       └── actions/               # Next.js Server Actions (23 files)
│           ├── workspace.ts       # Workspace CRUD
│           ├── document.ts        # Document CRUD
│           ├── blocks.ts          # Block operations
│           ├── comments.ts        # Comment operations
│           ├── sharing.ts         # Share link management
│           ├── version.ts         # Version history
│           ├── export.ts          # Export (Markdown, HTML, PDF)
│           ├── import.ts          # Import files
│           ├── ai usage           # ...and 15 more
│           └── ...
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── CONTEXT.md                     # Domain glossary & architecture notes
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run dev:ws` | Start Yjs WebSocket server for real-time collaboration |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run Vitest test suite |
| `npm run test:watch` | Run tests in watch mode |

---

## Architecture Decisions

Key architectural decisions are documented as ADRs in [`docs/adr/`](docs/adr/):

1. **[Block-Based Content Model](docs/adr/001-block-based-content-model.md)** — Why we chose blocks over flat documents.
2. **[CRDT over OT](docs/adr/002-crdt-over-ot.md)** — Why Yjs/CRDT instead of Operational Transform.
3. **[Operation-Based Version History](docs/adr/003-operation-based-version-history.md)** — Why we store operations + snapshots instead of full document copies.
4. **[Cascading Permission Inheritance](docs/adr/004-cascading-permission-inheritance.md)** — Why cascading roles with override capability.
5. **[Hybrid Commenting Model](docs/adr/005-hybrid-commenting-model.md)** — Why both inline and block-level comments.
6. **[Meilisearch over PostgreSQL FTS](docs/adr/006-meilisearch-over-postgres-fts.md)** — Why Meilisearch for search.

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Type checking
npm run typecheck
```

Tests cover: database operations, blocks, comments, suggestions, slash menus, snapshots, offline sync, API keys, backlinks, and AI features.

---

## License

[MIT](LICENSE)
