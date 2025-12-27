// Force all API routes to be dynamic (runtime rendering)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function APILayout({ children }: { children: React.ReactNode }) {
  return children;
}
