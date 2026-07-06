# ADR-002: CRDT via Yjs over Operational Transformation

**Date**: 2026-06-26
**Status**: Accepted

## Context

Real-time collaborative editing requires a conflict resolution strategy. Two users
editing the same block simultaneously must not lose each other's changes.

## Decision

Use **CRDT (Conflict-free Replicated Data Types)** via **Yjs** as the synchronization engine.

## Alternatives Considered

- **Operational Transformation (OT)**: Requires a central server for conflict resolution,
  harder to support offline editing, complex transformation functions.
- **Last-write-wins**: Simple but silently drops user changes — unacceptable for collaboration.

## Rationale

- Offline-first editing support
- Automatic conflict resolution without losing user changes
- Peer updates merge in any order — no central conflict server required
- Better support for future mobile and desktop clients
- Yjs is mature, well-documented, and widely adopted

## Consequences

- CRDT operation payloads can be larger than OT
- Eventual consistency model (strong consistency not guaranteed at all times)
- Server acts as sync/persistence layer, not conflict resolver
- Operation log for version history is derived from CRDT updates
