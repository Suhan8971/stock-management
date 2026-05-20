import React from 'react'

const Button = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'transition-all duration-300 focus:outline-none flex items-center justify-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95'
  
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg',
    md: 'text-sm px-5 py-2.5 rounded-xl',
    lg: 'text-base px-6 py-3 rounded-2xl'
  }
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 focus:ring-4 focus:ring-blue-100',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-4 focus:ring-slate-100',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40 focus:ring-4 focus:ring-red-100',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 focus:ring-4 focus:ring-emerald-100',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
    outline: 'bg-transparent border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
  }
  
  // Backward compatibility for the special variants used in the codebase
  let variantClass = variants[variant] || variants.primary
  if (variant === 'danger-icon') variantClass = 'p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg'
  if (variant === 'secondary' && className.includes('text-sm')) variantClass = 'bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm px-4 py-1.5'

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
