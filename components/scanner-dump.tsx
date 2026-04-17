// // // 'use client'
// // // import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
// // // import { Button } from '@/components/ui/button'
// // // import { Camera } from 'lucide-react'

// // // // Define types for the libraries to avoid "any"
// // // type ZXingReader = any;
// // // type QrScannerLib = any;

// // // interface QRScannerProps {
// // //   onScan: (data: string) => void
// // //   onError?: (error: string) => void
// // //   className?: string
// // //   facingMode?: 'user' | 'environment'
// // //   autoStart?: boolean
// // // }

// // // export interface QRScannerRef {
// // //   startCamera: () => void
// // //   stopCamera: () => void
// // // }

// // // export const QRScanner = forwardRef<QRScannerRef, QRScannerProps>(({
// // //   onScan,
// // //   onError,
// // //   className = '',
// // //   facingMode = 'environment',
// // //   autoStart = false
// // // }, ref) => {
// // //   const videoRef = useRef<HTMLVideoElement>(null)
// // //   const streamRef = useRef<MediaStream | null>(null)
// // //   const animationRef = useRef<number | undefined>(undefined)

// // //   // Library Refs to store loaded instances
// // //   const zxingRef = useRef<ZXingReader | null>(null)
// // //   const qrScannerLibRef = useRef<QrScannerLib | null>(null)

// // //   const [isScanning, setIsScanning] = useState(false)
// // //   const [hasPermission, setHasPermission] = useState<boolean | null>(null)
// // //   const [isLoading, setIsLoading] = useState(false)
// // //   const [libsReady, setLibsReady] = useState(false)

// // //   // 1. PRE-LOAD LIBRARIES ON MOUNT
// // //   useEffect(() => {
// // //     const loadLibs = async () => {
// // //       try {
// // //         const [zxingMod, qrScannerMod] = await Promise.all([
// // //           import('@zxing/library'),
// // //           import('qr-scanner')
// // //         ]);
// // //         zxingRef.current = new zxingMod.BrowserMultiFormatReader();
// // //         qrScannerLibRef.current = qrScannerMod.default;
// // //         setLibsReady(true);
// // //       } catch (err) {
// // //         console.error("Failed to load scanning libraries", err);
// // //       }
// // //     };
// // //     loadLibs();
// // //   }, []);

// // //   const startCamera = useCallback(async () => {
// // //     if (streamRef.current) return;

// // //     try {
// // //       setIsLoading(true);
// // //       const stream = await navigator.mediaDevices.getUserMedia({
// // //         video: {
// // //           facingMode,
// // //           width: { ideal: 1280 },
// // //           height: { ideal: 720 }
// // //         }
// // //       });

// // //       streamRef.current = stream;
// // //       if (videoRef.current) {
// // //         videoRef.current.srcObject = stream;
// // //         // Wait for video to be ready before scanning
// // //         videoRef.current.onloadedmetadata = () => {
// // //           videoRef.current?.play();
// // //           setIsScanning(true);
// // //           setHasPermission(true);
// // //         };
// // //       }
// // //     } catch (err) {
// // //       setHasPermission(false);
// // //       onError?.("Camera access denied");
// // //     } finally {
// // //       setIsLoading(false);
// // //     }
// // //   }, [facingMode, onError]);

// // //   const stopCamera = useCallback(() => {
// // //     if (streamRef.current) {
// // //       streamRef.current.getTracks().forEach(track => track.stop());
// // //       streamRef.current = null;
// // //     }
// // //     if (videoRef.current) videoRef.current.srcObject = null;
// // //     if (animationRef.current) cancelAnimationFrame(animationRef.current);

// // //     setIsScanning(false);
// // //   }, []);

// // //   useImperativeHandle(ref, () => ({ startCamera, stopCamera }), [startCamera, stopCamera]);

// // //   // 2. OPTIMIZED SCANNING LOOP
// // //   const scanFrame = useCallback(async () => {
// // //     if (!isScanning || !videoRef.current || !libsReady) return;

// // //     const video = videoRef.current;

// // //     // Only scan if video is actually playing and has data
// // //     if (video.readyState === video.HAVE_ENOUGH_DATA) {
// // //       try {
// // //         // Use ZXing (Efficient for static-ish frames)
// // //         const result = await zxingRef.current.decodeFromVideoElement(video);
// // //         if (result) {
// // //           onScan(result.getText());
// // //           return; // Stop loop on success
// // //         }
// // //       } catch (e) {
// // //         // ZXing throws error if no code found, just continue to next library
// // //         try {
// // //           // Fallback to QR Scanner (Faster for motion)
// // //           const result = await qrScannerLibRef.current.scanImage(video);
// // //           if (result) {
// // //             onScan(result);
// // //             return;
// // //           }
// // //         } catch (e2) { /* No code found */ }
// // //       }
// // //     }

