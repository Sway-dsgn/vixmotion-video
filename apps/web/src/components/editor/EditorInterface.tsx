import React, { useEffect, useState, useRef, useCallback } from "react";
import { ToolcraftText as Text } from "@vixmotion/ui";
import { MousePointer2, Move, Type, Shapes, Pen, Square, Circle, Triangle, Hexagon, Layers } from "@/icons/lucide-compat";

import { Preview } from "./Preview";
import { RightPanel } from "./RightPanel";
import { AssetsPanel } from "./AssetsPanel";
import { UploadPanel } from "./UploadPanel";
import { TextPanel } from "./TextPanel";
import { LeftIconRail } from "./LeftIconRail";
import { TopNavbar } from "./TopNavbar";
import { Timeline } from "./Timeline";
import { KeyframeEditorPanel } from "./KeyframeEditorPanel";
import { AudioMixer } from "../audio-mixer";
import { AIPanel } from "./ai-panel/AIPanel";
import { KeyboardShortcutsOverlay } from "./KeyboardShortcutsOverlay";
import { ErrorBoundary, PanelErrorBoundary } from "../ErrorBoundary";
import { SpotlightTour, MoGraphTour } from "./tour";
import { useProjectStore } from "../../stores/project-store";
import { useUIStore } from "../../stores/ui-store";
import { useEngineStore } from "../../stores/engine-store";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useRouter } from "../../hooks/use-router";
import { useSettingsStore } from "../../stores/settings-store";
import { useTimelineStore } from "../../stores/timeline-store";
import { toast } from "../../stores/notification-store";
import {
  initializePlaybackBridge,
  disposePlaybackBridge,
} from "../../bridges/playback-bridge";
import {
  initializeMediaBridge,
  disposeMediaBridge,
} from "../../bridges/media-bridge";
import {
  initializeRenderBridge,
  disposeRenderBridge,
} from "../../bridges/render-bridge";
import {
  initializeEffectsBridge,
  disposeEffectsBridge,
} from "../../bridges/effects-bridge";
import {
  initializeTransitionBridge,
  disposeTransitionBridge,
} from "../../bridges/transition-bridge";



// Timeline area (bottom band) is sized as a vh fraction so the
// top workspace (media | stage | inspector) gets the rest. The grid
// from the mockup is `1fr var(--tl-height)` rows â€” by default
// timeline is 58vh which leaves the top row with ~38â€“42vh of stage.
const DEFAULT_TIMELINE_VH = 35;
const MIN_TIMELINE_VH = 15;
const MAX_TIMELINE_VH = 85;
// Compact mode: timeline takes most of the height, leaving a small preview.
const COMPACT_TIMELINE_VH = 80;

const DEFAULT_MEDIA_W = 320;
const MIN_MEDIA_W = 260;
const MAX_MEDIA_W = 400;

const DEFAULT_INSPECTOR_W = 320;
const MIN_INSPECTOR_W = 260;
const MAX_INSPECTOR_W = 400;

const MIN_STAGE_W = 380;

type ResizeTarget = "timeline" | "media" | "inspector";

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Auto-save initialization hook
 */
const useAutoSave = () => {
  const { initializeAutoSave } = useProjectStore();

  useEffect(() => {
    initializeAutoSave().catch(console.error);
  }, [initializeAutoSave]);
};

/**
 * Engine and bridge initialization hook
 * Ensures all engines and bridges are fully initialized before rendering editor
 */
