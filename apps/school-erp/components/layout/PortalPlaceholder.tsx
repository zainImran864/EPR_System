"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface PortalPlaceholderProps {
  icon: React.ElementType;
  title: string;
  description: string;
  /** Optional bullet list of what this page will do. */
  points?: string[];
  phaseLabel?: string;
}

/**
 * Clean, on-brand placeholder for role portal pages whose data linkage lands in
 * a later phase. Keeps the route real (in its own folder) with honest content.
 */
export const PortalPlaceholder: React.FC<PortalPlaceholderProps> = ({
  icon: Icon,
  title,
  description,
  points,
  phaseLabel = "Coming soon",
}) => {
  return (
    <div className="max-w-3xl">
      <Card>
        <CardContent className="p-8 flex flex-col items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center">
            <Icon className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
            <Badge variant="neutral" size="sm">
              {phaseLabel}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
          {points && points.length > 0 && (
            <ul className="space-y-2 mt-1">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#0D9488] shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
