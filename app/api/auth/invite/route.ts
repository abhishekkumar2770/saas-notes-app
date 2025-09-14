import { type NextRequest, NextResponse } from "next/server"
import { readDatabase, writeDatabase, generateId } from "@/lib/database"
import { hashPassword, generateToken } from "@/lib/auth"
import { requireAdmin } from "@/lib/middleware"

export async function POST(request: NextRequest) {
  try {
    const admin = requireAdmin(request)
    const { email, password, role = "member" } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const db = await readDatabase()

    // Check if user already exists
    const existingUser = db.users.find((user) => user.email === email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Get admin's tenant info
    const tenant = db.tenants.find((t) => t.id === admin.tenantId)
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
    }

    // Create new user in the same tenant
    const userId = generateId()
    const hashedPassword = await hashPassword(password)
    const newUser = {
      id: userId,
      email,
      password: hashedPassword,
      role: role as "admin" | "member",
      tenantId: admin.tenantId,
      subscription: tenant.subscription,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Save to database
    db.users.push(newUser)
    await writeDatabase(db)

    // Generate JWT token for the new user
    const token = generateToken(newUser)

    return NextResponse.json(
      {
        message: "User invited successfully",
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          tenantId: newUser.tenantId,
          subscription: newUser.subscription,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Authentication") ? 401 : 403 },
      )
    }

    console.error("Invitation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
