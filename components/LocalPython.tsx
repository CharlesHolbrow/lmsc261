"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

const PYODIDE_VERSION = "314.0.7";
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
export const PYODIDE_SCRIPT_SRC = `${PYODIDE_INDEX_URL}pyodide.js`;

type PyodideRuntime = {
  runPython: (code: string) => unknown;
  setStdout: (options: { batched: (msg: string) => void }) => void;
  setStderr: (options: { batched: (msg: string) => void }) => void;
};

declare global {
  interface Window {
    loadPyodide?: (config?: { indexURL?: string }) => Promise<PyodideRuntime>;
  }
}

let pyodidePromise: Promise<PyodideRuntime> | null = null;

function getPyodide() {
  if (!window.loadPyodide) {
    return Promise.reject(new Error("Pyodide script has not loaded yet."));
  }
  if (!pyodidePromise) {
    pyodidePromise = window.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
  }
  return pyodidePromise;
}

function insertAtCursor(value: string, start: number, end: number, insert: string) {
  return {
    next: value.slice(0, start) + insert + value.slice(end),
    cursor: start + insert.length,
  };
}

export function LocalPython({
  initialCode,
  minHeight = 220,
}: {
  initialCode: string;
  minHeight?: number;
}) {
  const startingCode = useMemo(() => initialCode.replace(/^\n/, "").replace(/\n$/, ""), [initialCode]);
  const [code, setCode] = useState(startingCode);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "running" | "error">("loading");
  const [message, setMessage] = useState("Loading Python in this browser…");

  async function handleReady() {
    try {
      await getPyodide();
      setStatus("ready");
      setMessage("Ready. Code stays in your browser.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not start Python.");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function waitForRuntime() {
      const started = Date.now();
      while (!window.loadPyodide && Date.now() - started < 30000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (cancelled) return;
      await handleReady();
    }

    void waitForRuntime();
    return () => {
      cancelled = true;
    };
  }, []);

  async function run() {
    setStatus("running");
    setMessage("Running…");
    setOutput("");
    try {
      const pyodide = await getPyodide();
      const chunks: string[] = [];
      const write = (msg: string) => {
        chunks.push(msg.endsWith("\n") ? msg : `${msg}\n`);
      };
      pyodide.setStdout({ batched: write });
      pyodide.setStderr({ batched: write });
      pyodide.runPython(code);
      setOutput(chunks.join("").trimEnd());
      setStatus("ready");
      setMessage("Ready. Code stays in your browser.");
    } catch (error) {
      setStatus("error");
      setOutput(error instanceof Error ? error.message : String(error));
      setMessage("Python raised an error.");
    }
  }

  return (
    <div className="not-prose my-6 overflow-hidden rounded border border-slate-200">
      <Script
        id="pyodide"
        src={PYODIDE_SCRIPT_SRC}
        strategy="afterInteractive"
        onReady={() => {
          void handleReady();
        }}
        onError={() => {
          setStatus("error");
          setMessage("Could not load the Pyodide script.");
        }}
      />
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-sm text-slate-600">{message}</p>
        <button
          type="button"
          onClick={() => void run()}
          disabled={status === "loading" || status === "running"}
          className="cursor-pointer rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Run
        </button>
      </div>
      <textarea
        value={code}
        spellCheck={false}
        aria-label="Python editor"
        onChange={(event) => setCode(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Tab") {
            event.preventDefault();
            const target = event.currentTarget;
            const { next, cursor } = insertAtCursor(
              code,
              target.selectionStart,
              target.selectionEnd,
              "    "
            );
            setCode(next);
            requestAnimationFrame(() => {
              target.selectionStart = cursor;
              target.selectionEnd = cursor;
            });
          }
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void run();
          }
        }}
        className="block w-full resize-y border-0 bg-[#f6f8fa] p-3 font-mono text-sm leading-6 text-slate-900 outline-none"
        style={{ minHeight }}
      />
      <pre className="m-0 min-h-24 whitespace-pre-wrap border-0 border-t border-slate-200 bg-white p-3 text-sm text-slate-800">
        {output || "Output will appear here."}
      </pre>
    </div>
  );
}
