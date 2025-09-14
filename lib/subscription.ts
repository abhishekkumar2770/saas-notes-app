export interface SubscriptionLimits {
  maxNotes: number
  maxPrivateNotes: number
  maxTagsPerNote: number
  canInviteUsers: boolean
  apiRateLimit: number // requests per minute
}

export const SUBSCRIPTION_LIMITS: Record<"free" | "pro", SubscriptionLimits> = {
  free: {
    maxNotes: 50,
    maxPrivateNotes: 0,
    maxTagsPerNote: 3,
    canInviteUsers: false,
    apiRateLimit: 30,
  },
  pro: {
    maxNotes: -1, // unlimited
    maxPrivateNotes: -1, // unlimited
    maxTagsPerNote: 10,
    canInviteUsers: true,
    apiRateLimit: 300,
  },
}

export const checkSubscriptionLimit = (
  subscription: "free" | "pro",
  limitType: keyof SubscriptionLimits,
  currentValue: number,
): boolean => {
  const limits = SUBSCRIPTION_LIMITS[subscription]
  const limit = limits[limitType] as number

  if (limit === -1) return true // unlimited
  return currentValue < limit
}

export const getSubscriptionFeatures = (subscription: "free" | "pro") => {
  const limits = SUBSCRIPTION_LIMITS[subscription]

  return {
    subscription,
    features: {
      notes: limits.maxNotes === -1 ? "Unlimited" : `Up to ${limits.maxNotes}`,
      privateNotes:
        limits.maxPrivateNotes === -1
          ? "Unlimited"
          : limits.maxPrivateNotes === 0
            ? "None"
            : `Up to ${limits.maxPrivateNotes}`,
      tagsPerNote: `Up to ${limits.maxTagsPerNote}`,
      teamInvites: limits.canInviteUsers ? "Yes" : "No",
      apiAccess: `${limits.apiRateLimit} requests/min`,
    },
    limits,
  }
}
