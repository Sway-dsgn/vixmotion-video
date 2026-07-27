import React, { useEffect, useState, useRef, useCallback } from "react";
import { ToolcraftText as Text } from "@vixmotion/ui";

import { Preview } from "./Preview";
import { SeekBar } from "./SeekBar";
import { RightPanel } from "./RightPanel";
import { LeftPanel } from "./LeftPanel";
import { UploadPanel } from "./UploadPanel";
import { TextPanel } from "./TextPanel";
import { LeftIconRail } from "./LeftIconRail";
import { TopNavbar } from "./TopNavbar";
import { Timeline } from "./Timeline";
import { BottomToolbar } from "./BottomToolbar";
import { KeyframeEditorPanel } from "./KeyframeEditorPanel";
import { AudioMixer } from "../audio-mixer";
import { AIPanel } from "./ai-panel/AIPanel";
import { KeyboardShortcutsOverlay } from "./KeyboardShortcutsOverlay";
import { PanelErrorBoundary } from "../ErrorBoundary";
import { SpotlightTour, MoGraphTour } from "./tour";
import { useProjectStore } from "../../stores/project-store";
import { useUIStore } from "../../stores/ui-store";
import { useEngineStore } from "../../stores/engine-store";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
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
const MIN_TIMELINE_VH = 18;
const MAX_TIMELINE_VH = 70;
// Compact mode: timeline takes most of the height, leaving a small preview.
const COMPACT_TIMELINE_VH = 75;

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

  const [activeTab, setActiveTab] = useState("assets");
  const [activeTool, setActiveTool] = useState("select");

  // Floating toolbar drag
  const [toolbarPos, setToolbarPos] = useState({ x: 80, y: 60 });
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

  const {
    keyframeEditorOpen,
    setKeyframeEditorOpen,
    getSelectedClipIds,
    panels,
    setPanelVisible,
    timelineMaximized,
  } = useUIStore();
  const { project, updateClipKeyframes } = useProjectStore();
  const tracks = project.timeline.tracks;

  const [selectedKeyframeIds, setSelectedKeyframeIds] = React.useState<string[]>([]);
  const [copiedKeyframes, setCopiedKeyframes] = React.useState<
    import("@vixmotion/core").Keyframe[]
  >([]);

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
      <TopNavbar />

      {/* Floating draggable tool tabs bar */}
      <div
        className="fixed z-50 flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl select-none cursor-grab active:cursor-grabbing"
        style={{ left: toolbarPos.x, top: toolbarPos.y }}
        onMouseDown={onToolbarMouseDown}
      >
        {[
          { id: "select", label: "V" },
          { id: "edit", label: "A" },
          { id: "text", label: "T" },
          { id: "shape", label: "R" },
          { id: "pen", label: "P" },
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-mono font-semibold transition-colors ${
              activeTool === tool.id
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/40 hover:text-white/70 hover:bg-white/5"
            }`}
            title={tool.id}
          >
            {tool.label}
          </button>
        ))}

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button className="px-2.5 h-7 rounded-lg text-[10px] text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors font-medium" onClick={() => {}}>
          Add Track
        </button>
        <button className="px-2.5 h-7 rounded-lg text-[10px] text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors font-medium" onClick={() => {}}>
          Effects
        </button>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-h-0 flex">
        {/* Left Icon Rail */}
        <LeftIconRail activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Left Panel - Content switches by tab */}
        <div className="h-full overflow-hidden shrink-0">
          {activeTab === "assets" && <LeftPanel />}
          {activeTab === "upload" && <UploadPanel />}
          {activeTab === "text" && <TextPanel />}
        </div>

        {/* Center: Preview + Timeline */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Preview */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <PanelErrorBoundary name="Stage">
              <Preview />
            </PanelErrorBoundary>
          </div>

          {/* Seek bar */}
          <SeekBar />

          {/* Bottom toolbar above timeline */}
          <div className="shrink-0">
            <BottomToolbar />
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
        <div className="h-full overflow-hidden shrink-0">
          <RightPanel />
        </div>
      </div>

      <KeyboardShortcutsOverlay
        isOpen={showShortcutsOverlay}
        onClose={() => setShowShortcutsOverlay(false)}
      />

      <SpotlightTour />
      <MoGraphTour />
    </div>
  );
};

export default EditorInterface;
