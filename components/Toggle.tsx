"use client";

import { useState } from "react";

export default function Toggle({
  title,
  children,
  defaultOpen = false,
  className,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState<boolean>(defaultOpen);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 select-none cursor-pointer"
        aria-expanded={open}
      >
        <span
          className={`transition-transform inline-block ${open ? "rotate-90" : "rotate-0"}`}
          aria-hidden
        >
          ▶
        </span>
        <span className="font-medium">{title}</span>
      </button>
      {open ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
