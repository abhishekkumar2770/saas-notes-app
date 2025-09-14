import { type NextRequest, NextResponse } from "next/server"
import { readDatabase, writeDatabase, generateId, getUserNotes } from "@/lib/database"
import { requireAuth, requireProSubscription } from "@/lib/middleware"

// GET /api/notes - Get all notes for the authenticated user's tenant
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || []

    // Get user's notes with tenant isolation
    let notes = await getUserNotes(user.userId, user.tenantId)

    // Apply search filter
    if (search) {
      notes = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(search.toLowerCase()) ||
          note.content.toLowerCase().includes(search.toLowerCase()),
      )
    }

    // Apply tags filter
    if (tags.length > 0) {
      notes = notes.filter((note) => tags.some((tag) => note.tags.includes(tag)))
    }

    // Sort by updated date (newest first)
    notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedNotes = notes.slice(startIndex, endIndex)

    return NextResponse.json({
      notes: paginatedNotes,
      pagination: {
        page,
        limit,
        total: notes.length,
        totalPages: Math.ceil(notes.length / limit),
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Authentication") ? 401 : 500 },
      )
    }

    console.error("Get notes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { title, content, tags = [], isPrivate = false } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    // Check if private notes require Pro subscription
    if (isPrivate) {
      requireProSubscription(user)
    }

    const db = await readDatabase()

    // Create new note with tenant isolation
    const noteId = generateId()
    const newNote = {
      id: noteId,
      title,
      content,
      userId: user.userId,
      tenantId: user.tenantId, // Ensures tenant isolation
      tags: Array.isArray(tags) ? tags : [],
      isPrivate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Save to database
    db.notes.push(newNote)
    await writeDatabase(db)

    return NextResponse.json(
      {
        message: "Note created successfully",
        note: newNote,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Error) {
      const status = error.message.includes("Authentication")
        ? 401
        : error.message.includes("Pro subscription")
          ? 403
          : 500

      return NextResponse.json({ error: error.message }, { status })
    }

    console.error("Create note error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