const useEngineInitialization = () => {
  const { initialize, initialized, initializing, initError } = useEngineStore();
  const [bridgesReady, setBridgesReady] = useState(false);
  const [initStatus, setInitStatus] = useState("Starting...");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initAll = async () => {
      try {
        const currentState = useEngineStore.getState();
        if (!currentState.initialized && !currentState.initializing) {
          setInitStatus("Initializing video engine...");
          await initialize();
        } else if (currentState.initializing) {
          await new Promise<void>((resolve) => {
            const unsubscribe = useEngineStore.subscribe((state) => {
              if (state.initialized || state.initError) {
                unsubscribe();
                resolve();
              }
            });
          });
        }

        if (!isMounted) return;

        const engineState = useEngineStore.getState();
        if (!engineState.initialized) {
          throw new Error(
            engineState.initError || "Engine initialization failed",
          );
        }

        setInitStatus("Initializing media bridge...");
        await initializeMediaBridge();
        if (!isMounted) return;

        setInitStatus("Initializing playback bridge...");
        await initializePlaybackBridge();
        if (!isMounted) return;

        setInitStatus("Initializing render bridge...");
        await initializeRenderBridge();
        if (!isMounted) return;

        setInitStatus("Initializing effects bridge...");
        const projectState = useProjectStore.getState();
        const { width, height } = projectState.project.settings;
        try {
          await initializeEffectsBridge(width, height);
        } catch (effectsError) {
          console.error(
            "[EditorInterface] EffectsBridge initialization failed:",
            effectsError,
          );
        }
        if (!isMounted) return;

        setInitStatus("Initializing transition bridge...");
        try {
          initializeTransitionBridge(width, height);
        } catch (transitionError) {
          console.error(
            "[EditorInterface] TransitionBridge initialization failed:",
            transitionError,
          );
        }
        if (!isMounted) return;

        setBridgesReady(true);
      } catch (error) {
        console.error("Failed to initialize engines/bridges:", error);
        if (isMounted) {
          setLocalError(
            error instanceof Error ? error.message : "Unknown error",
          );
          setInitStatus(
            `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    };

    initAll();

    return () => {
      isMounted = false;
      disposePlaybackBridge();
      disposeMediaBridge();
      disposeRenderBridge();
      disposeEffectsBridge();
      disposeTransitionBridge();
    };
  }, [initialize, initialized, initializing]);

  return {
    initialized: initialized && bridgesReady,
    initializing: initializing || (!bridgesReady && initialized),
    initError: initError || localError,
    initStatus,
  };
};

/**
 * Main Editor Interface â€” v2 cinematic layout.
 *
 * Grid (per mockup):
 *
 *   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ topbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 *   â”‚                                      â”‚
 *   â”‚  media â”‚   stage   â”‚   inspector     â”‚  â† top row (auto-fit)
 *   â”‚   460  â”‚   1fr     â”‚      360        â”‚
 *   â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
 *   â”‚             timeline                 â”‚  â† `tl-height` (vh)
 *   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *
 * Column widths and timeline height are user-resizable via the
 * dividers between panels. Values are persisted to CSS custom
 * properties on the root grid so panels can pick them up.
 */
export const EditorInterface: React.FC = () => {
  const { initialized, initializing, initError, initStatus } =
    useEngineInitialization();

  const { showShortcutsOverlay, setShowShortcutsOverlay } =
    useKeyboardShortcuts();
  useAutoSave();

  const [activeTab, setActiveTab] = useState<string | null>("assets");
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);

  // Fullscreen canvas mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Floating toolbar drag
  const [toolbarPos, setToolbarPos] = useState({ x: 80, y: 60 });
  const [isLocked, setIsLocked] = useState(false);
  const [isCreatingMotion, setIsCreatingMotion] = useState(false);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  const posRef = useRef(toolbarPos);
  posRef.current = toolbarPos;

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const ds = dragState.current;
      if (!ds.dragging) return;
      setToolbarPos({
        x: ds.startPosX + (e.clientX - ds.startX),
        y: ds.startPosY + (e.clientY - ds.startY),
      });
    };
    const onUp = () => {
      dragState.current.dragging = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const onToolbarMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const p = posRef.current;
    dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY, startPosX: p.x, startPosY: p.y };
  }, []);
  const { navigate } = useRouter();

  const {
    keyframeEditorOpen,
    setKeyframeEditorOpen,
    getSelectedClipIds,
    panels,
    setPanelVisible,
    timelineMaximized,
    toggleTimelineMaximized,
  } = useUIStore();
  const { project, updateClipKeyframes, createMotionComposition } = useProjectStore();
  const tracks = project.timeline.tracks;

  const [selectedKeyframeIds, setSelectedKeyframeIds] = React.useState<string[]>([]);
  const [copiedKeyframes, setCopiedKeyframes] = React.useState<
    import("@vixmotion/core").Keyframe[]
  >([]);

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

  const selectedClip = React.useMemo(() => {
    const selectedIds = getSelectedClipIds();
    if (selectedIds.length === 0) return null;
    const clipId = selectedIds[0];
    for (const track of tracks) {
      const clip = track.clips.find((c) => c.id === clipId);
      if (clip) return clip;
    }
    return null;
  }, [getSelectedClipIds, tracks]);

  const handleUpdateKeyframe = React.useCallback(
    (
      keyframeId: string,
      updates: Partial<import("@vixmotion/core").Keyframe>,
    ) => {
      if (!selectedClip?.keyframes) return;
      const keyframes = selectedClip.keyframes.map((kf) =>
        kf.id === keyframeId ? { ...kf, ...updates } : kf,
      );
      updateClipKeyframes(selectedClip.id, keyframes);
    },
    [selectedClip, updateClipKeyframes],
  );

  const handleDeleteKeyframe = React.useCallback(
    (keyframeId: string) => {
      if (!selectedClip?.keyframes) return;
      const keyframes = selectedClip.keyframes.filter(
        (kf) => kf.id !== keyframeId,
      );
      updateClipKeyframes(selectedClip.id, keyframes);
      setSelectedKeyframeIds((prev) => prev.filter((id) => id !== keyframeId));
    },
    [selectedClip, updateClipKeyframes],
  );

  const handleCopyKeyframes = React.useCallback(
    (keyframeIds: string[]) => {
      if (!selectedClip?.keyframes) return;
      const toCopy = selectedClip.keyframes.filter((kf) =>
        keyframeIds.includes(kf.id),
      );
      setCopiedKeyframes(toCopy);
    },
    [selectedClip],
  );

  const handlePasteKeyframes = React.useCallback(
    (clipId: string, time: number) => {
      const targetClip = tracks
        .flatMap((t) => t.clips)
        .find((c) => c.id === clipId);
      if (!targetClip) return;
      const newKeyframes = copiedKeyframes.map((kf) => ({
        ...kf,
        id: `kf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        time: kf.time + time,
      }));
      updateClipKeyframes(clipId, [
        ...(targetClip.keyframes || []),
        ...newKeyframes,
      ]);
    },
    [copiedKeyframes, tracks, updateClipKeyframes],
  );

  const handleSelectKeyframe = React.useCallback(
    (keyframeId: string, addToSelection: boolean) => {
      if (addToSelection) {
        setSelectedKeyframeIds((prev) =>
          prev.includes(keyframeId)
            ? prev.filter((id) => id !== keyframeId)
            : [...prev, keyframeId],
        );
      } else {
        setSelectedKeyframeIds([keyframeId]);
      }
    },
    [],
  );

  // â”€â”€ Layout state (resizable columns and timeline band) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const rootRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<ResizeTarget | null>(null);
  const [mediaWidth, setMediaWidth] = useState(DEFAULT_MEDIA_W);
  const [inspectorWidth, setInspectorWidth] = useState(DEFAULT_INSPECTOR_W);
  const [timelineVh, setTimelineVh] = useState(DEFAULT_TIMELINE_VH);

  const mediaRef = useRef(mediaWidth);
  const inspectorRef = useRef(inspectorWidth);
  useEffect(() => {
    mediaRef.current = mediaWidth;
  }, [mediaWidth]);
  useEffect(() => {
    inspectorRef.current = inspectorWidth;
  }, [inspectorWidth]);

  const beginResize = useCallback(
    (target: ResizeTarget) => (e: React.MouseEvent) => {
      e.preventDefault();
      resizeRef.current = target;
      document.body.style.cursor =
        target === "timeline" ? "row-resize" : "col-resize";
      document.body.style.userSelect = "none";
    },
    [],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const root = rootRef.current;
      const target = resizeRef.current;
      if (!root || !target) return;
      const rect = root.getBoundingClientRect();

      if (target === "media") {
        const maxByStage =
          rect.width - inspectorRef.current - MIN_STAGE_W;
        setMediaWidth(
          clamp(e.clientX - rect.left, MIN_MEDIA_W, Math.min(MAX_MEDIA_W, maxByStage)),
        );
        return;
      }
      if (target === "inspector") {
        const maxByStage =
          rect.width - mediaRef.current - MIN_STAGE_W;
        setInspectorWidth(
          clamp(
            rect.right - e.clientX,
            MIN_INSPECTOR_W,
            Math.min(MAX_INSPECTOR_W, maxByStage),
          ),
        );
        return;
      }
      // timeline: vh based on the distance from bottom of the viewport
      const vh = ((window.innerHeight - e.clientY) / window.innerHeight) * 100;
      setTimelineVh(clamp(vh, MIN_TIMELINE_VH, MAX_TIMELINE_VH));
    };

    const onUp = () => {
      resizeRef.current = null;
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

  // Esc to exit fullscreen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Reflect resized panel sizes back into CSS variables so child styles
  // (timeline header padding, etc.) can react.
  useEffect(() => {
    const r = rootRef.current;
    if (!r) return;
    const tlVh = timelineMaximized ? COMPACT_TIMELINE_VH : timelineVh;
    r.style.setProperty("--media-w", `${mediaWidth}px`);
    r.style.setProperty("--inspector-w", `${inspectorWidth}px`);
    r.style.setProperty("--tl-height", `${tlVh}vh`);
  }, [mediaWidth, inspectorWidth, timelineVh, timelineMaximized]);

  if (initializing || !initialized) {
    return (
      <div className="w-full h-full bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <Text type="supporting" color="primary" className="text-fg-2 text-sm">Initializing editorâ€¦</Text>
          <Text type="supporting" color="secondary" className="text-fg-muted text-xs mt-2">{initStatus}</Text>
          {initError && (
            <Text type="supporting" className="text-status-error text-xs mt-2">{initError}</Text>
          )}
        </div>
      </div>
    );
  }

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Grid template uses inline CSS for the resizable columns. The CSS
  // variables `--media-w`, `--inspector-w`, `--tl-height` are kept in
  // sync via the effect above so other components can use them too.
  const effectiveTimelineVh = timelineMaximized
    ? COMPACT_TIMELINE_VH
    : timelineVh;

  return (
    <div
      ref={rootRef}
      className="w-full h-full bg-[#0d0d0d] text-fg overflow-hidden font-sans select-none relative z-20 flex flex-col"
    >
      {!isFullscreen && <TopNavbar />}

      {/* Toolbar */}
      <div
        className="fixed z-50 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1a1a1a]/95 backdrop-blur-md border border-white/10 shadow-2xl select-none cursor-grab active:cursor-grabbing"
        style={{ left: toolbarPos.x, top: toolbarPos.y }}
        onMouseDown={onToolbarMouseDown}
      >
        {[
          { id: "select", icon: MousePointer2, name: "Select" },
          { id: "edit", icon: Move, name: "Move" },
          { id: "text", icon: Type, name: "Text" },
          { id: "shape", icon: Shapes, name: "Shape" },
          { id: "pen", icon: Pen, name: "Pen" },
        ].map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id);
                if (["text", "shape", "pen"].includes(tool.id)) setActiveTab(tool.id);
              }}
              className={`flex flex-col items-center justify-center rounded-lg transition-all px-1.5 py-1 ${
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
              title={tool.name}
            >
              <Icon size={16} />
              <span className={`text-[7px] mt-0.5 leading-none ${isActive ? "text-white/60" : "text-white/20"}`}>
                {tool.name}
              </span>
            </button>
          );
        })}

        <div className="w-px h-8 bg-white/10 mx-1" />

        <button
          className="px-3 h-7 rounded-lg text-[10px] font-medium text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
          onClick={() => { setActiveTool("text"); setActiveTab("text"); }}
        >
          +Text
        </button>
        <button
          className="px-3 h-7 rounded-lg text-[10px] font-medium text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
          onClick={() => { setActiveTool("shape"); setActiveTab("shape"); }}
        >
          +Shape
        </button>
        <button
          className="px-3 h-7 rounded-lg text-[10px] font-medium text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
          onClick={() => { setActiveTool("pen"); setActiveTab("pen"); }}
        >
          +Pen
        </button>
        <button
          className="px-3 h-7 rounded-lg text-[10px] font-medium text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
          onClick={() => setActiveTab("assets")}
        >
          Media
        </button>
        <div className="w-px h-8 bg-white/10 mx-1" />
        <button
          className="px-2 h-7 rounded-lg text-[10px] font-medium text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen canvas"}
        >
          {isFullscreen ? "Exit FS" : "Fullscreen"}
        </button>
      </div>


      <ErrorBoundary fallback={<p className="text-white/50 text-xs p-4">Something went wrong. Try refreshing.</p>}>
      {isFullscreen ? (
        /* Fullscreen canvas — only preview */
        <div className="flex-1 min-h-0 flex">
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-hidden relative">
              <PanelErrorBoundary name="Stage">
                <Preview />
              </PanelErrorBoundary>
              <DrawingCanvas />
              <ShapeCanvas />
            </div>
          </div>
        </div>
      ) : (
      /* Normal layout */
      <div className="flex-1 min-h-0 flex">
        {/* Left Icon Rail */}
        <LeftIconRail
          activeTab={activeTab ?? ""}
          onTabChange={(tab) => setActiveTab(activeTab === tab ? null : tab)}
        />

        {/* Left Panel - Content switches by tab */}
        {activeTab && (
        <PanelErrorBoundary name="Left Panel">
        <div className="h-full overflow-hidden shrink-0 w-80 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
            <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">{activeTab}</span>
            <button
              className="p-1 rounded text-white/30 hover:text-white/70 transition-colors"
              onClick={() => setActiveTab(null)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
          {activeTab === "assets" && <AssetsPanel />}
          {activeTab === "upload" && <UploadPanel />}
          {activeTab === "text" && <TextPanel />}
          {activeTab === "shape" && <ShapePanel />}
          {activeTab === "pen" && <PenPanel />}
          {activeTab === "menu" && <MenuPanel />}
          {activeTab === "help" && <HelpPanel />}
          </div>
        </div>
        </PanelErrorBoundary>
        )}

        {/* Center: Preview + Timeline */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Preview */}
          <div className="flex-1 min-h-0 overflow-hidden relative">
            <PanelErrorBoundary name="Stage">
              <Preview />
            </PanelErrorBoundary>
            <DrawingCanvas />
            <ShapeCanvas />
          </div>

          {/* Tool controls strip */}
          <div className="shrink-0 flex items-center gap-3 px-3 py-1 border-t border-white/[0.06] bg-[#0a0a0a]">
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`p-1 rounded transition-colors ${isLocked ? "text-accent" : "text-white/40 hover:text-white/70"}`}
              title={isLocked ? "Unlock" : "Lock"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </button>
            <button
              onClick={toggleTimelineMaximized}
              className="p-1 rounded text-white/40 hover:text-white/70 transition-colors"
              title={timelineMaximized ? "Restore" : "Maximize"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {timelineMaximized
                  ? <><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></>
                  : <><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></>
                }
              </svg>
            </button>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5 text-white/40">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
              <input type="range" min={0} max={100} defaultValue={100} className="w-16 accent-accent h-1" />
            </div>
            <div className="flex-1" />
            <button
              onClick={handleCreateMotion}
              className="px-2 py-0.5 rounded text-[10px] font-medium text-accent hover:bg-accent/10 transition-colors"
              title="Create a motion composition"
            >
              Motion
            </button>
            <div className="flex items-center gap-1 text-[10px] text-white/30">
              <Layers size={10} />
              Main scene
            </div>
          </div>

          {/* Timeline resize handle */}
          <div
            className="h-1.5 cursor-row-resize group/tl flex items-center justify-center hover:bg-accent/10 transition-colors shrink-0"
            onMouseDown={beginResize("timeline")}
          >
            <span className="w-10 h-1 rounded-full bg-white/10 group-hover/tl:bg-accent/40 transition-colors" />
          </div>

          {/* Timeline Area */}
          <div
            className="min-h-0 overflow-hidden flex flex-col"
            style={{ height: `${effectiveTimelineVh}vh` }}
          >
            {panels.audioMixer?.visible && (
              <div className="shrink-0 border-b border-white/[0.06]">
                <PanelErrorBoundary name="Audio Mixer">
                  <AudioMixer
                    visible
                    onClose={() => setPanelVisible("audioMixer", false)}
                  />
                </PanelErrorBoundary>
              </div>
            )}

            {panels.ai?.visible && (
              <div className="shrink-0 border-b border-white/[0.06]">
                <PanelErrorBoundary name="AI">
                  <AIPanel />
                </PanelErrorBoundary>
              </div>
            )}

            <div className="flex-1 min-h-0 flex">
              <div className="flex-1 min-w-0 min-h-0">
                <PanelErrorBoundary name="Timeline">
                  <Timeline />
                </PanelErrorBoundary>
              </div>

              {keyframeEditorOpen && (
                <div className="shrink-0 min-w-0 border-l border-white/[0.06]">
                  <PanelErrorBoundary name="Keyframe Editor">
                    <KeyframeEditorPanel
                      clip={selectedClip}
                      onClose={() => setKeyframeEditorOpen(false)}
                      onUpdateKeyframe={handleUpdateKeyframe}
                      onDeleteKeyframe={handleDeleteKeyframe}
                      onCopyKeyframes={handleCopyKeyframes}
                      onPasteKeyframes={handlePasteKeyframes}
                      selectedKeyframeIds={selectedKeyframeIds}
                      onSelectKeyframe={handleSelectKeyframe}
                      copiedKeyframes={copiedKeyframes}
                    />
                  </PanelErrorBoundary>
                </div>
              )}
            </div>
        </div>
      </div>

        {/* Right Panel - Inspector */}
        {rightPanelOpen && (
        <div className="h-full overflow-hidden shrink-0 flex flex-col">
          <div className="flex items-center justify-end px-2 py-1 border-b border-white/[0.06] shrink-0">
            <button
              className="p-1 rounded text-white/30 hover:text-white/70 transition-colors"
              onClick={() => setRightPanelOpen(false)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <RightPanel />
          </div>
        </div>
        )}
      </div>
      )}
      </ErrorBoundary>

      <KeyboardShortcutsOverlay
        isOpen={showShortcutsOverlay}
        onClose={() => setShowShortcutsOverlay(false)}
      />

      <SpotlightTour />
      <MoGraphTour />
    </div>
  );
};

function MenuPanel() {
  const [view, setView] = useState<"main" | "shortcuts">("main");
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const setDesktopPage = useUIStore((s) => s.setDesktopPage);
  const openSettings = useSettingsStore((s) => s.openSettings);

  if (view === "shortcuts") {
    return (
      <div className="h-full flex flex-col bg-[#111111] border-r border-white/[0.06]" style={{ width: "240px" }}>
        <div className="px-3 py-2.5 border-b border-white/[0.06] shrink-0 flex items-center gap-2">
          <button onClick={() => setView("main")} className="text-white/40 hover:text-white/60 transition-colors">
            ←
          </button>
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Shortcuts</span>
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto text-xs text-white/50">
          <div className="flex justify-between"><span>Play / Pause</span><span className="text-white/30">Space</span></div>
          <div className="flex justify-between"><span>Frame Back</span><span className="text-white/30">←</span></div>
          <div className="flex justify-between"><span>Frame Forward</span><span className="text-white/30">→</span></div>
          <div className="flex justify-between"><span>Undo</span><span className="text-white/30">⌘Z</span></div>
          <div className="flex justify-between"><span>Redo</span><span className="text-white/30">⇧⌘Z</span></div>
          <div className="flex justify-between"><span>Cut</span><span className="text-white/30">⌘X</span></div>
          <div className="flex justify-between"><span>Copy</span><span className="text-white/30">⌘C</span></div>
          <div className="flex justify-between"><span>Paste</span><span className="text-white/30">⌘V</span></div>
          <div className="flex justify-between"><span>Delete</span><span className="text-white/30">⌫</span></div>
          <div className="flex justify-between"><span>Split</span><span className="text-white/30">S</span></div>
          <div className="flex justify-between"><span>Select All</span><span className="text-white/30">⌘A</span></div>
          <div className="flex justify-between"><span>Zoom In</span><span className="text-white/30">=</span></div>
          <div className="flex justify-between"><span>Zoom Out</span><span className="text-white/30">-</span></div>
          <div className="flex justify-between"><span>Fit Timeline</span><span className="text-white/30">⇧Z</span></div>
          <div className="flex justify-between"><span>Add Marker</span><span className="text-white/30">M</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#111111] border-r border-white/[0.06]" style={{ width: "240px" }}>
      <div className="px-3 py-2.5 border-b border-white/[0.06] shrink-0">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Menu</span>
      </div>
      <div className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        <button onClick={() => { const p = useProjectStore.getState().project; toast.success("Project saved", `${p.name} — ${p.timeline.tracks.length} tracks`); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors text-left">
          <span className="w-4 text-center text-xs">💾</span>
          <span className="flex-1">Save</span>
          <span className="text-[10px] text-white/20">⌘S</span>
        </button>
        <button onClick={() => setDesktopPage("deliver")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors text-left">
          <span className="w-4 text-center text-xs">📤</span>
          <span className="flex-1">Export</span>
          <span className="text-[10px] text-white/20">⌘E</span>
        </button>
        <div className="h-px bg-white/[0.06] my-2" />
        <button onClick={() => setActiveTool("text")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors text-left">
          <span className="w-4 text-center text-xs">T</span>
          <span className="flex-1">Add Text</span>
          <span className="text-[10px] text-white/20">T</span>
        </button>
        <button onClick={() => setActiveTool("shape")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors text-left">
          <span className="w-4 text-center text-xs">◻</span>
          <span className="flex-1">Add Shape</span>
        </button>
        <button onClick={() => setActiveTool("pen")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors text-left">
          <span className="w-4 text-center text-xs">✏</span>
          <span className="flex-1">Pen Tool</span>
        </button>
        <div className="h-px bg-white/[0.06] my-2" />
        <button onClick={() => setView("shortcuts")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors text-left">
          <span className="w-4 text-center text-xs">⌨</span>
          <span className="flex-1">Keyboard Shortcuts</span>
          <span className="text-[10px] text-white/20">?</span>
        </button>
        <button onClick={() => toast.info("Help", "Visit the documentation at https://vixmotion.dev/docs")} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors text-left">
          <span className="w-4 text-center text-xs">?</span>
          <span className="flex-1">Help & Documentation</span>
        </button>
        <div className="h-px bg-white/[0.06] my-2" />
        <button onClick={() => openSettings()} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors text-left">
          <span className="w-4 text-center text-xs">⚙</span>
          <span className="flex-1">Settings</span>
        </button>
      </div>
    </div>
  );
}

function HelpPanel() {
  return (
    <div className="h-full flex flex-col bg-[#111111] border-r border-white/[0.06]" style={{ width: "240px" }}>
      <div className="px-3 py-2.5 border-b border-white/[0.06] shrink-0">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Help</span>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto text-sm text-white/50">
        <p className="text-xs text-white/30 leading-relaxed">
          Vixmotion Video — browser-based video editor.
        </p>
        <p className="text-xs text-white/30 leading-relaxed">
          Use the toolbar to select tools, timeline to arrange clips, and inspector to adjust properties.
        </p>
        <div className="h-px bg-white/[0.06] my-2" />
        <p className="text-xs text-white/20">
          Keyboard Shortcuts: Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/40 text-[10px]">?</kbd> or open Menu &gt; Shortcuts
        </p>
      </div>
    </div>
  );
}

function ShapePanel() {
  const shapeType = useUIStore((s) => s.shapeType);
  const shapeFillColor = useUIStore((s) => s.shapeFillColor);
  const shapeStrokeColor = useUIStore((s) => s.shapeStrokeColor);
  const shapeStrokeWidth = useUIStore((s) => s.shapeStrokeWidth);
  const setShapeType = useUIStore((s) => s.setShapeType);
  const setShapeFillColor = useUIStore((s) => s.setShapeFillColor);
  const setShapeStrokeColor = useUIStore((s) => s.setShapeStrokeColor);
  const setShapeStrokeWidth = useUIStore((s) => s.setShapeStrokeWidth);
  const { select } = useUIStore();
  const { createShapeClip, addTrack } = useProjectStore();
  const playheadPosition = useTimelineStore((s) => s.playheadPosition);
  const [isAdding, setIsAdding] = useState(false);

  const addShapeToCanvas = async () => {
    if (isAdding) return;
    setIsAdding(true);
    try {
      const state = useProjectStore.getState();
      const tracksBefore = state.project.timeline.tracks;
      await addTrack("graphics");
      const tracksAfter = useProjectStore.getState().project.timeline.tracks;
      const newTrack = tracksAfter.find(
        (t) => t.type === "graphics" && !tracksBefore.some((bt) => bt.id === t.id),
      );
      if (!newTrack) {
        toast.error("Failed", "Could not create a graphics track");
        return;
      }
      const shapeMap: Record<string, string> = { square: "rectangle", circle: "circle", triangle: "triangle", hexagon: "polygon" };
      const created = createShapeClip(
        newTrack.id,
        Math.max(0, playheadPosition),
        (shapeMap[shapeType] || shapeType) as any,
        5,
        { fillColor: shapeFillColor === "transparent" ? undefined : shapeFillColor, strokeColor: shapeStrokeColor, strokeWidth: shapeStrokeWidth } as any,
      );
      if (created) {
        select({ type: "shape-clip", id: created.id, trackId: newTrack.id });
        toast.success("Shape added", `${shapeType} clip created on the timeline`);
      } else {
        toast.error("Failed", "Graphics engine not ready yet");
      }
    } finally {
      setIsAdding(false);
    }
  };
  return (
    <div className="h-full flex flex-col bg-[#111111] border-r border-white/[0.06]" style={{ width: "240px" }}>
      <div className="px-3 py-2.5 border-b border-white/[0.06] shrink-0">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Shapes</span>
      </div>
      <div className="p-3 space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Square, label: "Square", type: "square" as const },
            { icon: Circle, label: "Circle", type: "circle" as const },
            { icon: Triangle, label: "Triangle", type: "triangle" as const },
            { icon: Hexagon, label: "Hexagon", type: "hexagon" as const },
          ].map((s) => {
            const S = s.icon;
            const isActive = shapeType === s.type;
            return (
              <button key={s.label} onClick={() => setShapeType(s.type)} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive ? "bg-accent/20 ring-1 ring-accent" : "bg-white/5 hover:bg-white/10"}`}>
                <S size={20} className={isActive ? "text-accent" : "text-white/60"} />
                <span className="text-[8px] text-white/30">{s.label}</span>
              </button>
            );
          })}
        </div>
        <div>
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider block mb-1.5">Fill Color</span>
          <div className="flex gap-1 flex-wrap">
            {["#ffffff","#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff","#ff8800","transparent"].map((c) => (
              <button key={c} onClick={() => setShapeFillColor(c)} className={`w-6 h-6 rounded-full ${shapeFillColor === c ? "ring-2 ring-white ring-offset-1 ring-offset-[#111]" : ""}`} style={{ backgroundColor: c === "transparent" ? "#555" : c, border: c === "transparent" ? "2px dashed #888" : "none" }} />
            ))}
          </div>
        </div>
        <div>
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider block mb-1.5">Outline: {shapeStrokeWidth}px</span>
          <input type="range" min={0} max={10} value={shapeStrokeWidth} onChange={(e) => setShapeStrokeWidth(Number(e.target.value))} className="w-full accent-accent" />
        </div>
        <div>
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider block mb-1.5">Outline Color</span>
          <div className="flex gap-1 flex-wrap">
            {["#ffffff","#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff","#ff8800","#000000"].map((c) => (
              <button key={c} onClick={() => setShapeStrokeColor(c)} className={`w-6 h-6 rounded-full ${shapeStrokeColor === c ? "ring-2 ring-white ring-offset-1 ring-offset-[#111]" : ""}`} style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1" />
      <div className="px-3 pb-3 space-y-1.5">
        <button
          onClick={addShapeToCanvas}
          disabled={isAdding}
          className="w-full py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/80 transition-colors disabled:opacity-50"
        >
          {isAdding ? "Adding..." : "Add to Canvas"}
        </button>
        <button
          className="w-full py-2 rounded-lg bg-white/10 text-white/60 text-xs hover:bg-white/15 transition-colors"
          onClick={() => { clearShapeCanvas(); }}
        >
          Clear Shapes
        </button>
      </div>
    </div>
  );
}

function PenPanel() {
  const brushSize = useUIStore((s) => s.brushSize);
  const brushColor = useUIStore((s) => s.brushColor);
  const brushOpacity = useUIStore((s) => s.brushOpacity);
  const setBrushSize = useUIStore((s) => s.setBrushSize);
  const setBrushColor = useUIStore((s) => s.setBrushColor);
  const setBrushOpacity = useUIStore((s) => s.setBrushOpacity);
  return (
    <div className="h-full flex flex-col bg-[#111111] border-r border-white/[0.06]" style={{ width: "240px" }}>
      <div className="px-3 py-2.5 border-b border-white/[0.06] shrink-0">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Pen / Drawing</span>
      </div>
      <div className="p-3 space-y-3">
        <div>
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider block mb-1.5">Brush Size: {brushSize}px</span>
          <input type="range" min={1} max={30} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full accent-accent" />
        </div>
        <div>
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider block mb-1.5">Color</span>
          <div className="flex gap-1 flex-wrap">
            {["#ffffff","#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff","#ff8800","#000000","#888888"].map((c) => (
              <button key={c} onClick={() => setBrushColor(c)} className={`w-6 h-6 rounded-full ${brushColor === c ? "ring-2 ring-white ring-offset-1 ring-offset-[#111]" : ""}`} style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div>
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider block mb-1.5">Opacity: {brushOpacity}%</span>
          <input type="range" min={0} max={100} value={brushOpacity} onChange={(e) => setBrushOpacity(Number(e.target.value))} className="w-full accent-accent" />
        </div>
      </div>
      <div className="flex-1" />
      <div className="px-3 pb-3 space-y-1.5">
        <div className="w-full py-2 rounded-lg bg-white/5 text-white/40 text-xs text-center">
          Draw on the preview canvas above
        </div>
        <button
          className="w-full py-2 rounded-lg bg-white/10 text-white/60 text-xs hover:bg-white/15 transition-colors"
          onClick={() => { clearDrawingCanvas(); }}
        >
          Clear Drawing
        </button>
        <button
          className="w-full py-2 rounded-lg bg-white/10 text-white/60 text-xs hover:bg-white/15 transition-colors"
          onClick={() => { setBrushSize(4); setBrushColor("#ffffff"); setBrushOpacity(100); }}
        >
          Reset Brush
        </button>
      </div>
    </div>
  );
}

let clearDrawingCanvas: () => void = () => {};

function DrawingCanvas() {
  const activeTool = useUIStore((s) => s.activeTool);
  const visible = activeTool === "pen";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const brushSize = useUIStore((s) => s.brushSize);
  const brushColor = useUIStore((s) => s.brushColor);
  const brushOpacity = useUIStore((s) => s.brushOpacity);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    clearDrawingCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      clearDrawingCanvas = () => {};
    };
  }, []);

  const getPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.PointerEvent) => {
    if (!visible) return;
    isDrawing.current = true;
    lastPoint.current = getPos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing.current || !lastPoint.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = brushOpacity / 100;
    ctx.stroke();

    lastPoint.current = pos;
  };

  const endDraw = (e: React.PointerEvent) => {
    isDrawing.current = false;
    lastPoint.current = null;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
      style={{ pointerEvents: visible ? "auto" : "none" }}
      onPointerDown={startDraw}
      onPointerMove={draw}
      onPointerUp={endDraw}
      onPointerLeave={endDraw}
    />
  );
}

