"use client";

import { useRef, useEffect, useState } from "react";

interface WhiteboardBlockProps {
  content: string;
  onChange: (content: string) => void;
}

export function WhiteboardBlock({ content, onChange }: WhiteboardBlockProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#3b82f6");
  const [lineWidth, setLineWidth] = useState(2);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (content) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = content;
    }
  }, []);

  function getPos(e: React.MouseEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent) {
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = tool === "eraser" ? 20 : lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
  }

  function draw(e: React.MouseEvent) {
    if (!isDrawing) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDraw() {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current!;
    onChange(canvas.toDataURL());
  }

  function clearCanvas() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Canvas</span>
        <div className="flex items-center gap-1 ml-2">
          <button onClick={() => setTool("pen")} className={`rounded px-2 py-0.5 text-[10px] font-medium ${tool === "pen" ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" : "text-zinc-500"}`}>Pen</button>
          <button onClick={() => setTool("eraser")} className={`rounded px-2 py-0.5 text-[10px] font-medium ${tool === "eraser" ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" : "text-zinc-500"}`}>Eraser</button>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-5 w-5 rounded cursor-pointer border-0 bg-transparent" title="Color" />
          <select value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} className="rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[10px] px-1 py-0.5 text-zinc-600">
            <option value={1}>1px</option>
            <option value={2}>2px</option>
            <option value={4}>4px</option>
            <option value={6}>6px</option>
          </select>
          <button onClick={clearCanvas} className="text-[10px] text-red-400 hover:text-red-600 px-2">Clear</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full bg-white cursor-crosshair"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
      />
    </div>
  );
}
