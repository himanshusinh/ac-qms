import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  color?: string;           // e.g., "#E8732C"
  onClick?: () => void;
  className?: string;
  highlight?: boolean;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "#0D4F5C",
  onClick,
  className,
  highlight = false,
}: Props) {
  return (
    <div
      className={cn(
        "relative rounded-lg bg-[var(--bg-card)] p-[var(--space-standard)] transition-all shadow-sm",
        onClick && "cursor-pointer hover:shadow-md",
        highlight && "ring-2 ring-brand-highlight/30",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className="font-bold" style={{ color, fontSize: "var(--type-metric-size)" }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}12` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        )}
      </div>
    </div>
  );
}
