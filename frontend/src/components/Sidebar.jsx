import React from 'react'
import { LayoutDashboard, Search, FileText, History, Box, LogOut } from 'lucide-react'

const Sidebar = ({ activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen }) => {
  const navItems = [
    { id: 'search', label: 'Search Items', icon: Search },
    { id: 'inventory', label: 'Inventory', icon: LayoutDashboard },
    { id: 'request', label: 'Request Items', icon: FileText },
    { id: 'booking', label: 'Booking System', icon: Box },
    { id: 'trace_items', label: 'Trace Items', icon: History },
  ]

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Layout */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-slate-900 text-slate-300 z-50 transition-all duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col shadow-2xl`}>
        {/* Logo / Header */}
        <div className="h-20 flex items-center px-8 border-b border-slate-800/50">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-blue-500/20">
            <Box className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-heading">Stock<span className="text-blue-500">ly</span></h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setIsSidebarOpen(false)
                }}
                className={`w-full flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold translate-x-1'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
              >
                <Icon className={`w-5 h-5 mr-4 transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                <span className="tracking-wide">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-6 border-t border-slate-800/50 bg-slate-900/50">
          <div className="flex items-center p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800/60 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center mr-3 text-white font-bold shadow-inner">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">Admin User</p>
              <p className="text-xs text-slate-500 truncate">System Manager</p>
            </div>
            <LogOut className="w-4 h-4 text-slate-600 group-hover:text-red-400 transition-colors ml-2" />
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
