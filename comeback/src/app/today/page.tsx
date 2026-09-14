"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Input";
import { formatMinutes, todayISO, getWeekStart } from "@/lib/utils";
import { BookOpen, Dumbbell, CheckSquare, Clock, Target, Zap, Plus, Check, X } from "lucide-react";
import Link from "next/link";

interface TodayData {
  studySessions: { id: number; subject: string; topic: string; durationMinutes: number; studyMethod: string }[];
  habits: { id: number; name: string; icon?: string | null }[];
  habitLogs: { habitId: number; completed: boolean }[];
  workouts: { id: number; name: string; type: string; durationMinutes?: number | null }[];
  deepWork: { id: number; durationMinutes: number; subject?: string | null; category?: string | null }[];
  screenTime: { totalMinutes: number; targetMinutes: number } | null;
  goals: { id: number; title: string; isCompleted: boolean; currentValue: number; targetValue?: number | null; unit?: string | null }[];
}

export default function TodayPage() {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const today = todayISO();

  const fetchAll = useCallback(async () => {
    try {
      const [study, habitsRes, workoutsRes, deepWorkRes, screenTimeRes, goalsRes] = await Promise.all([
        fetch(`/api/study?date=${today}`).then((r) => r.json()),
        fetch(`/api/habits?date=${today}`).then((r) => r.json()),
        fetch(`/api/workouts?date=${today}`).then((r) => r.json()),
        fetch(`/api/deepwork?date=${today}`).then((r) => r.json()),
        fetch(`/api/screentime?date=${today}`).then((r) => r.json()),
        fetch(`/api/goals?week=${getWeekStart()}`).then((r) => r.json()),
      ]);
      setData({
        studySessions: study,
        habits: habitsRes.habits || [],
        habitLogs: habitsRes.logs || [],
        workouts: workoutsRes,
        deepWork: deepWorkRes,
        screenTime: screenTimeRes[0] || null,
        goals: goalsRes,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleHabit = async (habitId: number, current: boolean) => {
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "log", data: { habitId, date: today, completed: !current } }),
    });
    fetchAll();
  };

  const toggleGoal = async (goal: { id: number; isCompleted: boolean }) => {
    await fetch("/api/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: goal.id, isCompleted: !goal.isCompleted }),
    });
    fetchAll();
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="text-white/40">Loading...</div></div>;

  const totalStudyMinutes = data?.studySessions.reduce((a, s) => a + s.durationMinutes, 0) ?? 0;
  const totalDeepWorkMinutes = data?.deepWork.reduce((a, d) => a + d.durationMinutes, 0) ?? 0;
  const habitsCompleted = data?.habits.filter((h) => data.habitLogs.find((l) => l.habitId === h.id && l.completed)).length ?? 0;
  const goalsCompleted = data?.goals.filter((g) => g.isCompleted).length ?? 0;

  const today_display = new Date(today + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Today</h1>
          <p className="text-white/30 text-sm mt-0.5">{today_display}</p>
        </div>
        <Link href="/review">
          <Button variant="secondary" size="sm">End of Day Review</Button>
        </Link>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Study", value: formatMinutes(totalStudyMinutes), color: "text-indigo-400", bg: "bg-indigo-500/10" },
          { label: "Deep Work", value: formatMinutes(totalDeepWorkMinutes), color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Habits", value: `${habitsCompleted}/${data?.habits.length ?? 0}`, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Goals", value: `${goalsCompleted}/${data?.goals.length ?? 0}`, color: "text-orange-400", bg: "bg-orange-500/10" },
        ].map((item) => (
          <div key={item.label} className={`${item.bg} rounded-xl p-3 flex items-center justify-between`}>
            <span className="text-sm text-white/50">{item.label}</span>
            <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Habits */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="mb-0">Habits</CardTitle>
          <Link href="/habits"><Button variant="ghost" size="sm"><Plus size={14} /> Manage</Button></Link>
        </div>
        {data?.habits.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-white/30 text-sm mb-3">No habits configured yet</p>
            <Link href="/habits"><Button variant="secondary" size="sm">Add Habits</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data?.habits.map((h) => {
              const log = data.habitLogs.find((l) => l.habitId === h.id);
              const done = log?.completed ?? false;
              return (
                <button
                  key={h.id}
                  onClick={() => toggleHabit(h.id, done)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${done ? "bg-green-500/10 border-green-500/20 text-green-300" : "bg-white/3 border-white/5 text-white/50 hover:bg-white/5"}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${done ? "bg-green-500 border-green-500" : "border-white/20"}`}>
                    {done && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium">{h.icon} {h.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Study Sessions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-400" />
            <CardTitle className="mb-0">Study Sessions</CardTitle>
          </div>
          <Link href="/study"><Button variant="secondary" size="sm"><Plus size={14} /> Add</Button></Link>
        </div>
        {data?.studySessions.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-4">No study sessions logged today</p>
        ) : (
          <div className="space-y-2">
            {data?.studySessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                <div>
                  <p className="text-sm font-medium text-white">{s.subject} → {s.topic}</p>
                  <p className="text-xs text-white/30 mt-0.5">{s.studyMethod}</p>
                </div>
                <span className="text-indigo-400 font-semibold text-sm">{formatMinutes(s.durationMinutes)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Workouts */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Dumbbell size={16} className="text-green-400" />
            <CardTitle className="mb-0">Workouts</CardTitle>
          </div>
          <Link href="/fitness"><Button variant="secondary" size="sm"><Plus size={14} /> Add</Button></Link>
        </div>
        {data?.workouts.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-4">No workout logged today</p>
        ) : (
          <div className="space-y-2">
            {data?.workouts.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg border border-green-500/10">
                <div>
                  <p className="text-sm font-medium text-white">{w.name}</p>
                  <p className="text-xs text-white/30 mt-0.5">{w.type}</p>
                </div>
                {w.durationMinutes ? <span className="text-green-400 font-semibold text-sm">{formatMinutes(w.durationMinutes)}</span> : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Deep Work */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            <CardTitle className="mb-0">Deep Work Sessions</CardTitle>
          </div>
          <Link href="/deepwork"><Button variant="secondary" size="sm"><Plus size={14} /> Add</Button></Link>
        </div>
        {data?.deepWork.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-4">No deep work sessions today</p>
        ) : (
          <div className="space-y-2">
            {data?.deepWork.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                <div>
                  <p className="text-sm font-medium text-white">{d.subject || "Deep Work"}</p>
                  <p className="text-xs text-white/30 mt-0.5">{d.category || "Focus"}</p>
                </div>
                <span className="text-amber-400 font-semibold text-sm">{formatMinutes(d.durationMinutes)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Screen Time */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-cyan-400" />
            <CardTitle className="mb-0">Screen Time</CardTitle>
          </div>
          <Link href="/screentime"><Button variant="secondary" size="sm"><Plus size={14} /> Log</Button></Link>
        </div>
        {data?.screenTime ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/3 rounded-lg">
              <p className="text-xs text-white/30">Total</p>
              <p className={`text-xl font-bold ${data.screenTime.totalMinutes > data.screenTime.targetMinutes ? "text-red-400" : "text-cyan-400"}`}>
                {formatMinutes(data.screenTime.totalMinutes)}
              </p>
            </div>
            <div className="p-3 bg-white/3 rounded-lg">
              <p className="text-xs text-white/30">Target</p>
              <p className="text-xl font-bold text-white">{formatMinutes(data.screenTime.targetMinutes)}</p>
            </div>
          </div>
        ) : (
          <p className="text-white/20 text-sm text-center py-4">Screen time not logged today</p>
        )}
      </Card>

      {/* Weekly Goals */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-orange-400" />
            <CardTitle className="mb-0">Weekly Goals</CardTitle>
          </div>
          <Link href="/goals"><Button variant="secondary" size="sm"><Plus size={14} /> Add</Button></Link>
        </div>
        {data?.goals.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-4">No weekly goals set</p>
        ) : (
          <div className="space-y-2">
            {data?.goals.map((g) => (
              <div key={g.id} className={`flex items-center gap-3 p-3 rounded-lg border ${g.isCompleted ? "bg-green-500/10 border-green-500/20" : "bg-white/3 border-white/5"}`}>
                <button onClick={() => toggleGoal(g)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${g.isCompleted ? "bg-green-500 border-green-500" : "border-white/20"}`}>
                  {g.isCompleted && <Check size={12} className="text-white" />}
                </button>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${g.isCompleted ? "text-green-300 line-through" : "text-white"}`}>{g.title}</p>
                  {g.targetValue && (
                    <p className="text-xs text-white/30">{g.currentValue}/{g.targetValue} {g.unit}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
