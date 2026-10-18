'use client';

import React, { useEffect, useState } from 'react';
import {
  Award,
  Star,
  CheckCircle2,
  Lock,
  Clock,
  BookOpen,
  CalendarCheck,
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
    const colorClass = isUnlocked ? 'text-amber-400' : 'text-slate-500';
    switch (icon) {
      case 'star':
        return <Star className={`w-8 h-8 ${colorClass} ${isUnlocked ? 'fill-amber-400' : ''}`} />;
      case 'award':
        return <Trophy className={`w-8 h-8 ${colorClass}`} />;
      case 'book':
        return <BookOpen className={`w-8 h-8 ${colorClass}`} />;
      case 'clock':
        return <Clock className={`w-8 h-8 ${colorClass}`} />;
      default:
        return <Award className={`w-8 h-8 ${colorClass}`} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-900 border border-amber-500/30 shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
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
          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 self-start sm:self-auto shrink-0">
            <Trophy className="w-10 h-10 text-brand-gold animate-bounce" />
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white block font-mono-data">
                {unlockedCount} / {badges.length || 4}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Stars Unlocked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading student achievements...</div>
      ) : badges.length === 0 ? (
        <div className="p-12 text-center text-slate-400">No achievements recorded yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {badges.map((b) => {
            return (
              <div
                key={b.badgeType}
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                  b.isUnlocked
                    ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-white/5 to-transparent shadow-lg shadow-amber-500/5'
                    : 'border-white/10 bg-white/5 opacity-80'
                }`}
              >
                {b.isUnlocked && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Unlocked
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`p-3.5 rounded-2xl border ${
                        b.isUnlocked
                          ? 'bg-amber-500/20 border-amber-500/40 shadow-inner'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      {getBadgeIcon(b.icon, b.isUnlocked)}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {b.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {b.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Criteria Progress:</span>
                      <span
                        className={`font-semibold font-mono-data ${
                          b.isUnlocked ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        {b.progress}%
                      </span>
                    </div>

                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          b.isUnlocked ? 'bg-gradient-to-r from-amber-500 to-amber-300' : 'bg-slate-600'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, b.progress))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  {b.isUnlocked && b.awardedAt ? (
                    <span className="text-amber-300/80 flex items-center gap-1 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Awarded on {new Date(b.awardedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      Locked (Maintain criteria to unlock)
                    </span>
                  )}

                  {b.isUnlocked && (
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
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
