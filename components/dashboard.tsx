"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { NotesView } from "@/components/notes-view"
import { SubscriptionView } from "@/components/subscription-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileTextIcon, SettingsIcon, CreditCardIcon, LogOutIcon, UsersIcon, CrownIcon } from "@/components/icons"

type View = "notes" | "subscription" | "settings"

export function Dashboard() {
  const { user, logout } = useAuth()
  const [currentView, setCurrentView] = useState<View>("notes")

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileTextIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">NotesApp</h1>
            </div>
            <Badge variant={user.subscription === "pro" ? "default" : "secondary"} className="ml-2">
              {user.subscription === "pro" ? (
                <>
                  <CrownIcon className="w-3 h-3 mr-1" />
                  Pro
                </>
              ) : (
                "Free"
              )}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
              <LogOutIcon className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        <aside className="w-64 border-r border-border bg-sidebar min-h-[calc(100vh-4rem)]">
          <nav className="p-6 space-y-2">
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Main Menu</h2>
            </div>
            <Button
              variant={currentView === "notes" ? "default" : "ghost"}
              className="w-full justify-start h-10 font-medium"
              onClick={() => setCurrentView("notes")}
            >
              <FileTextIcon className="w-4 h-4 mr-3" />
              Notes
            </Button>
            <Button
              variant={currentView === "subscription" ? "default" : "ghost"}
              className="w-full justify-start h-10 font-medium"
              onClick={() => setCurrentView("subscription")}
            >
              <CreditCardIcon className="w-4 h-4 mr-3" />
              Subscription
            </Button>
            {user.role === "admin" && (
              <Button variant="ghost" className="w-full justify-start h-10 font-medium" disabled>
                <UsersIcon className="w-4 h-4 mr-3" />
                Team
                <Badge variant="secondary" className="ml-auto text-xs">
                  Soon
                </Badge>
              </Button>
            )}
            <Button
              variant={currentView === "settings" ? "default" : "ghost"}
              className="w-full justify-start h-10 font-medium"
              onClick={() => setCurrentView("settings")}
            >
              <SettingsIcon className="w-4 h-4 mr-3" />
              Settings
            </Button>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {currentView === "notes" && <NotesView />}
          {currentView === "subscription" && <SubscriptionView />}
          {currentView === "settings" && (
            <div className="max-w-2xl">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
                <p className="text-muted-foreground">Manage your account preferences and application settings.</p>
              </div>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Account Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Settings panel coming soon. We're working on bringing you more customization options.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
