"use client";
import { useEffect, useState, useCallback } from "react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatMinutes, getDaysSince, todayISO } from "@/lib/utils";
import { TrendingUp, TrendingDown, Zap, BookOpen, Dumbbell, Clock, CheckSquare, Target, Star, ArrowRight, Flame, Brain } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("recharts").then((m) => ({ default: m.LineChart })), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => ({ default: m.Line })), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => ({ default: m.XAxis })), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => ({ default: m.YAxis })), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => ({ default: m.Tooltip })), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => ({ default: m.ResponsiveContainer })), { ssr: false });

interface DashboardData {
  date: string;
  overallScore: number;
  yesterdayScore: number | null;
  avg7: number;
  best: number;
  sevenDayScores: { date: string; label: string; score: number }[];
  scores: { study: number; fitness: number; deepWork: number; habits: number; screenTime: number; weeklyGoals: number };
  study: { totalMinutes: number; weekMinutes: number; sessions: number };
  fitness: { workoutsToday: number };
  deepWork: { todayMinutes: number; weekMinutes: number };
  habits: { completed: number; total: number };
  screenTime: { totalMinutes: number; targetMinutes: number } | null;
  goals: { completed: number; total: number };
  gateProgress: number;
  latestBody: { weight: number } | null;
  insights: string[];
  weights: { study: number; fitness: number; deepWork: number; habits: number; screenTime: number; weeklyGoals: number };
}

interface Settings {
  comebackStartDate: string;
}