// // //     // Schedule next frame only if still scanning
// // //     animationRef.current = requestAnimationFrame(scanFrame);
// // //   }, [isScanning, libsReady, onScan]);

// // //   useEffect(() => {
// // //     if (isScanning) {
// // //       animationRef.current = requestAnimationFrame(scanFrame);
// // //     }
// // //     return () => {
// // //       if (animationRef.current) cancelAnimationFrame(animationRef.current);
// // //     };
// // //   }, [isScanning, scanFrame]);

// // //   useEffect(() => {
// // //     if (autoStart) startCamera();
// // //     return () => stopCamera();
// // //   }, [autoStart, startCamera, stopCamera]);

// // //   return (
// // //     <div className={`relative w-full h-full bg-black overflow-hidden ${className}`}>
// // //       <video
// // //         ref={videoRef}
// // //         className="w-full h-full object-cover block"
// // //         playsInline
// // //         muted
// // //       />

// // //       {(!isScanning && !isLoading) && (
// // //         <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center p-6 text-center z-20">
// // //           <Camera className="w-12 h-12 text-gray-400 mb-3" />
// // //           <p className="text-gray-300 text-sm mb-4">
// // //             {libsReady ? "Camera is ready" : "Loading Scanner..."}
// // //           </p>
// // //           <Button
// // //             onClick={startCamera}
// // //             disabled={!libsReady}
// // //             size="sm"
// // //           >
// // //             Start Scanning
// // //           </Button>
// // //         </div>
// // //       )}

// // //       {isLoading && (
// // //         <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
// // //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
// // //         </div>
// // //       )}
// // //     </div>
// // //   )
// // // })

// // // QRScanner.displayName = 'QRScanner'
// // // export default QRScanner




// // // "use client"
// // // import { useState, useEffect } from "react"
// // // import { Button } from "@/components/ui/button"
// // // import { ThemeToggle } from "@/components/theme-toggle"
// // // import { QRScanner } from "@/components/qr-scanner"
// // // import { UniversalLoader } from "@/components/ui/universal-loader"
// // // import { publicRoutes, authRoutes, getRedirectPath } from "@/utils"
// // // import { useUser } from "@clerk/nextjs"
// // // import { Shield, ArrowLeft, Info, Sparkles } from "lucide-react"
// // // import Link from "next/link"


// // // function Step({ number, text }: { number: string; text: string }) {
// // //   return (
// // //     <div className="flex items-center gap-5 group cursor-pointer">
// // //       <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-background border border-border flex items-center justify-center font-bold text-base text-muted-foreground group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
// // //         {number}
// // //       </div>
// // //       <p className="text-base font-medium text-foreground/80 leading-snug">{text}</p>
// // //     </div>
// // //   )
// // // }

// // // export default function ScanPage() {

// // //   const { user, isSignedIn } = useUser()

// // //   const role = user?.publicMetadata.role as string | undefined

// // //   const organizationType = user?.publicMetadata.organizationType as string | undefined

// // //   const [scannedQRcodeResult, setScannedQRcodeResult] = useState("")

// // //   const [isRedirecting, setIsRedirecting] = useState(false)

// // //   const handleQRScan = (qrData: string) => {
// // //     if (qrData && !isRedirecting) {
// // //       setScannedQRcodeResult(qrData)
// // //       setIsRedirecting(true)
// // //     }
// // //   }

// // //   useEffect(() => {
// // //     if (scannedQRcodeResult) {
// // //       window.location.href = scannedQRcodeResult
// // //     }
// // //   }, [scannedQRcodeResult])

// // //   return (
// // //     <div className="min-h-screen bg-background flex flex-col">
// // //       {isRedirecting && <UniversalLoader text="Verifying Authenticity..." />}

// // //       {/* Modern Glass Nav */}
// // //       <nav className="border-b border-border bg-background/70 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
// // //         <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-16 flex justify-between items-center">
// // //           <Link href={publicRoutes.home} className="flex items-center gap-2 group">
// // //             <div className="bg-primary p-1.5 rounded-xl transition-transform group-hover:scale-110">
// // //               <Shield className="h-5 w-5 text-primary-foreground" />
// // //             </div>
// // //             <span className="font-bold text-xl tracking-tight">MediCheck</span>
// // //           </Link>

