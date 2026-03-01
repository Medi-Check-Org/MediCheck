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

  // Mobile Header (matches your other pages)
  const MobileHeader = () => (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">MediCheck</span>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );

  // Desktop Header (matches your other pages)
  const DesktopHeader = () => (
    <div className="hidden lg:flex items-center justify-between w-full px-8 py-6 border-b bg-background/95 backdrop-blur-sm z-40">
      <div className="flex items-center space-x-2">
        <Shield className="h-7 w-7 text-primary" />
        <span className="font-bold text-2xl">MediCheck</span>
      </div>
      <ThemeToggle />
    </div>
  );

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (loading) {
    return (
        <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
            <MobileHeader />
            <DesktopHeader />
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-56 h-56 bg-primary/5 rounded-full blur-2xl"></div>
                <div className="absolute bottom-20 left-20 w-40 h-40 bg-accent/5 rounded-full blur-xl"></div>
            </div>
            <main className="flex flex-1 items-center justify-center w-full px-2 sm:px-4">
                <Card className="w-full max-w-xs sm:max-w-sm mx-auto rounded-xl shadow-lg z-10">
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl font-bold text-foreground">Verifying Batch</CardTitle>
                        <CardDescription className="text-muted-foreground text-xs sm:text-sm">
                            Please wait while we verify this batch. This may take a few seconds.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center space-y-4 py-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <div className="text-sm text-muted-foreground">Verifying batch authenticity...</div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
            <MobileHeader />
            <DesktopHeader />
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-56 h-56 bg-destructive/5 rounded-full blur-2xl"></div>
                <div className="absolute bottom-20 left-20 w-40 h-40 bg-status-warning/5 rounded-full blur-xl"></div>
            </div>
            <main className="flex flex-1 items-center justify-center w-full px-2 sm:px-4">
                <Card className="w-full max-w-md mx-auto rounded-xl shadow-lg z-10">
                    <CardHeader>
                        <CardTitle className="text-xl sm:text-2xl font-bold text-destructive">Verification Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm sm:text-base">{error}</p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <MobileHeader />
      <DesktopHeader />
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-status-verified/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-primary/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-status-verified/10 rounded-full blur-lg transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>
      <main className="flex flex-1 items-center justify-center w-full px-2 sm:px-4">
        <Card className="w-full max-w-lg mx-auto rounded-xl shadow-lg p-4 sm:p-8 my-8 sm:my-16 relative z-10">
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
                <div className={`rounded-xl p-4 sm:p-6 text-center transition-all duration-300 ${statusUI.bg}`}>
                  <h2 className={`text-2xl sm:text-3xl font-bold mb-2 ${statusUI.text}`}>
                    {statusUI.icon} {statusUI.label} Batch
                  </h2>
                  <p className="mt-2 text-base sm:text-lg font-medium">
                    Batch ID: <span className="font-mono">{batch?.batchId}</span>
                  </p>
                  <p className="text-sm sm:text-base">
                    Status:{" "}
                    <span className={`font-semibold uppercase tracking-wide ${statusUI.badge}`}>
                      {statusUI.label}
                    </span>
                  </p>
                  {statusUI.message && (
                    <p className={`text-sm sm:text-base font-semibold mt-2 ${statusUI.badge}`}>
                      {statusUI.message}
                    </p>
                  )}
                </div>
              );
            })() : valid ? (
              // fallback for valid but no status
              <div className="rounded-xl p-4 sm:p-6 text-center transition-all duration-300 bg-muted border border-border">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-muted-foreground">
                  ℹ️ Unknown Status
                </h2>
                <p className="mt-2 text-base sm:text-lg font-medium">
                  Batch ID: <span className="font-mono">{batch?.batchId}</span>
                </p>
              </div>
            ) : (
              // INVALID: RED CARD
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 sm:p-6 text-center transition-all duration-300">
                <h2 className="text-2xl sm:text-3xl font-bold text-destructive mb-2">
                  Invalid Signature
                </h2>
                <p className="text-sm sm:text-base text-destructive">
                  This batch QR code does not match any authentic record.
                </p>
                <p className="text-sm sm:text-base text-destructive">
                  Batch transfer has been cancelled, this batch id has been forged.
                </p>
              </div>
            )}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground p-3 shadow transition-colors"
                href="/consumer/scan"
                aria-label="Back to Scanner"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Link
                className="inline-block rounded bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-sm sm:text-base font-semibold shadow transition-colors text-center flex-1"
                href={getRedirectPath(publicMetadata?.role, publicMetadata?.organizationType)}
              >
                Go To Dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
