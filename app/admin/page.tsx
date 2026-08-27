import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getReposWithCollaborators } from "@/lib/github"
import { getAllUsersFromNotion } from "@/lib/notion"
import PermissionManager from "./PermissionManager"

// Merged user type combining Notion + GitHub data
interface MergedUser {
  githubUserId: string
  githubUsername: string
  email?: string
  signInDate?: string // ISO date string, undefined if never signed in
  repos: { fullName: string; role: string }[]
  pendingInvites: { fullName: string; permissions: string }[]
}

export default async function AdminPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  // Check admin access (isAdmin is set in JWT during sign-in)
  if (!session.user?.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-4">
          You don&apos;t have permission to access this page.
        </p>
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
      </div>
    )
  }

  let error: string | null = null
  let mergedUsers: MergedUser[] = []
  const repoNames: string[] = []

  try {
    // Fetch both data sources in parallel
    const [notionUsers, reposWithCollaborators] = await Promise.all([
      getAllUsersFromNotion(),
      getReposWithCollaborators(),
    ])

    // Build a map of all users
    const userMap = new Map<string, MergedUser>()

    // Add Notion users (who have signed in)
    for (const user of notionUsers) {
      userMap.set(user.githubUserId, {
        githubUserId: user.githubUserId,
        githubUsername: user.githubUsername,
        email: user.email,
        signInDate: user.signInDate,
        repos: [],
        pendingInvites: [],
      })
    }

    // Add/merge GitHub collaborators
    for (const { repo, collaborators, pendingInvitations } of reposWithCollaborators) {
      repoNames.push(repo.fullName)

      for (const collab of collaborators) {
        const userId = String(collab.id)
        if (userMap.has(userId)) {
          // User exists, add repo access
          userMap.get(userId)!.repos.push({
            fullName: repo.fullName,
            role: collab.role,
          })
        } else {
          // User hasn't signed in but has repo access
          userMap.set(userId, {
            githubUserId: userId,
            githubUsername: collab.login,
            email: undefined,
            signInDate: undefined,
            repos: [{ fullName: repo.fullName, role: collab.role }],
            pendingInvites: [],
          })
        }
      }

      // Track pending invitations
      for (const inv of pendingInvitations) {
        if (inv.login) {
          // Find user by username (we don't have ID for invitees)
          const existingUser = Array.from(userMap.values()).find(
            (u) => u.githubUsername.toLowerCase() === inv.login?.toLowerCase()
          )
          if (existingUser) {
            existingUser.pendingInvites.push({
              fullName: repo.fullName,
              permissions: inv.permissions,
            })
          }
        }
      }
    }

    // Convert to sorted array (most recent sign-ins first, then users who haven't signed in)
    mergedUsers = Array.from(userMap.values()).sort((a, b) => {
      // Users without sign-in date go to the bottom
      if (!a.signInDate && !b.signInDate) {
        return a.githubUsername.toLowerCase().localeCompare(b.githubUsername.toLowerCase())
      }
      if (!a.signInDate) return 1
      if (!b.signInDate) return -1
      // Most recent first
      return new Date(b.signInDate).getTime() - new Date(a.signInDate).getTime()
    })
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to fetch data"
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">{session.user?.username}</p>
        </div>
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/" })
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Sign Out
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {!error && (
        <PermissionManager repoNames={repoNames} users={mergedUsers} />
      )}

      <div className="mt-8 pt-8 border-t border-gray-200 flex gap-4 text-sm">
        <Link href="/" className="text-gray-500 hover:text-gray-900">
          ← Back to Home
        </Link>
        <Link href="/admin/debug" className="text-gray-500 hover:text-gray-900">
          Debug Info
        </Link>
      </div>
    </div>
  )
}
