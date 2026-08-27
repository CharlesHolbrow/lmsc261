import {
  Client,
  isFullPage,
  isFullDatabase,
} from "@notionhq/client"
import type {
  CreatePageParameters,
  UpdatePageParameters,
  PageObjectResponse,
  DatabaseObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client"

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const DATABASE_ID = process.env.NOTION_STUDENTS_DB_ID!

// GitHub user record interface (from Notion - users who have signed in)
export interface GitHubUser {
  id: string // Notion page ID
  githubUserId: string // Rich text field - immutable unique identifier
  githubUsername: string // Title field - human-readable, can change
  name?: string // Display name from GitHub profile
  email?: string
  signInDate?: string // ISO date string of most recent sign-in
  notes?: string
}

// Type for database query filter
interface QueryDatabaseFilter {
  property: string
  rich_text?: { equals: string }
  title?: { equals: string }
}

interface QueryDatabaseParams {
  database_id: string
  filter?: QueryDatabaseFilter
  sorts?: Array<{ property: string; direction: "ascending" | "descending" }>
  page_size?: number
}

interface QueryDatabaseResponse {
  results: PageObjectResponse[]
  has_more: boolean
  next_cursor: string | null
}

/**
 * Query the database using the Notion API
 * SDK v5 removed databases.query, so we use fetch directly
 */
async function queryDatabase(
  params: QueryDatabaseParams
): Promise<QueryDatabaseResponse> {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${params.database_id}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        ...(params.filter && { filter: params.filter }),
        ...(params.sorts && { sorts: params.sorts }),
        ...(params.page_size && { page_size: params.page_size }),
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Notion API error: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * Get all users from the Notion database (users who have signed in via OAuth)
 */
export async function getAllUsersFromNotion(): Promise<GitHubUser[]> {
  const response = await queryDatabase({
    database_id: DATABASE_ID,
    sorts: [
      {
        property: "Sign In Date",
        direction: "descending",
      },
    ],
  })

  return response.results.map(pageToGitHubUser)
}

/**
 * Find a user by GitHub user ID
 */
export async function findUserByGitHubId(
  githubUserId: string
): Promise<GitHubUser | null> {
  const response = await queryDatabase({
    database_id: DATABASE_ID,
    filter: {
      property: "GitHub User ID",
      rich_text: {
        equals: githubUserId,
      },
    },
  })

  if (response.results.length === 0) {
    return null
  }

  return pageToGitHubUser(response.results[0])
}

/**
 * Create a new user record (called when user signs in via OAuth)
 */
export async function createUser(data: {
  githubUserId: string
  githubUsername: string
  name?: string
  email?: string
}): Promise<GitHubUser> {
  const properties: CreatePageParameters["properties"] = {
    // GitHub Username is the title column in Notion
    "GitHub Username": {
      type: "title",
      title: [
        {
          type: "text",
          text: {
            content: data.githubUsername,
          },
        },
      ],
    },
    // GitHub User ID is a rich_text column
    "GitHub User ID": {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: {
            content: data.githubUserId,
          },
        },
      ],
    },
    "Sign In Date": {
      type: "date",
      date: {
        start: new Date().toISOString(),
      },
    },
  }

  if (data.name) {
    properties["Name"] = {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: {
            content: data.name,
          },
        },
      ],
    }
  }

  if (data.email) {
    properties["Email"] = {
      type: "email",
      email: data.email,
    }
  }

  const response = await notion.pages.create({
    parent: {
      type: "database_id",
      database_id: DATABASE_ID,
    },
    properties,
  })

  if (!isFullPage(response)) {
    throw new Error("Failed to create page: partial response received")
  }

  return pageToGitHubUser(response)
}

/**
 * Update user notes
 */
export async function updateUserNotes(
  pageId: string,
  notes: string
): Promise<GitHubUser> {
  const properties: UpdatePageParameters["properties"] = {
    Notes: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: {
            content: notes,
          },
        },
      ],
    },
  }

  const response = await notion.pages.update({
    page_id: pageId,
    properties,
  })

  if (!isFullPage(response)) {
    throw new Error("Failed to update page: partial response received")
  }

  return pageToGitHubUser(response)
}

/**
 * Update the sign-in date for a user (called on each OAuth sign-in)
 */
/**
 * Update user info on sign-in (username, email, date). Name is NOT updated -
 * it's only set on first sign-in. that way we can update the name in notion
 * reliably.
 */
