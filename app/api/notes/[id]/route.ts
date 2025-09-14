import { type NextRequest, NextResponse } from "next/server"
import { readDatabase, writeDatabase } from "@/lib/database"
import { requireAuth, requireProSubscription } from "@/lib/middleware"

// GET /api/notes/[id] - Get a specific note
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(request)
    const { id } = params

    const db = await readDatabase()

    // Find note with tenant isolation
    const note = db.notes.find((n) => n.id === id && n.tenantId === user.tenantId)

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    // Check if user can access this note
    if (note.isPrivate && note.userId !== user.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ note })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Authentication") ? 401 : 500 },
      )
    }

    console.error("Get note error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/notes/[id] - Update a specific note
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(request)
    const { id } = params
    const { title, content, tags, isPrivate } = await request.json()

    const db = await readDatabase()

    // Find note with tenant isolation
    const noteIndex = db.notes.findIndex((n) => n.id === id && n.tenantId === user.tenantId)

    if (noteIndex === -1) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const note = db.notes[noteIndex]

    // Check if user owns this note
    if (note.userId !== user.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Check if private notes require Pro subscription
    if (isPrivate && !note.isPrivate) {
      requireProSubscription(user)
    }

    // Update note
    const updatedNote = {
      ...note,
      title: title || note.title,
      content: content || note.content,
      tags: tags !== undefined ? (Array.isArray(tags) ? tags : []) : note.tags,
      isPrivate: isPrivate !== undefined ? isPrivate : note.isPrivate,
      updatedAt: new Date().toISOString(),
    }

    db.notes[noteIndex] = updatedNote
    await writeDatabase(db)

    return NextResponse.json({
      message: "Note updated successfully",
      note: updatedNote,
    })
  } catch (error) {
    if (error instanceof Error) {
      const status = error.message.includes("Authentication")
        ? 401
        : error.message.includes("Pro subscription")
          ? 403
          : 500

      return NextResponse.json({ error: error.message }, { status })
    }

    console.error("Update note error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/notes/[id] - Delete a specific note
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = requireAuth(request)
    const { id } = params

    const db = await readDatabase()

    // Find note with tenant isolation
    const noteIndex = db.notes.findIndex((n) => n.id === id && n.tenantId === user.tenantId)

    if (noteIndex === -1) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const note = db.notes[noteIndex]

    // Check if user owns this note
    if (note.userId !== user.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Remove note from database
    db.notes.splice(noteIndex, 1)
    await writeDatabase(db)

    return NextResponse.json({ message: "Note deleted successfully" })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Authentication") ? 401 : 500 },
      )
    }

    console.error("Delete note error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
