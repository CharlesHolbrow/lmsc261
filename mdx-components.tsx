import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "@/components/CodeBlock";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    wrapper: ({ children }) => (
      <article className="prose prose-slate max-w-none">{children}</article>
    ),
    code: ({ children, className }) => {
      // Only use CodeBlock for code inside pre (code blocks), not inline code
      const isInline = !className;
      if (isInline) {
        return <code>{children}</code>;
      }
      return <CodeBlock className={className}>{children}</CodeBlock>;
    },
    ...components,
  };
}
