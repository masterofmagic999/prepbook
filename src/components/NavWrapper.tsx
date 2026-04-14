'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUserId } from '@/lib/hooks'
import { BookOpen, LayoutDashboard, Calendar, BarChart2, PenTool, Menu, X, Settings } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/practice', label: 'Practice', icon: PenTool },
  { href: '/planner', label: 'Planner', icon: Calendar },
  { href: '/review', label: 'Review', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function NavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { userId } = useUserId()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAuthPage = pathname === '/' || pathname === '/onboarding'

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-indigo-900 text-white">
        <div className="flex items-center gap-2 p-6 border-b border-indigo-800">
          <BookOpen className="w-6 h-6 text-indigo-300" />
          <span className="text-lg font-bold">PrepBook</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-indigo-800">
          <p className="text-xs text-indigo-400">AP World History</p>
          <p className="text-xs text-indigo-500 truncate">ID: {userId?.slice(0, 12) ?? '...'}</p>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-indigo-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-300" />
          <span className="font-bold">PrepBook</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-indigo-900 text-white pt-16 px-4">
          <nav className="space-y-2">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname.startsWith(href)
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-200 hover:bg-indigo-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        {children}
      </main>
    </div>
  )
}
