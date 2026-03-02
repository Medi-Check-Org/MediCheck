"use client"

import React from "react"
import { Shield } from "lucide-react"

interface UniversalLoaderProps {
  /** Text shown below the logo mark */
  text?: string
}

/**
 * UniversalLoader
 *
 * Full-screen, interaction-blocking loading overlay.
 * Uses a restrained logo-pulse animation only.
 * ARIA-compliant, dark-mode aware, high z-index.
 */
export function UniversalLoader({ text = "Loading..." }: UniversalLoaderProps) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      {/* Logo mark — pulsing opacity only, no scale or bounce */}
      <div className="loader-pulse flex flex-col items-center gap-4">
        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary">
          <Shield className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-semibold text-foreground tracking-tight">MediCheck</span>
          <span className="text-xs text-muted-foreground">{text}</span>
        </div>
      </div>
      {/* Progress bar — clean, no color flash */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted overflow-hidden">
        <div className="h-full w-1/3 bg-accent loader-pulse" />
      </div>
      <span className="sr-only">{text}</span>
    </div>
  )
}

export default UniversalLoader
