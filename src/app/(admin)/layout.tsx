import { AdminSidebar } from '@/components/admin/AdminSidebar'

export const metadata = {
    title: 'PayzDesk Admin',
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-page">
            <AdminSidebar />
            <main className="flex-1 py-[28px] px-8 overflow-y-auto min-w-0">
                {children}
            </main>
        </div>
    )
}