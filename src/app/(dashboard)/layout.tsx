import { Sidebar, MobileHeader } from '@/components/layout/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Right side: mobile header + page content */}
      <div className="flex flex-1 flex-col min-w-0">
        <MobileHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}