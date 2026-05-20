import React, { useState, useEffect } from 'react'
import api from '../api'
import Button from '../components/Button'
import Table from '../components/Table'
import { ArrowLeft, Search, Filter, History, User, Calendar, Info, Clock, Hash } from 'lucide-react'

const TraceItemsPage = ({ prefillSearch, showModal }) => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Detail View State
  const [selectedItem, setSelectedItem] = useState(null)
  const [itemDetails, setItemDetails] = useState([])
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [filter, setFilter] = useState('All')

  const todayStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchItems()
  }, [])

  useEffect(() => {
    if (prefillSearch && items.length > 0) {
      setSearchTerm(prefillSearch)
      const searchLow = prefillSearch.toLowerCase()
      const matchingItems = items.filter(item => 
        item.item_name?.toLowerCase().includes(searchLow) ||
        item.item_id?.toString().includes(prefillSearch)
      )
      if (matchingItems.length === 1 && !selectedItem) {
        handleItemClick(matchingItems[0])
      }
    }
  }, [prefillSearch, items])

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('trace/items/')
      setItems(res.data)
    } catch (error) {
      console.error("Failed to fetch trace items", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleItemClick = async (item) => {
    setSelectedItem(item)
    setIsDetailsLoading(true)
    try {
      const res = await api.get(`trace/items/${item.item_id}/`)
      setItemDetails(res.data.timeline || [])
    } catch (error) {
      console.error("Failed to fetch item details", error)
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const determineStatus = (timelineItem) => {
    if (timelineItem.timeline_type === 'booking') {
      if (timelineItem.status === 'released') {
        return { label: 'Released', type: 'success', icon: '✅', color: 'emerald' }
      }
      if (timelineItem.release_date && timelineItem.release_date < todayStr) {
        return { label: 'Overdue Release', type: 'danger', icon: '⚠️', color: 'red' }
      }
      return { label: 'Active Booking', type: 'warning', icon: '⏳', color: 'indigo' }
    } else {
      if (timelineItem.status === 'returned') {
        return { label: 'Returned', type: 'success', icon: '✅', color: 'emerald' }
      }
      if (timelineItem.expected_return_date && timelineItem.expected_return_date < todayStr) {
        return { label: 'Overdue Return', type: 'danger', icon: '⚠️', color: 'red' }
      }
      return { label: 'Pending Return', type: 'warning', icon: '⏳', color: 'amber' }
    }
  }

  const filteredItems = items.filter(item => {
    const searchLow = searchTerm.toLowerCase()
    return (
      item.item_name?.toLowerCase().includes(searchLow) ||
      item.item_id?.toString().includes(searchTerm)
    )
  })

  const filteredDetails = itemDetails.filter(req => {
    const statusInfo = determineStatus(req)
    if (filter === 'Overdue' && statusInfo.type !== 'danger') return false
    if (filter === 'Active' && statusInfo.type !== 'warning') return false
    return true
  })

  const columns = [
    {
      header: 'Item ID',
      accessor: 'item_id',
      cellClassName: 'font-bold text-blue-600'
    },
    {
      header: 'Item Name',
      accessor: 'item_name',
      cellClassName: 'font-bold text-slate-800'
    },
    {
      header: 'Category',
      accessor: 'category',
      cellClassName: 'text-slate-500 font-medium'
    },
    {
      header: 'Timeline',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (item) => (
        <Button variant="secondary" size="sm" onClick={() => handleItemClick(item)} className="ml-auto">
          View History
        </Button>
      )
    }
  ]

  if (selectedItem) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Button variant="secondary" onClick={() => setSelectedItem(null)} className="!p-3 rounded-2xl bg-slate-100 hover:bg-slate-200">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">{selectedItem.item_name}</h2>
              <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                <Hash className="w-3 h-3" /> Instance ID: {selectedItem.item_id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl border border-slate-100 p-2">
            <Filter className="w-4 h-4 ml-2 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-transparent border-none outline-none text-sm font-bold text-slate-700 cursor-pointer"
            >
              <option value="All">Full Timeline</option>
              <option value="Active">Active Only</option>
              <option value="Overdue">Overdue Only</option>
            </select>
          </div>
        </div>

        {isDetailsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-600/10"></div>
            <p className="text-slate-400 font-bold italic tracking-wide">Compiling lifecycle history...</p>
          </div>
        ) : filteredDetails.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mx-auto">
              <History size={32} />
            </div>
            <p className="text-slate-500 font-bold tracking-tight">
              {filter === 'Overdue'
                ? "Excellent! No overdue records found."
                : filter === 'Active'
                  ? "No active commitments for this item."
                  : "This instance has no recorded history yet."}
            </p>
          </div>
        ) : (
          <>
            {/* Timeline Diagram */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-x-auto">
              <div className="flex items-end gap-4 pb-4 min-w-max md:justify-center">
                {filteredDetails.map((req, idx) => {
                  const statusInfo = determineStatus(req)
                  const isLatest = idx === 0
                  const isBooking = req.timeline_type === 'booking'

                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-3 cursor-pointer group"
                      onClick={() => {
                        // Scroll to the corresponding timeline item
                        const element = document.getElementById(`timeline-${idx}`)
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }
                      }}
                    >
                      {isLatest && (
                        <span className="text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full whitespace-nowrap animate-pulse">
                          LATEST
                        </span>
                      )}
                      {/* Timeline Item */}
                      <div className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300 ${isLatest ? 'border-blue-400 bg-blue-50 shadow-lg' : 'border-slate-200 bg-white group-hover:border-slate-300 group-hover:shadow-md'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isLatest ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : `bg-${statusInfo.color}-100`}`}>
                          {statusInfo.icon}
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-700 whitespace-nowrap">
                            {isBooking ? 'Booking' : 'Request'}
                          </p>
                          <p className="text-[10px] text-slate-500 whitespace-nowrap">
                            {isBooking ? req.release_date : req.expected_return_date}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Vertical Timeline Details */}
          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {filteredDetails.map((req, idx) => {
              const statusInfo = determineStatus(req)
              const isBooking = req.timeline_type === 'booking'

              return (
                <div key={idx} id={`timeline-${idx}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-fade-in scroll-mt-24 transition-all duration-300 hover:bg-slate-50/50 rounded-lg p-2" style={{ animationDelay: `${idx * 100}ms` }}>
                  {/* Timeline Dot */}
                  <div className={`flex items-center justify-center w-12 h-12 rounded-2xl border-4 border-slate-50 bg-white shadow-xl shadow-${statusInfo.color}-500/10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-xl`}>
                    {statusInfo.icon}
                  </div>

                  {/* Card */}
                  <div className={`w-[calc(100%-4.5rem)] md:w-[calc(50%-3.5rem)] p-10 rounded-[2.5rem] border shadow-sm bg-white transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden group-hover:border-${statusInfo.color}-200 animate-slide-up`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-${statusInfo.color}-50 rounded-full -mr-16 -mt-16 opacity-50 transition-transform group-hover:scale-110`} />

                    <div className="relative">
                      <div className="flex justify-between items-start mb-8">
                        <div className="space-y-1">
                          <span className={`text-[10px] font-black uppercase tracking-[0.3em] text-${statusInfo.color}-500`}>
                            {isBooking ? 'Reservations' : 'Allocations'}
                          </span>
                          <h3 className="text-xl font-bold text-slate-900 font-heading">
                            {isBooking ? req.event_name : `Request #${req.id}`}
                          </h3>
                        </div>
                        <div className="px-4 py-1.5 bg-slate-50 rounded-xl text-xs font-black text-slate-500 shadow-inner">
                          Qty: {req.quantity}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 text-sm font-medium">
                        {isBooking ? (
                          <>
                            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl">
                              <Calendar className="w-4 h-4 text-indigo-500" />
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Schedule</span>
                                <span className="text-slate-700">{req.booked_date} &rarr; {req.release_date}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl">
                              <Info className="w-4 h-4 text-indigo-500" />
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Purpose</span>
                                <span className="text-slate-700 truncate max-w-[200px]" title={req.event_name}>{req.event_name}</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl">
                              <Clock className="w-4 h-4 text-amber-500" />
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Allocation Period</span>
                                <span className="text-slate-700">{req.issued_date} &rarr; {req.expected_return_date}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl">
                              <User className="w-4 h-4 text-amber-500" />
                              <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Custodian</span>
                                <span className="text-slate-700 font-bold italic">{req.requested_by}</span>
                              </div>
                            </div>
                            {req.actual_return_date && (
                              <div className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-2xl">
                                <Calendar className="w-4 h-4 text-emerald-500" />
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Returned On</span>
                                  <span className="text-emerald-700 font-bold">{req.actual_return_date}</span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
                        <span className={`text-xs font-black px-4 py-2 rounded-xl bg-${statusInfo.color}-1500 bg-indigo-600  text-white shadow-lg shadow-${statusInfo.color}-500/20`}>
                          {statusInfo.label}
                        </span>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Item Verified
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
            </>
          )}
        </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <header className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-30" />

        <div className="flex items-center gap-6 relative">
          <div className="p-4 bg-gradient-to-br from-indigo-600 to-blue-500 text-white rounded-3xl shadow-lg shadow-indigo-500/20">
            <History size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-heading">Trace Items</h1>
            <p className="text-slate-500 font-medium">Trace the complete lifecycle of every physical instance.</p>
          </div>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
          <input
            type="text"
            placeholder="Search by ID or Item Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 outline-none bg-white shadow-sm transition-all text-sm font-medium"
          />
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 p-8">
        <Table
          columns={columns}
          data={filteredItems}
          isLoading={isLoading}
          emptyMessage="No traceable items found."
        />
      </div>
    </div>
  )
}

export default TraceItemsPage