async function updateUserOnSignIn(
  pageId: string,
  data: { githubUsername: string; email?: string }
): Promise<GitHubUser> {
  const properties: UpdatePageParameters["properties"] = {
    "GitHub Username": {
      type: "title",
      title: [
        {
          type: "text",
          text: {
            content: data.githubUsername,
          },
        },
      ],
    },
    "Sign In Date": {
      type: "date",
      date: {
        start: new Date().toISOString(),
      },
    },
  }

  // Update email if provided, clear it if not
  if (data.email) {
    properties["Email"] = {
      type: "email",
      email: data.email,
    }
  }

  const response = await notion.pages.update({
    page_id: pageId,
    properties,
  })

  if (!isFullPage(response)) {
    throw new Error("Failed to update page: partial response received")
  }

  return pageToGitHubUser(response)
}

/**
 * Register or find existing user (called on OAuth sign-in)
 * Updates the sign-in date on each login
 * Returns the user record and whether it was newly created
 */
export async function registerOrFindUser(data: {
  githubUserId: string
  githubUsername: string
  name?: string
  email?: string
}): Promise<{ user: GitHubUser; isNew: boolean }> {
  // Try to find existing user by GitHub ID
  const existing = await findUserByGitHubId(data.githubUserId)

  if (existing) {
    // Update username, email, and sign-in date (but not name)
    const updated = await updateUserOnSignIn(existing.id, {
      githubUsername: data.githubUsername,
      email: data.email,
    })
    return { user: updated, isNew: false }
  }

  // Create new user (includes name on first sign-in)
  const user = await createUser(data)
  return { user, isNew: true }
}

// Type guard for properties with title
function hasTitle(
  prop: PageObjectResponse["properties"][string]
): prop is Extract<
  PageObjectResponse["properties"][string],
  { type: "title" }
> {
  return prop.type === "title"
}

// Type guard for properties with rich_text
function hasRichText(
  prop: PageObjectResponse["properties"][string]
): prop is Extract<
  PageObjectResponse["properties"][string],
  { type: "rich_text" }
> {
  return prop.type === "rich_text"
}

// Type guard for properties with email
function hasEmail(
  prop: PageObjectResponse["properties"][string]
): prop is Extract<
  PageObjectResponse["properties"][string],
  { type: "email" }
> {
  return prop.type === "email"
}

// Type guard for properties with date
function hasDate(
  prop: PageObjectResponse["properties"][string]
): prop is Extract<
  PageObjectResponse["properties"][string],
  { type: "date" }
> {
  return prop.type === "date"
}

// Helper to extract text from rich text items
function extractText(items: RichTextItemResponse[]): string {
  return items.map((item) => item.plain_text).join("")
}

// Helper function to convert Notion page to GitHubUser
function pageToGitHubUser(page: PageObjectResponse): GitHubUser {
  const props = page.properties

  const userIdProp = props["GitHub User ID"]
  const usernameProp = props["GitHub Username"]
  const nameProp = props["Name"]
  const emailProp = props["Email"]
  const signInDateProp = props["Sign In Date"]
  const notesProp = props["Notes"]

  return {
    id: page.id,
    githubUserId: hasRichText(userIdProp)
      ? extractText(userIdProp.rich_text)
      : "",
    githubUsername: hasTitle(usernameProp)
      ? extractText(usernameProp.title)
      : "",
    name:
      nameProp && hasRichText(nameProp)
        ? extractText(nameProp.rich_text) || undefined
        : undefined,
    email:
      emailProp && hasEmail(emailProp) ? emailProp.email ?? undefined : undefined,
    signInDate:
      signInDateProp && hasDate(signInDateProp)
        ? signInDateProp.date?.start ?? undefined
        : undefined,
    notes:
      notesProp && hasRichText(notesProp)
        ? extractText(notesProp.rich_text) || undefined
        : undefined,
  }
}

/**
 * Test the Notion connection
 */
export async function testNotionConnection(): Promise<{
  success: boolean
  error?: string
  databaseName?: string
  databaseId?: string
}> {
  try {
    const response = await notion.databases.retrieve({
      database_id: DATABASE_ID,
    })

    if (!isFullDatabase(response)) {
      return {
        success: false,
        error: "Received partial database response",
      }
    }

    const db = response as DatabaseObjectResponse
    const title = db.title?.[0]?.plain_text || "Untitled"

    return {
      success: true,
      databaseName: title,
      databaseId: DATABASE_ID,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
