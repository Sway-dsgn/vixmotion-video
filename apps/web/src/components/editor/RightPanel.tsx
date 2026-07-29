import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Info,
  Pin,
  Plus,
  Lock,
  List,
} from "@/icons/lucide-compat";
import { toast } from "../../stores/notification-store";

export const RightPanel: React.FC = () => {
  const [transformExpanded, setTransformExpanded] = useState(true);
  const [effectsExpanded, setEffectsExpanded] = useState(true);
  const [selectedSpeed, setSelectedSpeed] = useState("1x");
  const [audioExpanded, setAudioExpanded] = useState(true);
  const [hue, setHue] = useState(180);
  const [blur, setBlur] = useState(14);
  const [exposure, setExposure] = useState(14);
  const [blackLevels, setBlackLevels] = useState(14);
  const [volume, setVolume] = useState(50);
  const [exposureOpen, setExposureOpen] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const SectionHeader = ({
    title,
    expanded,
    onToggle,
    rightContent,
    accent,
  }: {
    title: string;
    expanded: boolean;
    onToggle: () => void;
    rightContent?: React.ReactNode;
    accent?: boolean;
  }) => (
    <div
      className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/[0.03] transition-colors"
      onClick={onToggle}
    >
      <span className={`text-[11px] font-semibold tracking-wide ${accent ? "text-violet-400" : "text-white/60"}`}>
        {title}
      </span>
      <div className="flex items-center gap-1">
        {rightContent}
        {expanded ? <ChevronDown size={10} className="text-white/30" /> : <ChevronRight size={10} className="text-white/30" />}
      </div>
    </div>
  );

  const InputRow = ({ label, value, unit }: { label: string; value: string | number; unit?: string }) => (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/30 w-3">{label}</span>
      <div className="flex-1 px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/60 font-mono">
        {value}{unit || ""}
      </div>
    </div>
  );

  const Slider = ({
    label,
    value,
    onChange,
    min = 0,
    max = 360,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/50">{label}</span>
        <span className="text-[10px] text-white/30 font-mono">{value}</span>
      </div>
      <div className="relative h-1.5 bg-white/[0.06] rounded-full cursor-pointer" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        onChange(Math.round(min + ratio * (max - min)));
      }}>
        <div
          className="absolute top-0 left-0 h-full bg-accent rounded-full"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md border border-black/20"
          style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 6px)` }}
        />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#111111] border-l border-white/[0.06] overflow-hidden" style={{ width: "220px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06] shrink-0">
        <span className="text-[13px] font-medium text-white">Untitled</span>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded text-white/30 hover:text-white/60 transition-colors"
            onClick={() => toast.info("Clip Info", "Select a clip on the timeline to see its properties")}
          >
            <Info size={12} />
          </button>
          <button
            className={`p-1 rounded transition-colors ${isPinned ? "text-accent" : "text-white/30 hover:text-white/60"}`}
            onClick={() => setIsPinned(!isPinned)}
          >
            <Pin size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Transform section */}
        <div className="border-b border-white/[0.06]">
          <SectionHeader title="Transform" expanded={transformExpanded} onToggle={() => setTransformExpanded(!transformExpanded)} />
          {transformExpanded && (
            <div className="px-3 pb-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <InputRow label="X" value={120} />
                <InputRow label="Y" value={180} />
              </div>
              <div className="grid grid-cols-2 gap-2 items-center">
                <InputRow label="W" value={1920} />
                <div className="flex items-center gap-1">
                  <InputRow label="H" value={1080} />
                  <button
                    className={`p-1 transition-colors ${isLocked ? "text-accent" : "text-white/30 hover:text-white/60"}`}
                    onClick={() => setIsLocked(!isLocked)}
                  >
                    <Lock size={10} />
                  </button>
                </div>
              </div>
              <InputRow label="R" value="0°" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30">Blend</span>
                <div className="flex-1 flex items-center justify-between px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/50">
                  Normal
                  <ChevronDown size={9} className="text-white/30" />
                </div>
              </div>
              {/* Speed chips */}
              <div>
                <span className="text-[10px] text-white/30 mb-1 block">Speed</span>
                <div className="flex gap-1">
                  {["5x", "1x", "15x", "2x", "Custom"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSpeed(s)}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                        selectedSpeed === s
                          ? "bg-accent text-white"
                          : "bg-white/[0.04] text-white/40 hover:text-white/60"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Magic Tools */}
        <div className="border-b border-white/[0.06]">
          <SectionHeader title="AI Magic Tools" expanded={true} onToggle={() => {}} accent />
          <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
            {[
              { label: "Green Screen", isNew: false },
              { label: "Inpainting", isNew: true },
              { label: "Stylize", isNew: true },
              { label: "Colorize", isNew: false },
            ].map((tool) => (
              <button
                key={tool.label}
                className="flex flex-col items-center gap-1 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                onClick={() => toast.info(tool.label, "Select a clip first, then apply this AI effect from the Effects panel")}
              >
                <div className="w-6 h-6 rounded bg-white/[0.06] flex items-center justify-center">
                  <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-violet-400 to-pink-400 opacity-50" />
                </div>
                <span className="text-[9px] text-white/50">{tool.label}</span>
                {tool.isNew && (
                  <span className="px-1 py-0.5 rounded text-[7px] font-bold text-pink-400 bg-pink-400/10">new</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Effects section */}
        <div className="border-b border-white/[0.06]">
          <SectionHeader
            title="Effects"
            expanded={effectsExpanded}
            onToggle={() => setEffectsExpanded(!effectsExpanded)}
            rightContent={
              <button className="p-0.5 rounded text-white/30 hover:text-white/60" onClick={(e) => e.stopPropagation()}>
                <Plus size={10} />
              </button>
            }
          />
          {effectsExpanded && (
            <div className="px-3 pb-3 space-y-3">
              <Slider label="Hue" value={hue} onChange={setHue} max={360} />
              <Slider label="Gaussian Blur" value={blur} onChange={setBlur} max={50} />
              {/* Nested: Exposure & Black Levels */}
              <div className="border border-white/[0.06] rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-white/[0.03]"
                  onClick={() => setExposureOpen(!exposureOpen)}
                >
                  <div className="flex items-center gap-1.5">
                    <List size={10} className="text-white/30" />
                    <span className="text-[10px] text-white/50">Exposure & Black Levels</span>
                  </div>
                  {exposureOpen ? <ChevronDown size={9} className="text-white/30" /> : <ChevronRight size={9} className="text-white/30" />}
                </div>
                {exposureOpen && (
                  <div className="px-2 pb-2 space-y-2">
                    <Slider label="Exposure" value={exposure} onChange={setExposure} max={50} />
                    <Slider label="Black Levels" value={blackLevels} onChange={setBlackLevels} max={50} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Audio section */}
        <div>
          <SectionHeader title="Audio" expanded={audioExpanded} onToggle={() => setAudioExpanded(!audioExpanded)} />
          {audioExpanded && (
            <div className="px-3 pb-3">
              <Slider label="Volume" value={volume} onChange={setVolume} max={100} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
