import type { ButtonHTMLAttributes, ReactNode } from "react";

// Generic building blocks. No Choreboard knowledge in here. The button and ticket styles
// themselves live in globals.css (btn, btn-primary, btn-secondary).

export const inputClass =
  "block min-h-13 w-full rounded-[14px] border-2 border-border bg-surface px-4 text-base text-foreground placeholder:text-muted transition-colors focus:border-foreground focus:outline-none";

export const buttonLooks = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonLooks };

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button {...props} className={`${buttonLooks[variant]} ${className}`} />;
}

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm font-medium text-danger">
      {children}
    </p>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[20px] bg-surface p-5 sm:p-6 ${className}`}>{children}</section>;
}
