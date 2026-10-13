import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  IndianRupee,
  GitMerge,
  Users,
  AlertTriangle,
  Train,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/departments', icon: Building2, label: 'Departments' },
  { to: '/budget', icon: IndianRupee, label: 'Budget' },
  { to: '/dependencies', icon: GitMerge, label: 'Dependencies' },
  { to: '/people', icon: Users, label: 'People' },
  { to: '/anomalies', icon: AlertTriangle, label: 'Anomalies' },
]

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 text-white flex flex-col flex-shrink-0">
        {/* Logo / Title */}
        <div className="px-4 py-5 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Train className="w-6 h-6 text-blue-400" />
            <div>
              <p className="font-bold text-sm leading-tight">DMRC-Pune</p>
              <p className="text-xs text-gray-400 leading-tight">Airport Link K02</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-700">
          <p className="text-xs text-gray-500">Data as of 15 Sep 2026</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
