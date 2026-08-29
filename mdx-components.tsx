import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "@/components/CodeBlock";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    wrapper: ({ children }) => (
      <article className="prose prose-slate max-w-none">{children}</article>
    ),
    // Fenced blocks always come through `pre`, including fences with no language.
    // Language-based className is not a reliable inline-vs-block check.
    pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
    code: ({ children, className }) => <code className={className}>{children}</code>,
  };
}