// // //           <div className="flex items-center gap-3">
// // //             <ThemeToggle />
// // //             {isSignedIn ? (
// // //               <Link href={getRedirectPath(role, organizationType)}>
// // //                 <Button variant="default" className="rounded-full shadow-lg shadow-primary/20">Dashboard</Button>
// // //               </Link>
// // //             ) : (
// // //               <Link href={authRoutes.login}>
// // //                 <Button variant="default" className="rounded-full shadow-lg shadow-primary/20">Sign In</Button>
// // //               </Link>
// // //             )}
// // //           </div>
// // //         </div>
// // //       </nav>

// // //       {/* Main Container - Adjusted max-width and Padding */}
// // //       <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 pt-28 pb-12 flex flex-col lg:flex-row gap-12 lg:gap-16 items-center lg:items-start">

// // //         {/* Left Side: The Scanner (Slightly larger ratio for Desktop) */}
// // //         <div className="w-full lg:w-[58%] flex flex-col gap-6">
// // //           <Link
// // //             href={publicRoutes.home}
// // //             className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors text-sm w-fit"
// // //           >
// // //             <ArrowLeft className="h-4 w-4 mr-2" />
// // //             Back to Home
// // //           </Link>

// // //           {/* Wrapper for Scanner to ensure it doesn't look like a "nested card" */}
// // //           <div className="relative overflow-hidden bg-black shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[2.5rem] aspect-square lg:aspect-[4/3] w-full border border-white/5">

// // //             {/* Live Indicator Overlay */}
// // //             <div className="absolute top-6 left-6 z-20">
// // //               <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px] px-3 py-1.5 rounded-full uppercase tracking-widest font-black">
// // //                 <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
// // //                 Live Camera
// // //               </div>
// // //             </div>

// // //             <div className="h-full w-full relative">
// // //               <QRScanner
// // //                 onScan={handleQRScan}
// // //                 onError={(err) => console.error(err)}
// // //                 facingMode="environment"
// // //                 className="w-full h-full object-cover"
// // //               />

// // //               {/* Viewfinder Overlay - Now looks integrated, not like an odd border */}
// // //               <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
// // //                 <div className="w-2/3 h-2/3 border border-white/10 rounded-[2rem] relative">
// // //                   {/* Neon-style Corners */}
// // //                   <div className="absolute -top-[0.3px] -left-[0.3px] w-12 h-12 border-t-[3px] border-l-[3px] border-primary rounded-tl-[1.5rem] shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
// // //                   <div className="absolute -top-[0.3px] -right-[0.3px] w-12 h-12 border-t-[3px] border-r-[3px] border-primary rounded-tr-[1.5rem] shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
// // //                   <div className="absolute -bottom-[0.3px] -left-[0.3px] w-12 h-12 border-b-[3px] border-l-[3px] border-primary rounded-bl-[1.5rem] shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
// // //                   <div className="absolute -bottom-[0.3px] -right-[0.3px] w-12 h-12 border-b-[3px] border-r-[3px] border-primary rounded-br-[1.5rem] shadow-[0_0_15px_rgba(var(--primary),0.5)]" />

// // //                   {/* High-tech Scan Line */}
// // //                   <div className="absolute top-0 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-[bounce_3s_infinite]" />
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         </div>

// // //         {/* Right Side: Information Content */}
// // //         <div className="w-full lg:w-[42%] flex flex-col gap-8 lg:pt-10">
// // //           <div className="space-y-4">
// // //             <div className="inline-flex items-center gap-2 text-primary bg-primary/10 px-4 py-1.5 rounded-full text-xs font-bold w-fit">
// // //               <Sparkles className="w-3.5 h-3.5" />
// // //               Smart Verification
// // //             </div>
// // //             <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
// // //               Verify your <br /><span className="text-primary">Medicine.</span>
// // //             </h1>
// // //             <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-md">
// // //               Our AI-powered scanner cross-references global databases to ensure your medication is 100% authentic.
// // //             </p>
// // //           </div>

// // //           <div className="space-y-6">
// // //             <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground/70">How it works</h3>

// // //             <div className="grid gap-4">
// // //               <Step number="1" text="Locate the QR code on the box side or cap." />
// // //               <Step number="2" text="Align the code within the primary viewfinder." />
// // //               <Step number="3" text="Wait for the instant authenticity report." />
// // //             </div>
// // //           </div>

// // //           <div className="p-6 rounded-[2rem] bg-muted/30 border border-border/50 backdrop-blur-sm flex gap-5">
// // //             <div className="p-2.5 bg-primary/10 rounded-2xl h-fit">
// // //               <Info className="w-6 h-6 text-primary" />
// // //             </div>
// // //             <div className="text-sm space-y-1">
// // //               <p className="font-bold text-base">Scanning Tips</p>
// // //               <p className="text-muted-foreground leading-relaxed">Avoid direct glares and keep your hand steady for the fastest results.</p>
// // //             </div>
// // //           </div>
// // //         </div>

