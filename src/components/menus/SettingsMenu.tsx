
import React from 'react';
import { Settings } from 'lucide-react';
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface SettingsMenuProps {
  isDark: boolean;
  zoomLevel: number;
  onThemeToggle: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isDark,
  zoomLevel,
  onThemeToggle,
  onZoomIn,
  onZoomOut,
  onResetZoom
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="btn-icon">
          <Settings className="w-5 h-5 text-[#0EA5E9] dark:text-[#33C3F0]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onThemeToggle}>
          {isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>View</DropdownMenuLabel>
        <DropdownMenuItem onClick={onZoomIn} disabled={zoomLevel >= 2.0}>
          Zoom In ({Math.round(zoomLevel * 100)}%)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onZoomOut} disabled={zoomLevel <= 0.3}>
          Zoom Out ({Math.round(zoomLevel * 100)}%)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onResetZoom} disabled={zoomLevel === 1}>
          Reset Zoom
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SettingsMenu;
