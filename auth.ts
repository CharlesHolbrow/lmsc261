import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { registerOrFindUser } from "@/lib/notion"
import { getUserRepoAccessByUsername } from "@/lib/github"

function getAdminUsers(): string[] {
  const admins = process.env.ADMIN_USERS || ""
  return admins
    .split(",")
    .map((u) => u.trim().toLowerCase())
    .filter(Boolean)
}

function isAdmin(username: string): boolean {
  return getAdminUsers().includes(username.toLowerCase())
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ profile }) {
      // Allow sign-in for everyone
      // Register them in Notion to track who has authenticated
      if (!profile?.login || !profile?.id) {
        console.log("[Auth] signIn: Missing profile.login or profile.id")
        return false
      }

      console.log("[Auth] signIn: Registering user", {
        githubUserId: String(profile.id),
        githubUsername: profile.login,
        name: profile.name,
        email: profile.email,
      })

      try {
        const result = await registerOrFindUser({
          githubUserId: String(profile.id),
          githubUsername: profile.login as string,
          name: (profile.name as string) || undefined,
          email: profile.email || undefined,
        })
        console.log("[Auth] signIn: User registered/found", {
          isNew: result.isNew,
          notionId: result.user.id,
        })
      } catch (error) {
        // Log but don't block sign-in if Notion fails
        console.error("[Auth] signIn: Failed to register user in Notion:", error)
      }

      return true
    },

    async jwt({ token, account, profile, trigger }) {
      // On sign-in, populate token with GitHub info
      if (account && profile) {
        token.username = profile.login as string
        token.githubUserId = String(profile.id)
        token.isAdmin = isAdmin(profile.login as string)

        // Fetch repo access from GitHub (includes pending invitations)
        try {
          token.repoTags = await getUserRepoAccessByUsername(profile.login as string)
        } catch (error) {
          console.error("Failed to fetch repo access from GitHub:", error)
          token.repoTags = []
        }
      }

      // Allow client-side refresh via update() without full re-auth
      if (trigger === "update" && token.username) {
        try {
          token.repoTags = await getUserRepoAccessByUsername(token.username)
        } catch (error) {
          console.error("Failed to refresh repo access from GitHub:", error)
        }
      }

      return token
    },

    async session({ session, token }) {
      // Send properties to the client
      if (token.username) {
        session.user.username = token.username
      }
      if (token.githubUserId) {
        session.user.githubUserId = token.githubUserId
      }
      if (token.isAdmin !== undefined) {
        session.user.isAdmin = token.isAdmin
      }
      if (token.repoTags) {
        session.user.repoTags = token.repoTags
      }
      return session
    },

    async authorized({ auth }) {
      // Allow access if user is authenticated
      return !!auth?.user
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
})
