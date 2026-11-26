type ProgressBarProps = {
  value: number;
  max: number;
  label: string;
  tone?: "ember" | "ink" | "over";
  className?: string;
};

const tones = {
  ember: "bg-ember",
  ink: "bg-ink",
  over: "bg-ember-deep",
} as const;

export function ProgressBar({
  value,
  max,
  label,
  tone = "ember",
  className = "",
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Number(((value / max) * 100).toFixed(2))) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      aria-valuetext={`${percent}%`}
      className={`h-1.5 w-full overflow-hidden rounded-full bg-cream-deep ${className}`}
    >
      <span
        className={`block h-full rounded-full ${tones[tone]}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
