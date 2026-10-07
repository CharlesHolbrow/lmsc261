"use client";

import { useEffect, useId, useRef } from "react";

const PYSCRIPT_VERSION = "2026.7.3";
export const PYSCRIPT_CORE_JS = `https://pyscript.net/releases/${PYSCRIPT_VERSION}/core.js`;
export const PYSCRIPT_CORE_CSS = `https://pyscript.net/releases/${PYSCRIPT_VERSION}/core.css`;

type PyScriptKind = "py-editor" | "mpy-editor";

type PyEditorScript = HTMLScriptElement & {
  xworker?: {
    sync: { runAsync: (code: string) => Promise<unknown> };
    terminate: () => void;
  };
};

function trimCode(code: string) {
  return code.replace(/^\n/, "").replace(/\n$/, "");
}

function ensurePyScriptAssets() {
  if (!document.getElementById("pyscript-css")) {
    const link = document.createElement("link");
    link.id = "pyscript-css";
    link.rel = "stylesheet";
    link.href = PYSCRIPT_CORE_CSS;
    document.head.appendChild(link);
  }
  if (!document.getElementById("pyscript-core")) {
    const script = document.createElement("script");
    script.id = "pyscript-core";
    script.type = "module";
    script.src = PYSCRIPT_CORE_JS;
    document.head.appendChild(script);
  }
}

export function PyScriptEditor({
  initialCode,
  verifyCode,
  kind = "py-editor",
  rows,
}: {
  initialCode: string;
  /** Hidden Python run in the same worker after the student's code finishes. */
  verifyCode?: string;
  kind?: PyScriptKind;
  rows?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const outputId = `pyscript-output-${useId().replaceAll(":", "")}`;
  const code = trimCode(initialCode);
  const verify = verifyCode ? trimCode(verifyCode) : undefined;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const script = document.createElement("script") as PyEditorScript;
    script.type = kind;
    script.textContent = code;
    script.setAttribute("output", outputId);
    if (rows) script.setAttribute("rows", String(rows));
    host.appendChild(script);

    const timeoutId = window.setTimeout(ensurePyScriptAssets, 50);
    const output = () => document.getElementById(outputId);
    const markRunning = () => {
      const el = output();
      if (!el) return;
      // Keep the node empty so the CSS :empty hint can show "Running..."
      // PyScript also clears this element, then appends stdout when done.
      el.replaceChildren();
      el.setAttribute("data-running", "");
      el.setAttribute("aria-busy", "true");
    };
    const onRun = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest(
        ".py-editor-run-button, .mpy-editor-run-button",
      );
      // The stop button reuses this control; don't flash "Running..." for that.
      if (!button || button.classList.contains("running")) return;
      markRunning();
    };
    const onDone = async () => {
      const el = output();
      if (el) {
        el.removeAttribute("data-running");
        el.removeAttribute("aria-busy");
      }
      if (verify && script.xworker?.sync) {
        await script.xworker.sync.runAsync(verify);
      }
    };
    // Capture clicks so this runs before PyScript's handler. Hotkeys
    // (⌘/Ctrl/Shift+Enter) programmatically click the same run button.
    host.addEventListener("click", onRun, true);
    host.addEventListener("py-editor:done", onDone);

    return () => {
      window.clearTimeout(timeoutId);
      host.removeEventListener("click", onRun, true);
      host.removeEventListener("py-editor:done", onDone);
      // PyScript rewrites the script type to `${kind}-active` and inserts a
      // <py-editor>/<mpy-editor> sibling, then moves our output <pre> into it.
      // Removing only the script leaves that custom element, so Fast Refresh
      // appends a second editor on top of the first.
      script.xworker?.terminate();
      const playground = host.parentElement;
      const output = document.getElementById(outputId);
      if (output && playground && output.parentElement !== playground) {
        playground.appendChild(output);
      }
      host.replaceChildren();
    };
  }, [code, kind, outputId, rows, verify]);

  return (
    <div className="pyscript-playground not-prose my-6 overflow-hidden rounded border border-slate-200">
      <div ref={hostRef} />
      <pre
        id={outputId}
        data-empty-hint="Click Run, or press ⌘+Enter / Ctrl+Enter with the cursor in the editor."
        className="pyscript-playground-output m-0 min-h-24 whitespace-pre-wrap border-0 border-t border-slate-200 bg-white p-3 font-mono text-sm text-slate-800"
      />
    </div>
  );
}
