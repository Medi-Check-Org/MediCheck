"use client"
import { useState, useEffect } from "react"
// components import 
import { ManufacturerSidebar } from "@/components/manufacturer-page-component/manufacturer-sidebar";
import { TeamMemberManagement } from "@/components/team-member-management";
import QRGenerationComponent from "@/components/QRGenerationComponent";
import ManufacturerReports from "@/components/manufacturer-page-component/ManufacturerReports";
import { ManufacturerApiKeys } from "@/components/manufacturer-page-component/ManufacturerApiKeys";
import ManufacturerTransport from "@/components/manufacturer-page-component/ManufacturerTransport";
import ManufacturerQuality from "@/components/manufacturer-page-component/ManufacturerQuality";
import ManufacturerProducts from "@/components/manufacturer-page-component/ManufacturerProducts";
import ManufacturerBatch from "@/components/manufacturer-page-component/ManufacturerBatch";
import UnitFlowManagement from "@/components/manufacturer-page-component/UnitFlowManagement";
import Transfers from "@/components/Transfers";
import ManufacturerMain from "@/components/manufacturer-page-component/ManufacturerMain"
import ManufacturerSettings from "@/components/manufacturer-page-component/ManufacturerSettings"
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard"
import { SectionErrorBoundary } from "@/components/ui/error-boundary"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, Shield } from "lucide-react"
import { ManufacturerTab } from "@/utils";
import { toast } from "react-toastify";
import { MedicationBatchInfoProps } from "@/utils";
import { UniversalLoader } from "@/components/ui/universal-loader"


export default function ManufacturerDashboard() {

  const [activeTab, setActiveTab] = useState<ManufacturerTab>("dashboard");
  const [orgId, setOrgId] = useState("");
  const [batches, setBatches] = useState<MedicationBatchInfoProps[]>([]);
  const [orgLoading, setOrgLoading] = useState(true);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [orgName, setOrgName] = useState("Loading...");

  // 1️⃣ Fetch orgId and orgName
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
      }
      catch (err) {
        toast.error(`${err instanceof Error ? err.message : String(err)}`);
      }
      finally {
        setOrgLoading(false);
      }
    };

    loadOrg();

  }, []);

  const loadBatches = async () => {

    setBatchesLoading(true);
    try {
      const res = await fetch(`/api/web/batches?organizationId=${orgId}`);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch batches");
      }

      setBatches(data.batches || []);

      toast.success("Fetched batches");
    }
    catch (err) {
      toast.error(`Failed to fetch batches: ${err instanceof Error ? err.message : String(err)}`);
    }
    finally {
      setBatchesLoading(false);
    }
  };

  // 2️⃣ Fetch batches when orgId is ready
  useEffect(() => {

    if (!orgId) return;

    loadBatches();

  }, [orgId]);
  
  return (

    <div className="flex h-screen bg-background">

      {(orgLoading || batchesLoading || !orgId) && <UniversalLoader text="Loading Transfers." />}

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
            <ManufacturerSidebar
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
        <ManufacturerSidebar
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
            <SectionErrorBoundary context="the manufacturer dashboard">
              <ManufacturerMain setActiveTab={setActiveTab} orgId={orgId} />
            </SectionErrorBoundary>
          )}

          {activeTab === "batches" && (
            <SectionErrorBoundary context="batch management">
              <ManufacturerBatch orgId={orgId} allBatches={batches} loadBatches={loadBatches} />
            </SectionErrorBoundary>
          )}

          {activeTab === "products" && (
            <SectionErrorBoundary context="products">
              <ManufacturerProducts orgId={orgId} />
            </SectionErrorBoundary>
          )}

          {activeTab === "transfers" && (
            <SectionErrorBoundary context="transfers">
              <Transfers orgId={orgId} allBatches={batches} loadBatches={loadBatches} />
            </SectionErrorBoundary>
          )}

          {activeTab === "units" && (
            <SectionErrorBoundary context="unit flow management">
              <UnitFlowManagement orgId={orgId} />
            </SectionErrorBoundary>
          )}

          {/* {activeTab === "quality" && (
            <SectionErrorBoundary context="quality control">
              <ManufacturerQuality />
            </SectionErrorBoundary>
          )} */}

          {/* {activeTab === "transport" && (
            <SectionErrorBoundary context="transport management">
              <ManufacturerTransport setActiveTab={setActiveTab} />
            </SectionErrorBoundary>
          )} */}

          {activeTab === "qr-generator" && (
            <SectionErrorBoundary context="QR code generation">
              <QRGenerationComponent allBatches={batches} />
            </SectionErrorBoundary>
          )}

          {activeTab === "team" && (
            <SectionErrorBoundary context="team management">
              <TeamMemberManagement 
                organizationType="MANUFACTURER" 
                organizationId={orgId}
              />
            </SectionErrorBoundary>
          )}

          {activeTab === "api-keys" && (
            <SectionErrorBoundary context="Integrations">
              <ManufacturerApiKeys />
            </SectionErrorBoundary>
          )}

          {activeTab === "analytics" && (
            <SectionErrorBoundary context="manufacturing analytics">
              <AnalyticsDashboard 
                dashboardType="manufacturer"
                title="Manufacturing Analytics"
              />
            </SectionErrorBoundary>
          )}

          {/* {activeTab === "reports" && (
            <SectionErrorBoundary context="reports">
              <ManufacturerReports />
            </SectionErrorBoundary>
          )} */}

          {activeTab === "settings" && (
            <SectionErrorBoundary context="settings">
              <ManufacturerSettings />
            </SectionErrorBoundary>
          )}
        </div>
      </main>

    </div>
  )
}
