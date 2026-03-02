"use client"

import React from "react"

/**
 * AnimatedBackground — removed as part of enterprise UI redesign.
 * Decorative gradient blobs and floating particles violated the
 * strict no-background-gradient, no-decorative-noise constraints.
 * Kept as a no-op export for backward compatibility.
 */
interface AnimatedBackgroundProps {
  variant?: "default" | "hero" | "minimal" | "dashboard"
  className?: string
}

export function AnimatedBackground({}: AnimatedBackgroundProps) {
  return null
}
