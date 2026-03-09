import React from "react"

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large"
  text?: string
  className?: string
}

/**
 * LoadingSpinner — inline, non-blocking loading indicator.
 * Used inside cards, tables, and content areas.
 */
export function LoadingSpinner({
  size = "medium", text = "Loading...", className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: "w-4 h-4 border",
    medium: "w-5 h-5 border-2",
    large: "w-6 h-6 border-2",
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-label={text}
    >
      <div
        className={`${sizeClasses[size]} border-border border-t-accent rounded-full animate-spin`} />
      {text && (
        <p className="text-xs text-muted-foreground font-medium">{text}</p>
      )}
      <span className="sr-only">{text}</span>
    </div>
  )
}

interface LoadingCardProps {
  className?: string
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ className = "" }) => {
  return (
    <div
      className={`bg-card rounded-lg border border-border px-4 py-6 shadow-none ${className}`}
      aria-hidden="true"
    >
      <div className="skeleton h-3 rounded w-3/4 mb-3" />
      <div className="skeleton h-3 rounded w-1/2 mb-2" />
      <div className="skeleton h-3 rounded w-2/3" />
    </div>
  )
}

/** Section loading placeholder: Card with header + LoadingSpinner. Use for tab/section content to match other cards. */
interface SectionLoadingCardProps {
  title?: string
  /** e.g. "Loading products...", "Loading settings..." */
  message?: string
  className?: string
}

export function SectionLoadingCard({
  title = "Loading",
  message = "Loading...",
  className = "",
}: SectionLoadingCardProps) {
  return (
    <div
      data-slot="card"
      className={`bg-card text-card-foreground flex flex-col gap-6 rounded-lg border border-border py-6 shadow-none ${className}`}
      aria-hidden="true"
    >
      <div className="px-6 grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5">
        <div data-slot="card-title" className="leading-none font-semibold">
          {title}
        </div>
        <div data-slot="card-description" className="text-muted-foreground text-sm">
          {message}
        </div>
      </div>
      <div className="px-6 flex flex-col items-center justify-center min-h-[200px]">
        <LoadingSpinner size="large" text={message} />
      </div>
    </div>
  )
}

interface LoadingTableProps {
  rows?: number
  columns?: number
}

export const LoadingTable: React.FC<LoadingTableProps> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-3 py-3 border border-border rounded-lg bg-card"
        >
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="skeleton flex-1 h-3 rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}

export default LoadingSpinner
