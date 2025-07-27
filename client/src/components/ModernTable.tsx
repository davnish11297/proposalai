import React from 'react';
import { cn } from '../utils/cn';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
}

interface ModernTableProps {
  columns: Column[];
  data: any[];
  className?: string;
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
}

export default function ModernTable({
  columns,
  data,
  className,
  onRowClick,
  emptyMessage = 'No data available'
}: ModernTableProps) {
  return (
    <div className={cn('overflow-hidden', className)}>
      <table className="table-modern">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={index}
                className={cn(
                  'transition-colors duration-150',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} className={column.className}>
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
} 