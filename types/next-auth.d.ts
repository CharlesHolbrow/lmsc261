import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      username?: string // GitHub username
      githubUserId?: string // GitHub user ID (immutable)
      isAdmin?: boolean // Is this user an admin?
      repoTags?: string[] // Repo access from GitHub (format: "org/repo:permission" or "org/repo:permission:pending")
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string
    githubUserId?: string
    isAdmin?: boolean
    repoTags?: string[]
  }
}
