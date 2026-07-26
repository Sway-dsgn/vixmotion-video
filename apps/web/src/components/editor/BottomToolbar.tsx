import React, { useState, useCallback } from "react";
import {
  Sparkles,
  Layers,
  Scissors,
  Trash2,
  Copy,
  AlignLeft,
  PanelBottom,
  Link2,
  Snowflake,
  Bookmark,
  BarChart2,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
  Plus,
} from "@/icons/lucide-compat";
import { useUIStore } from "../../stores/ui-store";
import { useTimelineStore } from "../../stores/timeline-store";
import { useProjectStore } from "../../stores/project-store";
import { useRouter } from "../../hooks/use-router";
import { toast } from "../../stores/notification-store";

export const BottomToolbar: React.FC = () => {
  const {
    timelineMaximized,
    toggleTimelineMaximized,
    togglePanel,
    panels,
    getSelectedClipIds,
  } = useUIStore();
  const { playheadPosition } = useTimelineStore();
  const { createMotionComposition, splitClip, removeClip, duplicateClip } = useProjectStore();
  const { navigate } = useRouter();

  const [isLocked, setIsLocked] = useState(false);
  const [isCreatingMotion, setIsCreatingMotion] = useState(false);
  const [showSceneMenu, setShowSceneMenu] = useState(false);

  const handleCreateMotion = useCallback(async () => {
    if (isCreatingMotion) return;
    setIsCreatingMotion(true);
    try {
      const composition = await createMotionComposition("Motion Scene");
      if (composition) navigate("motion", { compositionId: composition.id });
    } finally {
      setIsCreatingMotion(false);
    }
  }, [createMotionComposition, navigate, isCreatingMotion]);

  const handleEditAction = useCallback(async (action: string) => {
    const clipIds = getSelectedClipIds();
    if (clipIds.length === 0) {
      toast.info("No clip selected", "Select a clip on the timeline first");
      return;
    }
    const clipId = clipIds[0];
    switch (action) {
      case "split":
        await splitClip(clipId, playheadPosition);
        toast.success("Clip split", "Split at playhead position");
        break;
      case "delete":
        await removeClip(clipId);
        toast.success("Clip deleted", "Removed from timeline");
        break;
      case "duplicate":
        await duplicateClip(clipId);
        toast.success("Clip duplicated", "Copy added to timeline");
        break;
      default:
        toast.info(action, "Feature coming soon");
    }
  }, [getSelectedClipIds, splitClip, removeClip, duplicateClip, playheadPosition]);

  return (
    <div className="bg-[#0a0a0a] flex flex-col select-none shrink-0">

      {/* ===== ROW 1: Main Toolbar ===== */}
      <div
        className="flex items-center gap-2 px-4 border-b border-white/10 shrink-0"
        style={{ height: "44px" }}
      >
        {/* Motion */}
        <ToolBtn
          icon={<Sparkles size={16} />}
          label="Motion (M)"
          accent
          onClick={handleCreateMotion}
          disabled={isCreatingMotion}
        />
        <Divider />

        {/* Scene selector */}
        <div className="relative">
          <button
            onClick={() => setShowSceneMenu(!showSceneMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors text-[13px] font-medium"
          >
            <Layers size={14} />
            Main scene
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/40">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showSceneMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSceneMenu(false)} />
              <div className="absolute bottom-full mb-2 left-0 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl py-1 z-50 min-w-[180px]">
                <button onClick={() => setShowSceneMenu(false)} className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5 flex items-center gap-2">
                  <Layers size={14} className="text-accent" /> Main scene
                </button>
                <div className="border-t border-white/10 my-1" />
                <button onClick={() => { togglePanel("audioMixer"); setShowSceneMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-white/50 hover:bg-white/5 flex items-center gap-2">
                  <Plus size={14} /> New scene...
                </button>
              </div>
            </>
          )}
        </div>

        {/* Layers */}
        <ToolBtn
          icon={<Layers size={16} />}
          label="Layers"
          active={panels.audioMixer?.visible}
          onClick={() => togglePanel("audioMixer")}
        />
        <Divider />

        {/* Editing tools */}
        <ToolBtn icon={<Scissors size={16} />} label="Split (S)" onClick={() => handleEditAction("split")} />
        <ToolBtn icon={<Trash2 size={16} />} label="Delete (Del)" onClick={() => handleEditAction("delete")} />
        <ToolBtn icon={<Copy size={16} />} label="Duplicate (Ctrl+D)" onClick={() => handleEditAction("duplicate")} />
        <ToolBtn icon={<AlignLeft size={16} />} label="Align" onClick={() => handleEditAction("align")} />
        <ToolBtn icon={<PanelBottom size={16} />} label="Dock" onClick={() => handleEditAction("dock")} />
        <ToolBtn icon={<Link2 size={16} />} label="Link" onClick={() => handleEditAction("link")} />
        <ToolBtn icon={<Snowflake size={16} />} label="Freeze" onClick={() => handleEditAction("freeze")} />
        <ToolBtn icon={<Bookmark size={16} />} label="Bookmark" onClick={() => handleEditAction("bookmark")} />
        <ToolBtn icon={<BarChart2 size={16} />} label="Graph" onClick={() => handleEditAction("graph")} />
        <Divider />

        {/* Lock + Resize */}
        <ToolBtn
          icon={isLocked ? <Lock size={16} /> : <Unlock size={16} />}
          label={isLocked ? "Unlock" : "Lock"}
          active={isLocked}
          onClick={() => setIsLocked(!isLocked)}
        />
        <ToolBtn
          icon={timelineMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          label={timelineMaximized ? "Restore" : "Maximize"}
          onClick={toggleTimelineMaximized}
        />
      </div>
    </div>
  );
};

// Reusable tool button
function ToolBtn({
  icon,
  label,
  active,
  accent,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  accent?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-lg transition-colors relative group ${
        accent
          ? "text-accent hover:bg-accent/10"
          : active
            ? "bg-accent text-white"
            : "text-white/50 hover:text-white hover:bg-white/10"
      } ${disabled ? "opacity-40 pointer-events-none" : ""}`}
      title={label}
    >
      {icon}
      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] bg-[#1a1a1a] border border-white/10 px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-white/70">
        {label}
      </span>
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-white/10 mx-0.5 shrink-0" />;
}

export default BottomToolbar;
