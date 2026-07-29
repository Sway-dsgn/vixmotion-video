import React, { useState, useCallback } from "react";
import {
  Sparkles,
  Layers,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
  Plus,
} from "@/icons/lucide-compat";
import { useUIStore } from "../../stores/ui-store";
import { useProjectStore } from "../../stores/project-store";
import { useRouter } from "../../hooks/use-router";

export const BottomToolbar: React.FC = () => {
  const {
    timelineMaximized,
    toggleTimelineMaximized,
    togglePanel,
    panels,
  } = useUIStore();
  const beginnerMode = useUIStore((s) => s.beginnerMode);
  const { createMotionComposition } = useProjectStore();
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
                  <Plus size={14} /> Audio Mixer
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

        {/* Volume slider (beginner mode) */}
        {beginnerMode && (
          <div className="flex items-center gap-2 text-white/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
            <input type="range" min={0} max={100} defaultValue={100} className="w-20 accent-accent" />
          </div>
        )}

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
