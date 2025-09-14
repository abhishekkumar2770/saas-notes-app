import { type NextRequest, NextResponse } from "next/server"
import { readDatabase, writeDatabase } from "@/lib/database"
import { requireAdmin } from "@/lib/middleware"
import { getSubscriptionFeatures } from "@/lib/subscription"

// GET /api/subscription - Get current subscription info
export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request)
    const db = await readDatabase()

    const tenant = db.tenants.find((t) => t.id === user.tenantId)
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    const subscriptionInfo = getSubscriptionFeatures(tenant.subscription)
    const userCount = db.users.filter((u) => u.tenantId === user.tenantId).length
    const noteCount = db.notes.filter((n) => n.tenantId === user.tenantId).length
    const privateNoteCount = db.notes.filter((n) => n.tenantId === user.tenantId && n.isPrivate).length

    return NextResponse.json({
      ...subscriptionInfo,
      usage: {
        users: userCount,
        notes: noteCount,
        privateNotes: privateNoteCount,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        createdAt: tenant.createdAt,
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Authentication") ? 401 : 403 },
      )
    }

    console.error("Get subscription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/subscription/upgrade - Upgrade to Pro (simplified for demo)
export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request)
    const { plan } = await request.json()

    if (plan !== "pro" && plan !== "free") {
      return NextResponse.json({ error: "Invalid subscription plan" }, { status: 400 })
    }

    const db = await readDatabase()

    // Find and update tenant
    const tenantIndex = db.tenants.findIndex((t) => t.id === user.tenantId)
    if (tenantIndex === -1) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Update tenant subscription
    db.tenants[tenantIndex] = {
      ...db.tenants[tenantIndex],
      subscription: plan,
      updatedAt: new Date().toISOString(),
    }

    // Update all users in the tenant
    db.users = db.users.map((u) =>
      u.tenantId === user.tenantId ? { ...u, subscription: plan, updatedAt: new Date().toISOString() } : u,
    )

    await writeDatabase(db)

    const subscriptionInfo = getSubscriptionFeatures(plan)

    return NextResponse.json({
      message: `Successfully ${plan === "pro" ? "upgraded to" : "downgraded to"} ${plan} plan`,
      ...subscriptionInfo,
    })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Authentication") ? 401 : 403 },
      )
    }

    console.error("Subscription update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
