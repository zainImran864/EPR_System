"use client";

import React from "react";
import { cn } from "@/app/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "./Table";
import { TableSkeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  /** Custom cell renderer. Falls back to `row[key]` when omitted. */
  render?: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
  width?: string | number;
}

export interface DataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  selectedRowKey?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  skeletonRows?: number;
  className?: string;
}

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

/**
 * Reusable, config-driven data grid over the design-system Table.
 * Handles loading (skeleton) and empty states out of the box so pages
 * don't re-implement them.
 */
export function DataGrid<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  onRowClick,
  selectedRowKey,
  emptyTitle = "No records found",
  emptyDescription = "There is nothing to show here yet.",
  emptyIcon,
  emptyAction,
  skeletonRows = 6,
  className,
}: DataGridProps<T>) {
  if (isLoading) {
    return <TableSkeleton rows={skeletonRows} cols={columns.length} />;
  }

  if (!data.length) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={col.key}
              style={col.width ? { width: col.width } : undefined}
              className={cn(
                alignClass[col.align ?? "left"],
                col.headerClassName
              )}
            >
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => {
          const key = rowKey(row, index);
          return (
            <TableRow
              key={key}
              isSelected={selectedRowKey === key}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "cursor-pointer" : undefined}
            >
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className={cn(alignClass[col.align ?? "left"], col.className)}
                >
                  {col.render
                    ? col.render(row, index)
                    : ((row as Record<string, React.ReactNode>)[col.key] ?? null)}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
