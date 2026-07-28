import React from "react";
import {
  Menu,
  Upload,
  FolderOpen,
  Type,
  HelpCircle,
} from "@/icons/lucide-compat";

interface LeftIconRailProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const LeftIconRail: React.FC<LeftIconRailProps> = ({ activeTab, onTabChange }) => {
  const topItems = [
    { id: "menu", icon: Menu, label: "" },
    { id: "upload", icon: Upload, label: "Upload" },
    { id: "assets", icon: FolderOpen, label: "Assets" },
    { id: "text", icon: Type, label: "Text" },
  ];

  return (
    <nav
      className="flex flex-col items-center py-3 bg-[#111111] border-r border-white/[0.06] shrink-0"
      style={{ width: "48px" }}
    >
      {/* Top items */}
      {topItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-9 h-9 flex flex-col items-center justify-center rounded-lg mb-1 transition-colors ${
              isActive
                ? "bg-white/10 text-white"
                : "text-white/35 hover:text-white/60 hover:bg-white/5"
            }`}
            title={item.label || "Menu"}
          >
            <item.icon size={16} />
            {item.label && (
              <span className="text-[8px] mt-0.5 leading-none">{item.label}</span>
            )}
          </button>
        );
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Help at bottom */}
      <button
        className="w-9 h-9 flex flex-col items-center justify-center rounded-lg text-white/35 hover:text-white/60 hover:bg-white/5 transition-colors"
        title="Help"
        onClick={() => onTabChange("help")}
      >
        <HelpCircle size={16} />
        <span className="text-[8px] mt-0.5 leading-none">Help</span>
      </button>
    </nav>
  );
};

export default LeftIconRail;
