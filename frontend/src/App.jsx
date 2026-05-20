import React, { useState } from 'react'
import Inventory from './pages/Inventory'
import SearchItem from './pages/searchitem'
import Sidebar from './components/Sidebar'
import Button from './components/Button'
import { Menu } from 'lucide-react'
import RequestPage from './pages/RequestPage'
import BookingPage from './pages/BookingPage'
import TraceItemsPage from './pages/TraceItemsPage'
import PopupModal from './components/PopupModal'

function App() {
  const [activeTab, setActiveTab] = useState('search')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedRequestItem, setSelectedRequestItem] = useState(null)
  const [traceFilter, setTraceFilter] = useState('')

  // Global Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null
  })

  const showModal = (title, message, type = 'info', onConfirm = null) => {
    setModalConfig({ isOpen: true, title, message, type, onConfirm })
  }

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }))
  }

  const handleRequestRouting = (item) => {
    setSelectedRequestItem(item)
    setActiveTab('request')
  }

  const handleTraceRouting = (filterText) => {
    setTraceFilter(filterText)
    setActiveTab('trace_items')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'inventory':
        return <Inventory showModal={showModal} onTraceItem={handleTraceRouting} />
      case 'search':
        return <SearchItem onRequestItem={handleRequestRouting} showModal={showModal} onTraceItem={handleTraceRouting} />
      case 'request':
        return <RequestPage preselectedItem={selectedRequestItem} showModal={showModal} />
      case 'booking':
        return <BookingPage showModal={showModal} />
      case 'trace_items':
        return <TraceItemsPage prefillSearch={traceFilter} showModal={showModal} />
      default:
        return <SearchItem onRequestItem={handleRequestRouting} showModal={showModal} onTraceItem={handleTraceRouting} />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Top navbar for mobile menu toggle */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-8 lg:hidden sticky top-0 z-40 transition-all">
          <div className="flex items-center">
            <Button 
              variant="ghost"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="-ml-4 mr-3 !p-2"
            >
              <Menu className="w-6 h-6 text-slate-700" />
            </Button>
            <span className="text-xl font-bold text-slate-900 font-heading tracking-tight">Stock<span className="text-blue-600">ly</span></span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200" />
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
          <div className="w-full min-h-full py-8 px-4 md:px-8 lg:px-12 animate-fade-in"> 
            {renderContent()}
          </div>
        </div>
      </main>

      <PopupModal 
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  )
}

export default App
