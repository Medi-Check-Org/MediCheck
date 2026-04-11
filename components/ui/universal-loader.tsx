"use client"
import { Shield } from "lucide-react"

interface UniversalLoaderProps {
  text?: string
}

export const UniversalLoader = ({ text = "Loading" }: UniversalLoaderProps) => {
  return (

    <div
      className="fixed h-screen inset-0 z-9999 flex items-center justify-center bg-black/40 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >

      <div className="relative flex h-48 w-48 items-center justify-center">

        <div className="relative flex h-48 w-48 flex-col items-center justify-center rounded-full bg-white/85 animate-[ping_2s_linear_infinite] text-black shadow-2xl">

          {/* Brand Content */}
          <div className="relative z-10 flex flex-col items-center gap-3">
            {/* Shield Icon Container */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
              <Shield className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
            </div>

            {/* Text Branding */}
            <div className="flex flex-col items-center">

              <span className="text-sm font-bold tracking-tight text-center text-black">
                MediCheck
              </span>

              <span className="text-[8px] mt-1 font-medium uppercase text-center text-wrap tracking-[0.2em] text-black/60">
                {text}
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}

export default UniversalLoader