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
import { tree as d3Tree, hierarchy } from "d3-hierarchy";

interface Document {
  id: string;
  title: string;
  folderId: string | null;
  updatedAt: string;
}

interface Link {
  sourceDocumentId: string;
  targetDocumentId: string;
}

interface Props {
  workspaceId: string;
  currentDocumentId?: string;
}

type LayoutMode = "force" | "circular" | "tree" | "radial";
type SizeMode = "links" | "activity" | "uniform";

const FOLDER_COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#14b8a6",
];

const SHORTCUTS: Record<string, string> = {
  F: "Fit view",
  R: "Reset zoom",
  Escape: "Deselect / close",
  "1": "Force layout",
  "2": "Circular layout",
  "3": "Tree layout",
  "4": "Radial layout",
  Tab: "Cycle connected nodes",
};

export function DocumentGraph({ workspaceId, currentDocumentId }: Props) {
  const router = useRouter();
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
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

  const [layoutMode, setLayoutMode] = useState<LayoutMode>("force");
  const [sizeMode, setSizeMode] = useState<SizeMode>("links");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [pathStart, setPathStart] = useState<string | null>(null);
  const [pathEnd, setPathEnd] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [previewNode, setPreviewNode] = useState<{ doc: Document; x: number; y: number } | null>(null);

  const folderColorMap = useMemo(() => {
    const map = new Map<string | null, string>();
    const folders = [...new Set(allDocs.map((d) => d.folderId))];
    folders.forEach((fid, i) => {
      map.set(fid, FOLDER_COLORS[i % FOLDER_COLORS.length]!);
    });
    return map;
  }, [allDocs]);

  const backlinkCounts = useMemo(() => {
    const counts = new Map<string, number>();
    allLinks.forEach((l) => counts.set(l.targetDocumentId, (counts.get(l.targetDocumentId) ?? 0) + 1));
    return counts;
  }, [allLinks]);

  const outgoingCounts = useMemo(() => {
    const counts = new Map<string, number>();
    allLinks.forEach((l) => counts.set(l.sourceDocumentId, (counts.get(l.sourceDocumentId) ?? 0) + 1));
    return counts;
  }, [allLinks]);

  const docMap = useMemo(() => new Map(allDocs.map((d) => [d.id, d])), [allDocs]);

  const filteredDocs = useMemo(() => {
    let docs = allDocs;
    if (filter) docs = docs.filter((d) => d.title.toLowerCase().includes(filter.toLowerCase()));
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      docs = docs.filter((d) => new Date(d.updatedAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000;
      docs = docs.filter((d) => new Date(d.updatedAt).getTime() <= to);
    }
    return docs;
  }, [allDocs, filter, dateFrom, dateTo]);

  const filteredLinks = useMemo(() => {
    const ids = new Set(filteredDocs.map((d) => d.id));
    return allLinks.filter((l) => ids.has(l.sourceDocumentId) && ids.has(l.targetDocumentId));
  }, [allLinks, filteredDocs]);

  const orphanCount = useMemo(() => {
    const linked = new Set<string>();
    allLinks.forEach((l) => { linked.add(l.sourceDocumentId); linked.add(l.targetDocumentId); });
    return allDocs.filter((d) => !linked.has(d.id)).length;
  }, [allDocs, allLinks]);

  const connectedNodeIds = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const connected = new Set<string>([hoveredNode]);
    allLinks.forEach((l) => {
      if (l.sourceDocumentId === hoveredNode) connected.add(l.targetDocumentId);
      if (l.targetDocumentId === hoveredNode) connected.add(l.sourceDocumentId);
    });
    return connected;
  }, [hoveredNode, allLinks]);

  const pathNodeIds = useMemo(() => {
    if (!pathStart || !pathEnd) return new Set<string>();
    if (pathStart === pathEnd) return new Set<string>([pathStart]);

    const adj = new Map<string, string[]>();
    filteredLinks.forEach((l) => {
      if (!adj.has(l.sourceDocumentId)) adj.set(l.sourceDocumentId, []);
      if (!adj.has(l.targetDocumentId)) adj.set(l.targetDocumentId, []);
      adj.get(l.sourceDocumentId)!.push(l.targetDocumentId);
      adj.get(l.targetDocumentId)!.push(l.sourceDocumentId);
    });

    const queue: string[] = [pathStart];
    const parent = new Map<string, string | null>();
    parent.set(pathStart, null);
    const visited = new Set<string>([pathStart]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === pathEnd) break;
      for (const neighbor of adj.get(current) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }

    if (!parent.has(pathEnd)) return new Set<string>();

    const pathNodes = new Set<string>();
    let node: string | null = pathEnd;
    while (node) {
      pathNodes.add(node);
      node = parent.get(node) ?? null;
    }
    return pathNodes;
  }, [pathStart, pathEnd, filteredLinks]);

  const selectedBacklinks = useMemo(() => {
    if (!selectedNode) return [];
    return allLinks.filter((l) => l.targetDocumentId === selectedNode)
      .map((l) => docMap.get(l.sourceDocumentId))
      .filter(Boolean) as Document[];
  }, [selectedNode, allLinks, docMap]);

  const selectedOutgoing = useMemo(() => {
    if (!selectedNode) return [];
    return allLinks.filter((l) => l.sourceDocumentId === selectedNode)
      .map((l) => docMap.get(l.targetDocumentId))
      .filter(Boolean) as Document[];
  }, [selectedNode, allLinks, docMap]);

  // Analytics
  const analytics = useMemo(() => {
    const totalDocs = allDocs.length;
    const totalLinks = allLinks.length;
    const maxPossible = totalDocs * (totalDocs - 1);
    const density = maxPossible > 0 ? (totalLinks / maxPossible * 100).toFixed(2) : "0";

    // Most connected
    let mostConnected = { id: "", title: "", count: 0 };
    docMap.forEach((doc, id) => {
      const count = (backlinkCounts.get(id) ?? 0) + (outgoingCounts.get(id) ?? 0);
      if (count > mostConnected.count) mostConnected = { id, title: doc.title, count };
    });

    // Largest connected component
    const visited = new Set<string>();
    let largestComp = 0;
    docMap.forEach((_, id) => {
      if (visited.has(id)) return;
      const stack = [id];
      let size = 0;
      while (stack.length > 0) {
        const curr = stack.pop()!;
        if (visited.has(curr)) continue;
        visited.add(curr);
        size++;
        filteredLinks.forEach((l) => {
          if (l.sourceDocumentId === curr && !visited.has(l.targetDocumentId)) stack.push(l.targetDocumentId);
          if (l.targetDocumentId === curr && !visited.has(l.sourceDocumentId)) stack.push(l.sourceDocumentId);
        });
      }
      if (size > largestComp) largestComp = size;
    });

    // Average path length (sample-based for performance)
    const sample = [...docMap.keys()].slice(0, 20);
    let totalPathLen = 0;
    let pathCount = 0;
    sample.forEach((start) => {
      const dist = new Map<string, number>();
      const q: string[] = [start];
      dist.set(start, 0);
      while (q.length > 0) {
        const c = q.shift()!;
        (adjPairs(c)).forEach((n) => {
          if (!dist.has(n)) { dist.set(n, dist.get(c)! + 1); q.push(n); }
        });
      }
      dist.forEach((d) => { if (d > 0) { totalPathLen += d; pathCount++; } });
    });

    function adjPairs(nodeId: string): string[] {
      const neighbors: string[] = [];
      filteredLinks.forEach((l) => {
        if (l.sourceDocumentId === nodeId) neighbors.push(l.targetDocumentId);
        if (l.targetDocumentId === nodeId) neighbors.push(l.sourceDocumentId);
      });
      return neighbors;
    }

    const avgPathLen = pathCount > 0 ? (totalPathLen / pathCount).toFixed(1) : "N/A";

    return { totalDocs, totalLinks, density, mostConnected, largestComp, avgPathLen, orphans: orphanCount };
  }, [allDocs, allLinks, docMap, backlinkCounts, outgoingCounts, orphanCount, filteredLinks]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/workspace/${workspaceId}/graph`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (!cancelled) { setAllDocs(data.documents || []); setAllLinks(data.links || []); }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load graph");
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [workspaceId]);

  useEffect(() => {
    if (filteredDocs.length === 0) { setNodes([]); setEdges([]); return; }

    const sizeFn = (id: string) => {
      if (sizeMode === "uniform") return 60;
      if (sizeMode === "activity") {
        const doc = docMap.get(id);
        if (!doc) return 60;
        const daysSince = (Date.now() - new Date(doc.updatedAt).getTime()) / 86400000;
        return Math.max(44, 80 - Math.min(daysSince / 2, 36));
      }
      const count = (backlinkCounts.get(id) ?? 0) + (outgoingCounts.get(id) ?? 0);
      return Math.min(80, 40 + count * 8);
    };

    let newNodes: Node[];
    let newEdges: Edge[];

    if (layoutMode === "circular") {
      const r = Math.max(200, filteredDocs.length * 20);
      newNodes = filteredDocs.map((doc, i) => {
        const angle = (2 * Math.PI * i) / filteredDocs.length;
        const size = sizeFn(doc.id);
        return makeNode(doc, Math.cos(angle) * r + 400, Math.sin(angle) * r + 350, size);
      });
    } else if (layoutMode === "tree" || layoutMode === "radial") {
      const rootId = currentDocumentId || filteredDocs[0]?.id || "";
      const adj = new Map<string, string[]>();
      filteredLinks.forEach((l) => {
        if (!adj.has(l.sourceDocumentId)) adj.set(l.sourceDocumentId, []);
        adj.get(l.sourceDocumentId)!.push(l.targetDocumentId);
      });

      const root: any = { id: rootId, children: [] };
      const buildTree = (nodeId: string, seen: Set<string>) => {
        seen.add(nodeId);
        (adj.get(nodeId) || []).forEach((child) => {
          if (!seen.has(child)) {
            const c: any = { id: child, children: [] };
            root.children.push(c);
            buildTree(child, seen);
          }
        });
      };
      buildTree(rootId, new Set());

      const treeLayout = d3Tree().size(layoutMode === "radial" ? [2 * Math.PI, Math.max(300, filteredDocs.length * 20)] : [600, Math.max(300, filteredDocs.length * 25)]);
      const rootNode = hierarchy(root);
      treeLayout(rootNode);

      const treeMap = new Map<string, { x: number; y: number }>();
      rootNode.descendants().forEach((n: any) => {
        if (layoutMode === "radial") {
          treeMap.set(n.data.id, { x: n.y * Math.cos(n.x - Math.PI / 2) + 400, y: n.y * Math.sin(n.x - Math.PI / 2) + 350 });
        } else {
          treeMap.set(n.data.id, { x: n.x + 100, y: n.y + 50 });
        }
      });

      newNodes = filteredDocs.map((doc) => {
        const pos = treeMap.get(doc.id) || { x: 400 + Math.random() * 100, y: 350 + Math.random() * 100 };
        return makeNode(doc, pos.x, pos.y, sizeFn(doc.id));
      });
    } else {
      const simNodes: any[] = filteredDocs.map((d) => ({ id: d.id, size: sizeFn(d.id) }));
      const simLinks = filteredLinks.map((l) => ({ source: l.sourceDocumentId, target: l.targetDocumentId }));
      const simulation = forceSimulation(simNodes)
        .force("link", forceLink(simLinks).id((d: any) => d.id).distance(120))
        .force("charge", forceManyBody().strength(-300))
        .force("center", forceCenter(0, 0))
        .force("collide", forceCollide().radius((d: any) => (d.size ?? 60) + 20))
        .stop();
      for (let i = 0; i < 150; i++) simulation.tick();
      newNodes = filteredDocs.map((doc) => {
        const simNode = simNodes.find((n) => n.id === doc.id)!;
        return makeNode(doc, (simNode as any).x + 400, (simNode as any).y + 350, sizeFn(doc.id));
      });
    }

    const edgeWeight = new Map<string, number>();
    filteredLinks.forEach((l) => {
      const key = `${l.sourceDocumentId}->${l.targetDocumentId}`;
      edgeWeight.set(key, (edgeWeight.get(key) ?? 0) + 1);
    });

    newEdges = filteredLinks.map((l) => {
      const key = `${l.sourceDocumentId}->${l.targetDocumentId}`;
      const weight = edgeWeight.get(key) ?? 1;
      const onPath = pathNodeIds.has(l.sourceDocumentId) && pathNodeIds.has(l.targetDocumentId);
      return {
        id: key,
        source: l.sourceDocumentId,
        target: l.targetDocumentId,
        animated: true,
        type: "smoothstep" as const,
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: onPath ? "#f59e0b" : "#a1a1aa" },
        style: {
          stroke: onPath ? "#f59e0b" : "#a1a1aa",
          strokeWidth: onPath ? 3 : Math.min(3, 1 + weight * 0.5),
        },
        label: weight > 1 ? String(weight) : undefined,
        labelStyle: { fontSize: 9, fill: "#a1a1aa" },
        labelBgStyle: { fill: "transparent" },
      };
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setTimeout(() => fitView({ padding: 0.2 }), 100);

    function makeNode(doc: Document, x: number, y: number, size: number): Node {
      const isCurrent = doc.id === currentDocumentId;
      const bc = backlinkCounts.get(doc.id) ?? 0;
      const oc = outgoingCounts.get(doc.id) ?? 0;
      const color = folderColorMap.get(doc.folderId) || "#78716c";
      const onPath = pathNodeIds.has(doc.id);

      return {
        id: doc.id,
        position: { x, y },
        data: { label: doc.title, backlinks: bc, outgoing: oc, isCurrent, isOrphan: bc === 0 && oc === 0, color, onPath },
        style: {
          width: size + 20,
          padding: 10,
          borderRadius: 10,
          fontSize: 11,
          background: isCurrent ? "#dbeafe" : `${color}22`,
          border: isCurrent ? "2px solid #3b82f6" : onPath ? "2px solid #f59e0b" : `2px solid ${color}44`,
          cursor: "pointer",
          transition: "all 0.2s",
        },
      };
    }
  }, [filteredDocs, filteredLinks, layoutMode, sizeMode, currentDocumentId, backlinkCounts, outgoingCounts, setNodes, setEdges, fitView, folderColorMap, pathNodeIds, docMap]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.id === selectedNode) { router.push(`/${workspaceId}/d/${node.id}`); }
    else { setSelectedNode(node.id); }
  }, [router, workspaceId, selectedNode]);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    router.push(`/${workspaceId}/d/${node.id}`);
  }, [router, workspaceId]);

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    setHoveredNode(node.id);
    const doc = docMap.get(node.id);
    if (doc) {
      const el = (node as any).position || { x: 0, y: 0 };
      setPreviewNode({ doc, x: el.x + 60, y: el.y - 10 });
    }
  }, [docMap]);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
    setPreviewNode(null);
  }, []);

  const exportPng = useCallback(async () => {
    const el = reactFlowRef.current?.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!el) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(el, { backgroundColor: "#ffffff", pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl; a.download = `document-graph-${workspaceId}.png`; a.click();
    } catch { alert("Export failed."); }
  }, [workspaceId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      const key = e.key;

      if (key === "f" || key === "F") { e.preventDefault(); fitView({ padding: 0.2 }); }
      else if (key === "r" || key === "R") { e.preventDefault(); setNodes((ns) => ns.map((n) => ({ ...n, position: { x: (n.position as any).x ?? 400, y: (n.position as any).y ?? 350 } }))); fitView({ padding: 0.2 }); }
      else if (key === "Escape") { setSelectedNode(null); setPathStart(null); setPathEnd(null); }
      else if (key === "1") setLayoutMode("force");
      else if (key === "2") setLayoutMode("circular");
      else if (key === "3") setLayoutMode("tree");
      else if (key === "4") setLayoutMode("radial");
      else if (key === "Tab" && hoveredNode) {
        e.preventDefault();
        const conn = [...connectedNodeIds].filter((id) => id !== hoveredNode);
        if (conn.length > 0) {
          const idx = conn.findIndex((id) => id === selectedNode);
          const next = idx >= 0 && idx < conn.length - 1 ? conn[idx + 1] : conn[0];
          setHoveredNode(next!);
          setSelectedNode(next!);
          const doc = docMap.get(next!);
          if (doc) {
            const node = nodes.find((n) => n.id === next);
            if (node) setPreviewNode({ doc, x: (node.position as any).x + 60, y: (node.position as any).y - 10 });
          }
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [fitView, setNodes, connectedNodeIds, hoveredNode, selectedNode, docMap, nodes]);

  if (loading) return <div className="h-full w-full flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" /></div>;
  if (error) return <div className="h-full w-full flex items-center justify-center"><p className="text-sm text-red-400">{error}</p></div>;

  return (
    <div className="h-full w-full flex flex-col" ref={reactFlowRef}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg className="h-4 w-4 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={searchRef}
            className="flex-1 bg-transparent outline-none text-sm text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 min-w-0"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setFilter(""); }}
            placeholder="Search documents..."
          />
          {filter && (
            <button onClick={() => setFilter("")} className="text-xs text-zinc-400 hover:text-zinc-600 shrink-0">Clear</button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Layout modes */}
          {(["force", "circular", "tree", "radial"] as LayoutMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setLayoutMode(mode)}
              className={`rounded-lg px-2.5 py-1.5 text-[10px] font-medium capitalize transition-all ${layoutMode === mode ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
            >
              {mode}
            </button>
          ))}
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />

          {/* Size mode */}
          <select value={sizeMode} onChange={(e) => setSizeMode(e.target.value as SizeMode)}
            className="rounded-lg bg-zinc-50 dark:bg-zinc-800 text-[10px] text-zinc-500 dark:text-zinc-400 px-1.5 py-1.5 outline-none border border-zinc-200 dark:border-zinc-700">
            <option value="links">By links</option>
            <option value="activity">By activity</option>
            <option value="uniform">Uniform</option>
          </select>

          {/* Path finding */}
          {pathStart && pathEnd && (
            <span className="text-[10px] text-amber-500 font-medium">
              Path: {pathNodeIds.size > 0 ? `${pathNodeIds.size - 1} hops` : "No path"}
            </span>
          )}
          <button
            onClick={() => { setPathStart(null); setPathEnd(null); }}
            className={`rounded-lg px-2 py-1 text-[10px] font-medium transition-all ${pathStart ? "text-amber-500 bg-amber-50 dark:bg-amber-500/10" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
          >
            {pathStart ? "Clear path" : "Find path"}
          </button>

          <button onClick={() => setShowAnalytics(!showAnalytics)}
            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all ${showAnalytics ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}>
            Stats
          </button>
          <button onClick={() => setShowShortcuts(!showShortcuts)}
            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all ${showShortcuts ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}>
            Shortcuts
          </button>
          <button onClick={exportPng} className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all" title="Export as PNG">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[10px] text-zinc-400 w-full">
          <span>{filteredDocs.length}/{allDocs.length} docs</span>
          <span>&middot;</span>
          <span>{filteredLinks.length} links</span>
          {orphanCount > 0 && <><span>&middot;</span><span className="text-amber-500">{orphanCount} orphan{orphanCount !== 1 ? "s" : ""}</span></>}
        </div>

        {/* Analytics panel */}
        {showAnalytics && (
          <div className="w-full p-3 mt-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 grid grid-cols-4 gap-3">
            {[
              { label: "Documents", value: analytics.totalDocs },
              { label: "Links", value: analytics.totalLinks },
              { label: "Density", value: `${analytics.density}%` },
              { label: "Orphans", value: analytics.orphans },
              { label: "Most Connected", value: analytics.mostConnected.title || "—", sub: analytics.mostConnected.count > 0 ? `${analytics.mostConnected.count} links` : undefined },
              { label: "Largest Component", value: analytics.largestComp },
              { label: "Avg Path Length", value: analytics.avgPathLen },
              { label: "Layout", value: layoutMode },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{stat.label}</p>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">{stat.value}</p>
                {stat.sub && <p className="text-[10px] text-zinc-400">{stat.sub}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Shortcuts panel */}
        {showShortcuts && (
          <div className="w-full p-3 mt-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 grid grid-cols-4 gap-2">
            {Object.entries(SHORTCUTS).map(([key, desc]) => (
              <div key={key} className="flex items-center gap-2">
                <kbd className="rounded-md bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">{key}</kbd>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-[10px]">
        <span className="text-zinc-400">Show:</span>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-0.5 text-zinc-600 dark:text-zinc-400 outline-none" />
        <span className="text-zinc-400">to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-0.5 text-zinc-600 dark:text-zinc-400 outline-none" />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-zinc-400 hover:text-zinc-600">Clear</button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 relative flex">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes.map((n) => ({
              ...n,
              style: {
                ...n.style,
                opacity: hoveredNode ? (connectedNodeIds.has(n.id) ? 1 : 0.15) : 1,
              },
            }))}
            edges={edges.map((e) => ({
              ...e,
              style: { ...e.style, opacity: hoveredNode ? (connectedNodeIds.has(e.source) && connectedNodeIds.has(e.target) ? 1 : 0.04) : 1 },
            }))}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            fitView
            fitViewOptions={{ padding: 0.3 }}
          >
            <Background color="var(--graph-bg, #d4d4d8)" gap={20} />
            <Controls />
            <MiniMap nodeStrokeWidth={2} zoomable pannable style={{ background: "var(--minimap-bg, #fafafa)" }} maskColor="var(--minimap-mask, rgba(0,0,0,0.1))" />
          </ReactFlow>
        </div>

        {/* Hover preview popover */}
        {previewNode && !selectedNode && (
          <div
            className="absolute z-50 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-3 max-w-[200px] pointer-events-none"
            style={{ left: previewNode.x, top: previewNode.y, transform: "translate(-50%, -100%)" }}
          >
            <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{previewNode.doc.title}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Updated {new Date(previewNode.doc.updatedAt).toLocaleDateString()}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-zinc-400">↗ {outgoingCounts.get(previewNode.doc.id) ?? 0}</span>
              <span className="text-[10px] text-zinc-400">↙ {backlinkCounts.get(previewNode.doc.id) ?? 0}</span>
            </div>
          </div>
        )}

        {/* Sidebar */}
        {selectedNode && (
          <div className="w-64 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{docMap.get(selectedNode)?.title ?? "Document"}</h3>
              <button onClick={() => setSelectedNode(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Path finding controls */}
            <div className="mb-4 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Find Path</p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPathStart(selectedNode)}
                  className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all ${pathStart === selectedNode ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}
                >
                  {pathStart === selectedNode ? "✓ Start" : "Set start"}
                </button>
                <span className="text-zinc-400 text-[10px]">→</span>
                <button
                  onClick={() => { if (pathStart && pathStart !== selectedNode) setPathEnd(selectedNode); else if (pathStart === selectedNode) setPathEnd(null); }}
                  className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all ${pathEnd === selectedNode ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" : pathStart && pathStart !== selectedNode ? "bg-blue-50 dark:bg-blue-500/10 text-blue-500 cursor-pointer" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed"}`}
                >
                  {pathEnd === selectedNode ? "✓ End" : "Set end"}
                </button>
              </div>
              {pathNodeIds.size > 1 && <p className="text-[10px] text-amber-500 mt-1.5">{pathNodeIds.size - 1} hops from start to end</p>}
              {pathStart && pathEnd && pathStart !== pathEnd && pathNodeIds.size === 1 && <p className="text-[10px] text-red-400 mt-1.5">No path found</p>}
            </div>

            <div className="space-y-4">
              {selectedBacklinks.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Backlinks ({selectedBacklinks.length})</p>
                  <div className="space-y-1">
                    {selectedBacklinks.map((doc) => (
                      <button key={doc.id} onClick={() => router.push(`/${workspaceId}/d/${doc.id}`)}
                        className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-all">
                        <svg className="h-3 w-3 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                        <span className="truncate">{doc.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedOutgoing.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Links to ({selectedOutgoing.length})</p>
                  <div className="space-y-1">
                    {selectedOutgoing.map((doc) => (
                      <button key={doc.id} onClick={() => router.push(`/${workspaceId}/d/${doc.id}`)}
                        className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-all">
                        <svg className="h-3 w-3 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                        <span className="truncate">{doc.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedBacklinks.length === 0 && selectedOutgoing.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-xs text-zinc-500">No links</p>
                  <p className="text-[10px] text-zinc-400 mt-1">Add <code className="text-blue-400">[[page title]]</code> to create links.</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={() => router.push(`/${workspaceId}/d/${selectedNode}`)}
                className="w-full rounded-lg bg-blue-500 hover:bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-all">Open Document</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
