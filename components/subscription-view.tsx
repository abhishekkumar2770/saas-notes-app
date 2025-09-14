"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Crown, Check, X } from "lucide-react"

interface SubscriptionData {
  subscription: "free" | "pro"
  features: {
    notes: string
    privateNotes: string
    tagsPerNote: string
    teamInvites: string
    apiAccess: string
  }
  usage: {
    users: number
    notes: number
    privateNotes: number
  }
  limits: {
    maxNotes: number
    maxPrivateNotes: number
    maxTagsPerNote: number
    canInviteUsers: boolean
    apiRateLimit: number
  }
}

export function SubscriptionView() {
  const { token, user } = useAuth()
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch("/api/subscription", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSubscriptionData(data)
      } else {
        setError("Failed to fetch subscription data")
      }
    } catch (err) {
      setError("Failed to fetch subscription data")
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (plan: "free" | "pro") => {
    setUpgrading(true)
    setError("")

    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      })

      if (response.ok) {
        await fetchSubscriptionData()
        // Refresh the page to update user context
        window.location.reload()
      } else {
        const error = await response.json()
        setError(error.error || "Failed to update subscription")
      }
    } catch (err) {
      setError("Failed to update subscription")
    } finally {
      setUpgrading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!subscriptionData) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load subscription data</AlertDescription>
      </Alert>
    )
  }

  const isProUser = subscriptionData.subscription === "pro"
  const notesUsagePercent =
    subscriptionData.limits.maxNotes > 0 ? (subscriptionData.usage.notes / subscriptionData.limits.maxNotes) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Subscription</h2>
        <Badge variant={isProUser ? "default" : "secondary"} className="text-sm">
          {isProUser ? (
            <>
              <Crown className="w-4 h-4 mr-1" />
              Pro Plan
            </>
          ) : (
            "Free Plan"
          )}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>Your current plan usage and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Notes</span>
              <span>
                {subscriptionData.usage.notes} / {subscriptionData.features.notes}
              </span>
            </div>
            {subscriptionData.limits.maxNotes > 0 && <Progress value={notesUsagePercent} className="h-2" />}
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Private Notes</span>
              <span>
                {subscriptionData.usage.privateNotes} / {subscriptionData.features.privateNotes}
              </span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span>Team Members</span>
              <span>{subscriptionData.usage.users}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <Card className={!isProUser ? "ring-2 ring-primary" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Free Plan
              {!isProUser && <Badge>Current</Badge>}
            </CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">
              $0<span className="text-sm font-normal">/month</span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Up to 50 notes</span>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-500" />
                <span className="text-sm">No private notes</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Up to 3 tags per note</span>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-500" />
                <span className="text-sm">No team invites</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">30 API requests/min</span>
              </li>
            </ul>
            {isProUser && (
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => handleUpgrade("free")}
                disabled={upgrading}
              >
                {upgrading ? "Updating..." : "Downgrade to Free"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className={isProUser ? "ring-2 ring-primary" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Pro Plan
              </div>
              {isProUser && <Badge>Current</Badge>}
            </CardTitle>
            <CardDescription>For power users and teams</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">
              $9<span className="text-sm font-normal">/month</span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Unlimited notes</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Unlimited private notes</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Up to 10 tags per note</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Team invites</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">300 API requests/min</span>
              </li>
            </ul>
            {!isProUser && (
              <Button className="w-full" onClick={() => handleUpgrade("pro")} disabled={upgrading}>
                {upgrading ? "Upgrading..." : "Upgrade to Pro"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
