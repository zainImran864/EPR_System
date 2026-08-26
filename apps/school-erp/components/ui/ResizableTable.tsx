"use client";

import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/app/lib/utils";
import { GripVertical } from "lucide-react";
import { Pagination } from "./Pagination";

export interface ColumnDef<T> {
  id: string;
  header: string | React.ReactNode;
  width?: number; // In pixels
  minWidth?: number;
  cell: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface ResizableTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    pageSize?: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
    itemLabel?: string;
  };
  emptyState?: React.ReactNode;
  className?: string;
  onRowClick?: (item: T) => void;
}

export function ResizableTable<T>({
  data,
  columns: initialColumns,
  keyExtractor,
  pagination,
  emptyState,
  className,
  onRowClick,
}: ResizableTableProps<T>) {
  // Column width state
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>(
    () => {
      const initial: { [key: string]: number } = {};
      initialColumns.forEach((col) => {
        initial[col.id] = col.width || 160;
      });
      return initial;
    }
  );

  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const handleMouseDown = (
    e: React.MouseEvent,
    colId: string,
    currentWidth: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColId(colId);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const minW =
        initialColumns.find((c) => c.id === colId)?.minWidth || 70;
      const newWidth = Math.max(minW, startWidthRef.current + deltaX);
      setColumnWidths((prev) => ({
        ...prev,
        [colId]: newWidth,
      }));
    };

    const onMouseUp = () => {
      setResizingColId(null);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      className={cn(
        "w-full bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden",
        className
      )}
    >
      {/* Table Scroll Area */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm table-fixed">
          {/* Colgroup with dynamic widths */}
          <colgroup>
            {initialColumns.map((col) => (
              <col
                key={col.id}
                style={{ width: `${columnWidths[col.id] || 160}px` }}
              />
            ))}
          </colgroup>

          {/* Table Header */}
          <thead className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600 select-none">
            <tr>
              {initialColumns.map((col) => {
                const width = columnWidths[col.id] || 160;
                const isResizing = resizingColId === col.id;

                return (
                  <th
                    key={col.id}
                    style={{ width: `${width}px` }}
                    className={cn(
                      "relative px-4 py-3.5 align-middle truncate group",
                      col.headerClassName
                    )}
                  >
                    <div className="flex items-center justify-between pr-2">
                      <span className="truncate">{col.header}</span>
                    </div>

                    {/* Resizing Handle */}
                    <div
                      onMouseDown={(e) => handleMouseDown(e, col.id, width)}
                      className={cn(
                        "absolute right-0 top-0 bottom-0 w-2 cursor-col-resize flex items-center justify-center transition-colors select-none",
                        isResizing
                          ? "bg-[#0D9488] z-20 opacity-100"
                          : "hover:bg-slate-300 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <div className="w-0.5 h-4 bg-slate-400 rounded-full" />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
            {data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    "transition-colors duration-100 hover:bg-slate-50/80",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {initialColumns.map((col) => (
                    <td
                      key={col.id}
                      className={cn("px-4 py-3.5 align-middle", col.className)}
                    >
                      {col.cell(row, rowIdx)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={initialColumns.length}
                  className="py-12 text-center text-slate-400 text-sm"
                >
                  {emptyState || "No records found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && <Pagination {...pagination} />}
    </div>
  );
}
