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
    </article>
  )
}
