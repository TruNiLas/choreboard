"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/logo";

// A floating bar with the sign-up button. It slides up once the hero's button has
// scrolled away and hides again at the closing call to action, so there is always
// exactly one sign-up button in view.
export function Dock({ signedIn }: { signedIn: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-cta");
    const closing = document.getElementById("closing-cta");
    if (!hero || !closing) return;
    let heroVisible = true;
    let closingVisible = false;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) heroVisible = entry.isIntersecting;
        if (entry.target === closing) closingVisible = entry.isIntersecting;
      }
      setVisible(!heroVisible && !closingVisible);
    });
    observer.observe(hero);
    observer.observe(closing);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 transition-[opacity,transform] duration-300 ease-out sm:bottom-6 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-2 rounded-full bg-board p-2 pl-3 text-board-foreground shadow-[0_20px_40px_-12px_rgb(19_33_60/0.6)]">
        <LogoMark className="size-9" />
        <Link href={signedIn ? "/app" : "/signup"} tabIndex={visible ? 0 : -1} className="btn btn-primary ml-1 min-h-12">
          {signedIn ? "Open your board" : "Sign up free"}
        </Link>
        {!signedIn && (
          <Link
            href="/login"
            tabIndex={visible ? 0 : -1}
            className="flex min-h-12 items-center rounded-full px-4 font-semibold text-board-muted transition-colors hover:text-board-foreground"
          >
            Log in
          </Link>
        )}
      </div>
    </div>
  );
}
