"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"

export function SignInButton() {
  const pathname = usePathname()

  return (
    <button
      type="button"
      onClick={() => signIn("github", { callbackUrl: pathname })}
      className="cursor-pointer text-blue-600 hover:text-blue-800 underline"
    >
      Sign in
    </button>
  )
}

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="text-blue-600 hover:text-blue-800 underline"
    >
      Sign out
    </button>
  )
}

export function UserNav() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <span className="text-gray-500">...</span>
  }

  if (!session) {
    return <SignInButton />
  }

  return (
    <span>
      {session.user?.username || session.user?.name} · <SignOutButton />
    </span>
  )
}
