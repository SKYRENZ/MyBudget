import type { IconProps } from "@/components/icons/types";

export function PencilIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M4.75 20h3.5L19 9.25a2.47 2.47 0 0 0-3.5-3.5L4.75 16.5v3.5Z" />
      <path d="M14.5 7.25 16.75 9.5" />
    </svg>
  );
}
