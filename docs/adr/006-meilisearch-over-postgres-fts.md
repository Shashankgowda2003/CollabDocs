# ADR-006: Meilisearch over PostgreSQL Full-Text Search

**Date**: 2026-06-26
**Status**: Accepted

## Context

The platform requires powerful, typo-tolerant search across documents, blocks,
comments, tags, and users — while respecting the permission model so users only
see content they have access to.

## Decision

Use **Meilisearch** (self-hosted, embedded search engine) instead of PostgreSQL
full-text search.

## Alternatives Considered

- **PostgreSQL FTS (tsvector)**: No additional infrastructure. But limited ranking,
  no typo tolerance, poor performance at scale for faceted search.
- **External SaaS (Algolia, Elastic Cloud)**: Best UX, zero ops. But adds cost
  and external dependency.

## Rationale

- Typo-tolerant search (critical for document discovery)
- Faceted filtering (by workspace, folder, author, date, tags)
- Real-time indexing (near-instant updates)
- Self-hosted — full control, no external dependency or cost
- Mature, well-documented, simple API

## Consequences

- Additional infrastructure: Meilisearch container/process
- Async index synchronization pipeline required (on document create/edit/delete,
  block modification, comment changes, tag changes, permission updates)
- Permission-aware search: results must be post-filtered based on user's access
- Index must be rebuilt if permission model changes significantly
- Future vector/semantic search can be added alongside Meilisearch