// // //       </main>
// // //     </div>
// // //   )
// // // }



// // // "use client"
// // // import { useState, useRef } from "react"
// // // import { Button } from "@/components/ui/button"
// // // import { ThemeToggle } from "@/components/theme-toggle"
// // // import { QRScanner, QRScannerRef } from "@/components/qr-scanner"
// // // import { UniversalLoader } from "@/components/ui/universal-loader"
// // // import { publicRoutes, getRedirectPath } from "@/utils"
// // // import { useUser } from "@clerk/nextjs"
// // // import { Shield, ArrowLeft, Info, Camera, Sparkles, XCircle } from "lucide-react"
// // // import Link from "next/link"

// // // export default function ScanPage() {
// // //     const { user, isSignedIn } = useUser()
// // //     const role = user?.publicMetadata.role as string | undefined
// // //     const orgType = user?.publicMetadata.organizationType as string | undefined

// // //     const scannerRef = useRef<QRScannerRef>(null)
// // //     const [isScanning, setIsScanning] = useState(false)
// // //     const [error, setError] = useState<string | null>(null)
// // //     const [isRedirecting, setIsRedirecting] = useState(false)

// // //     const handleStart = async () => {
// // //         setError(null)
// // //         try {
// // //             await scannerRef.current?.startCamera()
// // //             setIsScanning(true)
// // //         } catch (e) {
// // //             setIsScanning(false)
// // //         }
// // //     }

// // //     const handleStop = () => {
// // //         scannerRef.current?.stopCamera()
// // //         setIsScanning(false)
// // //         setError(null)
// // //     }

// // //     const handleScan = (data: string) => {
// // //         setIsRedirecting(true)
// // //         window.location.href = data
// // //     }

// // //     return (
// // //         <div className="min-h-screen bg-background flex flex-col">
// // //             {isRedirecting && <UniversalLoader text="Verifying Code..." />}

// // //             <nav className="border-b bg-background/70 backdrop-blur-md fixed top-0 w-full z-50">
// // //                 <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-16 flex justify-between items-center">
// // //                     <Link href={publicRoutes.home} className="flex items-center gap-2">
// // //                         <Shield className="h-6 w-6 text-primary" />
// // //                         <span className="font-bold text-xl">MediCheck</span>
// // //                     </Link>
// // //                     <div className="flex items-center gap-3">
// // //                         <ThemeToggle />
// // //                         <Link href={isSignedIn ? getRedirectPath(role, orgType) : "/sign-in"}>
// // //                             <Button variant="outline" size="sm">Dashboard</Button>
// // //                         </Link>
// // //                     </div>
// // //                 </div>
// // //             </nav>

// // //             <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 pt-28 pb-12 flex flex-col lg:flex-row gap-12">

// // //                 {/* Left Side: Scanner UI */}
// // //                 <div className="w-full lg:w-[60%] space-y-6">
// // //                     <Link href={publicRoutes.home} className="flex items-center text-muted-foreground text-sm hover:text-primary transition-colors">
// // //                         <ArrowLeft className="w-4 h-4 mr-2" /> Back
// // //                     </Link>

// // //                     <div className="relative aspect-square lg:aspect-[4/3] bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-border/50">
// // //                         {/* Camera Feed */}
// // //                         <QRScanner
// // //                             ref={scannerRef}
// // //                             onScan={handleScan}
// // //                             onError={setError}
// // //                             isPaused={!isScanning}
// // //                         />

// // //                         {/* Viewfinder (Only visible when active) */}
// // //                         {isScanning && !error && (
// // //                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
// // //                                 <div className="w-1/2 h-1/2 border-2 border-primary/30 rounded-3xl relative">
// // //                                     <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
// // //                                     <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
// // //                                     <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20 animate-pulse" />
// // //                                 </div>
// // //                             </div>
// // //                         )}

// // //                         {/* Overlays: Off / Error / Success */}
// // //                         {!isScanning && (
// // //                             <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-8 text-center z-20">
// // //                                 <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
// // //                                     <Camera className="w-8 h-8 text-primary" />
// // //                                 </div>
// // //                                 {error ? (
// // //                                     <>
// // //                                         <h3 className="text-red-400 font-bold text-lg mb-2">Access Denied</h3>
// // //                                         <p className="text-muted-foreground text-sm max-w-xs mb-6">{error}</p>
// // //                                     </>
// // //                                 ) : (
// // //                                     <>
// // //                                         <h3 className="text-white font-bold text-lg mb-2">Camera is Off</h3>
// // //                                         <p className="text-muted-foreground text-sm max-w-xs mb-6">Ready to verify your medication? Start the scanner below.</p>
// // //                                     </>
// // //                                 )}
// // //                                 <Button onClick={handleStart} className="rounded-full px-8">Start Scanner</Button>
// // //                             </div>
// // //                         )}

