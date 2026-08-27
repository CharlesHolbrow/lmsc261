import { auth } from "@/auth"
import { NextResponse } from "next/server"

// https://nextjs.org/docs/app/getting-started/proxy
// In Next.js 16+, Middleware is now called Proxy.

// Required repo tag prefix for course access
const COURSE_TAG_PREFIX = "berklee-epd/lmsc261"


export const proxy = auth((req) => {
  const { pathname } = req.nextUrl

  // Build signin URL with callback to return user to their original destination
  const signinUrl = new URL("/auth/signin", req.url)
  signinUrl.searchParams.set("callbackUrl", pathname)

  // Must be signed in
  if (!req.auth?.user) {
    return NextResponse.redirect(signinUrl)
  }

  // Must have course repo access (any permission level)
  const repoTags = req.auth.user.repoTags || []
  const hasCourseAccess = repoTags.some((tag: string) =>
    tag.startsWith(COURSE_TAG_PREFIX)
  )

  if (!hasCourseAccess) {
    // Signed in but not enrolled - redirect to signin with reason
    signinUrl.searchParams.set("reason", "not-enrolled")
    return NextResponse.redirect(signinUrl)
  }

  // Admin routes have additional page-level checks (isAdmin)
  return NextResponse.next()
})

// All course content requires enrollment (berklee-epd/mtec345:* tag)
// Note: /admin has additional isAdmin check at page level
export const config = {
  matcher: [
    "/admin/:path*",
    "/assignments/:path*",
    "/modules/:path*",
    "/syllabus/:path*",
    // Public routes (not in matcher):
    // - / (home)
    // - /auth/signin
    // - /you (shows sign-in status)
    // - /syllabus (if you want it public)
  ],
}
