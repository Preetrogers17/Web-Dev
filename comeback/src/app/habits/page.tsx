"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { todayISO, getLast30Days } from "@/lib/utils";
import { CheckSquare, Plus, Trash2, Flame, Check } from "lucide-react";

interface Habit {
  id: number;
  name: string;
  icon?: string | null;
  category?: string | null;
  isActive: boolean;
  order: number;
}

interface HabitLog {
  id: number;
  habitId: number;
  date: string;
  completed: boolean;
}

const DEFAULT_HABITS = [
  { name: "Wake up on time", icon: "🌅", category: "Morning" },
  { name: "Gym", icon: "💪", category: "Fitness" },
  { name: "Study", icon: "📚", category: "Learning" },
  { name: "Reading", icon: "📖", category: "Learning" },
  { name: "Meditation", icon: "🧘", category: "Mindfulness" },
  { name: "No junk food", icon: "🥗", category: "Health" },
  { name: "No unnecessary scrolling", icon: "📵", category: "Focus" },
  { name: "Journal", icon: "✍️", category: "Reflection" },
  { name: "Sleep on time", icon: "😴", category: "Recovery" },
];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "", category: "" });
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [view, setView] = useState<"today" | "heatmap">("today");

  const last30 = getLast30Days();

  const fetchHabits = useCallback(async () => {
    const from = last30[0];
    const to = last30[last30.length - 1];
    const data = await fetch(`/api/habits?from=${from}&to=${to}`).then((r) => r.json());
    setHabits(data.habits || []);
    setLogs(data.logs || []);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchHabits().finally(() => setLoading(false));
  }, [fetchHabits]);

  const toggleHabit = async (habitId: number) => {
    const existing = logs.find((l) => l.habitId === habitId && l.date === selectedDate);
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "log", data: { habitId, date: selectedDate, completed: !existing?.completed } }),
    });
    fetchHabits();
  };

  const addHabit = async () => {
    if (!form.name) return;
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "habit", data: { ...form, isActive: true, order: habits.length } }),
    });
    setForm({ name: "", icon: "", category: "" });
    setAddOpen(false);
    fetchHabits();
  };

  const deleteHabit = async (id: number) => {
    if (!confirm("Delete this habit and all its history?")) return;
    await fetch(`/api/habits?id=${id}`, { method: "DELETE" });
    fetchHabits();
  };

  const seedHabits = async () => {
    for (const h of DEFAULT_HABITS) {
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "habit", data: { ...h, isActive: true, order: habits.length } }),
      });
    }
    fetchHabits();
  };

  const getStreak = (habitId: number): number => {
    let streak = 0;
    const today = new Date(todayISO() + "T00:00:00");
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const log = logs.find((l) => l.habitId === habitId && l.date === dateStr);
      if (log?.completed) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  const getMonthCompletion = (habitId: number): number => {
    const monthLogs = last30.map((d) => logs.find((l) => l.habitId === habitId && l.date === d));
    const done = monthLogs.filter((l) => l?.completed).length;
    return Math.round((done / last30.length) * 100);
  };

  const getHeatmapIntensity = (date: string): number => {
    const dayLogs = logs.filter((l) => l.date === date && l.completed).length;
    const total = habits.length;
    if (total === 0) return 0;
    return dayLogs / total;
  };

  if (loading) return <div className="flex items-center justify-center h-96 text-white/20">Loading...</div>;

  const todayLogs = logs.filter((l) => l.date === selectedDate);
  const completedToday = todayLogs.filter((l) => l.completed).length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Habit Tracker</h1>
          <p className="text-white/30 text-sm mt-0.5">Build consistency one day at a time</p>
        </div>
        <div className="flex gap-2">
          {habits.length === 0 && <Button variant="secondary" onClick={seedHabits}>Load Defaults</Button>}
          <Button onClick={() => setAddOpen(true)}><Plus size={16} /> Add Habit</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 rounded-xl p-1">
        <button onClick={() => setView("today")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${view === "today" ? "bg-indigo-600 text-white" : "text-white/40 hover:text-white"}`}>
          Daily Check-in
        </button>
        <button onClick={() => setView("heatmap")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${view === "heatmap" ? "bg-indigo-600 text-white" : "text-white/40 hover:text-white"}`}>
          30-Day Overview
        </button>
      </div>

      {view === "today" && (
        <>
          <div className="flex items-center gap-3">
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto" />
            <div className="text-sm text-white/40">
              <strong className="text-white">{completedToday}/{habits.length}</strong> completed
            </div>
            <div className="flex-1 bg-white/5 rounded-full h-2 max-w-40">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${habits.length > 0 ? (completedToday / habits.length * 100) : 0}%` }} />
            </div>
          </div>

          {habits.length === 0 ? (
            <Card className="text-center py-12">
              <CheckSquare className="mx-auto mb-3 text-white/10" size={40} />
              <p className="text-white/30 mb-4">No habits configured yet</p>
              <Button onClick={seedHabits}>Load Default Habits</Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {habits.map((h) => {
                const log = todayLogs.find((l) => l.habitId === h.id);
                const done = log?.completed ?? false;
                const streak = getStreak(h.id);
                const monthPct = getMonthCompletion(h.id);

                return (
                  <div key={h.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${done ? "bg-green-500/10 border-green-500/20" : "bg-white/2 border-white/5 hover:border-white/10"}`}>
                    <button
                      onClick={() => toggleHabit(h.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${done ? "bg-green-500 border-green-500" : "border-white/20 hover:border-white/40"}`}
                    >
                      {done && <Check size={14} className="text-white" />}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${done ? "text-green-300" : "text-white"}`}>
                        {h.icon} {h.name}
                      </p>
                      {h.category && <p className="text-xs text-white/25">{h.category}</p>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/30">
                      {streak > 0 && (
                        <div className="flex items-center gap-1 text-amber-400">
                          <Flame size={12} />
                          <span>{streak}</span>
                        </div>
                      )}
                      <span>{monthPct}%/mo</span>
                    </div>
                    <button onClick={() => deleteHabit(h.id)} className="text-white/15 hover:text-red-400 p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {view === "heatmap" && (
        <div className="space-y-6">
          {habits.map((h) => {
            const streak = getStreak(h.id);
            const monthPct = getMonthCompletion(h.id);
            return (
              <Card key={h.id}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-white">{h.icon} {h.name}</p>
                    <p className="text-xs text-white/30">{monthPct}% this month · {streak} day streak</p>
                  </div>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                      <Flame size={14} /> {streak}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {last30.map((date) => {
                    const log = logs.find((l) => l.habitId === h.id && l.date === date);
                    const done = log?.completed ?? false;
                    const isToday = date === todayISO();
                    return (
                      <button
                        key={date}
                        onClick={() => { setSelectedDate(date); setView("today"); }}
                        title={date}
                        className={`w-7 h-7 rounded-md transition-all ${done ? "bg-green-500" : "bg-white/5"} ${isToday ? "ring-1 ring-white/30" : ""} hover:opacity-80`}
                      />
                    );
                  })}
                </div>
              </Card>
            );
          })}

          {/* Overall heatmap */}
          <Card>
            <CardTitle>Overall Completion Heatmap (30 Days)</CardTitle>
            <div className="flex gap-1 flex-wrap">
              {last30.map((date) => {
                const intensity = getHeatmapIntensity(date);
                const isToday = date === todayISO();
                const opacity = intensity === 0 ? 0.05 : 0.3 + intensity * 0.7;
                return (
                  <div
                    key={date}
                    title={`${date}: ${Math.round(intensity * habits.length)}/${habits.length}`}
                    className={`w-7 h-7 rounded-md ${isToday ? "ring-1 ring-white/30" : ""}`}
                    style={{ backgroundColor: `rgba(99, 102, 241, ${opacity})` }}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-white/30">
              <div className="w-3 h-3 rounded-sm bg-white/5" /> Less
              <div className="w-3 h-3 rounded-sm bg-indigo-500/40" />
              <div className="w-3 h-3 rounded-sm bg-indigo-500" />
              <div className="w-3 h-3 rounded-sm bg-indigo-400" /> More
            </div>
          </Card>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Habit">
        <div className="space-y-4">
          <Input label="Habit Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Morning walk" />
          <Input label="Icon (emoji)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="e.g. 🏃" />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Health, Learning" />
          <div className="flex gap-3">
            <Button onClick={addHabit} className="flex-1">Add Habit</Button>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