let clearShapeCanvas: () => void = () => {};

interface ShapeData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  fill: string;
  stroke: string;
  lineWidth: number;
  type: string;
}

function ShapeCanvas() {
  const activeTool = useUIStore((s) => s.activeTool);
  const visible = activeTool === "shape";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const currentPoint = useRef<{ x: number; y: number } | null>(null);
  const shapeType = useUIStore((s) => s.shapeType);
  const shapeFillColor = useUIStore((s) => s.shapeFillColor);
  const shapeStrokeColor = useUIStore((s) => s.shapeStrokeColor);
  const shapeStrokeWidth = useUIStore((s) => s.shapeStrokeWidth);
  const committedShapes = useRef<ShapeData[]>([]);
  const previewShape = useRef<ShapeData | null>(null);

  const drawShape = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, fill: string, stroke: string, lineWidth: number, type: string) => {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);
    const cx = left + w / 2;
    const cy = top + h / 2;
    const r = Math.min(w, h) / 2;

    ctx.beginPath();
    switch (type) {
      case "square":
        ctx.rect(left, top, w, h);
        break;
      case "circle":
        ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
        break;
      case "triangle":
        ctx.moveTo(cx, top);
        ctx.lineTo(left, top + h);
        ctx.lineTo(left + w, top + h);
        ctx.closePath();
        break;
      case "hexagon": {
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const px = cx + r * Math.cos(angle);
          const py = cy + r * Math.sin(angle);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      }
    }
    if (fill !== "transparent") {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (lineWidth > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  };

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of committedShapes.current) {
      drawShape(ctx, s.x1, s.y1, s.x2, s.y2, s.fill, s.stroke, s.lineWidth, s.type);
    }
    if (previewShape.current) {
      const p = previewShape.current;
      drawShape(ctx, p.x1, p.y1, p.x2, p.y2, p.fill, p.stroke, p.lineWidth, p.type);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    clearShapeCanvas = () => {
      committedShapes.current = [];
      previewShape.current = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      redrawAll();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      clearShapeCanvas = () => {};
    };
  }, [redrawAll]);

  const getPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.PointerEvent) => {
    if (!visible) return;
    isDrawing.current = true;
    const pos = getPos(e);
    startPoint.current = pos;
    currentPoint.current = pos;
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing.current || !startPoint.current) return;
    currentPoint.current = getPos(e);
    previewShape.current = {
      x1: startPoint.current.x, y1: startPoint.current.y,
      x2: currentPoint.current.x, y2: currentPoint.current.y,
      fill: shapeFillColor, stroke: shapeStrokeColor,
      lineWidth: shapeStrokeWidth, type: shapeType,
    };
    redrawAll();
  };

  const endDraw = (e: React.PointerEvent) => {
    if (!isDrawing.current || !startPoint.current) return;
    const end = getPos(e);
    const data: ShapeData = {
      x1: startPoint.current.x, y1: startPoint.current.y,
      x2: end.x, y2: end.y,
      fill: shapeFillColor, stroke: shapeStrokeColor,
      lineWidth: shapeStrokeWidth, type: shapeType,
    };
    committedShapes.current.push(data);
    previewShape.current = null;
    redrawAll();

    isDrawing.current = false;
    startPoint.current = null;
    currentPoint.current = null;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
      style={{ pointerEvents: visible ? "auto" : "none" }}
      onPointerDown={startDraw}
      onPointerMove={draw}
      onPointerUp={endDraw}
    />
  );
}

export default EditorInterface;
