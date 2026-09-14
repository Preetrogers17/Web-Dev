"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { getWeekStart, todayISO } from "@/lib/utils";
import { Target, Plus, Trash2, Check, Edit2 } from "lucide-react";

interface WeeklyGoal {
  id: number;
  weekStart: string;
  title: string;
  description?: string | null;
  category?: string | null;
  priority: string;
  targetValue?: number | null;
  currentValue: number;
  unit?: string | null;
  isCompleted: boolean;
  deadline?: string | null;
}

const CATEGORIES = ["Study", "Fitness", "Health", "Productivity", "Personal", "Career", "Finance", "Other"];
const PRIORITIES = ["low", "medium", "high"];

const emptyForm = {
  weekStart: getWeekStart(),
  title: "",
  description: "",
  category: "Study",
  priority: "medium",
  targetValue: "",
  currentValue: "0",
  unit: "",
  deadline: "",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<WeeklyGoal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [viewAll, setViewAll] = useState(false);

  const currentWeekStart = getWeekStart();

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const url = viewAll ? "/api/goals?all=1" : `/api/goals?week=${currentWeekStart}`;
      const data = await fetch(url).then((r) => r.json());
      setGoals(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [viewAll, currentWeekStart]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const openAdd = () => {
    setEditGoal(null);
    setForm({ ...emptyForm, weekStart: currentWeekStart });
    setModalOpen(true);
  };

  const openEdit = (goal: WeeklyGoal) => {
    setEditGoal(goal);
    setForm({
      weekStart: goal.weekStart,
      title: goal.title,
      description: goal.description ?? "",
      category: goal.category ?? "Study",
      priority: goal.priority,
      targetValue: goal.targetValue?.toString() ?? "",
      currentValue: goal.currentValue.toString(),
      unit: goal.unit ?? "",
      deadline: goal.deadline ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      targetValue: form.targetValue ? Number(form.targetValue) : null,
      currentValue: Number(form.currentValue),
    };
    if (editGoal) {
      await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editGoal.id, ...payload }),
      });
    } else {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setModalOpen(false);
    fetchGoals();
  };

  const toggleComplete = async (goal: WeeklyGoal) => {
    await fetch("/api/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: goal.id, isCompleted: !goal.isCompleted }),
    });
    fetchGoals();
  };

  const deleteGoal = async (id: number) => {
    if (!confirm("Delete this goal?")) return;
    await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
    fetchGoals();
  };

  const completed = goals.filter((g) => g.isCompleted).length;
  const completion = goals.length > 0 ? Math.round((completed / goals.length) * 100) : 0;

  const priorityColor = (p: string) => ({ high: "text-red-400", medium: "text-amber-400", low: "text-green-400" })[p] || "text-white/40";
  const priorityBg = (p: string) => ({ high: "bg-red-500/10 border-red-500/20", medium: "bg-amber-500/10 border-amber-500/20", low: "bg-green-500/10 border-green-500/20" })[p] || "";

  type GroupedEntry = [string, WeeklyGoal[]];
  const groupedGoals: GroupedEntry[] = viewAll
    ? Object.entries(goals.reduce<Record<string, WeeklyGoal[]>>((acc, g) => {
        (acc[g.weekStart] = acc[g.weekStart] || []).push(g);
        return acc;
      }, {})).sort((a, b) => b[0].localeCompare(a[0]))
    : [["This Week", goals]];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Weekly Goals</h1>
          <p className="text-white/30 text-sm mt-0.5">Set and track your weekly objectives</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setViewAll(!viewAll)}>
            {viewAll ? "This Week" : "All Goals"}
          </Button>
          <Button onClick={openAdd}><Plus size={16} /> Add Goal</Button>
        </div>
      </div>

      {!viewAll && goals.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">Weekly Completion</span>
            <span className="text-2xl font-black text-orange-400">{completion}%</span>
          </div>
          <div className="bg-white/5 rounded-full h-3">
            <div className="bg-gradient-to-r from-orange-600 to-amber-500 h-3 rounded-full transition-all" style={{ width: `${completion}%` }} />
          </div>
          <p className="text-xs text-white/30 mt-2">{completed} / {goals.length} goals completed</p>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-white/20">Loading...</div>
      ) : goals.length === 0 ? (
        <Card className="text-center py-12">
          <Target className="mx-auto mb-3 text-white/10" size={40} />
          <p className="text-white/30">No goals for this week</p>
          <Button className="mt-4" onClick={openAdd}><Plus size={14} /> Add First Goal</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedGoals.map(([week, weekGoals]) => (
            <div key={week}>
              {viewAll && <h3 className="text-xs text-white/30 uppercase tracking-widest mb-2">Week of {week}</h3>}
              <div className="space-y-2">
                {weekGoals.map((goal) => {
                  const progress = goal.targetValue && goal.targetValue > 0
                    ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
                    : goal.isCompleted ? 100 : 0;
                  return (
                    <Card key={goal.id} className={`${goal.isCompleted ? "opacity-70" : ""}`}>
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleComplete(goal)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${goal.isCompleted ? "bg-green-500 border-green-500" : "border-white/20 hover:border-white/40"}`}
                        >
                          {goal.isCompleted && <Check size={12} className="text-white" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className={`font-medium text-sm ${goal.isCompleted ? "line-through text-white/40" : "text-white"}`}>{goal.title}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {goal.category && <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-white/40">{goal.category}</span>}
                                <span className={`text-xs font-medium ${priorityColor(goal.priority)}`}>{goal.priority}</span>
                                {goal.deadline && <span className="text-xs text-white/25">Due: {goal.deadline}</span>}
                              </div>
                              {goal.description && <p className="text-xs text-white/25 mt-1">{goal.description}</p>}
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button onClick={() => openEdit(goal)} className="p-1 text-white/20 hover:text-white"><Edit2 size={13} /></button>
                              <button onClick={() => deleteGoal(goal.id)} className="p-1 text-white/15 hover:text-red-400"><Trash2 size={13} /></button>
                            </div>
                          </div>
                          {goal.targetValue && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-white/30 mb-1">
                                <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                                <span>{progress}%</span>
                              </div>
                              <div className="bg-white/5 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${goal.isCompleted ? "bg-green-500" : "bg-orange-500"}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editGoal ? "Edit Goal" : "Add Goal"} size="lg">
        <div className="space-y-4">
          <Input label="Goal Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Complete 3 GATE chapters" />
          <Textarea label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={PRIORITIES.map((p) => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Target Value" type="number" value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} placeholder="e.g. 5" />
            <Input label="Current Value" type="number" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} />
            <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. chapters, hours" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Week Start" type="date" value={form.weekStart} onChange={(e) => setForm({ ...form, weekStart: e.target.value })} />
            <Input label="Deadline (optional)" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} className="flex-1">{editGoal ? "Update Goal" : "Add Goal"}</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
