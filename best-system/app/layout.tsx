'use client'

import './globals.css'
import { AppProvider } from '@/lib/app-context'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
