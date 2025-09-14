import { type NextRequest, NextResponse } from "next/server"
import { authenticate } from "@/lib/middleware"
import { readDatabase } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Auth me route called")
    const user = authenticate(request)
    console.log("[v0] Authenticated user:", user)

    if (!user) {
      console.log("[v0] No user authenticated")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const db = await readDatabase()
    console.log("[v0] Database read, users count:", db.users.length)

    const fullUser = db.users.find((u) => u.id === user.userId)
    const tenant = db.tenants.find((t) => t.id === user.tenantId)

    console.log("[v0] Found user:", !!fullUser, "Found tenant:", !!tenant)

    if (!fullUser || !tenant) {
      console.log("[v0] User or tenant not found")
      return NextResponse.json({ error: "User or tenant not found" }, { status: 404 })
    }

    const response = {
      user: {
        id: fullUser.id,
        email: fullUser.email,
        role: fullUser.role,
        tenantId: fullUser.tenantId,
        subscription: fullUser.subscription,
        createdAt: fullUser.createdAt,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subscription: tenant.subscription,
      },
    }

    console.log("[v0] Returning response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
