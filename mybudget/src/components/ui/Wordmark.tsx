type WordmarkProps = {
  className?: string;
};

export function Wordmark({ className = "" }: WordmarkProps) {
  return (
    <span
      className={`font-display font-black uppercase leading-none tracking-[-0.015em] ${className}`}
    >
      MyBudget
    </span>
  );
}
