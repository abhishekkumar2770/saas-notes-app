import type { NextRequest } from "next/server"
import { verifyToken, extractTokenFromHeader, type JWTPayload } from "./auth"

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export const authenticate = (req: NextRequest): JWTPayload | null => {
  const authHeader = req.headers.get("authorization")
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    return null
  }

  return verifyToken(token)
}

export const requireAuth = (req: NextRequest): JWTPayload => {
  const user = authenticate(req)
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export const requireAdmin = (req: NextRequest): JWTPayload => {
  const user = requireAuth(req)
  if (user.role !== "admin") {
    throw new Error("Admin access required")
  }
  return user
}

export const requireProSubscription = (user: JWTPayload): void => {
  if (user.subscription !== "pro") {
    throw new Error("Pro subscription required for this feature")
  }
}
