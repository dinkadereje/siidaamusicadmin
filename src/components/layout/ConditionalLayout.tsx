"use client"

import { usePathname } from 'next/navigation'
import AdminLayout from './AdminLayout'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Don't wrap public pages with AdminLayout
  if (pathname === '/login' || pathname === '/debug-public') {
    return <>{children}</>
  }
  
  // Wrap all other pages with AdminLayout
  return <AdminLayout>{children}</AdminLayout>
}