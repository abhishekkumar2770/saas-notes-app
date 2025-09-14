import { type NextRequest, NextResponse } from "next/server"
import { readDatabase } from "@/lib/database"
import { requireAuth } from "@/lib/middleware"
import { SUBSCRIPTION_LIMITS } from "@/lib/subscription"

// GET /api/subscription/usage - Get detailed usage statistics
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const db = await readDatabase()

    const tenant = db.tenants.find((t) => t.id === user.tenantId)
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    const limits = SUBSCRIPTION_LIMITS[tenant.subscription]

    // Calculate usage statistics
    const tenantUsers = db.users.filter((u) => u.tenantId === user.tenantId)
    const tenantNotes = db.notes.filter((n) => n.tenantId === user.tenantId)
    const userNotes = db.notes.filter((n) => n.userId === user.userId && n.tenantId === user.tenantId)
    const privateNotes = tenantNotes.filter((n) => n.isPrivate)
    const userPrivateNotes = userNotes.filter((n) => n.isPrivate)

    // Calculate tag usage
    const allTags = tenantNotes.flatMap((n) => n.tags)
    const uniqueTags = [...new Set(allTags)]
    const tagUsage = uniqueTags
      .map((tag) => ({
        tag,
        count: allTags.filter((t) => t === tag).length,
      }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      subscription: tenant.subscription,
      limits,
      usage: {
        tenant: {
          users: {
            current: tenantUsers.length,
            limit: limits.canInviteUsers ? -1 : 1,
          },
          notes: {
            current: tenantNotes.length,
            limit: limits.maxNotes,
          },
          privateNotes: {
            current: privateNotes.length,
            limit: limits.maxPrivateNotes,
          },
        },
        user: {
          notes: {
            current: userNotes.length,
            limit: limits.maxNotes,
          },
          privateNotes: {
            current: userPrivateNotes.length,
            limit: limits.maxPrivateNotes,
          },
        },
        tags: {
          unique: uniqueTags.length,
          total: allTags.length,
          popular: tagUsage.slice(0, 10),
        },
      },
      warnings: {
        nearNoteLimit: limits.maxNotes > 0 && tenantNotes.length >= limits.maxNotes * 0.8,
        nearPrivateNoteLimit: limits.maxPrivateNotes > 0 && privateNotes.length >= limits.maxPrivateNotes * 0.8,
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Authentication") ? 401 : 500 },
      )
    }

    console.error("Get usage error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
