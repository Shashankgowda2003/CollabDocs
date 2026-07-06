# ADR-003: Operation-Based Version History with Periodic Snapshots

**Date**: 2026-06-26
**Status**: Accepted

## Context

Every document needs complete version history so users can review changes and restore
previous versions. The storage and retrieval strategy has significant cost implications.

## Decision

Use an **operation-based version history** (event log) with **periodic full document snapshots**.

Every edit is stored as an operation: insert text, delete text, create/delete/move block,
update properties, change formatting, add/resolve comment. A full snapshot is created
every 500 operations or 30 minutes of active editing.

## Alternatives Considered

- **Snapshot-only**: Simple but storage-inefficient (10KB doc × 1000 edits = 10MB).
  No fine-grained diffs.
- **Operation-only (no snapshots)**: Storage-efficient but slow restoration — replaying
  thousands of operations becomes impractical.

## Rationale

- Aligns with the real-time CRDT sync model (operations are already being generated)
- Storage-efficient — only deltas stored, full copies only at intervals
- Enables fine-grained diffs and user attribution ("who changed what")
- Snapshots prevent slow replay during restoration
- Supports future features: document playback, analytics, AI change summaries

## Consequences

- Restoration logic: load nearest snapshot, replay subsequent operations
- Need a snapshot job/task that monitors operation count and elapsed time
- Each operation must record: ID, userId, timestamp, type, target, payload
