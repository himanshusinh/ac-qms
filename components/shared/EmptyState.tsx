import { cn } from "@/lib/utils";
import { InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        {icon || <InboxIcon className="w-7 h-7 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="bg-brand-primary hover:bg-brand-primary/90">
          {action.label}
        </Button>
      )}
    </div>
  );
}
