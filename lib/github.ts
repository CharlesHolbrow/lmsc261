import { createAppAuth } from "@octokit/auth-app"
import { Octokit } from "@octokit/rest"

/**
 * Get the GitHub App private key from environment (base64 encoded)
 */
function getPrivateKey(): string {
  const base64Key = process.env.GITHUB_PRIVATE_KEY_BASE64
  if (!base64Key) {
    throw new Error("Missing GITHUB_PRIVATE_KEY_BASE64")
  }
  return Buffer.from(base64Key, "base64").toString("utf8")
}

/**
 * Create an authenticated Octokit instance using GitHub App credentials
 */
function createOctokit(): Octokit {
  const appId = process.env.GITHUB_APP_ID
  const installationId = process.env.GITHUB_INSTALLATION_ID

  if (!appId || !installationId) {
    throw new Error("Missing GITHUB_APP_ID or GITHUB_INSTALLATION_ID")
  }

  const privateKey = getPrivateKey()

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId,
    },
  })
}

export interface Repository {
  id: number
  name: string
  fullName: string
  private: boolean
  url: string
}

export interface Collaborator {
  id: number
  login: string
  avatarUrl: string
  role: "admin" | "maintain" | "write" | "triage" | "read" | "unknown"
}

// Map of GitHub user ID → repo access info
export interface UserRepoAccess {
  githubUserId: string
  githubUsername: string
  repos: { fullName: string; permission: string }[]
}

export interface RepoWithCollaborators {
  repo: Repository
  collaborators: Collaborator[]
  pendingInvitations: { id: number; login: string | null; permissions: string }[]
}

/**
 * List all repositories accessible to this GitHub App installation
 */
export async function listRepos(): Promise<Repository[]> {
  const octokit = createOctokit()

  const { data } = await octokit.apps.listReposAccessibleToInstallation({
    per_page: 100,
  })

  return data.repositories.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    url: repo.html_url,
  }))
}

/**
 * List collaborators for a specific repository
 */
export async function listCollaborators(
  owner: string,
  repo: string
): Promise<Collaborator[]> {
  const octokit = createOctokit()

  const { data } = await octokit.rest.repos.listCollaborators({
    owner,
    repo,
  })

  return data.map((collab) => {
    const permissions = collab.permissions
    // Map GitHub permissions to our role names (highest permission wins)
    let role: Collaborator["role"] = "unknown"
    if (permissions?.admin) role = "admin"
    else if (permissions?.maintain) role = "maintain"
    else if (permissions?.push) role = "write"
    else if (permissions?.triage) role = "triage"
    else if (permissions?.pull) role = "read"

    return {
      id: collab.id,
      login: collab.login,
      avatarUrl: collab.avatar_url,
      role,
    }
  })
}

/**
 * List pending invitations for a specific repository
 */
export async function listPendingInvitations(
  owner: string,
  repo: string
): Promise<{ id: number; login: string | null; permissions: string }[]> {
  const octokit = createOctokit()

  const { data } = await octokit.rest.repos.listInvitations({
    owner,
    repo,
  })

  return data.map((inv) => ({
    id: inv.id,
    login: inv.invitee?.login || null,
    permissions: inv.permissions,
  }))
}

/**
 * Cancel a pending invitation
 */
export async function cancelInvitation(
  owner: string,
  repo: string,
  invitationId: number
): Promise<void> {
  const octokit = createOctokit()

  await octokit.rest.repos.deleteInvitation({
    owner,
    repo,
    invitation_id: invitationId,
  })
}

/**
 * Get all repos with their collaborators
 */
export async function getReposWithCollaborators(): Promise<RepoWithCollaborators[]> {
  const repos = await listRepos()

  const results = await Promise.all(
    repos.map(async (repo) => {
      const [owner, repoName] = repo.fullName.split("/")
      const [collaborators, pendingInvitations] = await Promise.all([
        listCollaborators(owner, repoName),
        listPendingInvitations(owner, repoName),
      ])

      return {
        repo,
        collaborators,
        pendingInvitations,
      }
    })
  )

  return results
}

/**
 * Build a map of all users and their repo access across all managed repos.
 * This aggregates collaborator data from all repos the GitHub App has access to.
 *
 * Returns: Map keyed by GitHub user ID string
 */
