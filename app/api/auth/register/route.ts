import { type NextRequest, NextResponse } from "next/server"
import { readDatabase, writeDatabase, generateId } from "@/lib/database"
import { hashPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Registration API called")
    const { email, password, tenantName, role = "admin" } = await request.json()
    console.log("[v0] Registration data:", { email, tenantName, role })

    if (!email || !password || !tenantName) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Email, password, and tenant name are required" }, { status: 400 })
    }

    console.log("[v0] Reading database...")
    const db = await readDatabase()
    console.log("[v0] Database read, checking existing user...")

    // Check if user already exists
    const existingUser = db.users.find((user) => user.email === email)
    if (existingUser) {
      console.log("[v0] User already exists")
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    console.log("[v0] Creating new tenant and user...")
    // Create new tenant
    const tenantId = generateId()
    const newTenant = {
      id: tenantId,
      name: tenantName,
      subscription: "free" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Create new user
    const userId = generateId()
    console.log("[v0] Hashing password...")
    const hashedPassword = await hashPassword(password)
    console.log("[v0] Password hashed successfully")

    const newUser = {
      id: userId,
      email,
      password: hashedPassword,
      role: role as "admin" | "member",
      tenantId,
      subscription: "free" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Save to database
    console.log("[v0] Saving to database...")
    db.tenants.push(newTenant)
    db.users.push(newUser)
    await writeDatabase(db)
    console.log("[v0] Database saved successfully")

    // Generate JWT token
    console.log("[v0] Generating token...")
    const token = generateToken(newUser)
    console.log("[v0] Token generated successfully")

    const response = {
      message: "User registered successfully",
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        tenantId: newUser.tenantId,
        subscription: newUser.subscription,
      },
    }

    console.log("[v0] Registration successful, returning response")
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ error: `Internal server error: ${error}` }, { status: 500 })
  }
}
