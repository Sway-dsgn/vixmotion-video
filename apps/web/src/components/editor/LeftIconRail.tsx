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
  beginnerMode?: boolean;
}

export const LeftIconRail: React.FC<LeftIconRailProps> = ({ activeTab, onTabChange, beginnerMode }) => {
  const topItems = [
    { id: "menu", icon: Menu, label: "Menu" },
    { id: "upload", icon: Upload, label: "Upload" },
    { id: "assets", icon: FolderOpen, label: "Media" },
    { id: "text", icon: Type, label: "Text" },
  ];

  return (
    <nav
      className="flex flex-col items-center py-3 bg-[#111111] border-r border-white/[0.06] shrink-0"
      style={{ width: beginnerMode ? "72px" : "48px" }}
    >
      {topItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center rounded-lg mb-1 transition-colors ${
              beginnerMode ? "w-[56px] py-1.5 gap-0.5" : "w-9 h-9"
            } ${
              isActive
                ? "bg-white/10 text-white"
                : "text-white/35 hover:text-white/60 hover:bg-white/5"
            }`}
            title={item.label}
          >
            <item.icon size={beginnerMode ? 18 : 16} />
            <span className={`leading-none ${beginnerMode ? "text-[10px] mt-0.5 font-medium" : "text-[8px] mt-0.5"}`}>
              {item.label}
            </span>
          </button>
        );
      })}

      <div className="flex-1" />

      <button
        className={`flex flex-col items-center justify-center rounded-lg transition-colors ${
          beginnerMode ? "w-[56px] py-1.5 gap-0.5" : "w-9 h-9"
        } text-white/35 hover:text-white/60 hover:bg-white/5`}
        title="Help"
        onClick={() => onTabChange("help")}
      >
        <HelpCircle size={beginnerMode ? 18 : 16} />
        <span className={`leading-none ${beginnerMode ? "text-[10px] mt-0.5 font-medium" : "text-[8px] mt-0.5"}`}>Help</span>
      </button>
    </nav>
  );
};

export default LeftIconRail;
