"use client"

import { Button } from "@/components/ui/button"
import { UniversalLoader } from "@/components/ui/universal-loader"
import {
  Shield,
  LayoutDashboard,
  Eye,
  FileText,
  CheckCircle,
  AlertTriangle,
  Users,
  Settings,
  LogOut,
  X,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { useClerk } from "@clerk/nextjs"
import { authRoutes, ManufacturerTab } from "@/utils"
import { useEffect, useState } from "react"

interface RegulatorSidebarProps {
  activeTab: ManufacturerTab
  setActiveTab: (tab: ManufacturerTab) => void
  isOpen?: boolean
  onClose?: () => void
}

export function RegulatorSidebar({ activeTab, setActiveTab, isOpen = false, onClose }: RegulatorSidebarProps) {
  const { signOut } = useClerk()
  const [orgName, setOrgName] = useState("Regulatory Authority")
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    fetch("/api/web/organizations/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.organization?.companyName && setOrgName(d.organization.companyName))
      .catch(() => {})
  }, [])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try { await signOut({ redirectUrl: authRoutes.login }) }
    catch { setIsSigningOut(false) }
  }

  const menuItems = [
    { id: "dashboard",     label: "Dashboard",           icon: LayoutDashboard },
    { id: "compliance",    label: "Compliance",          icon: CheckCircle },
    { id: "reports",       label: "Reports",             icon: FileText },
    { id: "alerts",        label: "Alerts",              icon: AlertTriangle },
    { id: "entities",      label: "Registered Entities", icon: Users },
    { id: "team",          label: "Team",                icon: Users },
    { id: "analytics",     label: "Analytics",           icon: BarChart3 },
    { id: "settings",      label: "Settings",            icon: Settings },
  ]

  const handleTabClick = (tab: ManufacturerTab) => {
    setActiveTab(tab)
    if (onClose) onClose()
  }

  if (isSigningOut) return <UniversalLoader text="Signing out..." />

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-foreground/20"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 w-60 bg-sidebar border-r border-sidebar-border flex flex-col h-full
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-sidebar-border flex-shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 bg-sidebar-primary rounded flex items-center justify-center flex-shrink-0">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-sidebar-foreground tracking-tight">MediCheck</span>
          </Link>
          <button
            className="lg:hidden text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Org badge */}
        <div className="px-4 py-3 border-b border-sidebar-border flex-shrink-0">
          <p className="text-[10px] font-semibold text-role-regulator uppercase tracking-widest mb-0.5">
            Regulator
          </p>
          <p className="text-xs font-medium text-sidebar-foreground truncate">{orgName}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === (item.id as unknown as string)
            return (
              <button
                key={item.id}
                className={`w-full flex items-center gap-2.5 px-3 h-8 rounded text-xs font-medium transition-colors duration-100 cursor-pointer mb-0.5 ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
                onClick={() => handleTabClick(item.id as ManufacturerTab)}
              >
                <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? "text-role-regulator" : ""}`} />
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
    </>
  )
}
