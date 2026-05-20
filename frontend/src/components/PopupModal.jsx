import React from 'react'
import Button from './Button'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const PopupModal = ({ isOpen, onClose, title, message, type = 'info', onConfirm }) => {
  if (!isOpen) return null

  const config = {
    success: {
      icon: <CheckCircle2 size={32} className="text-emerald-500" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      titleColor: 'text-slate-900',
      btnVariant: 'success',
      btnClass: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
    },
    error: {
      icon: <AlertCircle size={32} className="text-red-500" />,
      bg: 'bg-red-50',
      border: 'border-red-100',
      titleColor: 'text-slate-900',
      btnVariant: 'primary',
      btnClass: 'bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white'
    },
    info: {
      icon: <Info size={32} className="text-blue-500" />,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      titleColor: 'text-slate-900',
      btnVariant: 'primary',
      btnClass: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 text-white'
    },
    confirm: {
      icon: <AlertCircle size={32} className="text-amber-500" />,
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      titleColor: 'text-slate-900',
      btnVariant: 'primary',
      btnClass: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-white'
    }
  }

  const { icon, bg, border, titleColor, btnClass } = config[type] || config.info

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className={`bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full border ${border} relative scale-100 transform transition-all`}>
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className={`mx-auto w-16 h-16 ${bg} rounded-3xl flex items-center justify-center mb-6 shadow-inner`}>
          {icon}
        </div>

        <h3 className={`text-center text-2xl font-bold ${titleColor} mb-3 font-heading tracking-tight`}>
          {title}
        </h3>

        <p className="text-center text-slate-500  mb-8 leading-relaxed text-sm font-medium">
          {message}
        </p>

        {type === 'confirm' ? (
          <div className="flex gap-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full py-4 rounded-2xl shadow-sm font-bold text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className={`w-full py-4 rounded-2xl shadow-xl font-bold text-base transition-all ${btnClass}`}
            >
              Confirm
            </Button>
          </div>
        ) : (
          <Button
            onClick={onClose}
            className={`w-full py-4 rounded-2xl shadow-xl font-bold text-base transition-all ${btnClass}`}
          >
            I Understand
          </Button>
        )}
      </div>
    </div>
  )
}

export default PopupModal
