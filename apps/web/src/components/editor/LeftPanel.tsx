import React from "react";
import { SlidersHorizontal } from "@/icons/lucide-compat";
import { ToolcraftText as Text } from "@vixmotion/ui";
import { useUIStore, type SelectionItem } from "../../stores/ui-store";

export const LeftPanel: React.FC = () => {
  const selectedItems = useUIStore((state) => state.selectedItems);

  const hasSelection = selectedItems.length > 0;

  if (hasSelection) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-bg-1 flex items-center gap-2">
          <Text type="label" weight="semibold" color="primary" className="text-text-primary">
            Properties
          </Text>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <InspectorContent selectedItems={selectedItems} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center bg-[#141414] p-8"
    >
      <div className="text-center max-w-sm flex flex-col items-center">
        <div
          className="w-14 h-14 mb-5 rounded-xl border border-border flex items-center justify-center"
          style={{ backgroundColor: "#1e1e1e" }}
        >
          <SlidersHorizontal size={28} className="text-text-muted" />
        </div>
        <Text type="body" weight="bold" color="primary" className="text-xl text-white">
          It's empty here
        </Text>
        <Text
          type="supporting"
          color="secondary"
          className="text-text-muted text-center leading-relaxed mt-3"
        >
          Click an element on the timeline to edit its properties
        </Text>
      </div>
    </div>
  );
};

const InspectorContent: React.FC<{ selectedItems: SelectionItem[] }> = ({
  selectedItems,
}) => {
  if (selectedItems.length === 0) return null;

  return (
    <div className="space-y-4">
      <Text type="supporting" color="secondary" className="text-xs text-text-muted">
        {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""} selected
      </Text>
      <div className="space-y-3">
          {selectedItems.map((item) => (
          <div key={item.id} className="p-3 rounded-lg border border-border bg-bg-1">
            <Text type="supporting" color="primary" weight="medium">
              Clip: {item.id.slice(0, 12)}...
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeftPanel;