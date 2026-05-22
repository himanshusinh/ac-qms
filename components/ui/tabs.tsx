"use client"

import React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex w-full gap-2",
        orientation === "horizontal" ? "flex-col" : "flex-row",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex items-center justify-start gap-[var(--space-compact)] rounded-full p-[3px] text-muted-foreground overflow-hidden whitespace-nowrap flex-wrap-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  const children = props.children

  return (
    <>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        className={cn(tabsListVariants({ variant }), className)}
        {...props}
      />

      {/* Mobile fallback: dropdown that activates the tab triggers by clicking the matching trigger element */}
      <div className="block sm:hidden mt-2">
        <select
          aria-label="Select tab"
          className="w-full rounded-md border p-2 text-sm"
          onChange={(e) => {
            const v = e.currentTarget.value
            const el = document.querySelector(`[data-value=\"${v}\"]`)
            if (el && typeof (el as HTMLElement).click === "function") (el as HTMLElement).click()
          }}
        >
          {React.Children.map(children, (child) => {
            const childEl = child as React.ReactElement<{ value?: string; children?: React.ReactNode }>
            if (!childEl || !childEl.props) return null
            const val = childEl.props.value ?? String(childEl.key ?? "")
            const label = typeof childEl.props.children === "string"
              ? childEl.props.children
              : Array.isArray(childEl.props.children)
                ? childEl.props.children[0]
                : childEl.props.children
            return (
              <option key={val} value={val}>
                {label ?? val}
              </option>
            )
          })}
        </select>
      </div>
    </>
  )
}

function TabsTrigger({ className, value, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      data-value={value}
      className={cn(
        "relative inline-flex items-center gap-[var(--space-compact)] rounded-full px-[var(--space-section)] py-[6px] text-sm font-medium whitespace-nowrap text-foreground/60 transition-all hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-active:bg-primary data-active:text-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("w-full flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
