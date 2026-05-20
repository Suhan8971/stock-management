import { useState, useEffect } from 'react'
import api from '../api'
import { Package, Plus, Trash2, Box, Calendar, Tags, Hash, History } from 'lucide-react'
import Button from '../components/Button'

export default function Inventory({ showModal, onTraceItem }) {
  const today = new Date().toISOString().split('T')[0]
  const [items, setItems] = useState([])
  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    total_quantity: 0,
    date: ''
  })

  const [selectedExistingItem, setSelectedExistingItem] = useState('new')

  useEffect(() => {
    fetchItems()
    const handleUpdate = () => fetchItems()
    window.addEventListener('inventory-updated', handleUpdate)
    return () => window.removeEventListener('inventory-updated', handleUpdate)
  }, [])

  const fetchItems = async () => {
    try {
      const response = await api.get('item_totals/')
      setItems(response.data)
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const uniqueItems = Array.from(
    new Map(items.map(item => [item.item_name.toLowerCase(), item])).values()
  ).sort((a, b) => a.item_name.localeCompare(b.item_name))

  const handleDropdownChange = (e) => {
    const val = e.target.value
    setSelectedExistingItem(val)
    if (val !== 'new') {
      const selected = items.find(i => (i.item_total_id || i.id).toString() === val)
      if (selected) {
        setFormData(prev => ({
          ...prev,
          item_name: selected.item_name,
          category: selected.category
        }))
      }
    } else {
      setFormData(prev => ({ ...prev, item_name: '', category: '' }))
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('quantity') ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedExistingItem === 'new') {
      if (!formData.item_name.trim() || !formData.category.trim() || formData.total_quantity <= 0 || !formData.date) {
        showModal("Requirement", "All fields are mandatory for new items. Please verify the name, category, quantity, and date.", "error")
        return
      }
    } else {
      if (formData.total_quantity <= 0 || !formData.date) {
        showModal("Requirement", "Quantity and Date are required to update existing inventory.", "error")
        return
      }
    }

    try {
      await api.post('items/', formData)
      setFormData({ item_name: '', category: '', total_quantity: 0, date: '' })
      setSelectedExistingItem('new')
      fetchItems()
      window.dispatchEvent(new Event('inventory-updated'))
      showModal("Success", "Inventory updated successfully.", "success")
    } catch (error) {
      console.error('Error adding item:', error)
      showModal("Error", "Failed to update inventory.", "error")
    }
  }

  const handleDelete = (id) => {
    showModal(
      "Confirm Deletion",
      "Delete this inventory record? This action is permanent and affects all related history.",
      "confirm",
      async () => {
        try {
          await api.delete(`item_totals/${id}/`)
          fetchItems()
          window.dispatchEvent(new Event('inventory-updated'))
          showModal("Success", "Inventory record deleted.", "success")
        } catch (error) {
          console.error('Error deleting item:', error)
          showModal("Error", "Failed to delete item.", "error")
        }
      }
    )
  }

  const isFormValid = selectedExistingItem === 'new'
    ? formData.item_name.trim() !== '' && formData.category.trim() !== '' && formData.total_quantity > 0 && formData.date !== ''
    : formData.total_quantity > 0 && formData.date !== '';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <header className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl shadow-lg shadow-blue-500/20">
            <Package size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-heading">Global Inventory</h1>
            <p className="text-slate-500 font-medium">Manage and monitor physical items across all locations.</p>
          </div>
        </div>

      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Management Form */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 relative overflow-hidden">
            <div className="w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-40" />

            <div className="relative">
              <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3 font-heading">
                <Box size={20} className="text-blue-500" /> Stock Inflow
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Item Selection</label>
                    <select
                      value={selectedExistingItem}
                      onChange={handleDropdownChange}
                      className="w-full bg-slate-50 border-none px-4 py-3 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer"
                    >
                      <option value="new">Add New Item Category</option>
                      {uniqueItems.map(item => (
                        <option key={item.item_total_id || item.id} value={(item.item_total_id || item.id).toString()}>
                          {item.item_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedExistingItem === 'new' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="relative group">
                        <Tags className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10 pointer-events-none" />
                        <input
                          type="text"
                          name="item_name"
                          placeholder="Item Description"
                          value={formData.item_name}
                          onChange={handleInputChange}
                          className="w-full pl-14 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-blue-100 transition-all"
                        />
                      </div>
                      <div className="relative group">
                        <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10 pointer-events-none" />
                        <input
                          type="text"
                          name="category"
                          placeholder="Category (e.g. IT, Furniture)"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full pl-14 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-blue-100 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10 pointer-events-none" />
                      <input
                        type="number"
                        name="total_quantity"
                        min="1"
                        placeholder="Qty"
                        value={formData.total_quantity || ''}
                        onChange={handleInputChange}
                        className="w-full pl-14 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-blue-100 transition-all"
                      />
                    </div>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10 pointer-events-none" />
                      <input
                        type="date"
                        name="date"
                        max={today}
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-4 text-lg"
                  disabled={!isFormValid}
                >
                  Post to Inventory
                </Button>
              </form>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-600/20">
            <h4 className="font-bold mb-2 flex items-center gap-2 font-heading">
              <Package size={18} /> Quick Tip
            </h4>
            <p className="text-blue-100 text-sm leading-relaxed">
              Adding stock to an existing category will automatically link new physical units to the current totals.
            </p>
          </div>
        </div>

        {/* Inventory List */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 font-heading">Warehouse Stock</h2>
              <div className="text-xs font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-xl">
                {items.length} Item Types
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-100">
                    <th className="font-semibold p-6">Description</th>
                    <th className="font-semibold p-6">Category</th>
                    <th className="font-semibold p-6 text-center">In Stock</th>
                    <th className="font-semibold p-6 text-center">Available</th>
                    <th className="font-semibold p-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Box size={48} className="text-slate-200" />
                          <p className="text-slate-400 font-medium italic">The warehouse is currently empty.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.item_total_id || item.id} className="group hover:bg-slate-50/80 transition-all">
                        <td className="p-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{item.item_name}</span>
                            <span className="text-xs text-slate-400 font-medium tracking-tight">ID: #{item.item_total_id || item.id}</span>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          <span className="font-bold text-slate-600">{item.total_quantity}</span>
                        </td>
                        <td className="p-6 text-center">
                          <span className={`px-4 py-1.5 rounded-2xl text-sm font-bold shadow-sm ${item.available_quantity > 0 ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-200 text-slate-500'
                            }`}>
                            {item.available_quantity}
                          </span>
                        </td>
                        <td className="p-6 text-right flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => onTraceItem(item.item_name)}
                            className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            title="View History"
                          >
                            <History size={20} />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleDelete(item.item_total_id || item.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={20} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Removed old modal */}
    </div>
  )
}
