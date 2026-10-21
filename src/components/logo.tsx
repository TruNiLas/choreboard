// A clean plate seen from above, with a tick on it. The mark works alone (the landing
// dock) or with the wordmark (the header).
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <circle cx="16" cy="16" r="15" fill="var(--foreground)" />
      <circle cx="16" cy="16" r="11.5" fill="var(--surface)" />
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="var(--border)" strokeWidth="1" />
      <path
        d="M11.2 16.4l3.2 3.2 6.6-7"
        fill="none"
        stroke="var(--accent-ink)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="font-display text-[1.75rem] leading-none">Choreboard</span>
    </span>
  );
}
