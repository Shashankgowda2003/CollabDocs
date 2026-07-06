"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from "d3-force";

interface Document {
  id: string;
  title: string;
}

interface Link {
  sourceDocumentId: string;
  targetDocumentId: string;
}

interface Props {
  workspaceId: string;
  currentDocumentId?: string;
}

export function DocumentGraph({ workspaceId, currentDocumentId }: Props) {
  const router = useRouter();
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [filter, setFilter] = useState("");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [allLinks, setAllLinks] = useState<Link[]>([]);
  const { fitView } = useReactFlow();

  const backlinkCounts = useMemo(() => {
    const counts = new Map<string, number>();
    allLinks.forEach((l) => {
      counts.set(l.targetDocumentId, (counts.get(l.targetDocumentId) ?? 0) + 1);
    });
    return counts;
  }, [allLinks]);

  const outgoingCounts = useMemo(() => {
    const counts = new Map<string, number>();
    allLinks.forEach((l) => {
      counts.set(l.sourceDocumentId, (counts.get(l.sourceDocumentId) ?? 0) + 1);
    });
    return counts;
  }, [allLinks]);

  const orphanCount = useMemo(() => {
    const linked = new Set<string>();
    allLinks.forEach((l) => {
      linked.add(l.sourceDocumentId);
      linked.add(l.targetDocumentId);
    });
    return allDocs.filter((d) => !linked.has(d.id)).length;
  }, [allDocs, allLinks]);

  const connectedNodeIds = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const connected = new Set<string>();
    connected.add(hoveredNode);
    allLinks.forEach((l) => {
      if (l.sourceDocumentId === hoveredNode) connected.add(l.targetDocumentId);
      if (l.targetDocumentId === hoveredNode) connected.add(l.sourceDocumentId);
    });
    return connected;
  }, [hoveredNode, allLinks]);

  const selectedBacklinks = useMemo(() => {
    if (!selectedNode) return [];
    return allLinks
      .filter((l) => l.targetDocumentId === selectedNode)
      .map((l) => allDocs.find((d) => d.id === l.sourceDocumentId))
      .filter(Boolean) as Document[];
  }, [selectedNode, allLinks, allDocs]);

  const selectedOutgoing = useMemo(() => {
    if (!selectedNode) return [];
    return allLinks
      .filter((l) => l.sourceDocumentId === selectedNode)
      .map((l) => allDocs.find((d) => d.id === l.targetDocumentId))
      .filter(Boolean) as Document[];
  }, [selectedNode, allLinks, allDocs]);

  // Load data once per workspace
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/workspace/${workspaceId}/graph`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (!cancelled) {
          setAllDocs(data.documents || []);
          setAllLinks(data.links || []);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load graph");
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [workspaceId]);

  // Rebuild graph when data or filter changes
  useEffect(() => {
    if (allDocs.length === 0 && allLinks.length === 0) return;

    const filteredDocs = filter
      ? allDocs.filter((d) => d.title.toLowerCase().includes(filter.toLowerCase()))
      : allDocs;

    const filteredDocIds = new Set(filteredDocs.map((d) => d.id));
    const filteredLinks = allLinks.filter(
      (l) => filteredDocIds.has(l.sourceDocumentId) && filteredDocIds.has(l.targetDocumentId)
    );

    if (filteredDocs.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const nodeSize = (id: string) => {
      const count = (backlinkCounts.get(id) ?? 0) + (outgoingCounts.get(id) ?? 0);
      return Math.min(80, 40 + count * 8);
    };

    const simNodes: any[] = filteredDocs.map((d) => ({ id: d.id, size: nodeSize(d.id) }));
    const simLinks = filteredLinks.map((l) => ({
      source: l.sourceDocumentId,
      target: l.targetDocumentId,
    }));

    const simulation = forceSimulation(simNodes)
      .force("link", forceLink(simLinks).id((d: any) => d.id).distance(120))
      .force("charge", forceManyBody().strength(-300))
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide().radius((d: any) => (d.size ?? 60) + 20))
      .stop();

    for (let i = 0; i < 150; i++) simulation.tick();

    const newNodes: Node[] = filteredDocs.map((doc) => {
      const simNode = simNodes.find((n) => n.id === doc.id)!;
      const isCurrent = doc.id === currentDocumentId;
      const bc = backlinkCounts.get(doc.id) ?? 0;
      const oc = outgoingCounts.get(doc.id) ?? 0;
      const size = nodeSize(doc.id);

      return {
        id: doc.id,
        position: { x: (simNode as any).x + 400, y: (simNode as any).y + 350 },
        data: {
          label: doc.title,
          backlinks: bc,
          outgoing: oc,
          isCurrent,
          isOrphan: bc === 0 && oc === 0,
        },
        style: {
          width: size + 20,
          padding: 10,
          borderRadius: 10,
          fontSize: 11,
          background: isCurrent ? "#dbeafe" : "var(--node-bg, #ffffff)",
          border: isCurrent
            ? "2px solid #3b82f6"
            : "1px solid var(--node-border, #e4e4e7)",
          cursor: "pointer",
          transition: "all 0.2s",
        },
      };
    });

    const edgeWeight = new Map<string, number>();
    filteredLinks.forEach((l) => {
      const key = `${l.sourceDocumentId}->${l.targetDocumentId}`;
      edgeWeight.set(key, (edgeWeight.get(key) ?? 0) + 1);
    });

    const newEdges: Edge[] = filteredLinks.map((l) => {
      const key = `${l.sourceDocumentId}->${l.targetDocumentId}`;
      return {
        id: key,
        source: l.sourceDocumentId,
        target: l.targetDocumentId,
        animated: true,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: "#a1a1aa" },
        style: {
          stroke: "#a1a1aa",
          strokeWidth: Math.min(3, 1 + (edgeWeight.get(key) ?? 1) * 0.5),
        },
        label: (edgeWeight.get(key) ?? 0) > 1 ? String(edgeWeight.get(key)) : undefined,
        labelStyle: { fontSize: 9, fill: "#a1a1aa" },
        labelBgStyle: { fill: "transparent" },
      };
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [allDocs, allLinks, filter, currentDocumentId, backlinkCounts, outgoingCounts, setNodes, setEdges, fitView]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id === selectedNode) {
        router.push(`/${workspaceId}/d/${node.id}`);
      } else {
        setSelectedNode(node.id);
      }
    },
    [router, workspaceId, selectedNode]
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      router.push(`/${workspaceId}/d/${node.id}`);
    },
    [router, workspaceId]
  );

  const exportPng = useCallback(async () => {
    const el = reactFlowRef.current?.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!el) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(el, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `document-graph-${workspaceId}.png`;
      a.click();
    } catch {
      alert("Export failed. Try taking a screenshot instead.");
    }
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col" ref={reactFlowRef}>
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
        <div className="flex items-center gap-2 flex-1">
          <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            className="flex-1 bg-transparent outline-none text-sm text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setFilter(""); }}
            placeholder="Search documents..."
          />
          {filter && (
            <button onClick={() => setFilter("")} className="text-xs text-zinc-400 hover:text-zinc-600">
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-zinc-400">
          <span>{allDocs.length} docs</span>
          <span>&middot;</span>
          <span>{allLinks.length} links</span>
          {orphanCount > 0 && (
            <>
              <span>&middot;</span>
              <span className="text-amber-500">{orphanCount} orphan{orphanCount !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>
        <button onClick={exportPng} className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all" title="Export as PNG">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </button>
      </div>

      <div className="flex-1 relative flex">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes.map((n) => ({
              ...n,
              style: {
                ...n.style,
                opacity: hoveredNode
                  ? connectedNodeIds.has(n.id)
                    ? 1
                    : 0.2
                  : 1,
              },
            }))}
            edges={edges.map((e) => ({
              ...e,
              style: {
                ...e.style,
                opacity: hoveredNode
                  ? connectedNodeIds.has(e.source) && connectedNodeIds.has(e.target)
                    ? 1
                    : 0.05
                  : 1,
              },
            }))}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeMouseEnter={(_: React.MouseEvent, node: Node) => setHoveredNode(node.id)}
            onNodeMouseLeave={() => setHoveredNode(null)}
            fitView
            fitViewOptions={{ padding: 0.3 }}
          >
            <Background color="var(--graph-bg, #d4d4d8)" gap={20} />
            <Controls />
            <MiniMap
              nodeStrokeWidth={2}
              zoomable
              pannable
              style={{ background: "var(--minimap-bg, #fafafa)" }}
              maskColor="var(--minimap-mask, rgba(0,0,0,0.1))"
            />
          </ReactFlow>
        </div>

        {selectedNode && (
          <div className="w-64 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                {allDocs.find((d) => d.id === selectedNode)?.title ?? "Document"}
              </h3>
              <button onClick={() => setSelectedNode(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {selectedBacklinks.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Backlinks ({selectedBacklinks.length})
                  </p>
                  <div className="space-y-1">
                    {selectedBacklinks.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => router.push(`/${workspaceId}/d/${doc.id}`)}
                        className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-all"
                      >
                        <svg className="h-3 w-3 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                        </svg>
                        <span className="truncate">{doc.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedOutgoing.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Links to ({selectedOutgoing.length})
                  </p>
                  <div className="space-y-1">
                    {selectedOutgoing.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => router.push(`/${workspaceId}/d/${doc.id}`)}
                        className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-all"
                      >
                        <svg className="h-3 w-3 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                        <span className="truncate">{doc.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedBacklinks.length === 0 && selectedOutgoing.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-xs text-zinc-500">No links</p>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Add <code className="text-blue-400">[[page title]]</code> in a document to create links.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => router.push(`/${workspaceId}/d/${selectedNode}`)}
                className="w-full rounded-lg bg-blue-500 hover:bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-all"
              >
                Open Document
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
