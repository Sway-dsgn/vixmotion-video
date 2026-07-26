import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  FolderOpen,
  Headphones,
  Type,
  Sparkles,
  Smile,
  PenTool,
  Expand,
  Subtitles,
  SlidersHorizontal,
  Settings,
  GripVertical,
} from "@/icons/lucide-compat";
import { useUIStore } from "../../stores/ui-store";

interface FloatingToolbarProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface ToolDef {
  icon: React.FC<{ size: number; className?: string }>;
  label: string;
  onClick: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ containerRef }) => {
  const { openModal, togglePanel } = useUIStore();

  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  const clampPosition = useCallback(
    (x: number, y: number) => {
      const container = containerRef.current;
      if (!container) return { x, y };
      const rect = container.getBoundingClientRect();
      const toolbarW = 44;
      const toolbarH = 340;
      return {
        x: Math.max(0, Math.min(x, rect.width - toolbarW)),
        y: Math.max(0, Math.min(y, rect.height - toolbarH)),
      };
    },
    [containerRef],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      hasDragged.current = false;
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    },
    [position],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      hasDragged.current = true;
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      setPosition(clampPosition(newX, newY));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, clampPosition]);

  const tools: ToolDef[] = [
    {
      icon: FolderOpen,
      label: "Import media",
      onClick: () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "video/*,image/*,audio/*";
        input.multiple = true;
        input.onchange = () => input.click();
        input.click();
      },
    },
    {
      icon: Headphones,
      label: "Audio mixer",
      onClick: () => togglePanel("audioMixer"),
    },
    {
      icon: Type,
      label: "Add text",
      onClick: () => openModal("addText"),
    },
    {
      icon: Sparkles,
      label: "Effects",
      onClick: () => openModal("effects"),
    },
    {
      icon: Smile,
      label: "Stickers",
      onClick: () => openModal("stickers"),
    },
    {
      icon: PenTool,
      label: "Draw",
      onClick: () => openModal("draw"),
    },
    {
      icon: Expand,
      label: "More tools",
      onClick: () => openModal("moreTools"),
    },
    {
      icon: Subtitles,
      label: "Subtitles",
      onClick: () => togglePanel("subtitles"),
    },
    {
      icon: SlidersHorizontal,
      label: "Adjustments",
      onClick: () => openModal("adjustments"),
    },
    {
      icon: Settings,
      label: "Settings",
      onClick: () => openModal("settings"),
    },
  ];

  return (
    <div
      className="absolute z-30 select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div
        className="flex flex-col items-center gap-0.5 rounded-xl border border-white/10 py-1.5"
        style={{
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Drag handle */}
        <div
          onMouseDown={handleMouseDown}
          className="w-8 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing rounded hover:bg-white/10 transition-colors mb-1"
          aria-label="Drag toolbar"
        >
          <GripVertical size={14} className="text-white/40" />
        </div>

        <div className="w-6 h-px bg-white/10 mb-1" />

        {/* Tool buttons */}
        {tools.map((tool) => (
          <button
            key={tool.label}
            onClick={() => {
              if (!hasDragged.current) {
                tool.onClick();
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={tool.label}
            title={tool.label}
          >
            <tool.icon size={16} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default FloatingToolbar;
