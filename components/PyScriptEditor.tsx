"use client";

import { useEffect, useId, useRef } from "react";

const PYSCRIPT_VERSION = "2026.7.3";
export const PYSCRIPT_CORE_JS = `https://pyscript.net/releases/${PYSCRIPT_VERSION}/core.js`;
export const PYSCRIPT_CORE_CSS = `https://pyscript.net/releases/${PYSCRIPT_VERSION}/core.css`;

type PyScriptKind = "py-editor" | "mpy-editor";

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
  kind = "py-editor",
  rows,
}: {
  initialCode: string;
  kind?: PyScriptKind;
  rows?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const outputId = `pyscript-output-${useId().replaceAll(":", "")}`;
  const code = initialCode.replace(/^\n/, "").replace(/\n$/, "");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const script = document.createElement("script");
    script.type = kind;
    script.textContent = code;
    script.setAttribute("output", outputId);
    if (rows) script.setAttribute("rows", String(rows));
    host.appendChild(script);

    const timeoutId = window.setTimeout(ensurePyScriptAssets, 50);
    const onRun = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest(".py-editor-run-button, .mpy-editor-run-button")) return;
      const output = document.getElementById(outputId);
      if (output) output.textContent = "";
    };
    host.addEventListener("click", onRun, true);

    return () => {
      window.clearTimeout(timeoutId);
      host.removeEventListener("click", onRun, true);
      script.remove();
    };
  }, [code, kind, outputId, rows]);

  return (
    <div className="pyscript-playground not-prose my-6 overflow-hidden rounded border border-slate-200">
      <div ref={hostRef} />
      <pre
        id={outputId}
        className="pyscript-playground-output m-0 min-h-24 whitespace-pre-wrap border-0 border-t border-slate-200 bg-white p-3 font-mono text-sm text-slate-800"
      />
    </div>
  );
}
