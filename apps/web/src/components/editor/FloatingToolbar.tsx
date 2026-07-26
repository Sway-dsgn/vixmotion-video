import React, { useState, useRef, useEffect } from "react";
import {
  FolderOpen,
  Headphones,
  Type,
  Sparkles,
  Smile,
  PenTool,
  Subtitles,
  SlidersHorizontal,
  Settings,
  GripVertical,
  Eye,
  EyeOff,
} from "@/icons/lucide-compat";
import { useUIStore } from "../../stores/ui-store";
import { useProjectStore } from "../../stores/project-store";

export const FloatingToolbar: React.FC = () => {
  const { togglePanel, panels } = useUIStore();
  const { importMedia } = useProjectStore();

  const [pos, setPos] = useState({ x: 60, y: 40 });
  const [visible, setVisible] = useState(true);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      dragRef.current.moved = true;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPos({
        x: Math.max(0, Math.min(dragRef.current.origX + dx, window.innerWidth - 50)),
        y: Math.max(0, Math.min(dragRef.current.origY + dy, window.innerHeight - 50)),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const onGripDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y, moved: false };
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  };

  const onToolClick = (action: () => void) => {
    if (dragRef.current?.moved) return;
    action();
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*,image/*,audio/*";
    input.multiple = true;
    input.onchange = async () => {
      for (const file of Array.from(input.files || [])) {
        try { await importMedia(file); } catch { /* ignore */ }
      }
    };
    input.click();
  };

  const isActive = (panelId: string) => Boolean(panels[panelId as keyof typeof panels]?.visible);

  const tools = [
    { icon: FolderOpen, label: "Import", action: handleImport },
    { icon: Headphones, label: "Audio", panel: "audioMixer" },
    { icon: Type, label: "Text", panel: "effects" },
    { icon: Sparkles, label: "AI Chat", panel: "agentChat" },
    { icon: Smile, label: "AI Panel", panel: "ai" },
    { icon: Subtitles, label: "Subtitles", panel: "subtitles" },
    { icon: PenTool, label: "Color", panel: "colorGrading" },
    { icon: SlidersHorizontal, label: "Inspector", panel: "inspector" },
    { icon: Settings, label: "Settings", panel: "mediaLibrary" },
  ];

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="absolute z-30 p-1.5 rounded-lg border border-white/10 hover:bg-white/20 transition-colors"
        style={{ left: pos.x, top: pos.y, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        title="Show toolbar"
      >
        <Eye size={14} className="text-white/70" />
      </button>
    );
  }

  return (
    <div
      className="absolute z-30 select-none"
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        className="flex items-center rounded-xl border border-white/10 px-1 py-1 gap-0.5"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
      >
        {/* Drag handle - LEFT side */}
        <div
          onMouseDown={onGripDown}
          className="w-5 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/10 rounded-l-lg transition-colors"
          title="Drag to move"
        >
          <GripVertical size={12} className="text-white/40" />
        </div>

        {/* Tools - horizontal row */}
        {tools.map((t) => {
          const panelId = (t as { panel?: string }).panel;
          const active = panelId ? isActive(panelId) : false;
          const action = panelId ? () => togglePanel(panelId as any) : (t as { action?: () => void }).action!;

          return (
            <button
              key={t.label}
              onMouseUp={() => onToolClick(action)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                active
                  ? "bg-accent text-white shadow-sm shadow-accent/30"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
              title={t.label}
            >
              <t.icon size={14} />
            </button>
          );
        })}

        {/* Separator */}
        <div className="w-px h-5 bg-white/10 mx-0.5" />

        {/* Hide - RIGHT side */}
        <button
          onMouseUp={() => onToolClick(() => setVisible(false))}
          className="w-6 h-7 flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/10 rounded-r-lg transition-colors"
          title="Hide toolbar"
        >
          <EyeOff size={11} />
        </button>
      </div>
    </div>
  );
};

export default FloatingToolbar;
