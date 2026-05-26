import { Sidebar, MobileHeader } from '@/components/layout/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    /*
      Full-screen flex container.
      bg-page = var(--bg-page) = #060a16 deep dark from globals.css @theme.
      min-h-[100dvh] uses dynamic viewport height (handles mobile browser chrome).
      vh fallback for older browsers.
    */
    <div
      className="flex min-h-[100dvh] min-h-screen"
      style={{ background: 'linear-gradient(135deg, var(--bg-gradient-start), var(--bg-gradient-end))' }}
    >
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <Sidebar />

      {/* ── Main column: mobile header bar + scrollable page content ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile-only top bar (hamburger / logo / deposit CTA) */}
        <MobileHeader />

        {/*
          Page content area.
          p-4 on mobile → p-6 on md → p-8 on lg.
          max-w-3xl + mx-auto centres content on wide desktop without
          stretching the single-column layout.
        */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-3xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}