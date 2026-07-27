import React, { useRef, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward } from "@/icons/lucide-compat";
import { useTimelineStore } from "../../stores/timeline-store";
import { useEngineStore } from "../../stores/engine-store";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

export const SeekBar: React.FC = () => {
  const barRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const playheadPosition = useTimelineStore((s) => s.playheadPosition);
  const playbackState = useTimelineStore((s) => s.playbackState);
  const togglePlayback = useTimelineStore((s) => s.togglePlayback);
  const stop = useTimelineStore((s) => s.stop);
  const seekTo = useTimelineStore((s) => s.seekTo);
  const startScrubbing = useTimelineStore((s) => s.startScrubbing);
  const updateScrubPosition = useTimelineStore((s) => s.updateScrubPosition);
  const endScrubbing = useTimelineStore((s) => s.endScrubbing);

  const duration = useEngineStore((s) => s.playbackStats?.duration ?? 0);

  const progress = duration > 0 ? (playheadPosition / duration) * 100 : 0;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const time = ratio * (duration || 1);
      startScrubbing(time);

      const onMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        const r = barRef.current?.getBoundingClientRect();
        if (!r) return;
        const p = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
        updateScrubPosition(p * (duration || 1));
      };

      const onUp = () => {
        isDragging.current = false;
        endScrubbing();
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "pointer";
    },
    [duration, startScrubbing, updateScrubPosition, endScrubbing],
  );

  const handleBarClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging.current) return;
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seekTo(ratio * (duration || 1));
    },
    [duration, seekTo],
  );

  const isPlaying = playbackState === "playing";

  return (
    <div className="h-10 bg-[#0a0a0a] border-b border-white/[0.06] flex items-center gap-2 px-3 shrink-0 select-none">
      {/* Transport buttons */}
      <button
        onClick={() => seekTo(0)}
        className="p-1 rounded text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
        title="Go to start"
      >
        <SkipBack size={14} />
      </button>

      <button
        onClick={togglePlayback}
        className="p-1.5 rounded text-white hover:bg-white/15 transition-colors bg-white/10"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>

      <button
        onClick={stop}
        className="p-1 rounded text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
        title="Stop"
      >
        <SkipForward size={14} />
      </button>

      {/* Time display */}
      <span className="text-[11px] font-mono text-white/50 tabular-nums min-w-[72px]">
        {formatTime(playheadPosition)}
      </span>

      {/* Seek bar */}
      <div
        ref={barRef}
        className="flex-1 h-5 flex items-center cursor-pointer group"
        onMouseDown={handleMouseDown}
        onClick={handleBarClick}
      >
        <div className="w-full h-1 bg-white/10 rounded-full relative overflow-hidden group-hover:h-1.5 transition-all">
          <div
            className="h-full bg-accent rounded-full relative"
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Duration */}
      <span className="text-[11px] font-mono text-white/30 tabular-nums min-w-[72px] text-right">
        {formatTime(duration)}
      </span>
    </div>
  );
};

export default SeekBar;
