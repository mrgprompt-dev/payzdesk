// src/app/(dashboard)/layout.tsx
import { Sidebar, MobileHeader } from '@/components/layout/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="flex min-h-dvh"
      style={{ background: 'linear-gradient(135deg, var(--bg-gradient-start), var(--bg-gradient-end))' }}
    >
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main column */}
      <div className="flex flex-1 flex-col min-w-0">
        <MobileHeader />

        {/*
          px-4 py-4 on mobile (matches auth page 16px padding).
          md:px-6 md:py-6 on tablet, lg:px-8 lg:py-8 on desktop.
          This gives the same breathing room as the auth pages.
        */}
        <main className="flex-1 px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-3xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}