import React, { useState } from "react";
import {
  Menu,
  Play,
  History,
  ChevronDown,
  Grid3x3,
} from "@/icons/lucide-compat";
import { useProjectStore } from "../../stores/project-store";

export const TopNavbar: React.FC = () => {
  const projectName = useProjectStore((state) => state.project.name);
  const [zoomLevel] = useState("33%");

  return (
    <header
      className="w-full flex items-center justify-between px-4 bg-[#0d0d0d] border-b border-white/[0.06] shrink-0 select-none"
      style={{ height: "48px" }}
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white/40 border border-white/10 uppercase tracking-wider">
          Beta
        </span>
        <button className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
          <Menu size={16} />
        </button>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-white/40">Video Editor</span>
          <span className="text-white/15">|</span>
          <span className="text-white font-medium">{projectName || "Untitled Project"}</span>
        </div>
      </div>

      {/* Center section */}
      <div className="flex items-center gap-3">
        <button className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
          <Play size={14} />
        </button>
        <button className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
          <History size={14} />
        </button>
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
          <span className="text-[12px] text-white/60 font-mono">{zoomLevel}</span>
          <ChevronDown size={10} className="text-white/30" />
        </div>
        <button className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
          <Grid3x3 size={14} />
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Avatar stack */}
        <div className="flex items-center -space-x-2">
          <div className="w-6 h-6 rounded-full bg-violet-500 border-2 border-[#0d0d0d] flex items-center justify-center text-[9px] font-bold text-white">S</div>
          <div className="w-6 h-6 rounded-full bg-pink-500 border-2 border-[#0d0d0d] flex items-center justify-center text-[9px] font-bold text-white">K</div>
          <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-[#0d0d0d] flex items-center justify-center text-[9px] font-bold text-white">J</div>
          <div className="w-6 h-6 rounded-full bg-white/10 border-2 border-[#0d0d0d] flex items-center justify-center text-[9px] font-medium text-white/50">+5</div>
        </div>

        <button className="px-3 py-1.5 rounded-lg border border-white/15 text-[12px] font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors">
          Share
        </button>
        <button className="px-4 py-1.5 rounded-lg bg-accent text-white text-[12px] font-semibold hover:bg-accent/80 transition-colors">
          Export
        </button>
      </div>
    </header>
  );
};

export default TopNavbar;
