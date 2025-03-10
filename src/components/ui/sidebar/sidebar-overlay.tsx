
import * as React from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"

export interface SidebarOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarOverlay({ className, ...props }: SidebarOverlayProps) {
  const { isMobileView, isOpen, setIsOpen } = useSidebar()

  if (!isMobileView || !isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity",
        className
      )}
      onClick={() => setIsOpen(false)}
      {...props}
    />
  )
}
