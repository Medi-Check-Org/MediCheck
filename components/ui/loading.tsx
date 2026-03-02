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
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  text = "Loading...",
  className = "",
}) => {
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
        className={`${sizeClasses[size]} border-border border-t-accent rounded-full animate-spin`}
      />
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
      className={`bg-card rounded border border-border p-4 ${className}`}
      aria-hidden="true"
    >
      <div className="skeleton h-3 rounded w-3/4 mb-3" />
      <div className="skeleton h-3 rounded w-1/2 mb-2" />
      <div className="skeleton h-3 rounded w-2/3" />
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
          className="flex gap-4 px-3 py-3 border border-border rounded bg-card"
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
