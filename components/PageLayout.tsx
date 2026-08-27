import { ReactNode } from "react";
import Navigation from "./Navigation";

interface PageLayoutProps {
  children: ReactNode;
  /** Where to show navigation: "top", "sidebar", "footer", or "none" */
  navPosition?: "top" | "sidebar" | "footer" | "none";
  /** Use prose styling for content (markdown-like) */
  useProse?: boolean;
}

export default function PageLayout({
  children,
  navPosition = "top",
  useProse = true,
}: PageLayoutProps) {
  const contentClasses = useProse ? "prose prose-slate max-w-none" : "";

  if (navPosition === "sidebar") {
    return (
      <div className="min-h-screen flex">
        <aside className="w-56 shrink-0 border-r border-slate-200 px-4">
          <div className="sticky top-4">
            <Navigation variant="sidebar" />
          </div>
        </aside>
        <main className="flex-1 px-8 py-8 max-w-4xl">
          <article className={contentClasses}>{children}</article>
        </main>
      </div>
    );
  }

  if (navPosition === "top") {
    return (
      <div className="min-h-screen">
        <Navigation variant="top" />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <article className={contentClasses}>{children}</article>
        </main>
      </div>
    );
  }

  // Footer nav or no nav
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article className={contentClasses}>{children}</article>
        {navPosition === "footer" && <Navigation variant="footer" />}
      </main>
    </div>
  );
}
