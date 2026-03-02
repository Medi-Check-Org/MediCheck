"use client"

import { UniversalLoader } from "@/components/ui/universal-loader"
import {
  Shield,
  LayoutDashboard,
  Package,
  ClipboardList,
  BarChart3,
  Users,
  Settings,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { useClerk } from "@clerk/nextjs"
import { authRoutes } from "@/utils"
import { useState } from "react"

interface PharmacySidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function PharmacySidebar({ activeTab, setActiveTab }: PharmacySidebarProps) {
  const { signOut } = useClerk()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try { await signOut({ redirectUrl: authRoutes.login }) }
    catch { setIsSigningOut(false) }
  }

  const menuItems = [
    { id: "dashboard",     label: "Dashboard",    icon: LayoutDashboard },
    { id: "prescriptions", label: "Prescriptions", icon: ClipboardList },
    { id: "inventory",     label: "Inventory",     icon: Package },
    { id: "team",          label: "Team",          icon: Users },
    { id: "reports",       label: "Reports",       icon: BarChart3 },
    { id: "settings",      label: "Settings",      icon: Settings },
  ]

  if (isSigningOut) return <UniversalLoader text="Signing out..." />

  return (
    <div className="w-60 bg-sidebar border-r border-sidebar-border flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="flex items-center px-4 py-3.5 border-b border-sidebar-border flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-6 w-6 bg-sidebar-primary rounded flex items-center justify-center flex-shrink-0">
            <Shield className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm text-sidebar-foreground tracking-tight">MediCheck</span>
        </Link>
      </div>

      {/* Org badge */}
      <div className="px-4 py-3 border-b border-sidebar-border flex-shrink-0">
        <p className="text-[10px] font-semibold text-role-consumer uppercase tracking-widest mb-0.5">
          Pharmacy
        </p>
        <p className="text-xs font-medium text-sidebar-foreground truncate">Active Pharmacy</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              className={`w-full flex items-center gap-2.5 px-3 h-8 rounded text-xs font-medium transition-colors duration-100 cursor-pointer mb-0.5 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? "text-role-consumer" : ""}`} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="px-2 py-2 border-t border-sidebar-border flex-shrink-0">
        <button
          className="w-full flex items-center gap-2.5 px-3 h-8 rounded text-xs font-medium text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