// // //                         {/* Close Button (Floating) */}
// // //                         {isScanning && (
// // //                             <Button
// // //                                 variant="secondary"
// // //                                 size="sm"
// // //                                 onClick={handleStop}
// // //                                 className="absolute bottom-6 right-6 z-30 rounded-full bg-black/60 text-white backdrop-blur-md border-white/10 hover:bg-black/80"
// // //                             >
// // //                                 <XCircle className="w-4 h-4 mr-2" />
// // //                                 Close Camera
// // //                             </Button>
// // //                         )}
// // //                     </div>
// // //                 </div>

// // //                 {/* Right Side: Copy */}
// // //                 <div className="w-full lg:w-[40%] space-y-8 pt-10">
// // //                     <div className="space-y-4">
// // //                         <div className="inline-flex items-center gap-2 text-primary bg-primary/10 px-4 py-1.5 rounded-full text-xs font-bold w-fit">
// // //                             <Sparkles className="w-3.5 h-3.5" /> Secure Verification
// // //                         </div>
// // //                         <h1 className="text-5xl font-black tracking-tight leading-tight">
// // //                             Verify your <br /><span className="text-primary">Package.</span>
// // //                         </h1>
// // //                         <p className="text-muted-foreground text-lg leading-relaxed">
// // //                             Instantly check the authenticity of your medication using our encrypted blockchain verification system.
// // //                         </p>
// // //                     </div>

// // //                     <div className="p-6 rounded-[2rem] bg-muted/30 border flex gap-5">
// // //                         <Info className="w-6 h-6 text-primary shrink-0" />
// // //                         <div className="text-sm">
// // //                             <p className="font-bold text-base mb-1">Scanning Tips</p>
// // //                             <p className="text-muted-foreground">Keep the QR code within the frame. Ensure you are in a well-lit environment for faster detection.</p>
// // //                         </div>
// // //                     </div>
// // //                 </div>
// // //             </main>
// // //         </div>
// // //     )
// // // }



// // // initial qr-scanner
// // 'use client'

// // import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
// // import { Button } from '@/components/ui/button'
// // import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// // import { Alert } from '@/components/ui/alert'
// // import { Camera, X, RotateCcw } from 'lucide-react'

// // interface QRScannerProps {
// //   onScan: (data: string) => void
// //   onError?: (error: string) => void
// //   className?: string
// //   width?: number
// //   height?: number
// //   facingMode?: 'user' | 'environment' // 'user' for front camera, 'environment' for back camera
// //   autoStart?: boolean // Whether to automatically start scanning when component mounts
// // }

// // interface QRCodeResult {
// //   text: string
// //   format?: string
// //   timestamp: number
// // }

// // export interface QRScannerRef {
// //   startCamera: () => void
// //   stopCamera: () => void
// // }

// // export const QRScanner = forwardRef<QRScannerRef, QRScannerProps>(({
// //   onScan,
// //   onError,
// //   className = '',
// //   width = 300,
// //   height = 300,
// //   facingMode = 'environment',
// //   autoStart = false
// // }, ref) => {
// //   const videoRef = useRef<HTMLVideoElement>(null)
// //   const canvasRef = useRef<HTMLCanvasElement>(null)
// //   const streamRef = useRef<MediaStream | null>(null)
// //   const animationRef = useRef<number | undefined>(undefined)
  
// //   const [isScanning, setIsScanning] = useState(false)
// //   const [hasPermission, setHasPermission] = useState<boolean | null>(null)
// //   const [error, setError] = useState<string | null>(null)
// //   const [lastScanResult, setLastScanResult] = useState<QRCodeResult | null>(null)
// //   const [isLoading, setIsLoading] = useState(false)

// //   // Debounce function to prevent multiple scans of the same code
// //   const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

// //   const handleScanResult = useCallback((result: string) => {
// //     const now = Date.now()
    
// //     // Prevent scanning the same code within 2 seconds
// //     if (lastScanResult &&
// //         lastScanResult.text === result &&
// //         now - lastScanResult.timestamp < 2000) {
// //       return
// //     }

// //     // Clear any existing debounce timeout
// //     if (debounceRef.current) {
// //       clearTimeout(debounceRef.current)
// //     }

