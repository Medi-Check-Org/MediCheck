"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { getRedirectPath } from "@/utils";
import { MyPublicMetadata } from "@/utils";
import Link from "next/link";
import { Loader2, Shield, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function VerifyBatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, isSignedIn } = useUser();

  const batchId = params.batchId as string;
  const sig = searchParams.get("sig");

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState<boolean | null>(null);
  const [batch, setBatch] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const publicMetadata = user?.publicMetadata as MyPublicMetadata;

  useEffect(() => {
    async function verifyBatch(latitude: number, longitude: number) {
      if (!batchId || !sig) {
        setError("Missing batch ID or signature");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/web/verify/batch/${batchId}?sig=${sig}&lat=${latitude}&long=${longitude}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Verification failed");
        } else {
          setValid(data.valid);
          setBatch(data.batch);
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        verifyBatch(latitude, longitude);
      });
    }
  }, [batchId, sig]);

  // Helper to get status color and label
  const getStatusUI = (status: string | undefined) => {
    const normalized = status?.toLowerCase();
    switch (normalized) {
      case "flagged":
        return {
          bg: "bg-destructive/10 border border-destructive/20",
          text: "text-destructive",
          badge: "text-destructive",
          label: "Flagged",
          message: (
            <>
              This batch has been <span className="underline">flagged for review</span>.<br />
              Please contact support or your administrator.
            </>
          ),
        };
      case "recalled":
        return {
          bg: "bg-status-warning/10 border border-status-warning/20",
          text: "text-status-warning",
          badge: "text-status-warning",
          label: "Recalled",
          message: (
            <>
              This batch has been <span className="underline">recalled</span>.<br />
              Please do not use or distribute.
            </>
          ),
        };
      case "expired":
        return {
          bg: "bg-muted border border-border",
          text: "text-muted-foreground",
          badge: "text-muted-foreground",
          label: "Expired",
          message: (
            <>
              This batch is <span className="underline">expired</span>.<br />
              Please dispose of properly.
            </>
          ),
        };
      case "bully":
        return {
          bg: "bg-status-warning/10 border border-status-warning/20",
          text: "text-status-warning",
          badge: "text-status-warning",
          label: "Bully",
          message: (
            <>
              This batch is marked as <span className="underline">bully</span>.<br />
              Please review with caution.
            </>
          ),
        };
      case "in_transit":
        return {
          bg: "bg-primary/10 border border-primary/20",
          text: "text-primary",
          badge: "text-primary",
          label: "In Transit",
          message: (
            <>
              This batch is currently <span className="underline">in transit</span>.<br />
              Awaiting delivery.
            </>
          ),
        };
      case "delivered":
        return {
          bg: "bg-status-verified/10 border border-status-verified/20",
          text: "text-status-verified",
          badge: "text-status-verified",
          label: "Delivered",
          message: (
            <>
              This batch has been <span className="underline">delivered</span>.<br />
              Transfer completed.
            </>
          ),
        };
      case "created":
        return {
          bg: "bg-secondary border border-border",
          text: "text-secondary-foreground",
          badge: "text-secondary-foreground",
          label: "Created",
          message: (
            <>
              This batch has been <span className="underline">created</span> and is awaiting processing.
            </>
          ),
        };
      default:
        return {
          bg: "bg-muted border border-border",
          text: "text-muted-foreground",
          badge: "text-muted-foreground",
          label: status || "Unknown",
          message: null,
        };
    }
  };

  const PageHeader = () => (
    <nav className="border-b border-border bg-card/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-base text-foreground tracking-tight">MediCheck</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PageHeader />
        <main className="flex flex-1 items-center justify-center w-full px-4 pt-14">
          <Card className="w-full max-w-sm mx-auto border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">Verifying Batch</CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Please wait while we verify this batch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 py-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Checking blockchain records...</span>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PageHeader />
        <main className="flex flex-1 items-center justify-center w-full px-4 pt-14">
          <Card className="w-full max-w-md mx-auto border border-destructive/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-destructive">Verification Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{error}</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageHeader />
      <main className="flex flex-1 items-center justify-center w-full px-4 pt-14">
        <Card className="w-full max-w-lg mx-auto border border-border shadow-sm my-8 sm:my-12">
          <CardHeader className="pb-2">
            <CardTitle className="font-bold text-xl sm:text-2xl text-foreground">Batch Verification</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              Batch ID: <span className="font-mono">{batchId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {valid && batch?.status ? (() => {
              const statusUI = getStatusUI(batch.status);
              return (
                <div className={`rounded-lg p-5 ${statusUI.bg}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-mono uppercase tracking-widest font-semibold ${statusUI.badge}`}>
                      {statusUI.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Batch ID: <span className="font-mono text-xs">{batch?.batchId}</span>
                  </p>
                  {statusUI.message && (
                    <p className={`text-sm mt-2 ${statusUI.badge}`}>
                      {statusUI.message}
                    </p>
                  )}
                </div>
              );
            })() : valid ? (
              <div className="rounded-lg p-5 bg-muted border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-1">Status: Unknown</p>
                <p className="text-sm font-mono text-xs">Batch ID: {batch?.batchId}</p>
              </div>
            ) : (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-5">
                <p className="font-semibold text-destructive mb-1">Invalid Signature</p>
                <p className="text-sm text-destructive/80">
                  This batch QR code does not match any authentic record in the blockchain.
                </p>
              </div>
            )}
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <Link
                href="/consumer/scan"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-3 py-2 justify-center"
                aria-label="Back to Scanner"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Scanner</span>
              </Link>
              <Link
                className="flex-1 inline-flex items-center justify-center rounded-md bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 text-sm font-medium transition-colors"
                href={getRedirectPath(publicMetadata?.role, publicMetadata?.organizationType)}
              >
                Go to Dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
