"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading"
import {
  Shield,
  LayoutDashboard,
  Package,
  ClipboardList,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Building2,
} from "lucide-react"
import Link from "next/link";
import { useClerk } from "@clerk/nextjs"
import { authRoutes } from "@/utils"
import { useState } from "react"

interface PharmacySidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function PharmacySidebar({ activeTab, setActiveTab }: PharmacySidebarProps) {

  const { signOut } = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ redirectUrl: authRoutes.login });
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };
  
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "prescriptions", label: "Prescriptions", icon: ClipboardList },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "team", label: "Team Members", icon: Users },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <>
      {/* Full-page loading overlay when signing out */}
      {isSigningOut && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg border">
            <LoadingSpinner size="large" text="Signing out..." />
          </div>
        </div>
      )}
      
      <div className="w-64 bg-sidebar border-r border-sidebar-border shadow-lg flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="p-4 sm:p-6 border-b border-sidebar-border flex-shrink-0">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative group-hover:scale-110 transition-transform duration-300">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-sidebar-primary" />
            </div>
            <span className="font-bold text-lg sm:text-xl text-sidebar-foreground">
              MediCheck
            </span>
          </Link>
        </div>

        {/* Organization Card */}
        <div className="p-4 pt-6 flex flex-col items-center border-b border-sidebar-border bg-gradient-to-b from-role-manufacturer/10 to-transparent rounded-b-xl shadow-sm mb-2">
          <Badge variant="manufacturer" className="mb-2 px-3 py-1 text-xs rounded-full shadow bg-gradient-to-r from-[#0FA3B1] to-[#0C8A96] text-white border-0">
            Pharmacy
          </Badge>
          <span className="font-bold text-base text-sidebar-foreground text-center tracking-wide mb-1">
            MedPlus Pharmacy
          </span>
          <span className="text-xs text-sidebar-foreground/60 text-center italic">Active Pharmacy</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start cursor-pointer hover:bg-sidebar-accent/50 transition-all duration-200 group ${activeTab === item.id ? 'border-l-[3px] border-[#0FA3B1] bg-sidebar-accent/50 text-sidebar-foreground rounded-l-none' : 'text-sidebar-foreground/70'} text-xs sm:text-sm`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon className={`h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3 ${activeTab === item.id ? 'text-[#0FA3B1]' : ''} group-hover:scale-110 transition-transform duration-200`} />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.label.split(' ')[0]}</span>
              </Button>
            )
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-sidebar-border flex-shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors text-xs sm:text-sm"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
            <span className="hidden sm:inline">Sign Out</span>
            <span className="sm:hidden">Out</span>
          </Button>
        </div>
      </div>
    </>
  )
}
