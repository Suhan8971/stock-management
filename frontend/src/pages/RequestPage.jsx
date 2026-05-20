import React, { useState, useEffect } from 'react'
import api from '../api'
import Button from '../components/Button'
import { PlusCircle, Trash2, ShoppingCart, Users, Calendar as CalendarIcon, Info, ClipboardList } from 'lucide-react'
import { calculateRemainingQuantity } from '../utils/inventoryUtils'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { parseISO, format, startOfDay } from 'date-fns'

const ItemSelector = ({ items, value, onChange, getRemainingQuantity, rowIndex }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-50 border-none px-4 py-3 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer"
    >
      <option value="">Select an item to allocate...</option>
      {items.map(item => {
        const remaining = getRemainingQuantity ? getRemainingQuantity(item.item_total_id, rowIndex) : item.available_quantity;
        return (
          <option key={item.item_total_id} value={item.item_total_id} disabled={remaining <= 0 && value != item.item_total_id}>
            {item.item_name} — {remaining} available
          </option>
        )
      })}
    </select>
  )
}

const RequestPage = ({ preselectedItem, showModal }) => {
  const [availableItems, setAvailableItems] = useState([])
  const [allBookings, setAllBookings] = useState([])
  const [users, setUsers] = useState([])
  const today = new Date().toISOString().split('T')[0]

  const [userType, setUserType] = useState('')
  const [recipient, setRecipient] = useState('')
  const [staffRecipient, setStaffRecipient] = useState('')
  const [emailError, setEmailError] = useState('')

  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [addUserName, setAddUserName] = useState('')
  const [addUserEmail, setAddUserEmail] = useState('')
  const [addUserRole, setAddUserRole] = useState('') 
  const [addUserDropdownSource, setAddUserDropdownSource] = useState('')

  const [requestRows, setRequestRows] = useState([
    {
      item_id: preselectedItem ? preselectedItem.item_total_id : '',
      quantity: 1,
      issued_date: today,
      expected_return_date: ''
    }
  ])

  useEffect(() => {
    if (preselectedItem && requestRows.length === 1 && !requestRows[0].item_id) {
      const newRows = [...requestRows]
      newRows[0].item_id = preselectedItem.item_total_id
      setRequestRows(newRows)
    }
  }, [preselectedItem])

  useEffect(() => {
    const fetchItemsAndUsers = async () => {
      try {
        const itemRes = await api.get('item_totals/')
        setAvailableItems(itemRes.data)
        const userRes = await api.get('users/')
        setUsers(userRes.data)
        const bookingsRes = await api.get('bookings/')
        setAllBookings(bookingsRes.data)
      } catch (error) {
        console.error("Failed to fetch dependencies", error)
      }
    }
    fetchItemsAndUsers()
  }, [])

  const getRemainingQuantity = (itemId, currentIndex) => {
    return calculateRemainingQuantity(itemId, availableItems, requestRows, currentIndex);
  };

  const getBookingStatsForDate = (itemId, date) => {
    if (!itemId) return { isFullyBooked: false, tooltip: "" };
    const targetDate = startOfDay(date);
    const item = availableItems.find(i => String(i.item_total_id) === String(itemId));
    if (!item) return { isFullyBooked: false, tooltip: "" };

    let bookedQuantityOnDate = 0;
    for (const b of allBookings) {
      if (String(b.item) === String(itemId) && b.status === 'active') {
        const from = startOfDay(parseISO(b.from_date));
        const to = startOfDay(parseISO(b.to_date));
        if (targetDate >= from && targetDate <= to) bookedQuantityOnDate += parseInt(b.quantity);
      }
    }

    const isFullyBooked = bookedQuantityOnDate >= item.total_quantity;
    return {
      isFullyBooked,
      isPartiallyBooked: bookedQuantityOnDate > 0,
      tooltip: isFullyBooked ? 'Fully Booked' : bookedQuantityOnDate > 0 ? `${bookedQuantityOnDate} Booked` : ''
    };
  }

  const getBookingsForDate = (itemId, date) => {
    if (!itemId) return [];
    const targetDate = startOfDay(date);
    return allBookings.filter(b => {
      if (String(b.item) !== String(itemId) || b.status !== 'active') return false;
      const from = startOfDay(parseISO(b.from_date));
      const to = startOfDay(parseISO(b.to_date));
      return targetDate >= from && targetDate <= to;
    });
  };

  const renderCustomDay = (day, date, itemId) => {
    const dayBookings = getBookingsForDate(itemId, date);
    if (dayBookings.length === 0) return <span>{day}</span>;

    return (
      <div className="relative group/day w-full h-full flex items-center justify-center">
        <span>{day}</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/day:opacity-100 transition-opacity w-64 p-3 bg-slate-900 text-white text-xs text-left rounded-xl shadow-xl z-[100] pointer-events-none">
          {dayBookings.map((b, idx) => {
            const itemInfo = availableItems.find(i => String(i.item_total_id) === String(b.item));
            const itemName = b.item_name || (itemInfo ? itemInfo.item_name : 'Item');
            return (
              <div key={idx} className="mb-2 last:mb-0 border-b border-slate-700 last:border-0 pb-2 last:pb-0">
                <p className="font-bold text-blue-300">{b.event_name || 'Event'}</p>
                <p><span className="text-slate-400">Item:</span> {itemName}</p>
                <p><span className="text-slate-400">Qty:</span> {b.quantity}</p>
                <p><span className="text-slate-400">Timeline:</span> {b.from_date} to {b.to_date}</p>
                {b.allocated_items && b.allocated_items.length > 0 && (
                  <p><span className="text-slate-400">Assigned IDs:</span> {b.allocated_items.join(', ')}</p>
                )}
              </div>
            );
          })}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
        </div>
      </div>
    );
  };

  const getDayClassName = (date, itemId) => {
    const dayBookings = getBookingsForDate(itemId, date);
    if (dayBookings.length > 0) {
      return '!bg-blue-100 !text-blue-900 font-bold hover:!bg-blue-200 rounded-lg';
    }
    return '';
  };

  const handleAddRow = () => {
    setRequestRows([...requestRows, { item_id: '', quantity: 1, issued_date: today, expected_return_date: '' }])
  }

  const handleRemoveRow = (index) => {
    if (requestRows.length > 1) {
      const newRows = requestRows.filter((_, i) => i !== index)
      setRequestRows(newRows)
    }
  }

  const updateRow = (index, field, value) => {
    const newRows = [...requestRows]
    newRows[index][field] = value
    setRequestRows(newRows)
  }

  const handleAddUserSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('users/', {
        name: addUserName,
        email: addUserEmail,
        role: addUserRole,
        project: 1 // default project
      })
      
      const newUser = response.data
      
      const userRes = await api.get('users/')
      setUsers(userRes.data)
      
      if (addUserDropdownSource === 'staffRecipient') {
        setStaffRecipient(newUser.user_id)
      } else if (addUserDropdownSource === 'recipient') {
        setRecipient(newUser.user_id)
      }
      
      setShowAddUserModal(false)
      setAddUserName('')
      setAddUserEmail('')
    } catch (error) {
      console.error("Failed to add user", error)
      showModal("Error", "Failed to add user. Ensure the email is unique.", "error")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!userType) return;

    const payloadItems = requestRows.filter(row => row.item_id && row.quantity > 0)
    let from_user_id = null;
    let to_user_id = null;

    if (userType === 'Staff') {
      from_user_id = recipient;
      to_user_id = '1';
    } else {
      from_user_id = staffRecipient;
      to_user_id = recipient;
    }

    try {
      await api.post('transactions/bulk_issue/', {
        items: payloadItems,
        user_type: userType,
        from_user_id: from_user_id,
        to_user_id: to_user_id
      })
      setRequestRows([{ item_id: '', quantity: 1, issued_date: today, expected_return_date: '' }])
      setUserType('')
      const response = await api.get('item_totals/')
      setAvailableItems(response.data)
      showModal("Success", "Inventory allocated successfully!", "success")
    } catch (error) {
      console.error(error)
      showModal("Error", "Failed to allocate inventory.", "error")
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <header className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-30" />

        <div className="flex items-center gap-6 relative">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-500 text-white rounded-3xl shadow-lg shadow-blue-600/20">
            <ShoppingCart size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-heading">Items Allocation</h1>
            <p className="text-slate-500 font-medium">Issue physical items to staff, students or contractors.</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Item Selection List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 font-heading">Allocation Set</h2>
              <Button type="button" variant="outline" size="sm" onClick={handleAddRow} className="!rounded-xl border-blue-100 text-blue-600 hover:bg-blue-50">
                <PlusCircle className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </div>

            <div className="p-8 space-y-6">
              {requestRows.map((row, index) => (
                <div key={index} className="group relative bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-all">
                  {requestRows.length > 1 && (
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Item Description</label>
                      <ItemSelector
                        items={availableItems}
                        value={row.item_id}
                        onChange={(val) => updateRow(index, 'item_id', val)}
                        getRemainingQuantity={getRemainingQuantity}
                        rowIndex={index}
                      />
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
                        className="w-full bg-white border-2 border-slate-100 px-4 py-2.5 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-all disabled:opacity-30"
                        placeholder="Qty"
                      />
                    </div>

                    <div className="md:col-span-6 relative group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Allocation Date</label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                        <DatePicker
                          selected={row.issued_date ? parseISO(row.issued_date) : null}
                          onChange={(date) => updateRow(index, 'issued_date', date ? format(date, 'yyyy-MM-dd') : '')}
                          minDate={new Date()}
                          maxDate={new Date()}
                          className="w-full pl-14 pr-4 py-2.5 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-all disabled:opacity-30"
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Pick date"
                          disabled={!row.item_id}
                          renderDayContents={(day, date) => renderCustomDay(day, date, row.item_id)}
                          dayClassName={(date) => getDayClassName(date, row.item_id)}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-6 relative group">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Expected Return</label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                        <DatePicker
                          selected={row.expected_return_date ? parseISO(row.expected_return_date) : null}
                          onChange={(date) => updateRow(index, 'expected_return_date', date ? format(date, 'yyyy-MM-dd') : '')}
                          minDate={row.issued_date ? parseISO(row.issued_date) : new Date()}
                          className="w-full pl-14 pr-4 py-2.5 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-all disabled:opacity-30"
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Pick date"
                          disabled={!row.item_id}
                          renderDayContents={(day, date) => renderCustomDay(day, date, row.item_id)}
                          dayClassName={(date) => getDayClassName(date, row.item_id)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Configuration */}
        <div className="lg:col-span-4 space-y-8 sticky top-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-40" />

            <div className="relative">
              <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3 font-heading">
                <Users size={20} className="text-indigo-500" /> Recipient Details
              </h2>

              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-4 block">Select Profile Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Staff', 'Student', 'Other'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => { setUserType(type); setRecipient(''); setStaffRecipient(''); setEmailError(''); }}
                        className={`py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${userType === type
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {userType && (
                  <div className="space-y-6 animate-fade-in">
                    {userType === 'Staff' ? (
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Direct Allocation To</label>
                        <select
                          value={recipient}
                          onChange={(e) => {
                            if (e.target.value === 'add_new_staff') {
                              setAddUserRole('S')
                              setAddUserDropdownSource('recipient')
                              setShowAddUserModal(true)
                            } else {
                              setRecipient(e.target.value)
                            }
                          }}
                          className="w-full bg-slate-50 border-none px-4 py-3 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                        >
                          <option value="">Select individual...</option>
                          {users.filter(u => ['staff', 's'].includes(String(u.role).toLowerCase())).map(u => (
                            <option key={u.user_id} value={u.user_id}>ID: {u.user_id}</option>
                          ))}
                          <option value="add_new_staff" className="font-bold text-indigo-600">+ Add Staff...</option>
                        </select>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 animate-fade-in">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Authorized By (Staff)</label>
                            <select
                              value={staffRecipient}
                              onChange={(e) => {
                                if (e.target.value === 'add_new_staff') {
                                  setAddUserRole('S')
                                  setAddUserDropdownSource('staffRecipient')
                                  setShowAddUserModal(true)
                                } else {
                                  setStaffRecipient(e.target.value)
                                }
                              }}
                              className="w-full bg-slate-50 border-none px-4 py-3 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                            >
                              <option value="">Select authorizing staff...</option>
                              {users.filter(u => ['staff', 's'].includes(String(u.role).toLowerCase())).map(u => (
                                <option key={u.user_id} value={u.user_id}>ID: {u.user_id}</option>
                              ))}
                              <option value="add_new_staff" className="font-bold text-indigo-600">+ Add Staff...</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Allocation Recipient</label>
                            {userType === 'Student' ? (
                              <select
                                value={recipient}
                                onChange={(e) => {
                                  if (e.target.value === 'add_new_student') {
                                    setAddUserRole('U')
                                    setAddUserDropdownSource('recipient')
                                    setShowAddUserModal(true)
                                  } else {
                                    setRecipient(e.target.value)
                                  }
                                }}
                                className="w-full bg-slate-50 border-none px-4 py-3 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                              >
                                <option value="">Select student...</option>
                                {users.filter(u => ['student', 'u'].includes(String(u.role).toLowerCase())).map(u => (
                                  <option key={u.user_id} value={u.user_id}>ID: {u.user_id}</option>
                                ))}
                                <option value="add_new_student" className="font-bold text-indigo-600">+ Add Student...</option>
                              </select>
                            ) : (
                              <div>
                                <input
                                  type="text"
                                  placeholder="Email Address"
                                  value={recipient}
                                  onChange={(e) => {
                                    setRecipient(e.target.value);
                                    if (userType === 'Other') {
                                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                      if (e.target.value && !emailRegex.test(e.target.value)) {
                                        setEmailError('Please enter a valid email address');
                                      } else {
                                        setEmailError('');
                                      }
                                    }
                                  }}
                                  className={`w-full bg-slate-50 border-2 ${emailError ? 'border-red-500' : 'border-transparent'} px-4 py-3 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-indigo-100 outline-none transition-all`}
                                />
                                {emailError && <p className="text-red-500 text-xs mt-2 ml-2 font-medium">{emailError}</p>}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    <Button
                      type="submit"
                      className="w-full py-4 text-base font-bold shadow-xl !rounded-2xl"
                      disabled={!userType || requestRows.some(row => !row.item_id || !row.expected_return_date) || (userType === 'Other' && (!!emailError || !recipient))}
                    >
                      Process Allocation
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-900/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                <ClipboardList size={20} className="text-blue-400" />
              </div>
              <h4 className="font-bold font-heading">Policy Check</h4>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              All items are tracked individually. Return dates are monitored and will trigger overdue alerts in the Audit Trail.
            </p>
          </div>
        </div>
      </form>

      {showAddUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform scale-100 animate-slide-up">
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 font-heading">
                Add New {addUserRole === 'S' ? 'Staff' : 'Student'}
              </h2>
            </div>
            <form onSubmit={handleAddUserSubmit} className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={addUserName}
                  onChange={(e) => setAddUserName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Email Address</label>
                <input
                  type="email"
                  required
                  value={addUserEmail}
                  onChange={(e) => setAddUserEmail(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-3 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. john@example.com"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddUserModal(false)} className="w-full !rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="w-full !rounded-xl shadow-xl shadow-indigo-200">
                  Add User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RequestPage
