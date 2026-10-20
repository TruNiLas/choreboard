import type { ButtonHTMLAttributes, ReactNode } from "react";

// Generic building blocks. No Choreboard knowledge in here.

export const inputClass =
  "block min-h-12 w-full rounded-md border border-transparent bg-surface px-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

const buttonBase =
  "inline-flex min-h-12 items-center justify-center rounded-md px-5 font-medium transition-colors disabled:opacity-60";

export const buttonLooks = {
  primary: `${buttonBase} bg-accent text-accent-foreground hover:brightness-110`,
  secondary: `${buttonBase} bg-surface text-foreground hover:bg-border`,
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonLooks };

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button {...props} className={`${buttonLooks[variant]} ${className}`} />;
}

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-danger">
      {children}
    </p>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl bg-surface p-4 sm:p-5 ${className}`}>{children}</section>;
}
