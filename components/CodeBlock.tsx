"use client";

import { useEffect, useRef, useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

interface CodeBlockProps {
  children: React.ReactNode;
}

export function CodeBlock({ children }: CodeBlockProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const code = preRef.current?.querySelector("code");
    if (code && !code.dataset.highlighted) {
      hljs.highlightElement(code);
    }
  }, [children]);

  const handleCopy = async () => {
    const code = preRef.current?.querySelector("code");
    const text = code?.textContent || preRef.current?.textContent || "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 z-10 w-16 py-1 text-xs text-center rounded bg-slate-200 hover:bg-slate-300 hover:cursor-pointer text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Copy code to clipboard"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre ref={preRef}>{children}</pre>
    </div>
  );
}
