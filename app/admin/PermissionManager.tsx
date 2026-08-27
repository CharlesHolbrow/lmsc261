"use client"

import { useState, useTransition } from "react"
import { applyPermissionsAction } from "./actions"

type Permission = "skip" | "remove" | "read" | "write"

interface MergedUser {
  githubUserId: string
  githubUsername: string
  email?: string
  signInDate?: string
  repos: { fullName: string; role: string }[]
  pendingInvites: { fullName: string; permissions: string }[]
}

interface Props {
  repoNames: string[]
  users: MergedUser[]
}

export default function PermissionManager({ repoNames, users }: Props) {
  // State for each repo's selected permission
  const [repoPermissions, setRepoPermissions] = useState<
    Record<string, Permission>
  >(() => {
    const initial: Record<string, Permission> = {}
    for (const repo of repoNames) {
      initial[repo] = "skip"
    }
    return initial
  })

  // Track loading state per user
  const [loadingUser, setLoadingUser] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Track results
  const [results, setResults] = useState<
    Record<string, { success: boolean; errors: string[] }>
  >({})

  const handleApply = (user: MergedUser) => {
    // Filter out "skip" repos - only apply repos that have an actual action
    const permissionsToApply: Record<string, "remove" | "read" | "write"> = {}
    for (const [repo, perm] of Object.entries(repoPermissions)) {
      if (perm !== "skip") {
        permissionsToApply[repo] = perm
      }
    }

    // Don't do anything if all repos are set to "skip"
    if (Object.keys(permissionsToApply).length === 0) {
      setResults((prev) => ({
        ...prev,
        [user.githubUsername]: { success: false, errors: ["No changes selected"] },
      }))
      return
    }

    setLoadingUser(user.githubUsername)
    setResults((prev) => ({ ...prev, [user.githubUsername]: undefined! }))

    startTransition(async () => {
      const result = await applyPermissionsAction(
        user.githubUsername,
        permissionsToApply
      )
      setResults((prev) => ({ ...prev, [user.githubUsername]: result }))
      setLoadingUser(null)
    })
  }

  return (
    <div>
      {/* Repo Permission Selectors */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="font-bold mb-3">Set Permissions to Apply</h2>
        <div className="space-y-2">
          {repoNames.map((repo) => (
            <div key={repo} className="flex items-center gap-3">
              <span
                className={`font-mono text-sm min-w-48 ${repoPermissions[repo] === "skip" ? "text-gray-500" : ""
                  }`}
              >
                {repo}
              </span>
              <select
                value={repoPermissions[repo]}
                onChange={(e) =>
                  setRepoPermissions((prev) => ({
                    ...prev,
                    [repo]: e.target.value as Permission,
                  }))
                }
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="skip">— Skip</option>
                <option value="remove">Remove</option>
                <option value="read">Read</option>
                <option value="write">Write</option>
              </select>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Select permissions, then click &quot;Apply&quot; on each user row.
          &quot;Skip&quot; = no change, &quot;Remove&quot; = revoke access.
        </p>
      </div>

      {/* Users Table */}
      <h2 className="text-xl font-bold mb-4">Users ({users.length})</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 px-2">Username</th>
              <th className="text-left py-2 px-2">Signed In</th>
              <th className="text-left py-2 px-2">Current Access</th>
              <th className="text-left py-2 px-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const result = results[user.githubUsername]
              const isLoading = loadingUser === user.githubUsername && isPending

              return (
                <tr
                  key={user.githubUserId}
                  className="border-b border-gray-200"
                >
                  <td className="py-2 px-2">
                    <a
                      href={`https://github.com/${user.githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {user.githubUsername}
                    </a>
                    {user.email && (
                      <span className="text-gray-500 text-xs ml-2">
                        ({user.email})
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    {user.signInDate ? (
                      <span className="text-green-600 text-xs">
                        {new Date(user.signInDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    {user.repos.length > 0 || user.pendingInvites.length > 0 ? (
                      <ul className="space-y-1">
                        {user.repos.map((r) => (
                          <li key={r.fullName}>
                            <span className="font-mono text-xs">
                              {r.fullName}
                            </span>
                            <span className="text-gray-500 ml-1">
                              ({r.role})
                            </span>
                          </li>
                        ))}
                        {user.pendingInvites.map((inv) => (
                          <li key={`pending-${inv.fullName}`} className="text-amber-600">
                            <span className="font-mono text-xs">
                              {inv.fullName}
                            </span>
                            <span className="ml-1 italic">(pending)</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">No access</span>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    <button
                      onClick={() => handleApply(user)}
                      disabled={isLoading}
                      title={result && !result.success ? result.errors.join(", ") : undefined}
                      className={`px-3 py-1 rounded text-xs transition-colors ${result?.success
                        ? "bg-green-600 text-white"
                        : result && !result.success
                          ? "bg-red-100 text-red-700 border border-red-300"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading
                        ? "..."
                        : result?.success
                          ? "✓"
                          : result && !result.success
                            ? "✗"
                            : "Apply"}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <p className="text-gray-500 mt-4">No users found.</p>
      )}
    </div>
  )
}
