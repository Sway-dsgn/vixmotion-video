import React, { useState } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  FileVideo,
  FolderClosed,
  FolderOpen,
  FileAudio,
} from "@/icons/lucide-compat";
import { toast } from "../../stores/notification-store";

interface FileItem {
  name: string;
  type: "video" | "folder" | "audio";
  date?: string;
  expanded?: boolean;
  children?: FileItem[];
  uploading?: boolean;
  progress?: number;
  exportProgress?: number;
  timeAgo?: string;
}

const initialFiles: FileItem[] = [
  { name: "Close Cuts.mp4", type: "video", date: "Feb 20, 2021" },
  {
    name: "Ad Shoes",
    type: "folder",
    date: "Feb 20, 2021",
    expanded: false,
    children: [],
  },
  { name: "Snow Footage.mp4", type: "video", date: "Feb 20, 2021" },
  { name: "Fire.mp4", type: "video", date: "Feb 20, 2021" },
  { name: "Actor.mp4", type: "video", date: "Feb 20, 2021" },
  {
    name: "Studio Shots",
    type: "folder",
    date: "Feb 20, 2021",
    expanded: true,
    children: [
      { name: "Shoes.mp4", type: "video", date: "Feb 20, 2021" },
      { name: "Pinguins.mp4", type: "video", date: "Feb 20, 2021" },
      {
        name: "Studio Shots 2",
        type: "folder",
        date: "Feb 20, 2021",
        expanded: true,
        children: [
          { name: "sdx.mp3", type: "audio", date: "Feb 20, 2021" },
          { name: "sdx2.mp3", type: "audio", date: "Feb 20, 2021" },
        ],
      },
    ],
  },
  { name: "Actor 2.mp4", type: "video", date: "Feb 20, 2021" },
  { name: "Galaxy.mp4", type: "video", date: "Feb 20, 2021" },
];

const recentFiles = [
  { name: "firstcut.mp4", uploading: true, progress: 58 },
  { name: "edits.mov", exporting: true, progress: 26 },
  { name: "Mountains.mp4", timeAgo: "2 mins ago" },
  { name: "Beach.mp4", timeAgo: "4 mins ago" },
  { name: "Shoes.mp4", timeAgo: "12 mins ago" },
  { name: "Footage.mp4", timeAgo: "22 mins ago" },
];

const FileIcon = ({ type }: { type: string }) => {
  if (type === "folder") return <FolderClosed size={14} className="text-white/30" />;
  if (type === "audio") return <FileAudio size={14} className="text-green-400/60" />;
  return <FileVideo size={14} className="text-white/30" />;
};

const FolderIcon = ({ expanded }: { expanded: boolean }) => {
  if (expanded) return <FolderOpen size={14} className="text-accent" />;
  return <FolderClosed size={14} className="text-white/30" />;
};

export const LeftPanel: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFolder = (index: number) => {
    setFiles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], expanded: !next[index].expanded };
      return next;
    });
  };

  const renderFileItem = (item: FileItem, depth: number = 0) => {
    const isFolder = item.type === "folder";
    const isExpanded = item.expanded ?? false;

    return (
      <React.Fragment key={item.name + depth}>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 text-[12px] cursor-pointer transition-colors ${
            isFolder && isExpanded
              ? "bg-accent/10 border-l-2 border-accent"
              : "hover:bg-white/[0.03]"
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => isFolder && toggleFolder(0)}
        >
          {isFolder ? (
            <button className="p-0.5">
              {isExpanded ? <ChevronDown size={10} className="text-white/40" /> : <ChevronRight size={10} className="text-white/40" />}
            </button>
          ) : (
            <span className="w-[14px]" />
          )}
          {isFolder ? <FolderIcon expanded={isExpanded} /> : <FileIcon type={item.type} />}
          <span className={`flex-1 truncate ${isFolder && isExpanded ? "text-white" : "text-white/60"}`}>
            {item.name}
          </span>
          {item.date && (
            <span className="text-[10px] text-white/25 shrink-0">{item.date}</span>
          )}
        </div>
        {isFolder && isExpanded && item.children?.map((child) => renderFileItem(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#111111] border-r border-white/[0.06] overflow-hidden" style={{ width: "240px" }}>
      {/* Search bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
          <Search size={12} className="text-white/30" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[12px] text-white/70 placeholder:text-white/25 outline-none"
          />
        </div>
        <button className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors" onClick={() => toast.info("Filter", "Filter by file type — coming soon")}>
          <Filter size={12} />
        </button>
        <button className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors" onClick={() => toast.info("Sort", "Sort by name or date — coming soon")}>
          <ArrowUpDown size={12} />
        </button>
        <button className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors" onClick={() => toast.info("More", "More options — coming soon")}>
          <MoreHorizontal size={12} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Recent section */}
        <div className="px-3 pt-3 pb-1">
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Recent</span>
        </div>
        {recentFiles.map((file) => (
          <div
            key={file.name}
            className="flex items-center justify-between px-3 py-1.5 text-[12px] hover:bg-white/[0.03] cursor-pointer"
          >
            <span className="text-white/60 truncate">{file.name}</span>
            {file.uploading ? (
              <span className="text-[10px] text-amber-400/70 shrink-0">Uploading {file.progress}%</span>
            ) : file.exporting ? (
              <span className="text-[10px] text-blue-400/70 shrink-0">Exporting {file.progress}%</span>
            ) : (
              <span className="text-[10px] text-white/25 shrink-0">{file.timeAgo}</span>
            )}
          </div>
        ))}

        {/* Table header */}
        <div className="flex items-center justify-between px-3 pt-4 pb-1 border-t border-white/[0.06] mt-2">
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Name</span>
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider flex items-center gap-1">
            Date Created
            <ArrowUpDown size={8} className="text-white/20" />
          </span>
        </div>

        {/* File tree */}
        <div className="pb-4">
          {files.map((item) => renderFileItem(item, 0))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/[0.06] shrink-0">
        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-accent/40 rounded-full" />
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
