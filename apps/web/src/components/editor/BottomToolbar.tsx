import React from "react";
import {
  Scissors,
  AlignLeft,
  PanelBottom,
  Link2,
  Copy,
  Snowflake,
  Trash2,
  Bookmark,
  BarChart2,
  Layers,
  Lock,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ChevronDown,
} from "@/icons/lucide-compat";
import { ToolcraftButton as Button } from "@vixmotion/ui";
import { ToolcraftDropdownMenu } from "@vixmotion/ui";
import { useUIStore } from "../../stores/ui-store";

export const BottomToolbar: React.FC = () => {
  const { timelineMaximized, setTimelineMaximized } = useUIStore();
  const [showZoomMenu, setShowZoomMenu] = React.useState(false);

  const tools = [
    { icon: Scissors, label: "Cut", shortcut: "C", onClick: () => {} },
    { icon: AlignLeft, label: "Align", shortcut: "A", onClick: () => {} },
    { icon: PanelBottom, label: "Dock", shortcut: "D", onClick: () => {} },
    { icon: Link2, label: "Link", shortcut: "L", onClick: () => {} },
    { icon: Copy, label: "Duplicate", shortcut: "Ctrl+D", onClick: () => {} },
    { icon: Snowflake, label: "Freeze", shortcut: "F", onClick: () => {} },
    { icon: Trash2, label: "Delete", shortcut: "Del", onClick: () => {} },
    { icon: Bookmark, label: "Bookmark", shortcut: "B", onClick: () => {} },
    { icon: BarChart2, label: "Graph", shortcut: "G", onClick: () => {} },
  ];

  const zoomLevels = [25, 50, 75, 100, 150, 200, 300, 400];
  const currentZoom = 100;

  return (
    <div className="bg-[#0a0a0a] flex flex-col">
      {/* Row 1: Editing Tools */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-1">
          {tools.map((tool) => (
            <button
              key={tool.label}
              onClick={tool.onClick}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white relative group"
              aria-label={`${tool.label} (${tool.shortcut})`}
            >
              <tool.icon size={18} />
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] bg-bg-1 border border-border px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {tool.label} ({tool.shortcut})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Scene Selector + Zoom Controls */}
      <div className="h-12 px-4 flex items-center justify-between">
        {/* Left: Scene Selector */}
        <div className="flex items-center gap-2">
          <Button
            label="Main scene"
            variant="secondary"
            size="sm"
            icon={<Layers size={14} />}
            className="px-3 py-1.5 bg-bg-2 border-border text-text-primary hover:bg-white/5"
          />
          <ChevronDown size={14} className="text-text-muted" />
        </div>

        {/* Right: Lock, Resize, Zoom */}
        <div className="flex items-center gap-2">
          <button
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white"
            aria-label="Lock timeline"
          >
            <Lock size={18} />
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white"
            aria-label="Fit to window"
          >
            <Maximize2 size={18} />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          <button
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white"
            aria-label="Zoom out"
          >
            <ZoomOut size={18} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowZoomMenu(!showZoomMenu)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors text-text-primary min-w-[90px]"
            >
              <span className="font-mono text-xs tabular-nums">{currentZoom}%</span>
              <ChevronDown size={12} className="text-text-muted" />
            </button>
            {showZoomMenu && (
              <ToolcraftDropdownMenu
                items={zoomLevels.map((z) => ({
                  label: `${z}%`,
                  onClick: () => {
                    setShowZoomMenu(false);
                  },
                  icon: z === currentZoom ? (
                    <span className="w-4 h-4 flex items-center justify-center">
                      <ChevronDown size={10} className="text-primary rotate-90" />
                    </span>
                  ) : null,
                }))}
                className="absolute right-0 top-full mt-1 w-24 bg-bg-1 border border-border rounded-lg shadow-lg py-1 z-50"
              />
            )}
          </div>

          <div className="w-24 h-1.5 bg-bg-2 rounded-full relative mx-2" style={{ cursor: "ew-resize" }}>
            <div
              className="absolute top-1/2 -translate-y-1/2 bg-primary rounded-full"
              style={{
                left: "0%",
                width: `${(currentZoom - 25) / (400 - 25) * 100}%`,
                height: "2px",
              }}
            />
          </div>

          <button
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white"
            aria-label="Zoom in"
          >
            <ZoomIn size={18} />
          </button>

          <button
            onClick={() => setTimelineMaximized(!timelineMaximized)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white"
            aria-label={timelineMaximized ? "Minimize timeline" : "Maximize timeline"}
          >
            {timelineMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomToolbar;
