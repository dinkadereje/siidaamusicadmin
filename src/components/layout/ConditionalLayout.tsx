"use client"

import { usePathname } from 'next/navigation'
import AdminLayout from './AdminLayout'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Don't wrap login page with AdminLayout
  if (pathname === '/login') {
    return <>{children}</>
  }
  
  // Wrap all other pages with AdminLayout
  return <AdminLayout>{children}</AdminLayout>
}