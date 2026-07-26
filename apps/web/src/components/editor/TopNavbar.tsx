import React, { useState } from "react";
import {
  MessageSquare,
  ExternalLink,
  Sun,
  Moon,
  Upload,
  ChevronDown,
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
import { useThemeStore } from "../../stores/theme-store";

interface TopNavbarProps {
  onNewTabClick?: () => void;
  onFeedbackClick?: () => void;
  onExportClick?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onNewTabClick,
  onFeedbackClick,
  onExportClick,
}) => {
  const { isDark, toggleTheme } = useThemeStore();
  const projectName = useProjectStore((state) => state.project.name);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const exportOptions = [
    { label: "Export Video", icon: Upload, action: onExportClick },
    { label: "Export Audio Only", icon: MessageSquare, action: () => {} },
    { label: "Export as GIF", icon: MessageSquare, action: () => {} },
    { label: "Export Frame", icon: MessageSquare, action: () => {} },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0d0d0d] border-b border-border flex items-center justify-between px-6"
      style={{ height: "64px" }}
    >
      {/* Left: Logo + Project Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="w-7 h-7 flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
            clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
          }}
          aria-hidden="true"
        />
        <Text
          type="body"
          weight="medium"
          color="primary"
          className="text-white truncate max-w-[300px]"
        >
          {projectName || "Untitled Project"}
        </Text>
      </div>

      {/* Right: Status + Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2 text-text-muted">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#f97316" }}
          />
          <Text type="supporting" color="secondary" className="text-xs">
            Connecting...
          </Text>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Open in new tab */}
        <button
          onClick={onNewTabClick}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white"
          aria-label="Open in new tab"
        >
          <ExternalLink size={18} />
        </button>

        {/* Feedback buttons */}
        <button
          onClick={onFeedbackClick}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white"
          aria-label="Send feedback"
        >
          <MessageSquare size={18} />
        </button>

        <button
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white"
          aria-label="Messages"
        >
          <MessageSquare size={18} />
        </button>

        {/* Send Feedback button */}
        <Button
          label="Send feedback"
          variant="outline"
          size="sm"
          className="hidden sm:flex px-3 py-1.5 border-border text-text-primary hover:bg-white/5"
          onClick={onFeedbackClick}
        />

        <div className="w-px h-6 bg-border mx-1" />

        {/* Export Dropdown */}
        <DropdownMenu open={showExportMenu} onOpenChange={setShowExportMenu}>
          <DropdownMenuTrigger asChild>
            <Button
              label="Export"
              variant="primary"
              size="sm"
              icon={<Upload size={16} />}
              className="px-4 py-2"
              style={{
                background: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
                border: "none",
              }}
            >
              <ChevronDown size={14} className="ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-bg-1 border border-border rounded-lg shadow-lg py-1 z-50"
          >
            {exportOptions.map((opt, i) => (
              <DropdownMenuItem
                key={i}
                onClick={() => {
                  opt.action?.();
                  setShowExportMenu(false);
                }}
                className="text-text-primary hover:bg-white/5 px-3 py-2 text-sm cursor-pointer"
              >
                <opt.icon size={14} className="mr-2 text-text-muted" />
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-text-muted hover:text-white"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};

export default TopNavbar;