import React, { useState, useEffect } from 'react'
import api from '../api'
import Button from '../components/Button'
import Table from '../components/Table'
import { PlusCircle, Trash2, Calendar, Box, Tag, Layers, CheckCircle } from 'lucide-react'
import { calculateRemainingQuantity } from '../utils/inventoryUtils'

const BookingPage = ({ showModal }) => {
  const [availableItems, setAvailableItems] = useState([])
  const [bookings, setBookings] = useState([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [eventName, setEventName] = useState('')
  const today = new Date().toISOString().split('T')[0]

  const [bookingRows, setBookingRows] = useState([
    {
      item_id: '',
      quantity: 1,
      from_date: today,
      to_date: today
    }
  ])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const itemRes = await api.get('item_totals/')
        setAvailableItems(itemRes.data)
      } catch (error) {
        console.error("Failed to fetch items", error)
      }
    }
    fetchItems()
    fetchBookings()
  }, [])

  const getRemainingQuantity = (itemId, currentIndex) => {
    return calculateRemainingQuantity(itemId, availableItems, bookingRows, currentIndex);
  };

  const fetchBookings = async () => {
    setIsLoadingBookings(true)
    try {
      const res = await api.get('bookings/')
      setBookings(res.data)
    } catch (error) {
      console.error("Failed to fetch bookings", error)
    } finally {
      setIsLoadingBookings(false)
    }
  }

  const handleRelease = async (bookingId) => {
    try {
      await api.post(`bookings/${bookingId}/release/`)
      fetchBookings()
      window.dispatchEvent(new Event('inventory-updated'))
      const itemRes = await api.get('item_totals/')
      setAvailableItems(itemRes.data)
      showModal("Success", "Booking released successfully.", "success")
    } catch (error) {
      console.error(error)
      showModal("Error", "Failed to release booking.", "error")
    }
  }

  const bookingColumns = [
    {
      header: 'Event',
      accessor: 'event_name',
      cellClassName: 'text-slate-900 font-bold'
    },
    {
      header: 'Item',
      accessor: 'item_name',
      cellClassName: 'font-medium text-slate-600'
    },
    {
      header: 'Qty',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (item) => (
        <span className="font-bold text-slate-700">{item.quantity}</span>
      )
    },
    {
      header: 'Schedule',
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Timeline</span>
          <span className="text-sm font-medium text-slate-600">{item.from_date} — {item.to_date}</span>
        </div>
      )
    },
    {
      header: 'Status',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      render: (item) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === 'active' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 text-slate-400'
          }`}>
          {item.status || 'Active'}
        </span>
      )
    },
    {
      header: 'Actions',
      headerClassName: '',
      cellClassName: '',
      render: (item) => (
        <Button
          size="sm"
          variant={item.status === 'active' || item.status === undefined ? 'primary' : 'secondary'}
          className={item.status === 'active' || item.status === undefined ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' : ''}
          onClick={() => handleRelease(item.booking_id)}
          disabled={item.status !== 'active' && item.status !== undefined}
        >
          {item.status === 'active' || item.status === undefined ? 'Release Item' : 'Released'}
        </Button>
      )
    }
  ]

  const handleAddRow = () => {
    setBookingRows([...bookingRows, { item_id: '', quantity: 1, from_date: today, to_date: today }])
  }

  const handleRemoveRow = (index) => {
    if (bookingRows.length > 1) {
      const newRows = bookingRows.filter((_, i) => i !== index)
      setBookingRows(newRows)
    }
  }

  const updateRow = (index, field, value) => {
    const newRows = [...bookingRows]
    newRows[index][field] = value
    setBookingRows(newRows)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!eventName) return;

    const payloadItems = bookingRows.filter(row => row.item_id && row.quantity > 0)
    try {
      for (const row of payloadItems) {
        await api.post('bookings/', {
          event_name: eventName,
          item: row.item_id,
          quantity: row.quantity,
          from_date: row.from_date,
          to_date: row.to_date
        })
      }
      setEventName('')
      setBookingRows([{ item_id: '', quantity: 1, from_date: today, to_date: today }])
      fetchBookings()
      showModal("Success", "Reservation confirmed!", "success")
    } catch (error) {
      console.error(error)
      showModal("Error", "Failed to confirm reservation.", "error")
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-fade-in">
      {/* Header Section */}
      <header className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-30" />

        <div className="flex items-center gap-6 relative">
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl shadow-lg shadow-indigo-500/20">
            <Calendar size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-heading">Event Reservations</h1>
            <p className="text-slate-500 font-medium">Schedule and reserve physical stock for upcoming projects.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Area */}
        <div className="lg:col-span-12">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 font-heading">Booking Configuration</h2>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleAddRow} className="!rounded-xl border-indigo-100 text-indigo-600 hover:bg-indigo-50">
                  <PlusCircle className="w-4 h-4 mr-2" /> Add Resource
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="max-w-xl mb-10">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Event Title</label>
                <div className="relative group">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. Annual Symposium 2026"
                    className="w-full pl-14 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-6">
                {bookingRows.map((row, index) => (
                  <div key={index} className="group relative bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-all">
                    {bookingRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                      <div className="md:col-span-8">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Resource Selection</label>
                        <select
                          value={row.item_id}
                          onChange={(e) => updateRow(index, 'item_id', e.target.value)}
                          className="w-full bg-white border-2 border-slate-100 px-4 py-2.5 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all cursor-pointer"
                        >
                          <option value="">Choose an item...</option>
                          {availableItems.map(item => {
                            const remaining = getRemainingQuantity(item.item_total_id, index);
                            return (
                              <option key={item.item_total_id} value={item.item_total_id} disabled={remaining <= 0 && row.item_id != item.item_total_id}>
                                {item.item_name} ({remaining} available)
                              </option>
                            )
                          })}
                        </select>
                      </div>

                      <div className="md:col-span-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          max={row.item_id ? getRemainingQuantity(row.item_id, index) : ""}
                          value={row.quantity}
                          disabled={!row.item_id}
                          onChange={(e) => updateRow(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full bg-white border-2 border-slate-100 px-4 py-2.5 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all text-center disabled:opacity-30"
                        />
                      </div>

                      <div className="md:col-span-6 relative group">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Start Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
                          <input
                            type="date"
                            min={today}
                            value={row.from_date}
                            onChange={(e) => updateRow(index, 'from_date', e.target.value)}
                            className="w-full pl-14 pr-4 py-2.5 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-6 relative group">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">End Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none group-focus-within:text-indigo-500 transition-colors" />
                          <input
                            type="date"
                            min={row.from_date || today}
                            value={row.to_date}
                            onChange={(e) => updateRow(index, 'to_date', e.target.value)}
                            className="w-full pl-14 pr-4 py-2.5 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex flex-col md:flex-row items-center justify-between bg-slate-900 p-6 rounded-[2.5rem] text-white gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-800 rounded-2xl shrink-0">
                    <CheckCircle className="text-emerald-400 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ready to Confirm</p>
                    <p className="text-sm font-medium">Verify your dates and quantities before submitting.</p>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={!eventName || bookingRows.some(r => !r.item_id)}
                  className="w-full md:w-auto bg-indigo-600 text-white hover:bg-indigo-700 !rounded-2xl px-10 py-4 shadow-xl shadow-indigo-600/20 text-base font-bold shrink-0"
                >
                  Finalize Reservation
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* List Area */}
        <div className="lg:col-span-12">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers size={20} className="text-indigo-500" />
                <h2 className="text-xl font-bold text-slate-900 font-heading">Registry</h2>
              </div>
              <div className="text-xs font-bold text-slate-400">
                Active & Past Reservations
              </div>
            </div>
            <div className="p-8">
              <Table
                columns={bookingColumns}
                data={bookings}
                isLoading={isLoadingBookings}
                emptyMessage="No reservations currently on file."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingPage
