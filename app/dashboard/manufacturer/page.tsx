"use client"
import { useState, useEffect } from "react"
// components import 
import { ManufacturerSidebar } from "@/components/manufacturer-page-component/manufacturer-sidebar";
import { TeamMemberManagement } from "@/components/team-member-management";
import QRGenerationComponent from "@/components/QRGenerationComponent";
import ManufacturerReports from "@/components/manufacturer-page-component/ManufacturerReports";
import ManufacturerSettings from "@/components/manufacturer-page-component/ManufacturerSettings";
import ManufacturerTransport from "@/components/manufacturer-page-component/ManufacturerTransport";
import ManufacturerQuality from "@/components/manufacturer-page-component/ManufacturerQuality";
import ManufacturerProducts from "@/components/manufacturer-page-component/ManufacturerProducts";
import ManufacturerBatch from "@/components/manufacturer-page-component/ManufacturerBatch";
import UnitFlowManagement from "@/components/manufacturer-page-component/UnitFlowManagement";
import Transfers from "@/components/Transfers";
import ManufacturerMain from "@/components/manufacturer-page-component/ManufacturerMain"
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard"
import { UniversalLoader } from "@/components/ui/universal-loader"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
// icons
import { Menu, Shield, X } from "lucide-react"
// 
import { ManufacturerTab } from "@/utils";
import { toast } from "react-toastify";
import { MedicationBatchInfoProps } from "@/utils";

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


  // 3️⃣ Guard rendering while loading
  if (orgLoading || batchesLoading || !orgId) {
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
      <div className="hidden lg:flex lg:flex-shrink-0">
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
            <ManufacturerMain setActiveTab={setActiveTab} orgId={orgId} />
          )}

          {activeTab === "batches" && (
            <ManufacturerBatch orgId={orgId} allBatches={batches} loadBatches={loadBatches} />
          )}

          {activeTab === "products" && (
            <ManufacturerProducts orgId={orgId} />
          )}

          {activeTab === "transfers" && (
            <Transfers orgId={orgId} allBatches={batches} loadBatches={loadBatches} />
          )}

          {activeTab === "units" && (
            <UnitFlowManagement orgId={orgId} />
          )}

          {activeTab === "quality" && (
            <ManufacturerQuality />
          )}

          {activeTab === "transport" && (
            <ManufacturerTransport setActiveTab={setActiveTab} />
          )}

          {activeTab === "qr-generator" && (
            <QRGenerationComponent allBatches={batches} />
          )}

          {activeTab === "team" && (
            <TeamMemberManagement 
              organizationType="MANUFACTURER" 
              organizationId={orgId}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsDashboard 
              dashboardType="manufacturer"
              title="Manufacturing Analytics"
            />
          )}

          {activeTab === "reports" && (
            <ManufacturerReports />
          )}

          {activeTab === "settings" && (
            <ManufacturerSettings />
          )}
        </div>
      </main>

    </div>
  )
}
