import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({
  rows = 8,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <div className="border-b border-stone-200 bg-stone-50 px-4 py-2.5">
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="divide-y divide-stone-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-6 px-4 py-3.5">
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <Skeleton
                key={columnIndex}
                className="h-3.5"
                style={{ width: `${[22, 16, 12, 14, 10, 18][columnIndex % 6]}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
