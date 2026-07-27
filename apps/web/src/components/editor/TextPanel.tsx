import React, { useState } from "react";
import { Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from "@/icons/lucide-compat";

const fonts = ["Inter", "Roboto", "Arial", "Helvetica", "Georgia", "Courier New", "Times New Roman"];
const presets = [
  { name: "Title Large", size: 48, weight: "bold", color: "#ffffff" },
  { name: "Subtitle", size: 32, weight: "semibold", color: "#ffffff" },
  { name: "Body", size: 20, weight: "normal", color: "#cccccc" },
  { name: "Caption", size: 14, weight: "normal", color: "#999999" },
];

export const TextPanel: React.FC = () => {
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [fontSize, setFontSize] = useState(32);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [alignment, setAlignment] = useState<"left" | "center" | "right">("center");

  return (
    <div className="h-full flex flex-col bg-[#111111] border-r border-white/[0.06]" style={{ width: "240px" }}>
      <div className="px-3 py-2.5 border-b border-white/[0.06] shrink-0">
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Text</span>
      </div>

      {/* Text presets */}
      <div className="px-3 pt-3 pb-2 space-y-1">
        <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Presets</span>
        {presets.map((p) => (
          <button
            key={p.name}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
            onClick={() => { setFontSize(p.size); setIsBold(p.weight === "bold" || p.weight === "semibold"); }}
          >
            <Type size={14} className="text-white/30" />
            <div>
              <span className="text-xs text-white/70 block">{p.name}</span>
              <span className="text-[9px] text-white/30">{p.size}px · {p.weight}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="h-px bg-white/5 mx-3" />

      {/* Font selector */}
      <div className="px-3 pt-3 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Font</span>
          <span className="text-[10px] text-white/20">{fontSize}px</span>
        </div>
        <div className="flex gap-1">
          <select
            value={selectedFont}
            onChange={(e) => setSelectedFont(e.target.value)}
            className="flex-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 outline-none"
          >
            {fonts.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-14 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 outline-none text-center"
          />
        </div>
      </div>

      {/* Font style */}
      <div className="px-3 pb-2 space-y-2">
        <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Style</span>
        <div className="flex gap-1">
          {[
            { icon: Bold, active: isBold, toggle: () => setIsBold(!isBold), label: "Bold" },
            { icon: Italic, active: isItalic, toggle: () => setIsItalic(!isItalic), label: "Italic" },
            { icon: Underline, active: isUnderline, toggle: () => setIsUnderline(!isUnderline), label: "Underline" },
          ].map((s) => (
            <button
              key={s.label}
              onClick={s.toggle}
              className={`p-2 rounded-lg transition-colors ${s.active ? "bg-white/15 text-white" : "bg-white/5 text-white/40 hover:text-white/70"}`}
            >
              <s.icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Alignment */}
      <div className="px-3 pb-3 space-y-2">
        <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Alignment</span>
        <div className="flex gap-1">
          {[
            { icon: AlignLeft, value: "left" as const },
            { icon: AlignCenter, value: "center" as const },
            { icon: AlignRight, value: "right" as const },
          ].map((a) => (
            <button
              key={a.value}
              onClick={() => setAlignment(a.value)}
              className={`p-2 rounded-lg transition-colors ${alignment === a.value ? "bg-white/15 text-white" : "bg-white/5 text-white/40 hover:text-white/70"}`}
            >
              <a.icon size={14} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* Add text button */}
      <div className="px-3 pb-3">
        <button className="w-full py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/80 transition-colors">
          Add Text to Canvas
        </button>
      </div>
    </div>
  );
};

export default TextPanel;
