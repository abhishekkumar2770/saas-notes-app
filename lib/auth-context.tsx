"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  email: string
  role: "admin" | "member"
  tenantId: string
  subscription: "free" | "pro"
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, tenantName: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token")
      if (storedToken) {
        setToken(storedToken)
        fetchUser(storedToken)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.log("[v0] localStorage access error:", error)
      setLoading(false)
    }
  }, [])

  const fetchUser = async (authToken: string) => {
    try {
      console.log("[v0] Fetching user with token:", authToken.substring(0, 10) + "...")
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const text = await response.text()
        console.log("[v0] Response text:", text)

        try {
          const data = JSON.parse(text)
          setUser(data.user)
        } catch (parseError) {
          console.error("[v0] JSON parse error:", parseError)
          console.error("[v0] Response text that failed to parse:", text)
          throw new Error("Invalid JSON response from server")
        }
      } else {
        const text = await response.text()
        console.log("[v0] Error response text:", text)
        localStorage.removeItem("token")
        setToken(null)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch user:", error)
      localStorage.removeItem("token")
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    console.log("[v0] Attempting login for:", email)
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    console.log("[v0] Login response status:", response.status)

    if (!response.ok) {
      const text = await response.text()
      console.log("[v0] Login error response:", text)
      try {
        const error = JSON.parse(text)
        throw new Error(error.error || "Login failed")
      } catch (parseError) {
        throw new Error("Login failed - invalid response")
      }
    }

    const text = await response.text()
    console.log("[v0] Login success response:", text)

    try {
      const data = JSON.parse(text)
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem("token", data.token)
    } catch (parseError) {
      console.error("[v0] Login JSON parse error:", parseError)
      throw new Error("Invalid response from server")
    }
  }

  const register = async (email: string, password: string, tenantName: string) => {
    console.log("[v0] Attempting registration for:", email)
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, tenantName }),
    })

    console.log("[v0] Register response status:", response.status)

    if (!response.ok) {
      const text = await response.text()
      console.log("[v0] Register error response:", text)
      try {
        const error = JSON.parse(text)
        throw new Error(error.error || "Registration failed")
      } catch (parseError) {
        throw new Error("Registration failed - invalid response")
      }
    }

    const text = await response.text()
    console.log("[v0] Register success response:", text)

    try {
      const data = JSON.parse(text)
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem("token", data.token)
    } catch (parseError) {
      console.error("[v0] Register JSON parse error:", parseError)
      throw new Error("Invalid response from server")
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("token")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