export async function getAllUserRepoAccess(): Promise<Map<string, UserRepoAccess>> {
  const reposWithCollaborators = await getReposWithCollaborators()
  const userMap = new Map<string, UserRepoAccess>()

  for (const { repo, collaborators } of reposWithCollaborators) {
    for (const collab of collaborators) {
      const userId = String(collab.id)

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          githubUserId: userId,
          githubUsername: collab.login,
          repos: [],
        })
      }

      const user = userMap.get(userId)!
      // Only add if role is known
      if (collab.role !== "unknown") {
        user.repos.push({
          fullName: repo.fullName,
          permission: collab.role,
        })
      }
    }
  }

  return userMap
}

/**
 * Get repo access for a specific user by their GitHub user ID.
 * Returns array of repo tags in format "org/repo:permission"
 * Note: This only returns confirmed collaborators, not pending invitations
 * (pending invitations don't include user IDs, only usernames)
 * Use getUserRepoAccessByUsername() to include pending invitations.
 */
export async function getUserRepoAccess(githubUserId: string): Promise<string[]> {
  const reposWithCollaborators = await getReposWithCollaborators()
  const tags: string[] = []

  for (const { repo, collaborators } of reposWithCollaborators) {
    // Check if user is a confirmed collaborator
    const collab = collaborators.find((c) => String(c.id) === githubUserId)
    if (collab && collab.role !== "unknown") {
      tags.push(`${repo.fullName}:${collab.role}`)
    }
  }

  return tags
}

/**
 * Get repo access for a specific user by their GitHub username.
 * This is needed for pending invitations which don't have user IDs.
 * Returns array of repo tags in format:
 *   - "org/repo:permission" for confirmed access
 *   - "org/repo:permission:pending" for pending invitations
 */
export async function getUserRepoAccessByUsername(username: string): Promise<string[]> {
  const reposWithCollaborators = await getReposWithCollaborators()
  const tags: string[] = []

  for (const { repo, collaborators, pendingInvitations } of reposWithCollaborators) {
    // Check if user is a confirmed collaborator
    const collab = collaborators.find(
      (c) => c.login.toLowerCase() === username.toLowerCase()
    )
    if (collab && collab.role !== "unknown") {
      tags.push(`${repo.fullName}:${collab.role}`)
      continue
    }

    // Check if user has a pending invitation
    const pending = pendingInvitations.find(
      (inv) => inv.login?.toLowerCase() === username.toLowerCase()
    )
    if (pending) {
      // Include pending invitations with :pending suffix
      tags.push(`${repo.fullName}:${pending.permissions}:pending`)
    }
  }

  return tags
}

/**
 * Add or update a collaborator on a repository
 * Permission can be: "pull" (read), "push" (write), "admin", "maintain", "triage"
 */
export async function addCollaborator(
  owner: string,
  repo: string,
  username: string,
  permission: "pull" | "push" | "admin" | "maintain" | "triage"
): Promise<void> {
  const octokit = createOctokit()

  await octokit.rest.repos.addCollaborator({
    owner,
    repo,
    username,
    permission,
  })
}

/**
 * Remove a collaborator from a repository
 */
export async function removeCollaborator(
  owner: string,
  repo: string,
  username: string
): Promise<void> {
  const octokit = createOctokit()

  await octokit.rest.repos.removeCollaborator({
    owner,
    repo,
    username,
  })
}

/**
 * Apply permissions for a user across multiple repos
 * repoPermissions is a map of "owner/repo" -> permission level (or "remove" to revoke access)
 * If "remove" is selected and user has a pending invitation, it cancels the invitation
 */
export async function applyUserPermissions(
  username: string,
  repoPermissions: Record<string, "remove" | "read" | "write">
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []

  for (const [fullName, permission] of Object.entries(repoPermissions)) {
    const [owner, repo] = fullName.split("/")

    try {
      if (permission === "remove") {
        // Check for pending invitation first
        const invitations = await listPendingInvitations(owner, repo)
        const pendingInvite = invitations.find(
          (inv) => inv.login?.toLowerCase() === username.toLowerCase()
        )

        if (pendingInvite) {
          // Cancel the pending invitation
          await cancelInvitation(owner, repo, pendingInvite.id)
        } else {
          // Remove as collaborator
          await removeCollaborator(owner, repo, username)
        }
      } else {
        // Map our permission names to GitHub's
        const githubPerm = permission === "read" ? "pull" : "push"
        await addCollaborator(owner, repo, username, githubPerm)
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Unknown error"
      errors.push(`${fullName}: ${msg}`)
    }
  }

  return { success: errors.length === 0, errors }
}
