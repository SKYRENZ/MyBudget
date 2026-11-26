type AccentBarsProps = {
  className?: string;
};

export function AccentBars({ className = "" }: AccentBarsProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center gap-2.5 sm:gap-3 ${className}`}
    >
      <span className="h-1.5 w-12 rounded-full bg-ember sm:h-2 sm:w-20" />
      <span className="h-1.5 w-4 rounded-full bg-ink-soft sm:h-2 sm:w-6" />
      <span className="h-1.5 w-12 rounded-full bg-ember-soft sm:h-2 sm:w-20" />
    </div>
  );
}
