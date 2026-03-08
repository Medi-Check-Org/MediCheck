"use client"

import React from "react"
import { Button } from "@/components/ui/button"

// ─── Types ────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: React.ReactNode
  /** Custom fallback UI — receives error + reset fn */
  fallback?: (error: Error, reset: () => void) => React.ReactNode
  /** Called whenever an error is caught — use for logging / telemetry */
  onError?: (error: Error, info: React.ErrorInfo) => void
  /** Optional label shown in the default fallback (e.g. "this section") */
  context?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// ─── Default Fallback UI ─────────────────────────────────────

function DefaultFallback({
  error,
  context = "this section",
  onReset,
}: {
  error: Error
  context?: string
  onReset: () => void
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-center justify-center w-full min-h-[240px] p-6"
    >
      <div className="w-full max-w-sm text-center">
        {/* Icon badge */}
        <div className="flex justify-center mb-5">
          <div className="h-12 w-12 bg-destructive/10 rounded-lg flex items-center justify-center">
            <svg
              className="h-6 w-6 text-destructive"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
        </div>

        {/* Heading — match page title font */}
        <h2 className="font-sans font-bold text-xl sm:text-2xl text-foreground tracking-tight mb-1.5">
          Something went wrong
        </h2>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-1">
          An unexpected error occurred while loading {context}.
        </p>

        {/* Error message — for developer context */}
        {error.message && (
          <p className="text-xs text-muted-foreground/70 font-mono bg-muted rounded px-2.5 py-1.5 mt-2 mb-5 text-left break-all select-all">
            {error.message}
          </p>
        )}

        {/* Actions — match other dashboard buttons */}
        <div className="flex flex-col gap-2 mt-5">
          <Button
            variant="default"
            size="sm"
            className="w-full cursor-pointer"
            onClick={onReset}
          >
            Try again
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full cursor-pointer"
            onClick={() => window.location.reload()}
          >
            Reload page
          </Button>
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          If this keeps happening, contact{" "}
          <a
            href="mailto:support@medicheck.io"
            className="text-foreground hover:underline"
          >
            support@medicheck.io
          </a>
        </p>
      </div>
    </div>
  )
}

// ─── Error Boundary Class Component ──────────────────────────

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
    this.reset = this.reset.bind(this)
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Forward to caller for logging / Sentry / etc.
    this.props.onError?.(error, info)

    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary] Caught error:", error)
      console.error("[ErrorBoundary] Component stack:", info.componentStack)
    }
  }

  reset() {
    this.setState({ hasError: false, error: null })
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback, context } = this.props

    if (hasError && error) {
      if (fallback) {
        return fallback(error, this.reset)
      }
      return (
        <DefaultFallback error={error} context={context} onReset={this.reset} />
      )
    }

    return children
  }
}

// ─── Convenience wrapper for section-level boundaries ────────

const sectionCardClassName =
  "bg-card text-card-foreground flex flex-col gap-6 rounded-lg border border-border py-6 shadow-none min-h-0"

/**
 * Wraps any section in an ErrorBoundary with card styling matching ui/card.
 * Use for dashboard tab content so errors are contained and UI is consistent.
 */
export function SectionErrorBoundary({
  children,
  context,
  onError,
}: {
  children: React.ReactNode
  context?: string
  onError?: (error: Error, info: React.ErrorInfo) => void
}) {
  return (
    <ErrorBoundary
      context={context}
      onError={onError}
      fallback={(error, reset) => (
        <div className={sectionCardClassName}>
          <DefaultFallback error={error} context={context} onReset={reset} />
        </div>
      )}
    >
      <div className={sectionCardClassName}>
        {children}
      </div>
    </ErrorBoundary>
  )
}

export default ErrorBoundary
