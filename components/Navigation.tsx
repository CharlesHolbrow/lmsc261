"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import ProfileIcon from "./ProfileIcon";

interface NavLink {
  href: string;
  label: string;
}

const navLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/syllabus", label: "Syllabus" },
  { href: "/modules", label: "Modules" },
  { href: "/assignments", label: "Assignments" },
];

interface NavigationProps {
  variant?: "top" | "sidebar" | "footer";
  showBackLink?: boolean;
}

export default function Navigation({
  variant = "top",
  showBackLink = true,
}: NavigationProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isHome = pathname === "/";

  if (variant === "sidebar") {
    return (
      <nav className="flex flex-col gap-1 py-4">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  if (variant === "footer") {
    return (
      <nav className="mt-12 pt-8 border-t border-slate-200">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {showBackLink && !isHome && (
            <Link
              href="/"
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              ← Back to Home
            </Link>
          )}
          {navLinks
            .filter((link) => link.href !== "/" && link.href !== pathname)
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
        </div>
      </nav>
    );
  }

  // Default: top navigation
  return (
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between h-14">
          <Link
            href="/"
            className="font-semibold text-slate-900 hover:text-slate-600 transition-colors"
          >
            LMSC-261
          </Link>
          <div className="flex items-center gap-6">
            {navLinks
              .filter((link) => link.href !== "/")
              .map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${isActive
                      ? "text-slate-900"
                      : "text-slate-500 hover:text-slate-900"
                      }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

            {/* Auth link/icon */}
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
            ) : session?.user ? (
              <Link href="/you" className="hover:opacity-80 transition-opacity">
                <ProfileIcon
                  profile={{
                    picture: session.user.image || undefined,
                    name: session.user.username || session.user.name || "User",
                  }}
                />
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
