"use client";

import React, { useState, useEffect, useRef } from "react";
import { Users, ChevronDown, Check, UserCircle2 } from "lucide-react";
import { useAuthStore } from "@/app/store/useAuthStore";
import { parentRestApi } from "@/app/api/client";
import { useToast } from "@/app/hooks/useToast";

export interface ChildItem {
  studentId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  className?: string;
  sectionName?: string;
  rollNumber?: string;
  admissionNumber?: string;
  photoUrl?: string | null;
}

export const ParentChildSwitcher: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { success, error } = useToast();
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeChild = user?.studentContext;

  useEffect(() => {
    let mounted = true;
    parentRestApi
      .getChildren()
      .then((data) => {
        if (!mounted || !Array.isArray(data)) return;
        setChildren(data);

        // If no active child selected yet, default to first child
        if (!activeChild && data.length > 0 && user) {
          const first = data[0];
          setUser({
            ...user,
            studentContext: {
              studentId: first.studentId,
              classId: (first as any).classId || "",
              sectionId: (first as any).sectionId || "",
              fullName: first.fullName,
              firstName: first.firstName,
              lastName: first.lastName,
              className: first.className,
              sectionName: first.sectionName,
              rollNumber: first.rollNumber,
              admissionNumber: first.admissionNumber,
            },
          });
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectChild = async (child: ChildItem) => {
    if (child.studentId === activeChild?.studentId) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await parentRestApi.switchChild(child.studentId);
      const updatedCtx = res?.studentContext || {
        studentId: child.studentId,
        classId: (child as any).classId || "",
        sectionId: (child as any).sectionId || "",
        fullName: child.fullName,
        firstName: child.firstName,
        lastName: child.lastName,
        className: child.className,
        sectionName: child.sectionName,
        rollNumber: child.rollNumber,
        admissionNumber: child.admissionNumber,
      };

      if (user) {
        setUser({
          ...user,
          studentContext: updatedCtx,
        });
      }

      success(`Switched active child to ${child.fullName}`);
      setIsOpen(false);

      // Force instant window reload of current page so components refresh with new child context
      setTimeout(() => {
        window.location.reload();
      }, 250);
    } catch {
      // Offline fallback: set locally in store
      if (user) {
        setUser({
          ...user,
          studentContext: {
            studentId: child.studentId,
            classId: (child as any).classId || "",
            sectionId: (child as any).sectionId || "",
            fullName: child.fullName,
            firstName: child.firstName,
            lastName: child.lastName,
            className: child.className,
            sectionName: child.sectionName,
            rollNumber: child.rollNumber,
            admissionNumber: child.admissionNumber,
          },
        });
        success(`Switched to ${child.fullName}`);
        setIsOpen(false);
        setTimeout(() => {
          window.location.reload();
        }, 250);
      }
    } finally {
      setLoading(false);
    }
  };

  const displayName =
    activeChild?.fullName ||
    `${(activeChild as any)?.firstName || ""} ${(activeChild as any)?.lastName || ""}`.trim() ||
    "Select Child";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-50/90 hover:bg-teal-100/90 border border-teal-200/90 text-xs font-semibold text-teal-900 transition-all cursor-pointer shadow-2xs"
        title="Switch active child (Manage attendance, results, fees)"
      >
        <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <div className="flex flex-col text-left">
          <span className="truncate max-w-[110px] sm:max-w-[150px] leading-tight font-bold">
            {displayName}
          </span>
          {activeChild?.className && (
            <span className="text-[10px] text-teal-700 leading-tight">
              {activeChild.className} {activeChild.sectionName ? `· ${activeChild.sectionName}` : ""}
            </span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-teal-700 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3.5 py-1.5 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Enrolled Children</span>
            <span className="font-mono text-teal-600">{children.length || 1} Total</span>
          </div>

          <div className="py-1 max-h-64 overflow-y-auto divide-y divide-slate-50">
            {children.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500">
                {activeChild ? displayName : "No children registered"}
              </div>
            ) : (
              children.map((child) => {
                const isSelected = child.studentId === activeChild?.studentId;
                return (
                  <button
                    key={child.studentId}
                    type="button"
                    onClick={() => handleSelectChild(child)}
                    disabled={loading}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-teal-50/70 cursor-pointer ${
                      isSelected ? "bg-teal-50 font-bold text-teal-900" : "text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                        {child.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={child.photoUrl} alt={child.fullName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          child.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate text-slate-900">{child.fullName}</p>
                        <p className="text-[10px] text-slate-500 font-normal">
                          {child.className || "Class"} {child.sectionName ? `· ${child.sectionName}` : ""}
                          {child.rollNumber ? ` · Roll #${child.rollNumber}` : ""}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="px-3.5 pt-2 mt-1 border-t border-slate-100 text-[10px] text-slate-400">
            Switching updates attendance, challans &amp; results instantly.
          </div>
        </div>
      )}
    </div>
  );
};