// //     // Debounce the scan result to prevent rapid multiple scans
// //     debounceRef.current = setTimeout(() => {
// //       setLastScanResult({ text: result, timestamp: now })
// //       onScan(result)
// //     }, 100)
// //   }, [lastScanResult, onScan])

// //   // Initialize camera stream
// //   const startCamera = useCallback(async () => {
// //     try {
// //       setIsLoading(true)
// //       setError(null)

// //       // Check if getUserMedia is supported
// //       if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
// //         throw new Error('Camera access is not supported in this browser')
// //       }

// //       // Request camera permission
// //       const constraints: MediaStreamConstraints = {
// //         video: {
// //           facingMode,
// //           width: { ideal: width },
// //           height: { ideal: height }
// //         }
// //       }

// //       const stream = await navigator.mediaDevices.getUserMedia(constraints)
// //       streamRef.current = stream
      
// //       if (videoRef.current) {
// //         videoRef.current.srcObject = stream
// //         videoRef.current.play()
// //         setHasPermission(true)
// //         setIsScanning(true)
// //       }
// //     } catch (err) {
// //       const errorMessage = err instanceof Error ? err.message : 'Failed to access camera'
// //       setError(errorMessage)
// //       setHasPermission(false)
// //       onError?.(errorMessage)
// //     } finally {
// //       setIsLoading(false)
// //     }
// //   }, [facingMode, width, height, onError])

// //   // Stop camera stream
// //   const stopCamera = useCallback(() => {
// //     // Stop all media stream tracks
// //     if (streamRef.current) {
// //       streamRef.current.getTracks().forEach(track => {
// //         track.stop()
// //         console.log(`Stopped camera track: ${track.kind}`)
// //       })
// //       streamRef.current = null
// //     }
    
// //     // Clear video element
// //     if (videoRef.current) {
// //       videoRef.current.srcObject = null
// //       videoRef.current.load()
// //     }
    
// //     // Cancel any ongoing animation frames
// //     if (animationRef.current) {
// //       cancelAnimationFrame(animationRef.current)
// //       animationRef.current = undefined
// //     }
    
// //     // Reset all states
// //     setIsScanning(false)
// //     setHasPermission(null)
// //     setError(null)
// //     setLastScanResult(null)
// //     console.log('Camera completely stopped and resources released')
// //   }, [])

// //   // Expose methods to parent component via ref
// //   useImperativeHandle(ref, () => ({
// //     startCamera,
// //     stopCamera
// //   }), [startCamera, stopCamera])

// //   // QR Code scanning with actual libraries
// //   const scanQRCode = useCallback(async () => {
// //     if (!videoRef.current || !isScanning) {
// //       return
// //     }

// //     const video = videoRef.current

// //     if (video.readyState !== video.HAVE_ENOUGH_DATA) {
// //       animationRef.current = requestAnimationFrame(scanQRCode)
// //       return
// //     }

// //     try {
// //       // Try ZXing library first
// //       const result = await scanWithZXing(video)
// //       if (result) {
// //         handleScanResult(result)
// //         return
// //       }
// //     } catch (err) {
// //       // If ZXing fails, try qr-scanner
// //       try {
// //         const result = await scanWithQRScanner(video)
// //         if (result) {
// //           handleScanResult(result)
// //           return
// //         }
// //       } catch (fallbackErr) {
// //         // If both fail, use canvas-based detection as fallback
// //         if (canvasRef.current) {
// //           const result = scanWithCanvas(video, canvasRef.current)
// //           if (result) {
// //             handleScanResult(result)
// //           }
// //         }
// //       }
// //     }

// //     // Continue scanning
// //     animationRef.current = requestAnimationFrame(scanQRCode)
// //   }, [isScanning, handleScanResult])

// //   // ZXing-based scanning
// //   const scanWithZXing = async (video: HTMLVideoElement): Promise<string | null> => {
// //     try {
// //       const { BrowserMultiFormatReader } = await import('@zxing/library')
// //       const codeReader = new BrowserMultiFormatReader()
      
// //       const result = await codeReader.decodeOnceFromVideoDevice(undefined, video)
// //       return result ? result.getText() : null
// //     } catch (err) {
// //       // Silently fail - this is expected when no QR code is visible
// //       return null
// //     }
// //   }

// //   // qr-scanner library based scanning
// //   const scanWithQRScanner = async (video: HTMLVideoElement): Promise<string | null> => {
// //     try {
// //       const QrScanner = (await import('qr-scanner')).default
      
// //       // Create a canvas from the video frame
// //       const canvas = document.createElement('canvas')
// //       const ctx = canvas.getContext('2d')
// //       if (!ctx) return null
      
// //       canvas.width = video.videoWidth
// //       canvas.height = video.videoHeight
// //       ctx.drawImage(video, 0, 0)
      
