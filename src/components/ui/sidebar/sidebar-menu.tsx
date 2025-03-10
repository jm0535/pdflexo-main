
import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"

export interface SidebarMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarMenu({ className, ...props }: SidebarMenuProps) {
  return <div className={cn("", className)} {...props} />
}

export interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarMenuItem({ className, ...props }: SidebarMenuItemProps) {
  return <div className={cn("", className)} {...props} />
}

export interface SidebarMenuButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
  children: React.ReactNode
}

const menuButtonVariants = cva(
  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-slate-700 outline-none hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus:bg-slate-800",
  {
    variants: {
      active: {
        default: "",
        true: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50",
      },
    },
    defaultVariants: {
      active: "default",
    },
  }
)

export function SidebarMenuButton({
  className,
  asChild = false,
  children,
  ...props
}: SidebarMenuButtonProps) {
  const { expanded } = useSidebar()
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...children.props,
      className: cn(
        menuButtonVariants({}),
        expanded ? "" : "justify-center",
        children.props.className,
        className
      ),
    })
  }
  
  return (
    <div
      className={cn(
        menuButtonVariants({}),
        expanded ? "" : "justify-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
