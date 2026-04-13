import Sidebar from '@/components/layout/Sidebar'
import Cabecalho from '@/components/layout/Cabeçalho'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <Cabecalho />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
