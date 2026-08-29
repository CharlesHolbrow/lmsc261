import { auth } from "@/auth"
import { GitHubSignInButton } from "@/components/GitHubSignIn"

export default async function Home() {
  const session = await auth()

  return (
    <article className="prose prose-slate max-w-none">
      <h1>LMSC-261</h1>
      <p>Introduction to Computer Programming</p>
      <p>Welcome to the LMSC-261 course website.</p>

      {!session?.user && (
        <div className="not-prose mt-8">
          <p className="text-gray-600 mb-3">Taking this course?</p>
          <GitHubSignInButton />
        </div>
      )}

      {session && (
        <div className="not-prose mt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Course Resources</h2>
          <ul className="space-y-2">
            <li>
              <a
                href="https://github.com/berklee-epd/lmsc261"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Class materials
              </a>
            </li>
            <li>
              <a
                href="https://github.com/berklee-epd/lmsc261-homework"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Homework
              </a>
            </li>
            <li>
              <a
                href="https://www.youtube.com/playlist?list=PLSeBZrCqPtmo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                YouTube playlist
              </a>
            </li>
            <li>
              <a
                href="https://canvas.berklee.edu/courses/63535"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Canvas Page
              </a>
            </li>
          </ul>
        </div>
      )}
    </article>
  )
}
