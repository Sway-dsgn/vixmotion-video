import React, { useCallback, useRef, useState } from "react";
import { Upload } from "@/icons/lucide-compat";
import { useProjectStore } from "../../stores/project-store";

export const UploadPanel: React.FC = () => {
  const importMedia = useProjectStore((s) => s.importMedia);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setImporting(file.name);
    try {
      await importMedia(file);
    } catch (e) {
      console.error("Import failed:", e);
    }
    setImporting(null);
  }, [importMedia]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(handleFile);
  }, [handleFile]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(handleFile);
    e.target.value = "";
  }, [handleFile]);

  return (
    <div className="h-full flex flex-col bg-[#111111] border-r border-white/[0.06]" style={{ width: "240px" }}>
      <div className="px-3 py-2.5 border-b border-white/[0.06] shrink-0">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Import Media</span>
      </div>

      <div
        className={`flex-1 m-3 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 ${
          isDragOver ? "border-accent bg-accent/10" : "border-white/10 hover:border-white/20"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload size={32} className="text-white/20" />
        <span className="text-xs text-white/30 text-center px-4 leading-relaxed">
          Drop files here or click to browse
        </span>
        <button
          onClick={() => inputRef.current?.click()}
          className="px-4 py-1.5 rounded-lg bg-white/10 text-xs text-white/70 hover:bg-white/20 transition-colors"
        >
          Browse Files
        </button>
        <input ref={inputRef} type="file" multiple onChange={handleInput} className="hidden" accept="video/*,image/*,audio/*" />
      </div>

      {importing && (
        <div className="px-3 py-2 border-t border-white/[0.06] flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-xs text-white/50 truncate">Importing {importing}...</span>
        </div>
      )}

      <div className="px-3 py-2 border-t border-white/[0.06] shrink-0">
        <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Supported formats</span>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {["MP4", "MOV", "AVI", "PNG", "JPG", "MP3", "WAV"].map((fmt) => (
            <span key={fmt} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-white/30 font-mono">{fmt}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UploadPanel;
