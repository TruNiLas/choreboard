"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setStatus("copied");
        } catch {
          // Clipboard blocked (old browser or no permission): the text is on screen to copy by hand.
          setStatus("failed");
        }
        setTimeout(() => setStatus("idle"), 3000);
      }}
    >
      <span aria-live="polite">
        {status === "copied" ? "Copied" : status === "failed" ? "Couldn't copy. Copy the link above." : label}
      </span>
    </Button>
  );
}
