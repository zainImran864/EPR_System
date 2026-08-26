import React from "react";
import { cn } from "@/app/lib/utils";

export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table
        className={cn("w-full text-left border-collapse text-sm", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <thead
      className={cn("bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500", className)}
      {...props}
    >
      {children}
    </thead>
  );
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <tbody
      className={cn("divide-y divide-slate-100 text-slate-700 font-normal", className)}
      {...props}
    >
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement> & { isSelected?: boolean }> = ({
  className,
  isSelected,
  children,
  ...props
}) => {
  return (
    <tr
      className={cn(
        "transition-colors duration-100 hover:bg-slate-50/70",
        isSelected && "bg-[#F0FDFA]/70",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <th
      className={cn("px-4 py-3.5 select-none font-semibold text-slate-600", className)}
      {...props}
    >
      {children}
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <td className={cn("px-4 py-3.5 align-middle", className)} {...props}>
      {children}
    </td>
  );
};
