import React, { useState, useRef, useCallback, useEffect } from "react";
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
  Unlock,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "@/icons/lucide-compat";
import { ToolcraftButton as Button } from "@vixmotion/ui";
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

  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [showSceneMenu, setShowSceneMenu] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isCreatingMotion, setIsCreatingMotion] = useState(false);
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
      const newZoom = zoomMin + ratio * (zoomMax - zoomMin);
      setZoom(Math.round(newZoom));
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
      if (composition) {
        navigate("motion", { compositionId: composition.id });
      }
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
      case "cut":
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

  const editTools = [
    { icon: Scissors, label: "Cut / Split", shortcut: "S", action: "cut" },
    { icon: Trash2, label: "Delete", shortcut: "Del", action: "delete" },
    { icon: Copy, label: "Duplicate", shortcut: "Ctrl+D", action: "duplicate" },
    { icon: AlignLeft, label: "Align", shortcut: "A", action: "align" },
    { icon: PanelBottom, label: "Dock", shortcut: "D", action: "dock" },
    { icon: Link2, label: "Link", shortcut: "L", action: "link" },
    { icon: Snowflake, label: "Freeze", shortcut: "F", action: "freeze" },
    { icon: Bookmark, label: "Bookmark", shortcut: "B", action: "bookmark" },
    { icon: BarChart2, label: "Graph", shortcut: "G", action: "graph" },
  ];

  const zoomPresets = [25, 50, 100, 150, 200, 300, 400];

  return (
    <div className="h-12 bg-[#0a0a0a] flex items-center px-4 gap-3 select-none border-t border-border">
      {/* Motion Mode Button */}
      <button
        onClick={handleCreateMotion}
        disabled={isCreatingMotion}
        className="p-1.5 rounded-lg text-accent hover:bg-accent/10 transition-colors relative group shrink-0"
        aria-label="Motion mode (M)"
      >
        <Sparkles size={18} />
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] bg-bg-1 border border-border px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          Motion (M)
        </span>
      </button>

      <div className="w-px h-5 bg-white/10 shrink-0" />

      {/* Scene Selector */}
      <div className="flex items-center gap-1 shrink-0 relative">
        <Button
          label="Main scene"
          variant="secondary"
          size="sm"
          icon={<Layers size={14} />}
          className="px-3 py-1.5 bg-bg-2 border-border text-text-primary hover:bg-white/5"
          onClick={() => setShowSceneMenu(!showSceneMenu)}
        />
        <button
          onClick={() => setShowSceneMenu(!showSceneMenu)}
          className="text-text-muted hover:text-white transition-colors p-0.5"
        >
          {showSceneMenu ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {showSceneMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowSceneMenu(false)} />
            <div className="absolute bottom-full mb-2 left-0 bg-bg-1 border border-border rounded-lg shadow-lg py-1 z-50 min-w-[180px]">
              <button
                onClick={() => setShowSceneMenu(false)}
                className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-white/5 flex items-center gap-2"
              >
                <Layers size={14} className="text-accent" />
                Main scene
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => { togglePanel("audioMixer"); setShowSceneMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm text-text-muted hover:bg-white/5 flex items-center gap-2"
              >
                <Layers size={14} />
                New scene...
              </button>
            </div>
          </>
        )}

        <button
          onClick={() => togglePanel("audioMixer")}
          className={`p-1.5 rounded-lg transition-colors ${
            panels.audioMixer?.visible
              ? "bg-accent text-white"
              : "text-text-muted hover:text-white hover:bg-white/10"
          }`}
          aria-label="Toggle layers panel"
        >
          <Layers size={16} />
        </button>
      </div>

      <div className="w-px h-5 bg-white/10 shrink-0" />

      {/* Editing Tools */}
      <div className="flex items-center gap-0.5 shrink-0">
        {editTools.map((tool) => (
          <button
            key={tool.label}
            onClick={() => handleEditAction(tool.action)}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition-colors relative group"
            aria-label={`${tool.label} (${tool.shortcut})`}
          >
            <tool.icon size={16} />
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] bg-bg-1 border border-border px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {tool.label} ({tool.shortcut})
            </span>
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Lock + Maximize */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setIsLocked(!isLocked)}
          className={`p-1.5 rounded-lg transition-colors ${
            isLocked
              ? "bg-accent text-white"
              : "text-text-muted hover:text-white hover:bg-white/10"
          }`}
          aria-label={isLocked ? "Unlock timeline" : "Lock timeline"}
        >
          {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
        </button>
        <button
          onClick={toggleTimelineMaximized}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white"
          aria-label={timelineMaximized ? "Restore timeline" : "Maximize timeline"}
        >
          {timelineMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      <div className="w-px h-5 bg-white/10 shrink-0" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={zoomOut}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white"
          aria-label="Zoom out"
        >
          <ZoomOut size={16} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors text-text-primary min-w-[60px] justify-center"
          >
            <span className="font-mono text-xs tabular-nums">{zoomPercent}%</span>
          </button>
          {showZoomMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowZoomMenu(false)} />
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-bg-1 border border-border rounded-lg shadow-lg py-1 z-50 min-w-[80px]">
                {zoomPresets.map((z) => {
                  const pps = (z / 100) * ZOOM_PRESETS.DEFAULT;
                  return (
                    <button
                      key={z}
                      onClick={() => { setZoom(pps); setShowZoomMenu(false); }}
                      className={`w-full px-3 py-1.5 text-left text-[11px] font-mono hover:bg-white/5 transition-colors ${
                        Math.abs(pixelsPerSecond - pps) < 1 ? "text-accent" : "text-text-primary"
                      }`}
                    >
                      {z}%
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Zoom slider */}
        <div
          ref={sliderRef}
          onMouseDown={handleSliderDown}
          className="w-24 h-1.5 bg-bg-2 rounded-full relative cursor-ew-resize hover:h-2 transition-all"
        >
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 bg-accent rounded-full h-full"
            style={{ width: `${((pixelsPerSecond - zoomMin) / (zoomMax - zoomMin)) * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md border border-black/20 hover:scale-125 transition-transform"
            style={{ left: `calc(${((pixelsPerSecond - zoomMin) / (zoomMax - zoomMin)) * 100}% - 6px)` }}
          />
        </div>

        <button
          onClick={zoomIn}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white"
          aria-label="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
      </div>
    </div>
  );
};

export default BottomToolbar;
