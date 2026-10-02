"use client";

import React, { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// Closed external Convex cloud link - configured strictly for local ERP mode
const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210";
const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
