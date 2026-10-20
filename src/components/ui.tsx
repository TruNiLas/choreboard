import type { ButtonHTMLAttributes, ReactNode } from "react";

// Generic building blocks. No Choreboard knowledge in here.

export const inputClass =
  "block min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-base text-foreground placeholder:text-muted focus:border-foreground focus:outline-none";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" };

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const look =
    variant === "primary"
      ? "bg-accent text-accent-foreground hover:brightness-95"
      : "border border-border bg-surface text-foreground hover:bg-background";
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 font-semibold transition disabled:opacity-60 ${look} ${className}`}
    />
  );
}

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-danger">
      {children}
    </p>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-border bg-surface p-4 sm:p-5 ${className}`}>{children}</section>;
}
