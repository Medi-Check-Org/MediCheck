"use client";
import { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import { Shield } from "lucide-react"; 
// 
import { RegulatorSidebar } from "@/components/regulator-page-component/regulator-sidebar";
import RegulatorInvestigations from "@/components/regulator-page-component/RegulatorInvestigations";
import RegulatorCompliance from "@/components/regulator-page-component/RegulatorCompliance";
import RegulatorSettings from "@/components/regulator-page-component/RegulatorSettings";
import RegulatorAlerts from "@/components/regulator-page-component/RegulatorAlerts";
import RegulatorReports from "@/components/regulator-page-component/RegulatorReports";
import RegulatorEntities from "@/components/regulator-page-component/RegulatorEntities";    
import RegulatorMain from "@/components/regulator-page-component/RegulatorMain";
import RegulatorAnalytics from "@/components/regulator-page-component/RegulatorAnalytics";
import { TeamMemberManagement } from "@/components/team-member-management";
import { ManufacturerTab } from "@/utils";
import { ThemeToggle } from "@/components/theme-toggle"
import { UniversalLoader } from "@/components/ui/universal-loader"
import { SectionErrorBoundary } from "@/components/ui/error-boundary"
import { toast } from "react-toastify";
// 

export default function RegulatorDashboard() {

  const [activeTab, setActiveTab] = useState<ManufacturerTab>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [orgId, setOrgId] = useState("");
  const [orgName, setOrgName] = useState("Loading...");
  const [orgLoading, setOrgLoading] = useState(true);

  // Fetch orgId and orgName
  useEffect(() => {
    const loadOrg = async () => {
      setOrgLoading(true);
      try {
        const res = await fetch("/api/web/organizations/me");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch organization");
        }
        setOrgId(data.organizationId);
        setOrgName(data.organization.companyName);
      } catch (error) {
        console.error("Error fetching organization:", error);
        toast.error(`${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setOrgLoading(false);
      }
    };
    loadOrg();
  }, []);

  if (orgLoading || !orgId) {
    return <UniversalLoader text="Loading dashboard..." />
  }

  return (

    <div className="flex h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-12">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center justify-center h-8 w-8 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-primary rounded flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm text-foreground tracking-tight">MediCheck</span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-foreground/20"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar shadow-lg border-r border-sidebar-border"
            onClick={(e) => e.stopPropagation()}
          >
            <RegulatorSidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              orgId={orgId}
              orgName={orgName}
              isMobile={true}
              onTabSelect={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <RegulatorSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          orgId={orgId}
          orgName={orgName}
          isMobile={false}
        />
      </div>

      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="p-5 sm:p-6 lg:p-8 page-enter mt-12 lg:mt-0">

          {activeTab === "dashboard" && (
            <SectionErrorBoundary context="the regulator dashboard">
              <RegulatorMain setActiveTab={setActiveTab} />
            </SectionErrorBoundary>
          )}

          {activeTab === "analytics" && (
            <SectionErrorBoundary context="regulator analytics">
              <RegulatorAnalytics />
            </SectionErrorBoundary>
          )}

          {activeTab === "investigations" && (
            <SectionErrorBoundary context="investigations">
              <RegulatorInvestigations />
            </SectionErrorBoundary>
          )}

          {activeTab === "compliance" && (
            <SectionErrorBoundary context="compliance">
              <RegulatorCompliance />
            </SectionErrorBoundary>
          )}

          {activeTab === "entities" && (
            <SectionErrorBoundary context="regulated entities">
              <RegulatorEntities />
            </SectionErrorBoundary>
          )}

          {activeTab === "reports" && (
            <SectionErrorBoundary context="reports">
              <RegulatorReports />
            </SectionErrorBoundary>
          )}

          {activeTab === "alerts" && (
            <SectionErrorBoundary context="alerts">
              <RegulatorAlerts />
            </SectionErrorBoundary>
          )}

          {activeTab === "team" && (
            <SectionErrorBoundary context="team management">
              <TeamMemberManagement 
                organizationType="regulator"
                organizationId={orgId}
              />
            </SectionErrorBoundary>
          )}

          {activeTab === "settings" && (
            <SectionErrorBoundary context="settings">
              <RegulatorSettings />
            </SectionErrorBoundary>
          )}
        </div>

      </main>

    </div>

  )
}
