"use client"
import { createContext, useContext, useState, ReactNode } from 'react'

interface UsersContextType {
  totalUsers: number
  totalProperties: number
  totalReviews: number
  totalRevenue: number
  userType: 'agent' | 'landlord'
  userEmail: string
  setUserType: (type: 'agent' | 'landlord') => void
  setUserEmail: (email: string) => void
}

const UsersContext = createContext<UsersContextType | undefined>(undefined)

export function UsersProvider({ children }: { children: ReactNode }) {
  const [userType, setUserType] = useState<'agent' | 'landlord'>('agent')
  const [userEmail, setUserEmail] = useState('')

  // Sample data - in real app, this would come from API
  const totalUsers = 1247
  const totalProperties = 156
  const totalReviews = 4652
  const totalRevenue = 45920

  return (
    <UsersContext.Provider
      value={{
        totalUsers,
        totalProperties,
        totalReviews,
        totalRevenue,
        userType,
        userEmail,
        setUserType,
        setUserEmail,
      }}
    >
      {children}
    </UsersContext.Provider>
  )
}

export function useUsers() {
  const context = useContext(UsersContext)
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider')
  }
  return context
}
