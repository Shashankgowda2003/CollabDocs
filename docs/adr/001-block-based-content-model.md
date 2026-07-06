# ADR-001: Block-Based Content Model

**Date**: 2026-06-26
**Status**: Accepted

## Context

The collaborative document editor needs a content model that supports structured content,
real-time collaboration, and future AI capabilities.

## Decision

Use a **block-based content model** (Notion-style) over a traditional linear document model
(Google Docs-style).

Every piece of content is an independent block with a unique ID. Block types include:
paragraphs, headings, images, tables, code blocks, checklists, quotes, equations,
callouts, embeds, and AI-generated content.

## Rationale

- Enables block-level comments and discussions
- Supports drag-and-drop reordering and nesting
- Enables block-level version history and AI assistance
- Allows fine-grained conflict resolution during real-time collaboration
- Future support for block-level permissions and reusable synced blocks

## Consequences

- More complex data model (block table, parent-child relationships, ordering)
- Editor implementation is more involved than a flat document
- Every block needs a unique ID and position tracking
- Migration to a different model would require full data transformation
