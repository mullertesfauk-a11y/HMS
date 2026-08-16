export function MenuSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-x-10 gap-y-10 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-5 animate-pulse">
          <div className="h-32 w-40 shrink-0 rounded-xl bg-stone-200" />
          <div className="flex flex-1 flex-col gap-2 py-1">
            <div className="h-5 w-2/3 rounded bg-stone-200" />
            <div className="h-3 w-1/3 rounded bg-stone-200" />
            <div className="mt-1 h-3 w-full rounded bg-stone-100" />
            <div className="h-3 w-4/5 rounded bg-stone-100" />
            <div className="mt-auto flex items-end justify-between pt-3">
              <div className="h-4 w-16 rounded bg-stone-200" />
              <div className="h-8 w-8 rounded-full bg-stone-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
