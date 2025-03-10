
import * as React from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const { expanded, isMobileView, isOpen } = useSidebar()

  return (
    <div
      data-expanded={expanded}
      data-mobile={isMobileView}
      data-open={isOpen}
      className={cn(
        "min-h-full border-r bg-background transition-all duration-300 flex-shrink-0",
        // Desktop view - expanded/collapsed width
        "data-[mobile=false]:data-[expanded=true]:w-64 data-[mobile=false]:data-[expanded=false]:w-[70px]",
        // Mobile view - fixed position with transform
        "data-[mobile=true]:fixed data-[mobile=true]:top-0 data-[mobile=true]:left-0 data-[mobile=true]:z-40 data-[mobile=true]:w-64",
        "data-[mobile=true]:data-[open=false]:-translate-x-full data-[mobile=true]:data-[open=true]:translate-x-0",
        "dark:bg-gray-950",
        className
      )}
      {...props}
    />
  )
}

export interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarHeader({ className, ...props }: SidebarHeaderProps) {
  const { expanded, isMobileView } = useSidebar()
  
  return (
    <div
      className={cn(
        "flex h-14 items-center border-b px-4",
        (expanded || isMobileView) ? "justify-between" : "justify-center",
        className
      )}
      {...props}
    />
  )
}

export interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarContent({ className, ...props }: SidebarContentProps) {
  return <div className={cn("flex-1 overflow-auto p-4", className)} {...props} />
}

export interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarFooter({ className, ...props }: SidebarFooterProps) {
  return <div className={cn("mt-auto border-t p-4", className)} {...props} />
}
