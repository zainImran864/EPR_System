'use client';

import React, { useEffect, useState } from 'react';
import {
  Award,
  Star,
  CheckCircle2,
  Lock,
  Clock,
  BookOpen,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { achievementsRestApi } from '@/app/api/client';
import { useAuthStore } from '@/app/store/useAuthStore';

interface BadgeItem {
  badgeType: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progress: number;
  awardedAt?: string;
}

export function StudentAchievementsView({ isParent = false }: { isParent?: boolean }) {
  const { user } = useAuthStore();
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await achievementsRestApi.getMyAchievements();
      setBadges(res || []);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.studentContext?.studentId]);

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  const getBadgeIcon = (icon: string, isUnlocked: boolean) => {
    const colorClass = isUnlocked ? 'text-amber-500 fill-amber-500' : 'text-slate-400';
    switch (icon) {
      case 'star':
        return <Star className={`w-7 h-7 ${colorClass}`} />;
      case 'award':
        return <Trophy className={`w-7 h-7 ${colorClass}`} />;
      case 'book':
        return <BookOpen className={`w-7 h-7 ${colorClass}`} />;
      case 'clock':
        return <Clock className={`w-7 h-7 ${colorClass}`} />;
      default:
        return <Award className={`w-7 h-7 ${colorClass}`} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-xs text-amber-300 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              Student Engagement & Badges
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isParent ? 'Child Honors & Star Achievements' : 'My Honors & Star Achievements'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Earn official recognition stars for full-week perfect attendance, outstanding examination grades, on-time homework, and classroom punctuality!
            </p>
          </div>

          {/* Trophy Counter Widget */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/15 self-start sm:self-auto shrink-0">
            <Trophy className="w-10 h-10 text-amber-400" />
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white block font-mono">
                {unlockedCount} / {badges.length || 4}
              </span>
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Stars Unlocked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
          Loading student achievements...
        </div>
      ) : badges.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
          No achievements recorded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {badges.map((b) => {
            return (
              <div
                key={b.badgeType}
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden bg-white shadow-xs ${
                  b.isUnlocked
                    ? 'border-amber-300 ring-2 ring-amber-400/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {b.isUnlocked && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-2xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Unlocked
                  </div>
                )}

                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`p-3 rounded-2xl border shrink-0 ${
                        b.isUnlocked
                          ? 'bg-amber-50 border-amber-200 text-amber-600'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      {getBadgeIcon(b.icon, b.isUnlocked)}
                    </div>

                    <div className="pr-16">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        {b.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {b.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600">Criteria Progress:</span>
                      <span
                        className={`font-bold font-mono ${
                          b.isUnlocked ? 'text-amber-600' : 'text-slate-700'
                        }`}
                      >
                        {b.progress}%
                      </span>
                    </div>

                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          b.isUnlocked ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, b.progress))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {b.isUnlocked && b.awardedAt ? (
                    <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Awarded on {new Date(b.awardedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Locked (Maintain criteria to unlock)
                    </span>
                  )}

                  {b.isUnlocked && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Verified Honor
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
