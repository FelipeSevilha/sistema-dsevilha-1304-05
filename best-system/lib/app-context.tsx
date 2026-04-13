'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type Usuario = {
  nome: string
  email: string
  role: 'admin' | 'vendedor'
}

type AppContextType = {
  usuario: Usuario | null
  setUsuario: (user: Usuario | null) => void
}

const AppContext = createContext<AppContextType>({
  usuario: null,
  setUsuario: () => {}
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  return (
    <AppContext.Provider value={{ usuario, setUsuario }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
