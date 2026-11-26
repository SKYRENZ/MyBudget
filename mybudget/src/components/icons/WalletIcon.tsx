import type { IconProps } from "@/components/icons/types";

export function WalletIcon({ className = "" }: IconProps) {
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
      <path d="M3.5 8.25A2.25 2.25 0 0 1 5.75 6h11.5A2.25 2.25 0 0 1 19.5 8.25v9.5A2.25 2.25 0 0 1 17.25 20H5.75a2.25 2.25 0 0 1-2.25-2.25v-9.5Z" />
      <path d="M3.5 9.5h13.75A2.25 2.25 0 0 1 19.5 11.75v2.5a2.25 2.25 0 0 1-2.25 2.25H3.5" />
      <path d="M15.75 12.5h.01" />
    </svg>
  );
}
