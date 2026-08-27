"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"

export function RefreshButton({ redirectTo, className = "" }: { redirectTo: string; className?: string }) {
  const { update } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshed, setRefreshed] = useState(false)

  // Auto-reset success state after 3 seconds
  useEffect(() => {
    if (refreshed) {
      const timer = setTimeout(() => setRefreshed(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [refreshed])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setRefreshed(false)
    try {
      // Pass data to trigger the JWT callback with trigger: "update"
      // This forces NextAuth to call the jwt callback and refresh the token
      await update({ refreshPermissions: true })

      // If redirecting to current page, just refresh; otherwise navigate
      if (redirectTo === pathname) {
        router.refresh() // Refresh server components on current page
        setRefreshed(true)
      } else {
        router.push(redirectTo)
      }
    } catch (error) {
      console.error("Failed to refresh session:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`inline-flex items-center justify-center gap-2 rounded px-4 py-2 font-medium text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${refreshed ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} ${className}`}
    >
      {isRefreshing ? (
        <>
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Refreshing...
        </>
      ) : refreshed ? (
        <>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Refreshed
        </>
      ) : (
        <>
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh Permissions
        </>
      )}
    </button>
  )
}
