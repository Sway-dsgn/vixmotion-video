import React, { useCallback, useState, useRef } from "react";
import {
  Upload,
  MoreVertical,
  FolderOpen,
  ChevronDown,
  List,
  Grid,
} from "@/icons/lucide-compat";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@vixmotion/ui";
import { ToolcraftButton as Button } from "@vixmotion/ui";
import { ToolcraftText as Text } from "@vixmotion/ui";
import { useProjectStore } from "../../stores/project-store";

export const RightPanel: React.FC = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "date" | "type" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const importMedia = useProjectStore((state) => state.importMedia);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      for (const file of files) {
        try {
          await importMedia(file);
        } catch (error) {
          console.error("Failed to import media:", error);
        }
      }
    }
  }, [importMedia]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      for (const file of files) {
        try {
          await importMedia(file);
        } catch (error) {
          console.error("Failed to import media:", error);
        }
      }
      e.target.value = "";
    }
  }, [importMedia]);

  const mediaItems = [
    { id: "1", name: "video-01.mp4", type: "video", size: "15.2 MB", duration: "00:30" },
    { id: "2", name: "photo-02.jpg", type: "image", size: "3.4 MB", duration: null },
    { id: "3", name: "audio-03.mp3", type: "audio", size: "5.1 MB", duration: "02:15" },
    { id: "4", name: "video-04.mov", type: "video", size: "42.8 MB", duration: "01:45" },
  ];

  const filteredItems = [...mediaItems].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "name") comparison = a.name.localeCompare(b.name);
    else if (sortBy === "size") comparison = a.size.localeCompare(b.size);
    else comparison = 0;
    return sortOrder === "asc" ? comparison : -comparison;
  });

  return (
    <div className="h-full w-full flex flex-col bg-bg-1 border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-1">
        <div className="flex items-center gap-3">
          <Text type="label" weight="semibold" color="primary" className="text-text-primary">
            Assets
          </Text>
        </div>

        <div className="flex items-center gap-1.5">
          {/* View mode toggle */}
          <div className="flex bg-bg-2 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-primary text-white"
                  : "text-text-muted hover:text-white"
              }`}
              aria-label="Grid view"
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-primary text-white"
                  : "text-text-muted hover:text-white"
              }`}
              aria-label="List view"
            >
              <List size={14} />
            </button>
          </div>

          {/* Sort dropdown */}
          <DropdownMenu open={showSortMenu} onOpenChange={setShowSortMenu}>
            <DropdownMenuTrigger asChild>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white"
                aria-label="Sort"
              >
                <ChevronDown size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-36 bg-bg-1 border border-border rounded-lg shadow-lg py-1 z-50"
            >
              {(["name", "date", "type", "size"] as const).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => {
                    setSortBy(key);
                    setShowSortMenu(false);
                  }}
                  className={`text-text-primary hover:bg-white/5 px-3 py-2 text-sm cursor-pointer ${sortBy === key ? "text-primary" : ""}`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Import button */}
          <div className="relative">
            <input
              type="file"
              ref={(el) => { if (el) el.multiple = true; }}
              onChange={handleFileInput}
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept="video/*,image/*,audio/*"
            />
            <Button
              label="Import"
              variant="outline"
              size="sm"
              icon={<Upload size={14} />}
              className="px-3 py-1.5 border-border text-text-primary hover:bg-white/5"
            />
          </div>
        </div>
      </div>

      {/* Drop Zone / Media Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        {mediaItems.length === 0 ? (
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="relative mb-4">
              <Upload size={48} className="text-text-muted" />
              <button
                className="absolute -top-2 -right-2 p-1 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white"
                aria-label="More options"
              >
                <MoreVertical size={16} />
              </button>
              <button
                className="absolute -top-2 -left-2 p-1 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white"
                aria-label="Open folder"
              >
                <FolderOpen size={16} />
              </button>
            </div>
            <Text
              type="body"
              color="secondary"
              className="text-text-muted text-center px-8 leading-relaxed"
            >
              Drag and drop videos, photos, and audio files here
            </Text>
            <div className="mt-4">
              <input
                type="file"
                onChange={handleFileInput}
                className="absolute inset-0 opacity-0 cursor-pointer"
                multiple
                accept="video/*,image/*,audio/*"
              />
              <Button
                variant="outline"
                size="sm"
                icon={<Upload size={14} />}
                className="px-4 py-2 border-border text-text-primary hover:bg-white/5"
              >
                Browse Files
              </Button>
            </div>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3 auto-rows-min" : "space-y-2"}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`group p-2 rounded-lg border transition-colors ${
                  viewMode === "grid"
                    ? "border-border hover:border-primary/50 bg-bg-2/50"
                    : "border-border hover:border-primary/50 bg-bg-2/50 flex items-center gap-3"
                }`}
              >
                {viewMode === "grid" ? (
                  <>
                    <div className="aspect-video w-full rounded bg-black/50 flex items-center justify-center mb-2 relative overflow-hidden">
                      {item.type === "video" && (
                        <div className="text-center">
                          <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-white/20 flex items-center justify-center">
                            <Upload size={20} className="text-white" />
                          </div>
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] font-mono text-white">
                            {item.duration}
                          </div>
                        </div>
                      )}
                      {item.type === "image" && (
                        <div className="text-center">
                          <Upload size={28} className="text-text-muted mx-auto" />
                        </div>
                      )}
                      {item.type === "audio" && (
                        <div className="text-center">
                          <Upload size={28} className="text-text-muted mx-auto" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Text
                        type="supporting"
                        color="primary"
                        weight="medium"
                        className="text-text-primary truncate"
                      >
                        {item.name}
                      </Text>
                      <Text type="supporting" color="secondary" className="text-xs text-text-muted">
                        {item.size} • {item.type}
                      </Text>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 flex-shrink-0 rounded bg-black/50 flex items-center justify-center">
                      <Upload size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text
                        type="supporting"
                        color="primary"
                        weight="medium"
                        className="text-text-primary truncate"
                      >
                        {item.name}
                      </Text>
                      <Text type="supporting" color="secondary" className="text-xs text-text-muted">
                        {item.size} • {item.type} {item.duration ? `• ${item.duration}` : ""}
                      </Text>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <MoreVertical size={16} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RightPanel;