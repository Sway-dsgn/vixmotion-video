import React, { useState, useRef, useCallback, useEffect } from "react";
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
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  CornerDownLeft,
  CornerDownRight,
  Plus,
  Magnet,
  Grid3x3,
  SplitSquareHorizontal,
  Monitor,
} from "@/icons/lucide-compat";
import { useUIStore } from "../../stores/ui-store";
import { useTimelineStore, ZOOM_PRESETS } from "../../stores/timeline-store";
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
  const {
    pixelsPerSecond,
    zoomIn,
    zoomOut,
    setZoom,
    playheadPosition,
  } = useTimelineStore();
  const { createMotionComposition, splitClip, removeClip, duplicateClip } = useProjectStore();
  const { navigate } = useRouter();

  const [isLocked, setIsLocked] = useState(false);
  const [isCreatingMotion, setIsCreatingMotion] = useState(false);
  const [showSceneMenu, setShowSceneMenu] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingSlider = useRef(false);

  const zoomPercent = Math.round((pixelsPerSecond / ZOOM_PRESETS.DEFAULT) * 100);
  const zoomMin = ZOOM_PRESETS.MIN;
  const zoomMax = ZOOM_PRESETS.MAX;

  const handleSliderDrag = useCallback(
    (e: MouseEvent) => {
      if (!sliderRef.current || !isDraggingSlider.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setZoom(Math.round(zoomMin + ratio * (zoomMax - zoomMin)));
    },
    [setZoom, zoomMin, zoomMax],
  );

  const handleSliderUp = useCallback(() => {
    isDraggingSlider.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", handleSliderDrag);
    window.removeEventListener("mouseup", handleSliderUp);
  }, [handleSliderDrag]);

  const handleSliderDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingSlider.current = true;
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
      handleSliderDrag(e as unknown as MouseEvent);
      window.addEventListener("mousemove", handleSliderDrag);
      window.addEventListener("mouseup", handleSliderUp);
    },
    [handleSliderDrag, handleSliderUp],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleSliderDrag);
      window.removeEventListener("mouseup", handleSliderUp);
    };
  }, [handleSliderDrag, handleSliderUp]);

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

  const zoomPresets = [25, 50, 100, 150, 200, 300, 400];

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

      {/* ===== ROW 2: Undo/Redo + Track Controls + Zoom ===== */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{ height: "44px" }}
      >
        {/* Left side: undo/redo + track tools */}
        <div className="flex items-center gap-1">
          <ToolBtn icon={<Undo2 size={16} />} label="Undo" onClick={() => {}} />
          <ToolBtn icon={<Redo2 size={16} />} label="Redo" onClick={() => {}} />
          <Divider />
          <ToolBtn icon={<Scissors size={16} />} label="Trim start" onClick={() => handleEditAction("trimStart")} />
          <ToolBtn icon={<CornerDownLeft size={16} />} label="Trim to playhead" onClick={() => handleEditAction("trimStart")} />
          <ToolBtn icon={<CornerDownRight size={16} />} label="Trim end" onClick={() => handleEditAction("trimEnd")} />
          <ToolBtn icon={<Trash2 size={16} />} label="Ripple delete" onClick={() => handleEditAction("delete")} />
          <Divider />
          <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors text-[12px]">
            <Plus size={14} />
            Add track
          </button>
          <ToolBtn icon={<Layers size={16} />} label="Track layers" onClick={() => togglePanel("audioMixer")} />
        </div>

        {/* Right side: zoom + view controls */}
        <div className="flex items-center gap-1">
          <ToolBtn icon={<ZoomOut size={16} />} label="Zoom out" onClick={zoomOut} />
          <div className="relative">
            <button
              onClick={() => setShowZoomMenu(!showZoomMenu)}
              className="flex items-center px-2 py-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-[11px] font-mono tabular-nums min-w-[50px] justify-center"
            >
              {zoomPercent}%
            </button>
            {showZoomMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowZoomMenu(false)} />
                <div className="absolute bottom-full mb-2 right-0 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl py-1 z-50 min-w-[80px]">
                  {zoomPresets.map((z) => (
                    <button
                      key={z}
                      onClick={() => { setZoom((z / 100) * ZOOM_PRESETS.DEFAULT); setShowZoomMenu(false); }}
                      className={`w-full px-3 py-1.5 text-left text-[11px] font-mono hover:bg-white/5 transition-colors ${
                        Math.abs(pixelsPerSecond - (z / 100) * ZOOM_PRESETS.DEFAULT) < 1 ? "text-accent" : "text-white/60"
                      }`}
                    >
                      {z}%
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div
            ref={sliderRef}
            onMouseDown={handleSliderDown}
            className="w-20 h-1.5 bg-white/10 rounded-full relative cursor-ew-resize hover:h-2 transition-all mx-1"
          >
            <div
              className="absolute top-1/2 -translate-y-1/2 left-0 bg-accent rounded-full h-full"
              style={{ width: `${((pixelsPerSecond - zoomMin) / (zoomMax - zoomMin)) * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md border border-black/20"
              style={{ left: `calc(${((pixelsPerSecond - zoomMin) / (zoomMax - zoomMin)) * 100}% - 6px)` }}
            />
          </div>
          <ToolBtn icon={<ZoomIn size={16} />} label="Zoom in" onClick={zoomIn} />
          <Divider />
          <ToolBtn icon={<Magnet size={16} />} label="Snap" onClick={() => {}} />
          <ToolBtn icon={<Grid3x3 size={16} />} label="Grid" onClick={() => {}} />
          <ToolBtn icon={<SplitSquareHorizontal size={16} />} label="Split view" onClick={() => {}} />
          <ToolBtn icon={<Monitor size={16} />} label="Fullscreen" onClick={() => {}} />
        </div>
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
