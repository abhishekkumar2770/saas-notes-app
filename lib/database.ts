import path from "path"

export interface User {
  id: string
  email: string
  password: string // hashed
  role: "admin" | "member"
  tenantId: string
  subscription: "free" | "pro"
  createdAt: string
  updatedAt: string
}

export interface Tenant {
  id: string
  name: string
  domain?: string
  subscription: "free" | "pro"
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  title: string
  content: string
  userId: string
  tenantId: string // Ensures tenant isolation
  tags: string[]
  isPrivate: boolean
  createdAt: string
  updatedAt: string
}

export interface Database {
  users: User[]
  tenants: Tenant[]
  notes: Note[]
}

const DB_PATH = path.join(process.cwd(), "data", "database.json")

let inMemoryDatabase: Database | null = null

// Initialize database with empty structure
const initDatabase = (): Database => {
  const defaultDb: Database = {
    users: [],
    tenants: [],
    notes: [],
  }

  console.log("[v0] Database initialized")
  return defaultDb
}

// Read database
export const readDatabase = async (): Promise<Database> => {
  try {
    if (!inMemoryDatabase) {
      console.log("[v0] Creating new in-memory database")
      inMemoryDatabase = initDatabase()
    }
    console.log("[v0] Database read successfully, users:", inMemoryDatabase.users.length)
    return inMemoryDatabase
  } catch (error) {
    console.error("[v0] Failed to read database:", error)
    throw error
  }
}

// Write database
export const writeDatabase = async (data: Database): Promise<void> => {
  try {
    inMemoryDatabase = data
    console.log("[v0] Database written successfully, users:", data.users.length)
  } catch (error) {
    console.error("[v0] Failed to write database:", error)
    throw error
  }
}

// Utility functions for multi-tenant operations
export const getUsersByTenant = async (tenantId: string): Promise<User[]> => {
  const db = await readDatabase()
  return db.users.filter((user) => user.tenantId === tenantId)
}

export const getNotesByTenant = async (tenantId: string): Promise<Note[]> => {
  const db = await readDatabase()
  return db.notes.filter((note) => note.tenantId === tenantId)
}

export const getUserNotes = async (userId: string, tenantId: string): Promise<Note[]> => {
  const db = await readDatabase()
  return db.notes.filter((note) => note.userId === userId && note.tenantId === tenantId)
}

// Generate unique IDs
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
