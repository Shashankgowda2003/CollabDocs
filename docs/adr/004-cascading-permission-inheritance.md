# ADR-004: Cascading Permission Inheritance with Overrides

**Date**: 2026-06-26
**Status**: Accepted

## Context

The platform has a strict hierarchy: Workspace → Folder → Document. Permissions need to
control access at all three levels without forcing administrators to assign roles on
every single resource.

## Decision

Use **cascading permission inheritance with overrides**.

Roles assigned at the Workspace level propagate down to all Folders and Documents.
A Folder or Document can override the inherited role with a more explicit one.
Resolution priority: Document-level > Folder-level > Workspace-level.

## Alternatives Considered

- **Flat per-resource permissions**: No inheritance. Every resource independently managed.
  Simple but tedious — requires assigning permissions to every folder manually.
- **Inheritance without overrides**: Roles flow down cleanly with no exceptions. Simple
  but inflexible — can't restrict sensitive folders.

## Rationale

- Minimizes repetitive permission management (set once at workspace level)
- Supports exceptions (restrict HR folder, grant extra access to confidential docs)
- Predictable — nearest explicit permission always wins
- Common pattern in enterprise software (Google Drive, Dropbox, SharePoint)

## Consequences

- Permission resolution must traverse the hierarchy upward on every check (can be cached)
- Override logic adds complexity to the sharing UI
- Moving a document between folders may change its effective permissions
- Five roles defined: Owner, Admin, Editor, Commenter, Viewer
