import React, { useState, useCallback } from "react";
import {
  SlidersHorizontal,
  FolderOpen,
  Headphones,
  Type,
  Sparkles,
  Smile,
  PenTool,
  Subtitles,
  Settings,
  Upload,
} from "@/icons/lucide-compat";
import { ToolcraftText as Text } from "@vixmotion/ui";
import { useUIStore, type SelectionItem } from "../../stores/ui-store";
import { useProjectStore } from "../../stores/project-store";

type ToolId = "import" | "audio" | "text" | "ai" | "stickers" | "draw" | "subtitles" | "adjust" | "settings" | null;

export const LeftPanel: React.FC = () => {
  const selectedItems = useUIStore((state) => state.selectedItems);
  const { togglePanel, panels } = useUIStore();
  const { importMedia } = useProjectStore();
  const [activeTool, setActiveTool] = useState<ToolId>(null);

  const hasSelection = selectedItems.length > 0;

  const handleImport = useCallback(() => {
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
  }, [importMedia]);

  const toolClick = useCallback((id: ToolId) => {
    if (id === "audio") { togglePanel("audioMixer"); return; }
    if (id === "ai") { togglePanel("agentChat"); return; }
    if (id === "stickers") { togglePanel("ai"); return; }
    if (id === "subtitles") { togglePanel("subtitles"); return; }
    if (id === "adjust") { togglePanel("inspector"); return; }
    if (id === "settings") { togglePanel("mediaLibrary"); return; }
    setActiveTool(activeTool === id ? null : id);
  }, [activeTool, togglePanel]);

  const tools: Array<{ id: ToolId; icon: React.FC<{ size: number; className?: string }>; label: string }> = [
    { id: "import", icon: FolderOpen, label: "Import" },
    { id: "audio", icon: Headphones, label: "Audio" },
    { id: "text", icon: Type, label: "Text" },
    { id: "ai", icon: Sparkles, label: "AI" },
    { id: "stickers", icon: Smile, label: "Stickers" },
    { id: "draw", icon: PenTool, label: "Draw" },
    { id: "subtitles", icon: Subtitles, label: "CC" },
    { id: "adjust", icon: SlidersHorizontal, label: "Adjust" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  // When a clip is selected, show properties
  if (hasSelection) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-bg-1 flex items-center gap-2">
          <Text type="label" weight="semibold" color="primary" className="text-text-primary">
            Properties
          </Text>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <InspectorContent selectedItems={selectedItems} />
        </div>
      </div>
    );
  }

  // Empty state with tool icons
  return (
    <div className="h-full flex flex-col bg-[#141414] overflow-hidden">
      {/* Tool icon row */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 shrink-0 flex-wrap">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id || 
            (tool.id === "audio" && panels.audioMixer?.visible) ||
            (tool.id === "ai" && panels.agentChat?.visible) ||
            (tool.id === "stickers" && panels.ai?.visible) ||
            (tool.id === "subtitles" && panels.subtitles?.visible);

          return (
            <button
              key={tool.id}
              onClick={() => toolClick(tool.id)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all text-xs ${
                isActive
                  ? "bg-accent text-white shadow-sm"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
              title={tool.label}
            >
              <tool.icon size={15} />
            </button>
          );
        })}
      </div>

      {/* Content area based on active tool */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTool === "import" && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <FolderOpen size={28} className="text-white/40" />
            </div>
            <Text type="body" weight="semibold" color="primary" className="text-white text-base mb-2">
              Import Media
            </Text>
            <Text type="supporting" color="secondary" className="text-white/40 text-sm text-center mb-4">
              Drag files here or click to browse
            </Text>
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Upload size={14} />
              Browse Files
            </button>
          </div>
        )}

        {activeTool === "text" && (
          <div className="space-y-3">
            <Text type="label" weight="semibold" color="primary" className="text-white">
              Add Text
            </Text>
            <div className="space-y-2">
              {["Title", "Subtitle", "Lower Third", "Caption"].map((preset) => (
                <button
                  key={preset}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-left text-white/80 hover:text-white transition-colors text-sm"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTool === "draw" && (
          <div className="space-y-3">
            <Text type="label" weight="semibold" color="primary" className="text-white">
              Draw & Annotate
            </Text>
            <Text type="supporting" color="secondary" className="text-white/40 text-sm">
              Click on the video preview to start drawing
            </Text>
          </div>
        )}

        {activeTool === "adjust" && (
          <div className="space-y-3">
            <Text type="label" weight="semibold" color="primary" className="text-white">
              Adjustments
            </Text>
            <div className="space-y-3">
              {["Brightness", "Contrast", "Saturation", "Temperature", "Exposure"].map((label) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">{label}</span>
                    <span className="text-white/40">0</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full">
                    <div className="h-full w-1/2 bg-accent rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!activeTool && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div
              className="w-14 h-14 mb-5 rounded-xl border border-border flex items-center justify-center"
              style={{ backgroundColor: "#1e1e1e" }}
            >
              <SlidersHorizontal size={28} className="text-white/30" />
            </div>
            <Text type="body" weight="bold" color="primary" className="text-xl text-white">
              It's empty here
            </Text>
            <Text
              type="supporting"
              color="secondary"
              className="text-white/40 text-center leading-relaxed mt-3"
            >
              Click an element on the timeline to edit its properties
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

const InspectorContent: React.FC<{ selectedItems: SelectionItem[] }> = ({
  selectedItems,
}) => {
  if (selectedItems.length === 0) return null;

  return (
    <div className="space-y-4">
      <Text type="supporting" color="secondary" className="text-xs text-text-muted">
        {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""} selected
      </Text>
      <div className="space-y-3">
        {selectedItems.map((item) => (
          <div key={item.id} className="p-3 rounded-lg border border-border bg-bg-1">
            <Text type="supporting" color="primary" weight="medium">
              Clip: {item.id.slice(0, 12)}...
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeftPanel;
