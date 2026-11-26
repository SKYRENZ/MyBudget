export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-ink/10 dark:bg-white/10 ${className}`}
    />
  );
}