// //       // Use the correct API - just pass the canvas element
// //       const result = await QrScanner.scanImage(canvas)
// //       return result || null
// //     } catch (err) {
// //       // Silently fail - this is expected when no QR code is visible
// //       return null
// //     }
// //   }

// //   // Canvas-based fallback scanning
// //   const scanWithCanvas = (video: HTMLVideoElement, canvas: HTMLCanvasElement): string | null => {
// //     const context = canvas.getContext('2d')
// //     if (!context) return null

// //     // Set canvas dimensions to match video
// //     canvas.width = video.videoWidth
// //     canvas.height = video.videoHeight

// //     // Draw current video frame to canvas
// //     context.drawImage(video, 0, 0, canvas.width, canvas.height)

// //     try {
// //       // Get image data from canvas
// //       const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      
// //       // Basic pattern detection for demo purposes
// //       const data = imageData.data
// //       let darkPixels = 0
// //       let lightPixels = 0
      
// //       for (let i = 0; i < data.length; i += 4) {
// //         const r = data[i]
// //         const g = data[i + 1]
// //         const b = data[i + 2]
// //         const brightness = (r + g + b) / 3
        
// //         if (brightness < 100) darkPixels++
// //         else lightPixels++
// //       }
      
// //       // If we have a good mix of dark and light pixels, it might be a QR code
// //       const ratio = darkPixels / (darkPixels + lightPixels)
// //       if (ratio > 0.3 && ratio < 0.7) {
// //         // For demo purposes, return a mock QR code data
// //         return `demo-qr-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
// //       }
      
// //       return null
// //     } catch (err) {
// //       console.warn('Canvas scanning error:', err)
// //       return null
// //     }
// //   }

// //   // Start scanning when component mounts or when explicitly started
// //   useEffect(() => {
// //     if (isScanning && videoRef.current) {
// //       animationRef.current = requestAnimationFrame(scanQRCode)
// //     }
    
// //     return () => {
// //       if (animationRef.current) {
// //         cancelAnimationFrame(animationRef.current)
// //       }
// //     }
// //   }, [isScanning, scanQRCode])

// //   // Cleanup on unmount
// //   useEffect(() => {
// //     return () => {
// //       stopCamera()
// //       if (debounceRef.current) {
// //         clearTimeout(debounceRef.current)
// //       }
// //     }
// //   }, [stopCamera])

// //   // Auto-start camera if autoStart is enabled
// //   useEffect(() => {
// //     if (autoStart && !isScanning && hasPermission === null) {
// //       startCamera()
// //     }
// //   }, [autoStart, isScanning, hasPermission, startCamera])

// //   return (
// //     <Card className={`w-fit ${className}`}>
// //       <CardHeader>
// //         <CardTitle className="flex items-center gap-2">
// //           <Camera className="w-5 h-5" />
// //           QR Code Scanner
// //         </CardTitle>
// //       </CardHeader>
// //       <CardContent className="space-y-4">
// //         <div className="relative flex justify-center items-center">
// //           {/* Video element for camera feed */}
// //           <video
// //             ref={videoRef}
// //             style={{
// //               width: `${width}px`,
// //               height: `${height}px`,
// //               maxWidth: '100%',
// //               maxHeight: '100%'
// //             }}
// //             className="border rounded-lg bg-gray-100 mx-auto object-cover block"
// //             playsInline
// //             muted
// //           />
          
// //           {/* Camera off overlay */}
// //           {!isScanning && !isLoading && hasPermission !== false && (
// //             <div
// //               className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-gray-900/80 flex flex-col items-center justify-center rounded-lg"
// //               style={{
// //                 width: `${width}px`,
// //                 height: `${height}px`,
// //                 maxWidth: '100%',
// //                 maxHeight: '100%'
// //               }}
// //             >
// //               <Camera className="w-12 h-12 text-gray-400 mb-2" />
// //               <p className="text-gray-300 text-sm text-center px-4">Camera is off<br />Click "Start Scanning" to begin</p>
// //             </div>
// //           )}
          
// //           {/* Canvas for image processing (hidden) */}
// //           <canvas
// //             ref={canvasRef}
// //             className="hidden"
// //           />
          
// //           {/* Loading overlay */}
// //           {isLoading && (
// //             <div
// //               className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg"
// //               style={{ width, height }}
// //             >
// //               <div className="text-white text-center">
// //                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
// //                 <p>Starting camera...</p>
// //               </div>
// //             </div>
// //           )}
// //         </div>

// //         {/* Error display */}
// //         {error && (
// //           <Alert variant="destructive">
// //             <p>{error}</p>
// //           </Alert>
// //         )}

