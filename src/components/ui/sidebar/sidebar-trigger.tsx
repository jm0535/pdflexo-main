
import * as React from "react"
import { X, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"
import { Button } from "@/components/ui/button"

export interface SidebarTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function SidebarTrigger({
  className,
  ...props
}: SidebarTriggerProps) {
  const { expanded, toggleExpanded, isMobileView, isOpen, toggleOpen } = useSidebar()

  const handleClick = () => {
    if (isMobileView) {
      toggleOpen()
    } else {
      toggleExpanded()
    }
  }
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-10 w-10 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {(expanded && !isMobileView) || (isOpen && isMobileView) ? (
        <X className="h-5 w-5" />
      ) : (
        <Menu className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}
