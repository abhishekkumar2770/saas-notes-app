import { type NextRequest, NextResponse } from "next/server"
import { readDatabase, writeDatabase } from "@/lib/database"
import { requireAuth } from "@/lib/middleware"

// DELETE /api/notes/bulk - Delete multiple notes
export async function DELETE(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { noteIds } = await request.json()

    if (!Array.isArray(noteIds) || noteIds.length === 0) {
      return NextResponse.json({ error: "Note IDs array is required" }, { status: 400 })
    }

    const db = await readDatabase()

    // Find notes with tenant isolation and ownership check
    const notesToDelete = db.notes.filter(
      (note) => noteIds.includes(note.id) && note.tenantId === user.tenantId && note.userId === user.userId,
    )

    if (notesToDelete.length === 0) {
      return NextResponse.json({ error: "No notes found to delete" }, { status: 404 })
    }

    // Remove notes from database
    db.notes = db.notes.filter(
      (note) => !(noteIds.includes(note.id) && note.tenantId === user.tenantId && note.userId === user.userId),
    )

    await writeDatabase(db)

    return NextResponse.json({
      message: `${notesToDelete.length} notes deleted successfully`,
      deletedCount: notesToDelete.length,
    })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("Authentication") ? 401 : 500 },
      )
    }

    console.error("Bulk delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
