import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "Normal" | "Warning" | "Critical"
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "status-badge",
        {
          "status-normal": status === "Normal",
          "status-warning": status === "Warning",
          "status-critical": status === "Critical",
        },
        className,
      )}
    >
      {status}
    </span>
  )
}
