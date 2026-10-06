import { Skeleton } from '@/components/ui/skeleton';

export function NoteGridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      aria-hidden="true"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex h-full flex-col gap-4 rounded-xl border bg-card p-6"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-5 shrink-0" />
            <Skeleton className="h-6 flex-1" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
