
import * as React from "react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"

export interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarGroup({ className, ...props }: SidebarGroupProps) {
  return <div className={cn("pb-4", className)} {...props} />
}

export interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarGroupLabel({
  className,
  ...props
}: SidebarGroupLabelProps) {
  const { expanded } = useSidebar()
  
  if (!expanded) return null
  
  return (
    <div
      className={cn(
        "mb-2 px-2 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400",
        className
      )}
      {...props}
    />
  )
}

export interface SidebarGroupContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarGroupContent({
  className,
  ...props
}: SidebarGroupContentProps) {
  return <div className={cn("space-y-1", className)} {...props} />
}
