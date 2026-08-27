import { auth, signIn, signOut } from "@/auth"
import Link from "next/link"
import { RefreshButton } from "@/app/auth/signin/RefreshButton"

export default async function YouPage() {
  const session = await auth()

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-4">Your Account</h1>
        <p className="mb-6 text-gray-600">You are not signed in.</p>

        <form
          action={async () => {
            "use server"
            await signIn("github", { redirectTo: "/you" })
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-700"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            Sign in with GitHub
          </button>
        </form>
      </div>
    )
  }

  const username = session.user?.username || session.user?.name || "User"
  const repoTags = session.user?.repoTags || []

  // Extract pending repos from tags (format: "org/repo:permission:pending")
  const pendingRepos = repoTags
    .filter((tag) => tag.endsWith(":pending"))
    .map((tag) => tag.split(":")[0]) // Get "org/repo" part

  // Extract confirmed repos (format: "org/repo:permission")
  const confirmedRepos = repoTags
    .filter((tag) => !tag.endsWith(":pending"))
    .map((tag) => {
      const [repo, permission] = tag.split(":")
      return { repo, permission }
    })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header with username */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{username}</h1>
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600"
            title="View GitHub Profile"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton redirectTo="/you" />
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
      </div>

      {/* Pending invite warning */}
      {pendingRepos.length > 0 && (
        <div className="mb-6 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
          <p className="text-amber-800 text-sm">
            <strong>Action needed:</strong> Accept your pending {pendingRepos.length === 1 ? "invitation" : "invitations"} to get full access:
          </p>
          <ul className="mt-2 space-y-1">
            {pendingRepos.map((repo) => (
              <li key={repo}>
                <a
                  href={`https://github.com/${repo}/invitations`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-800 text-sm font-medium underline hover:text-amber-600"
                >
                  {repo}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-amber-700 text-xs mt-3">
            After accepting, click &quot;Refresh Permissions&quot; above.
          </p>
        </div>
      )}

      {/* Repository access */}
      {confirmedRepos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Your Repositories</h2>
          <ul className="space-y-2">
            {confirmedRepos.map(({ repo, permission }) => (
              <li key={repo} className="flex items-center gap-2">
                <a
                  href={`https://github.com/${repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {repo}
                </a>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {permission}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Session data */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Session Data</h2>
        <pre className="bg-gray-100 text-gray-800 p-4 rounded overflow-x-auto text-sm border border-gray-200">
          <code>{JSON.stringify(session, null, 2)}</code>
        </pre>
      </div>

      <div className="mt-8 pt-8 border-t border-gray-200 flex gap-4 text-sm">
        <Link href="/" className="text-gray-500 hover:text-gray-900">
          ← Back to Home
        </Link>
        {session.user?.isAdmin && (
          <Link href="/admin" className="text-gray-500 hover:text-gray-900">
            Admin Dashboard
          </Link>
        )}
      </div>
    </div>
  )
}
