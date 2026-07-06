# ADR-005: Hybrid Commenting Model (Inline + Block-Level)

**Date**: 2026-06-26
**Status**: Accepted

## Context

The platform needs a commenting system that supports both reviewing specific text
(inline) and discussing entire content blocks (block-level).

## Decision

Implement a **hybrid commenting system** supporting both inline and block-level comments,
stored in an **independent comments table** separate from the document/block model.

## Alternatives Considered

- **Inline-only (Google Docs-style)**: Clean UX but anchored to fragile text offsets.
  Cannot comment on non-text blocks (images, embeds).
- **Block-level only (Notion-style)**: Stable (block IDs are persistent) but cannot
  comment on a single word inside a paragraph.
- **Embedded comments (stored on block)**: Ties comments to blocks tightly but makes
  cross-document queries, search, and analytics harder.

## Rationale

- Both comment types serve different user needs (word-level review vs section discussion)
- Independent table keeps the document model clean
- Threads are independently queryable, searchable, and scalable
- Enables future AI features: thread summarization, action item extraction
- Supports threaded discussions, @mentions, replies, reactions, edit history

## Consequences

- Two anchoring strategies: text range (inline) and block ID (block-level)
- Text range anchors may become invalid if block content changes significantly
- Comment statuses: Open, Resolved, Reopened
- Real-time sync of comments requires separate CRDT awareness
