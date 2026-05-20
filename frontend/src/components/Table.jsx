import React from 'react'

const Table = ({ columns, data, isLoading, emptyMessage = 'No data available.' }) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/60 shadow-sm bg-white animate-fade-in">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-100">
            {columns.map((col, i) => (
              <th key={i} className={`font-semibold p-5 ${col.headerClassName || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-slate-400 italic">Syncing inventory...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-12 text-center text-slate-400 font-medium italic">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} className="group hover:bg-blue-50/30 transition-all duration-300">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className={`p-5 text-sm text-slate-600 font-medium ${col.cellClassName || ''}`}>
                    {col.render ? col.render(row, rowIndex) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Table
