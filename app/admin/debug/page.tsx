import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { testNotionConnection } from "@/lib/notion"

export default async function DebugPage() {
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

  // Test connections
  const notionTest = await testNotionConnection()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      <p className="mb-6 text-gray-600">
        Connection status and configuration details.
      </p>

      {/* Notion Connection */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Notion Connection</h2>
        <div
          className={`p-4 rounded border ${notionTest.success
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
            }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-lg ${notionTest.success ? "text-green-600" : "text-red-600"
                }`}
            >
              {notionTest.success ? "✓" : "✗"}
            </span>
            <span className="font-medium">
              {notionTest.success ? "Connected" : "Connection Failed"}
            </span>
          </div>

          {notionTest.success ? (
            <dl className="text-sm space-y-1">
              <div>
                <dt className="inline text-gray-500">Database: </dt>
                <dd className="inline">{notionTest.databaseName}</dd>
              </div>
              <div>
                <dt className="inline text-gray-500">ID: </dt>
                <dd className="inline font-mono text-xs">
                  {notionTest.databaseId}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-red-600">{notionTest.error}</p>
          )}
        </div>
      </section>

      {/* Environment Check */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Environment Variables</h2>
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <ul className="text-sm space-y-2 font-mono">
            <li>
              <span className="text-gray-500">NOTION_TOKEN:</span>{" "}
              {process.env.NOTION_TOKEN ? (
                <span className="text-green-600">✓ Set</span>
              ) : (
                <span className="text-red-600">✗ Missing</span>
              )}
            </li>
            <li>
              <span className="text-gray-500">NOTION_STUDENTS_DB_ID:</span>{" "}
              {process.env.NOTION_STUDENTS_DB_ID ? (
                <span className="text-green-600">✓ Set</span>
              ) : (
                <span className="text-red-600">✗ Missing</span>
              )}
            </li>
            <li>
              <span className="text-gray-500">GITHUB_ID:</span>{" "}
              {process.env.GITHUB_ID ? (
                <span className="text-green-600">✓ Set</span>
              ) : (
                <span className="text-red-600">✗ Missing</span>
              )}
            </li>
            <li>
              <span className="text-gray-500">GITHUB_SECRET:</span>{" "}
              {process.env.GITHUB_SECRET ? (
                <span className="text-green-600">✓ Set</span>
              ) : (
                <span className="text-red-600">✗ Missing</span>
              )}
            </li>
            <li>
              <span className="text-gray-500">GITHUB_APP_ID:</span>{" "}
              {process.env.GITHUB_APP_ID ? (
                <span className="text-green-600">✓ Set</span>
              ) : (
                <span className="text-red-600">✗ Missing</span>
              )}
            </li>
            <li>
              <span className="text-gray-500">GITHUB_INSTALLATION_ID:</span>{" "}
              {process.env.GITHUB_INSTALLATION_ID ? (
                <span className="text-green-600">✓ Set</span>
              ) : (
                <span className="text-red-600">✗ Missing</span>
              )}
            </li>
            <li>
              <span className="text-gray-500">ADMIN_USERS:</span>{" "}
              {process.env.ADMIN_USERS ? (
                <span className="text-green-600">✓ Set</span>
              ) : (
                <span className="text-red-600">✗ Missing</span>
              )}
            </li>
          </ul>
        </div>
      </section>

      <div className="flex gap-4 mt-8 pt-8 border-t border-gray-200">
        <Link href="/admin" className="text-blue-600 hover:text-blue-800">
          ← Back to Admin
        </Link>
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          Home
        </Link>
      </div>
    </div>
  )
}