// //         {/* Control buttons */}
// //         <div className="flex gap-2 justify-center">
// //           {!isScanning ? (
// //             <Button onClick={startCamera} disabled={isLoading}>
// //               <Camera className="w-4 h-4 mr-2" />
// //               Start Scanning
// //             </Button>
// //           ) : (
// //             <Button variant="outline" onClick={stopCamera}>
// //               <X className="w-4 h-4 mr-2" />
// //               Stop Scanning
// //             </Button>
// //           )}
          
// //           {hasPermission === false && (
// //             <Button variant="outline" onClick={startCamera}>
// //               <RotateCcw className="w-4 h-4 mr-2" />
// //               Retry
// //             </Button>
// //           )}
// //         </div>

// //         {/* Instructions */}
// //         <div className="text-sm text-gray-600 text-center">
// //           <p>Position the QR code within the scanning area</p>
// //           {lastScanResult && (
// //             <p className="text-green-600 mt-1">
// //               Last scanned: {new Date(lastScanResult.timestamp).toLocaleTimeString()}
// //             </p>
// //           )}
// //         </div>
// //       </CardContent>
// //     </Card>
// //   )
// // })

// // QRScanner.displayName = 'QRScanner'

// // export default QRScanner



// // initial page/scan
// "use client"
// import { useState, useEffect } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { ThemeToggle } from "@/components/theme-toggle"
// import { QRScanner } from "@/components/qr-scanner";
// import { publicRoutes, authRoutes } from "@/utils";
// import { useUser } from "@clerk/nextjs";
// import { getRedirectPath } from "@/utils";
// import {
//   Shield,
//   ArrowLeft,
//   QrCode,
// } from "lucide-react"
// import Link from "next/link"

// export default function ScanPage() {

//   const { user, isSignedIn } = useUser();

//   const role = user?.publicMetadata.role as string | undefined;

//   const organizationType = user?.publicMetadata.organizationType as string | undefined;

//   const [scannedQRcodeResult, setScannedQRcodeResult] = useState("");

//   const handleQRScan = (qrData: string) => {
//     setScannedQRcodeResult(qrData)
//   }

//   useEffect(() => {
//     if (scannedQRcodeResult) {
//       window.location.href = scannedQRcodeResult;
//     }
//   }, [scannedQRcodeResult])

//   // Handle QR scanner errors
//   const handleQRError = (error: string) => {
//     console.error('QR Scanner error:', error)
//   }

//   return (
//     <div className="min-h-screen bg-background flex flex-col">

//       {/* Unified Navigation */}
//       <nav className="border-b border-border bg-card/95 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-14">
//             <Link href={publicRoutes.home} className="flex items-center gap-2.5">
//               <div className="bg-primary p-1.5 rounded-md">
//                 <Shield className="h-4 w-4 text-primary-foreground" />
//               </div>
//               <span className="font-bold text-base text-foreground tracking-tight">MediCheck</span>
//             </Link>
//             {isSignedIn ? (
//               <div className="flex items-center gap-2">
//                 <ThemeToggle />
//                 <Link href={getRedirectPath(role, organizationType)}>
//                   <Button variant="default" size="sm">Dashboard</Button>
//                 </Link>
//               </div>
//             ) : (
//               <div className="flex items-center gap-2">
//                 <ThemeToggle />
//                 <Link href={authRoutes.login}>
//                   <Button variant="ghost" size="sm">Sign In</Button>
//                 </Link>
//                 <Link href={authRoutes.register}>
//                   <Button variant="default" size="sm">Get Started</Button>
//                 </Link>
//               </div>
//             )}
//           </div>
//         </div>
//       </nav>

//       <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
//         <div className="mb-6">
//           <Link
//             href={publicRoutes.home}
//             className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm mb-5"
//           >
//             <ArrowLeft className="h-4 w-4 mr-1.5" />
//             Back to Home
//           </Link>
//           <h1 className="font-bold text-2xl sm:text-3xl text-foreground mb-1.5 tracking-tight">
//             Verify Your Medicine
//           </h1>
//           <p className="text-muted-foreground text-sm">
//             Scan the QR code on your medication packaging to verify authenticity.
//           </p>
//         </div>

//         <Card className="border border-border shadow-sm">
//           <CardHeader className="pb-3">
//             <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
//               <QrCode className="h-4 w-4 text-accent" />
//               Medication Scanner
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <QRScanner
//               onScan={handleQRScan}
//               onError={handleQRError}
//               width={320}
//               height={240}
//               facingMode="environment"
//               className="mx-auto"
//             />
//           </CardContent>
//         </Card>
//       </main>
//     </div>
//   )
// }
