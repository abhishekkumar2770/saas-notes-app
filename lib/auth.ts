export interface JWTPayload {
  userId: string
  email: string
  role: "admin" | "member"
  tenantId: string
  subscription: "free" | "pro"
}

// Simple hash function for demo purposes (not for production)
const simpleHash = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "salt")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export const hashPassword = async (password: string): Promise<string> => {
  return await simpleHash(password)
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const hash = await simpleHash(password)
  return hash === hashedPassword
}

// Simple JWT implementation for demo purposes
export const generateToken = (user: any): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    subscription: user.subscription,
  }

  // Simple base64 encoding for demo (not secure for production)
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }))
  const payloadStr = btoa(JSON.stringify(payload))
  return `${header}.${payloadStr}.demo`
}

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const payload = JSON.parse(atob(parts[1]))
    return payload as JWTPayload
  } catch (error) {
    console.log("[v0] Token verification error:", error)
    return null
  }
}

export const extractTokenFromHeader = (authHeader: string | null): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.substring(7)
}
