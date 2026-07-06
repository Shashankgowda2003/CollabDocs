"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";

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
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const buildGraph = useCallback(
    (documents: Document[], links: Link[]) => {
      const docMap = new Map(documents.map((d) => [d.id, d]));
      const width = 800;
      const height = 600;
      const angleStep = (2 * Math.PI) / Math.max(documents.length, 1);
      const radius = Math.min(width, height) / 2.5;

      const centerX = width / 2;
      const centerY = height / 2;

      const newNodes: Node[] = documents.map((doc, i) => {
        const isCurrent = doc.id === currentDocumentId;
        const angle = i * angleStep;
        return {
          id: doc.id,
          position: {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
          },
          data: {
            label: (
              <div className={`text-xs font-medium ${isCurrent ? "text-blue-600" : ""}`}>
                {doc.title}
              </div>
            ),
          },
          style: {
            background: isCurrent ? "#eff6ff" : "#fff",
            border: isCurrent ? "2px solid #3b82f6" : "1px solid #e4e4e7",
            borderRadius: 8,
            padding: 8,
            minWidth: 100,
            maxWidth: 180,
            cursor: "pointer",
          },
        };
      });

      const newEdges: Edge[] = links
        .filter(
          (l) => docMap.has(l.sourceDocumentId) && docMap.has(l.targetDocumentId)
        )
        .map((l) => ({
          id: `${l.sourceDocumentId}->${l.targetDocumentId}`,
          source: l.sourceDocumentId,
          target: l.targetDocumentId,
          animated: true,
          style: { stroke: "#a1a1aa", strokeWidth: 1.5 },
        }));

      setNodes(newNodes);
      setEdges(newEdges);
    },
    [currentDocumentId, setNodes, setEdges]
  );

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/workspace/${workspaceId}/graph`);
        const data = await res.json();
        if (data.documents && data.links) {
          buildGraph(data.documents, data.links);
        }
      } catch (e) {
        console.error("Failed to load graph", e);
      }
      setLoading(false);
    }
    load();
  }, [workspaceId, buildGraph]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      router.push(`/${workspaceId}/d/${node.id}`);
    },
    [router, workspaceId]
  );

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background color="#d4d4d8" gap={16} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </div>
  );
}
