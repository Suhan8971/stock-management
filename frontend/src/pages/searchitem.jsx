import React, { useState, useEffect } from 'react'
import api from '../api'
import Button from '../components/Button'
import Table from '../components/Table'
import { Search, RotateCcw, PackageCheck, AlertCircle, History } from 'lucide-react'

const SearchItem = ({ onRequestItem, showModal, onTraceItem }) => {
  const [items, setItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Return Modal State
  const [returnItem, setReturnItem] = useState(null)
  const [returnQuantity, setReturnQuantity] = useState(1)
  const [isReturning, setIsReturning] = useState(false)

  const getIssuedQuantity = (item) => {
    return (item.total_quantity || 0) - (item.available_quantity || 0) - (item.booked_quantity || 0);
  };

  useEffect(() => {
    fetchItems()
    const handleUpdate = () => fetchItems()
    window.addEventListener('inventory-updated', handleUpdate)
    return () => window.removeEventListener('inventory-updated', handleUpdate)
  }, [])

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('item_totals/')
      setItems(response.data)
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequest = (item) => {
    if (onRequestItem) onRequestItem(item)
  }

  const handleReturnSubmit = async () => {
    if (!returnItem) return
    setIsReturning(true)
    try {
      await api.post('transactions/return_stock/', {
        item_id: returnItem.item_total_id,
        quantity: returnQuantity
      })
      setReturnItem(null)
      fetchItems()
      window.dispatchEvent(new Event('inventory-updated'))
      showModal('Success', 'Item returned successfully', 'success')
    } catch (error) {
      console.error(error)
      showModal('Error', 'Failed to return item', 'error')
    } finally {
      setIsReturning(false)
    }
  }

  const filteredItems = items.filter(item => {
    const searchLow = searchTerm.toLowerCase()
    return (
      item.item_name?.toLowerCase().includes(searchLow) ||
      item.item_total_id?.toString().includes(searchTerm)
    )
  })

  const columns = [
    {
      header: 'Item',
      accessor: 'item_name',
      cellClassName: 'text-slate-900 font-bold'
    },
    {
      header: 'Total Stock',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (item) => (
        <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
          {item.total_quantity}
        </span>
      )
    },
    {
      header: 'Available',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (item) => (
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
          {item.available_quantity}
        </span>
      )
    },
    {
      header: 'Booked',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (item) => (
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
          {item.booked_quantity || 0}
        </span>
      )
    },
    {
      header: 'Issued',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (item) => (
        <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">
          {getIssuedQuantity(item)}
        </span>
      )
    },
    {
      header: 'Actions',
      headerClassName: '',
      cellClassName: 'flex justify-end gap-3',
      render: (item) => (
        <>
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleRequest(item)}
            disabled={item.available_quantity <= 0}
          >
            Request
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-emerald-600 border-emerald-100 hover:bg-emerald-50"
            onClick={() => {
              setReturnItem(item)
              setReturnQuantity(1)
            }}
            disabled={getIssuedQuantity(item) <= 0}
          >
            Return
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onTraceItem(item.item_name)}
            className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 p-2"
            title="View History"
          >
            <History size={16} />
          </Button>
        </>
      )
    }
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-heading">Inventory Explorer</h1>
          <p className="text-slate-500 mt-1">Search, track and manage your stock across all categories.</p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 outline-none bg-white shadow-sm transition-all text-sm font-medium"
          />
        </div>
      </div>

      {/* Stats Overview (Optional but adds value) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: items.length, icon: PackageCheck, color: 'blue' },
          { label: 'Out of Stock', value: items.filter(i => i.available_quantity === 0).length, icon: AlertCircle, color: 'red' },
          { label: 'Currently Booked', value: items.reduce((acc, i) => acc + (i.booked_quantity || 0), 0), icon: RotateCcw, color: 'indigo' },
          { label: 'Total Stock', value: items.reduce((acc, i) => acc + (i.total_quantity || 0), 0), icon: PackageCheck, color: 'emerald' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-8">
          <Table
            columns={columns}
            data={filteredItems}
            isLoading={isLoading}
            emptyMessage="No assets found matching your criteria."
          />
        </div>
      </div>

      {/* Return Modal Overlay */}
      {returnItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 border border-slate-100 scale-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50" />

            <div className="relative">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <RotateCcw size={24} />
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-2 font-heading tracking-tight">Return Inventory</h3>
              <p className="text-slate-500 mb-8 leading-relaxed text-sm">
                You are initiating a return for <span className="font-bold text-slate-800">{returnItem.item_name}</span>. Please specify the quantity.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Quantity to Return
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={getIssuedQuantity(returnItem)}
                      value={returnQuantity}
                      onChange={(e) => {
                        let val = parseInt(e.target.value) || 0;
                        const maxVal = getIssuedQuantity(returnItem);
                        if (val > maxVal) val = maxVal;
                        setReturnQuantity(val);
                      }}
                      className="w-full pl-4 pr-16 py-3 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none text-lg font-bold transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                      max: {getIssuedQuantity(returnItem)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="secondary" className="flex-1" onClick={() => setReturnItem(null)}>
                    Discard
                  </Button>
                  <Button variant="success" className="flex-1" onClick={handleReturnSubmit} disabled={isReturning || returnQuantity < 1}>
                    {isReturning ? 'Processing...' : 'Confirm Return'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchItem
