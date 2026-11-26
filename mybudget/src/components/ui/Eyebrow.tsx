type EyebrowProps = {
  children: string;
  className?: string;
};

export function Eyebrow({ children, className = "" }: EyebrowProps) {
  return (
    <p
      className={`text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-ember-deep sm:text-xs ${className}`}
    >
      {children}
    </p>
  );
}
