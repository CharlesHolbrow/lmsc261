import type { ReactNode } from "react";

type RenderOptions = {
  indentSize?: number;
};

const classes = {
  // Structure
  punctuation: "text-gray-600",
  key: "text-sky-600",
  // Primitives
  string: "text-emerald-600",
  number: "text-amber-700",
  boolean: "text-purple-600",
  nullish: "text-pink-600",
  func: "text-indigo-600",
  symbol: "text-fuchsia-600",
  ctor: "text-blue-600",
};

export default function RenderValue({ object, indentSize = 2 }: { object: unknown; indentSize?: number }) {
  return (
    <pre className="p-4 rounded-lg overflow-x-auto font-mono text-sm">
      {renderValueJSX(object, { indentSize })}
    </pre>
  );
}

export function renderValueJSX(value: unknown, opts: RenderOptions = {}): ReactNode {
  const indentUnit = " ".repeat(opts.indentSize ?? 2);
  const seen = new WeakSet<object>();

  function isPlainObject(val: unknown): val is Record<string, unknown> {
    return Object.prototype.toString.call(val) === "[object Object]";
  }

  function render(val: unknown, depth: number): ReactNode {
    // functions
    if (typeof val === "function") {
      const fnName = (val as { name?: string }).name;
      return (
        <span className={classes.func}>
          {`[Function${fnName ? ": " + fnName : ""}]`}
        </span>
      );
    }

    // primitives
    if (typeof val === "string") {
      return (
        <>
          <span className={classes.punctuation}>{'"'}</span>
          <span className={classes.string}>{val}</span>
          <span className={classes.punctuation}>{'"'}</span>
        </>
      );
    }
    if (typeof val === "number") {
      return <span className={classes.number}>{String(val)}</span>;
    }
    if (typeof val === "bigint") {
      return <span className={classes.number}>{String(val)}n</span>;
    }
    if (typeof val === "boolean") {
      return <span className={classes.boolean}>{String(val)}</span>;
    }
    if (typeof val === "symbol") {
      return <span className={classes.symbol}>{String(val)}</span>;
    }
    if (val === null) {
      return <span className={classes.nullish}>null</span>;
    }
    if (val === undefined) {
      return <span className={classes.nullish}>undefined</span>;
    }

    // objects and arrays
    if (val && typeof val === "object") {
      if (seen.has(val as object)) {
        return <span className={classes.nullish}>[Circular]</span>;
      }
      seen.add(val as object);

      // Date
      if (val instanceof Date) {
        const iso = isNaN(val.getTime()) ? "Invalid Date" : val.toISOString();
        return (
          <>
            <span className={classes.ctor}>Date</span>
            <span className={classes.punctuation}>(</span>
            <span className={classes.punctuation}>{'"'}</span>
            <span className={classes.string}>{iso}</span>
            <span className={classes.punctuation}>{'"'}</span>
            <span className={classes.punctuation}>)</span>
          </>
        );
      }

      // Array
      if (Array.isArray(val)) {
        if (val.length === 0) {
          return (
            <>
              <span className={classes.punctuation}>[</span>
              <span className={classes.punctuation}>]</span>
            </>
          );
        }
        const nodes: ReactNode[] = [];
        nodes.push(<span key={`open-${depth}`} className={classes.punctuation}>[</span>);
        nodes.push(<span key={`nl-open-${depth}`}>{"\n"}</span>);
        for (let i = 0; i < val.length; i++) {
          nodes.push(<span key={`indent-${depth + 1}-${i}`}>{indentUnit.repeat(depth + 1)}</span>);
          nodes.push(<span key={`item-${i}`}>{render(val[i], depth + 1)}</span>);
          if (i < val.length - 1) nodes.push(<span key={`comma-${i}`} className={classes.punctuation}>,</span>);
          nodes.push(<span key={`nl-item-${depth}-${i}`}>{"\n"}</span>);
        }
        nodes.push(<span key={`indent-close-${depth}`}>{indentUnit.repeat(depth)}</span>);
        nodes.push(<span key={`close-${depth}`} className={classes.punctuation}>]</span>);
        return <>{nodes}</>;
      }

      // Plain object
      if (isPlainObject(val)) {
        const entries = Object.entries(val as Record<string, unknown>);
        if (entries.length === 0) {
          return (
            <>
              <span className={classes.punctuation}>{"{"}</span>
              <span className={classes.punctuation}>{"}"}</span>
            </>
          );
        }
        const nodes: ReactNode[] = [];
        nodes.push(<span key={`open-${depth}`} className={classes.punctuation}>{"{"}</span>);
        nodes.push(<span key={`nl-open-${depth}`}>{"\n"}</span>);
        entries.forEach(([k, v], idx) => {
          nodes.push(<span key={`indent-${depth + 1}-${idx}`}>{indentUnit.repeat(depth + 1)}</span>);
          // "key":
          nodes.push(<span key={`q1-${k}`} className={classes.punctuation}>{'"'}</span>);
          nodes.push(<span key={`key-${k}`} className={classes.key}>{k}</span>);
          nodes.push(<span key={`q2-${k}`} className={classes.punctuation}>{'"'}</span>);
          nodes.push(<span key={`colon-${k}`} className={classes.punctuation}>: </span>);
          nodes.push(<span key={`val-${k}`}>{render(v, depth + 1)}</span>);
          if (idx < entries.length - 1) nodes.push(<span key={`comma-${k}`} className={classes.punctuation}>,</span>);
          nodes.push(<span key={`nl-entry-${depth}-${idx}`}>{"\n"}</span>);
        });
        nodes.push(<span key={`indent-close-${depth}`}>{indentUnit.repeat(depth)}</span>);
        nodes.push(<span key={`close-${depth}`} className={classes.punctuation}>{"}"}</span>);
        return <>{nodes}</>;
      }

      // Fallback to toString for other objects
      return <span className={classes.string}>{String(val)}</span>;
    }

    // unreachable fallback
    return <span className={classes.string}>{String(val)}</span>;
  }

  return render(value, 0);
}
