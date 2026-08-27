"use server"

import { auth } from "@/auth"
import { applyUserPermissions } from "@/lib/github"

/**
 * Server action to apply permissions for a user
 */
export async function applyPermissionsAction(
  username: string,
  repoPermissions: Record<string, "remove" | "read" | "write">
): Promise<{ success: boolean; errors: string[] }> {
  // Verify admin access
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return { success: false, errors: ["Unauthorized"] }
  }

  return applyUserPermissions(username, repoPermissions)
}
