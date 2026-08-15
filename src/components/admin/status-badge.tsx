import { Badge } from "@/components/ui/badge";
import { statusMeta } from "@/lib/domain/labels";
import { cn } from "@/lib/utils/cn";

/**
 * Status badge for domain enum values. Includes a small dot so status is
 * never communicated by color alone (accessibility).
 */
export function StatusBadge({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) {
  const { label, variant } = statusMeta(value);
  return (
    <Badge variant={variant} className={className}>
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full bg-current opacity-70")} />
      {label}
    </Badge>
  );
}
