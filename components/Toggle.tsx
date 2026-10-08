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
      <div className="grid grid-cols-[auto_1fr] gap-x-2 items-start">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="col-span-2 grid grid-cols-subgrid items-center text-left select-none cursor-pointer"
          aria-expanded={open}
        >
          <span
            className={`transition-transform inline-block ${open ? "rotate-90" : "rotate-0"}`}
            aria-hidden
          >
            ▶
          </span>
          <span className="font-medium toggle-trigger">{title}</span>
        </button>
        {open ? (
          <div className="col-start-2 mt-2 min-w-0">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
