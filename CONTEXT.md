# CONTEXT.md — CollabDocs

Ubiquitous language glossary for the real-time collaborative document editor.

---

## Core Entities

**Workspace**:
Top-level organizational container. Contains folders and documents. Has members, roles,
permissions, and settings. The root of the hierarchy.

**Folder**:
A named container that organizes documents. Can be nested under other folders to any depth.
Each folder has exactly one parent (Workspace or another Folder). Names must be unique
within the same parent.

**Document**:
A collaborative document composed of blocks. Lives under exactly one parent (a Workspace
or a Folder). Has a title, tags, sharing settings, and version history.

**Block**:
An atomic piece of content with a unique ID. A block can be a paragraph, heading, image,
table, code block, checklist, quote, equation, callout, embed, or AI-generated content.
Blocks form the document body. Can be nested, reordered, collapsed, duplicated, and moved
between documents.

**Tag**:
A label attached to a document for cross-hierarchy organization. Documents can have
multiple tags. Tags are orthogonal to the folder hierarchy.

---

## Permissions & Access

**Role**:
One of five levels: Owner, Admin, Editor, Commenter, Viewer. Defines what a user can do.

**Permission Inheritance (Cascading with Overrides)**:
Roles assigned at the Workspace level cascade down to all Folders and Documents.
A Folder or Document can override the inherited role with a more specific one.
Resolution priority: Document > Folder > Workspace.

**Explicit Permission**:
A role directly assigned on a specific resource (Workspace, Folder, or Document).

**Inherited Permission**:
A role a user gains from a parent resource, not directly assigned.

**External User**:
A collaborator invited to a single document who is not a Workspace member. Can only
access the shared document — cannot browse the Workspace or view other content.

**Share Link**:
A URL granting access to a document at a specific role level. May be password-protected,
expire, or be limited to Workspace members. Multiple active links per document are allowed.

---

## Real-Time Collaboration

**CRDT (Conflict-free Replicated Data Type)**:
The data structure that guarantees all clients converge to the same document state
without a central conflict resolver. Powered by Yjs.

**Operation**:
An atomic edit: insert text, delete text, create/delete/move/update block, change
formatting, add/resolve comment. Every operation records: ID, user, timestamp, type,
target, and payload.

**Snapshot**:
A full document state saved periodically (every 500 operations or 30 minutes) to
accelerate version restoration. Restoration loads the nearest snapshot and replays
only subsequent operations.

**Presence**:
Live cursor position, text selection, and online status of each connected collaborator.

---

## Comments & Discussions

**Comment Thread**:
A discussion anchored to either a text range (inline comment) or an entire block
(block-level comment). Contains replies and has a status: Open, Resolved, or Reopened.

**Inline Comment**:
A comment anchored to a specific text range within a block.

**Block-Level Comment**:
A comment on an entire block, identified by block ID.

**@Mention**:
A reference to another user within a comment, triggering a notification.

---

## Notifications

**Notification Event**:
Generated when a significant action occurs: mention, comment, reply, share, permission
change, document restore, AI task complete, workspace invitation.

**Notification Preference**:
Per-user settings controlling which event types trigger notifications and through which
channels. Muting available at Workspace, Folder, Document, and Thread level.

---

## Sharing

**Invitation**:
An explicit grant of access to a specific user by email or username, assigned a role.
Recorded in the document's ACL.

**Access Control List (ACL)**:
The set of all explicit permissions on a document, including invitations.

---

## AI

**AI Feature**:
A capability powered by LLMs: rewrite, summarize, translate, generate content, answer
questions, extract action items, suggest replies. Available via freemium pricing.

**AI Quota**:
Monthly AI request limit tracked per-user and per-workspace.

**BYOK (Bring Your Own Key)**:
Option for users/organizations to supply their own LLM provider API key, bypassing
platform quotas.

---

## Search

**Search Index**:
A Meilisearch index containing workspace names, folder names, document titles/content,
block content, comments, tags, and user names. Updated asynchronously on changes.

**Permission-Aware Search**:
Search results are filtered to only include content the querying user has access to.

---

## Relationships

- A **Workspace** contains zero or more **Folders** and **Documents**.
- A **Folder** contains zero or more **Folders** (subfolders) and **Documents**.
- A **Document** belongs to exactly one parent: a Workspace or a Folder.
- A **Document** is composed of zero or more **Blocks**.
- A **Block** may contain zero or more child **Blocks** (nesting).
- A **Document** has zero or more **Tags**.
- A **Comment Thread** belongs to a **Document**, optionally anchored to a **Block** or text range.
- An **Operation** belongs to a **Document**, optionally targeting a specific **Block**.
- A **Snapshot** belongs to a **Document**.
- **Permissions** cascade: Workspace → Folder → Document, with overrides.
