"use client";

import { useEffect, useRef, useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [children]);

  // Extract language from className (e.g., "language-javascript" -> "javascript")
  const language = className?.replace("language-", "") || "";

  const handleCopy = async () => {
    if (codeRef.current) {
      const text = codeRef.current.textContent || "";
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 z-10 w-16 py-1 text-xs text-center rounded bg-slate-200 hover:bg-slate-300 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Copy code to clipboard"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <code ref={codeRef} className={language ? `language-${language}` : undefined}>
        {children}
      </code>
    </div>
  );
}
