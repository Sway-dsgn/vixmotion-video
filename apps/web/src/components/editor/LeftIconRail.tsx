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
    { id: "menu", icon: Menu, label: "Menu" },
    { id: "upload", icon: Upload, label: "Upload" },
    { id: "assets", icon: FolderOpen, label: "Media" },
    { id: "text", icon: Type, label: "Text" },
  ];

  return (
    <nav
      className="flex flex-col items-center py-3 bg-[#111111] border-r border-white/[0.06] shrink-0"
      style={{ width: "72px" }}
    >
      {topItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center rounded-lg mb-1 transition-colors w-[56px] py-1.5 gap-0.5 ${
              isActive
                ? "bg-white/10 text-white"
                : "text-white/35 hover:text-white/60 hover:bg-white/5"
            }`}
            title={item.label}
          >
            <item.icon size={18} />
            <span className="leading-none text-[10px] mt-0.5 font-medium">
              {item.label}
            </span>
          </button>
        );
      })}

      <div className="flex-1" />

      <button
        className="flex flex-col items-center justify-center rounded-lg transition-colors w-[56px] py-1.5 gap-0.5 text-white/35 hover:text-white/60 hover:bg-white/5"
        title="Help"
        onClick={() => onTabChange("help")}
      >
        <HelpCircle size={18} />
        <span className="leading-none text-[10px] mt-0.5 font-medium">Help</span>
      </button>
    </nav>
  );
};

export default LeftIconRail;