const scoreColor = (score: number) => {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#6366f1";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [appSettings, setAppSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [dash, settings] = await Promise.all([
        fetch("/api/dashboard").then((r) => r.json()),
        fetch("/api/settings").then((r) => r.json()),
      ]);
      setData(dash);
      setAppSettings(settings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Flame className="text-indigo-400 animate-pulse" size={32} />
          <p className="text-white/40 text-sm">Loading your command center...</p>
        </div>
      </div>
    );
  }

  const dayNumber = appSettings?.comebackStartDate ? getDaysSince(appSettings.comebackStartDate) : 1;
  const score = data?.overallScore ?? 0;
  const delta = data?.yesterdayScore != null ? score - data.yesterdayScore : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Flame className="text-indigo-400" size={22} />
            <h1 className="text-2xl font-black tracking-[0.15em] text-white">COMEBACK</h1>
          </div>
          <p className="text-white/30 text-sm">Build the person you said you would become.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-indigo-400/70 uppercase tracking-widest">Day</div>
          <div className="text-4xl font-black text-white">{dayNumber}</div>
          <div className="text-xs text-white/25 uppercase tracking-widest">of the comeback</div>
        </div>
      </div>

      {/* Today's score + overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Score Ring */}
        <Card className="lg:col-span-1 flex flex-col items-center justify-center py-6">
          <CardTitle className="text-center">Today's Comeback Score</CardTitle>
          <ProgressRing score={score} size={140} strokeWidth={10} color={scoreColor(score)} />
          <div className="mt-4 flex items-center gap-6 text-center">
            <div>
              <p className="text-xs text-white/30">Yesterday</p>
              <p className="text-lg font-bold text-white">{data?.yesterdayScore ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-white/30">7-day Avg</p>
              <p className="text-lg font-bold text-white">{data?.avg7 ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-white/30">Best</p>
              <p className="text-lg font-bold text-white">{data?.best ?? 0}</p>
            </div>
          </div>
          {delta !== null && (
            <div className={`mt-3 flex items-center gap-1 text-sm font-medium ${delta >= 0 ? "text-green-400" : "text-red-400"}`}>
              {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {delta >= 0 ? "+" : ""}{delta} vs yesterday
            </div>
          )}
        </Card>

        {/* 7-day chart */}
        <Card className="lg:col-span-2">
          <CardTitle>7-Day Performance</CardTitle>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.sevenDayScores ?? []}>
                <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", fontSize: 12 }}
                  formatter={(v) => [`${v}/100`, "Score"]}
                />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Study", key: "study", icon: BookOpen, color: "#6366f1" },
          { label: "Fitness", key: "fitness", icon: Dumbbell, color: "#22c55e" },
          { label: "Deep Work", key: "deepWork", icon: Zap, color: "#f59e0b" },
          { label: "Habits", key: "habits", icon: CheckSquare, color: "#a78bfa" },
          { label: "Screen", key: "screenTime", icon: Clock, color: "#06b6d4" },
          { label: "Goals", key: "weeklyGoals", icon: Target, color: "#f97316" },
        ].map(({ label, key, icon: Icon, color }) => {
          const s = data?.scores[key as keyof typeof data.scores] ?? 0;
          return (
            <Card key={key} className="flex flex-col items-center py-4 gap-2">
              <Icon size={18} style={{ color }} />
              <div className="text-2xl font-bold text-white">{s}</div>
              <div className="text-xs text-white/30">{label}</div>
              <div className="w-full bg-white/5 rounded-full h-1">
                <div className="h-1 rounded-full transition-all" style={{ width: `${s}%`, backgroundColor: color }} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Study */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-400" />
              <span className="text-sm font-semibold text-white">Study</span>
            </div>
            <Link href="/study" className="text-white/20 hover:text-white/60 transition-colors"><ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Today</span>
              <span className="text-white font-medium">{formatMinutes(data?.study.totalMinutes ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">This Week</span>
              <span className="text-white font-medium">{formatMinutes(data?.study.weekMinutes ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Sessions</span>
              <span className="text-white font-medium">{data?.study.sessions ?? 0}</span>
            </div>
          </div>
        </Card>

        {/* Deep Work */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-400" />
              <span className="text-sm font-semibold text-white">Deep Work</span>
            </div>
            <Link href="/deepwork" className="text-white/20 hover:text-white/60 transition-colors"><ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Today</span>
              <span className="text-white font-medium">{formatMinutes(data?.deepWork.todayMinutes ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">This Week</span>
              <span className="text-white font-medium">{formatMinutes(data?.deepWork.weekMinutes ?? 0)}</span>
            </div>
          </div>
        </Card>

        {/* Habits */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} className="text-purple-400" />
              <span className="text-sm font-semibold text-white">Habits</span>
            </div>
            <Link href="/habits" className="text-white/20 hover:text-white/60 transition-colors"><ArrowRight size={14} /></Link>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-3xl font-bold text-white">{data?.habits.completed ?? 0}</span>
              <span className="text-white/30 text-lg">/{data?.habits.total ?? 0}</span>
            </div>
            <div className="flex-1">
              <div className="bg-white/5 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${data?.habits.total ? ((data.habits.completed / data.habits.total) * 100) : 0}%` }}
                />
              </div>
              <p className="text-xs text-white/30 mt-1">habits done</p>
            </div>
          </div>
        </Card>

        {/* Screen Time */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" />
              <span className="text-sm font-semibold text-white">Screen Time</span>
            </div>
            <Link href="/screentime" className="text-white/20 hover:text-white/60 transition-colors"><ArrowRight size={14} /></Link>
          </div>
          {data?.screenTime ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Actual</span>
                <span className={`font-medium ${data.screenTime.totalMinutes > data.screenTime.targetMinutes ? "text-red-400" : "text-green-400"}`}>
                  {formatMinutes(data.screenTime.totalMinutes)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Target</span>
                <span className="text-white font-medium">{formatMinutes(data.screenTime.targetMinutes)}</span>
              </div>
              <div className="bg-white/5 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${data.screenTime.totalMinutes > data.screenTime.targetMinutes ? "bg-red-500" : "bg-cyan-500"}`}
                  style={{ width: `${Math.min(100, (data.screenTime.totalMinutes / data.screenTime.targetMinutes) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-white/20 text-xs">Not logged today</p>
          )}
        </Card>
      </div>

      {/* GATE + Goals + Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* GATE Progress */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-indigo-400" />
              <span className="text-sm font-semibold text-white">GATE 2027</span>
            </div>
            <Link href="/gate" className="text-white/20 hover:text-white/60 transition-colors"><ArrowRight size={14} /></Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-black text-white">{data?.gateProgress ?? 0}<span className="text-xl text-white/30">%</span></div>
            <div className="flex-1">
              <div className="bg-white/5 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${data?.gateProgress ?? 0}%` }} />
              </div>
              <p className="text-xs text-white/30 mt-1">syllabus covered</p>
            </div>
          </div>
        </Card>

        {/* Weekly Goals */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-orange-400" />
              <span className="text-sm font-semibold text-white">Weekly Goals</span>
            </div>
            <Link href="/goals" className="text-white/20 hover:text-white/60 transition-colors"><ArrowRight size={14} /></Link>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-3xl font-bold text-white">{data?.goals.completed ?? 0}</span>
              <span className="text-white/30 text-lg">/{data?.goals.total ?? 0}</span>
            </div>
            <div className="flex-1">
              <div className="bg-white/5 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${data?.goals.total ? ((data.goals.completed / data.goals.total) * 100) : 0}%` }}
                />
              </div>
              <p className="text-xs text-white/30 mt-1">goals completed</p>
            </div>
          </div>
        </Card>

        {/* Body */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-green-400" />
              <span className="text-sm font-semibold text-white">Body Weight</span>
            </div>
            <Link href="/fitness" className="text-white/20 hover:text-white/60 transition-colors"><ArrowRight size={14} /></Link>
          </div>
          {data?.latestBody?.weight ? (
            <div>
              <div className="text-4xl font-black text-white">{data.latestBody.weight}<span className="text-lg text-white/30"> kg</span></div>
              <p className="text-xs text-white/30 mt-1">last recorded</p>
            </div>
          ) : (
            <p className="text-white/20 text-xs">No measurements logged</p>
          )}
        </Card>
      </div>

      {/* Insights */}
      {data?.insights && data.insights.length > 0 && (
        <Card>
          <CardTitle>Smart Insights</CardTitle>
          <div className="space-y-2">
            {data.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span className="text-white/60">{insight}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs text-white/30 uppercase tracking-widest mb-3">Quick Add</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Study Session", href: "/study", color: "bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/20 text-indigo-300" },
            { label: "Workout", href: "/fitness", color: "bg-green-600/20 hover:bg-green-600/30 border-green-500/20 text-green-300" },
            { label: "Deep Work", href: "/deepwork", color: "bg-amber-600/20 hover:bg-amber-600/30 border-amber-500/20 text-amber-300" },
            { label: "Screen Time", href: "/screentime", color: "bg-cyan-600/20 hover:bg-cyan-600/30 border-cyan-500/20 text-cyan-300" },
            { label: "Log Weight", href: "/fitness", color: "bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/20 text-purple-300" },
            { label: "Daily Review", href: "/review", color: "bg-orange-600/20 hover:bg-orange-600/30 border-orange-500/20 text-orange-300" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${action.color}`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
