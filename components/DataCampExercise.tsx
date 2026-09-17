"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

/** Official embed. The npm `datacamp-light` package is a security-holding stub. */
export const DATACAMP_LIGHT_SCRIPT_SRC =
  "https://cdn.datacamp.com/dcl-react.js.gz";

type DataCampLang = "python" | "r" | "shell";

type DataCampExerciseProps = {
  id?: string;
  lang?: DataCampLang;
  height?: number | "auto";
  showRunButton?: boolean;
  preExerciseCode?: string;
  sampleCode?: string;
  solution?: string;
  sct?: string;
  hint?: string;
};

declare global {
  interface Window {
    DCL?: {
      init?: () => void;
      initAddedDCLightExercises?: () => void;
      instances?: Record<string, unknown>;
    };
    initAddedDCLightExercises?: () => void;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function codeBlock(type: string, value?: string) {
  if (!value) return "";
  return `<code data-type="${type}">${escapeHtml(value.trim())}</code>`;
}

export function initDataCampLightExercises() {
  if (typeof window === "undefined") return;
  if (typeof window.DCL?.init === "function") {
    window.DCL.init();
    return;
  }
  if (typeof window.DCL?.initAddedDCLightExercises === "function") {
    window.DCL.initAddedDCLightExercises();
    return;
  }
  if (typeof window.initAddedDCLightExercises === "function") {
    window.initAddedDCLightExercises();
  }
}

export function DataCampLightScript() {
  return (
    <Script
      id="datacamp-light"
      src={DATACAMP_LIGHT_SCRIPT_SRC}
      strategy="afterInteractive"
      onReady={initDataCampLightExercises}
    />
  );
}

export function DataCampExercise({
  id,
  lang = "python",
  height = "auto",
  showRunButton = false,
  preExerciseCode,
  sampleCode,
  solution,
  sct,
  hint,
}: DataCampExerciseProps) {
  // Render after mount so DataCamp's bundled React 16 can replace this node
  // without fighting Next.js hydration.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    initDataCampLightExercises();
  }, [mounted]);

  const innerHtml = [
    codeBlock("pre-exercise-code", preExerciseCode),
    codeBlock("sample-code", sampleCode),
    codeBlock("solution", solution),
    codeBlock("sct", sct),
    hint ? `<div data-type="hint">${escapeHtml(hint.trim())}</div>` : "",
  ].join("");

  return (
    <div className="not-prose my-6">
      <DataCampLightScript />
      {mounted ? (
        <div
          id={id}
          data-datacamp-exercise=""
          data-lang={lang}
          data-height={String(height)}
          data-show-run-button={showRunButton ? "" : undefined}
          data-no-lazy-load=""
          dangerouslySetInnerHTML={{ __html: innerHtml }}
        />
      ) : (
        <div
          className="datacamp-exercise-placeholder rounded border border-slate-200 bg-slate-50"
          style={{ minHeight: typeof height === "number" ? height : 300 }}
        />
      )}
    </div>
  );
}
