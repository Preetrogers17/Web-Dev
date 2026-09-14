"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatMinutes, todayISO, calculate1RM } from "@/lib/utils";
import { Dumbbell, Plus, Trash2, ChevronDown, ChevronRight, Trophy, Scale } from "lucide-react";
import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("recharts").then((m) => ({ default: m.LineChart })), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => ({ default: m.Line })), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => ({ default: m.XAxis })), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => ({ default: m.YAxis })), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => ({ default: m.Tooltip })), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => ({ default: m.ResponsiveContainer })), { ssr: false });

const WORKOUT_TYPES = ["Push", "Pull", "Legs", "Chest", "Back", "Shoulders", "Arms", "Core", "Full Body", "Cardio", "Other"];

interface ExerciseSet {
  setNumber: number;
  reps: number;
  weight: number;
  rpe?: number | null;
  isWarmup?: boolean;
}

interface ExerciseData {
  name: string;
  notes?: string;
  sets: ExerciseSet[];
}

interface Workout {
  id: number;
  date: string;
  name: string;
  type: string;
  notes?: string | null;
  durationMinutes?: number | null;
  exercises: {
    id: number;
    name: string;
    sets: ExerciseSet[];
  }[];
}

interface BodyMeasurement {
  id: number;
  date: string;
  weight?: number | null;
  chest?: number | null;
  waist?: number | null;
  arms?: number | null;
  shoulders?: number | null;
  bodyFatPercentage?: number | null;
  notes?: string | null;
}

interface PR {
  id: number;
  exerciseName: string;
  date: string;
  weight: number;
  reps: number;
  estimated1rm?: number | null;
}

const emptyExercise = (): ExerciseData => ({
  name: "", notes: "",
  sets: [{ setNumber: 1, reps: 8, weight: 0, rpe: undefined, isWarmup: false }]
});

export default function FitnessPage() {
  const [tab, setTab] = useState<"workouts" | "body" | "prs">("workouts");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [bodyData, setBodyData] = useState<BodyMeasurement[]>([]);
  const [prs, setPRs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWorkout, setExpandedWorkout] = useState<Record<number, boolean>>({});

  // Workout form
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({
    date: todayISO(), name: "Push Day", type: "Push", notes: "", durationMinutes: 60
  });
  const [exercises, setExercises] = useState<ExerciseData[]>([emptyExercise()]);

  // Body form
  const [bodyModalOpen, setBodyModalOpen] = useState(false);
  const [bodyForm, setBodyForm] = useState({
    date: todayISO(), weight: "", chest: "", waist: "", arms: "", shoulders: "", bodyFatPercentage: "", notes: ""
  });

  const fetchWorkouts = useCallback(async () => {
    const data = await fetch("/api/workouts").then((r) => r.json());
    setWorkouts(Array.isArray(data) ? data : []);
  }, []);

  const fetchBody = useCallback(async () => {
    const data = await fetch("/api/body").then((r) => r.json());
    setBodyData(Array.isArray(data) ? data : []);
  }, []);

  const fetchPRs = useCallback(async () => {
    const data = await fetch("/api/prs").then((r) => r.json());
    setPRs(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    Promise.all([fetchWorkouts(), fetchBody(), fetchPRs()]).finally(() => setLoading(false));
  }, [fetchWorkouts, fetchBody, fetchPRs]);

  const addExercise = () => setExercises([...exercises, emptyExercise()]);
  const addSet = (exIdx: number) => {
    const updated = [...exercises];
    const lastSet = updated[exIdx].sets[updated[exIdx].sets.length - 1];
    updated[exIdx].sets.push({
      setNumber: updated[exIdx].sets.length + 1,
      reps: lastSet?.reps ?? 8,
      weight: lastSet?.weight ?? 0,
    });
    setExercises(updated);
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof ExerciseSet, value: number | boolean) => {
    const updated = [...exercises];
    (updated[exIdx].sets[setIdx] as unknown as Record<string, unknown>)[field] = value;
    setExercises(updated);
  };

  const submitWorkout = async () => {
    await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...workoutForm, durationMinutes: Number(workoutForm.durationMinutes), exercises }),
    });
    setWorkoutModalOpen(false);
    setExercises([emptyExercise()]);
    fetchWorkouts();
    fetchPRs();
  };

  const deleteWorkout = async (id: number) => {
    if (!confirm("Delete this workout?")) return;
    await fetch(`/api/workouts?id=${id}`, { method: "DELETE" });
    fetchWorkouts();
  };

  const submitBody = async () => {
    const payload: Record<string, unknown> = { date: bodyForm.date };
    if (bodyForm.weight) payload.weight = Number(bodyForm.weight);
    if (bodyForm.chest) payload.chest = Number(bodyForm.chest);
    if (bodyForm.waist) payload.waist = Number(bodyForm.waist);
    if (bodyForm.arms) payload.arms = Number(bodyForm.arms);
    if (bodyForm.shoulders) payload.shoulders = Number(bodyForm.shoulders);
    if (bodyForm.bodyFatPercentage) payload.bodyFatPercentage = Number(bodyForm.bodyFatPercentage);
    if (bodyForm.notes) payload.notes = bodyForm.notes;
    await fetch("/api/body", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setBodyModalOpen(false);
    fetchBody();
  };

  const weightData = bodyData.filter((b) => b.weight).map((b) => ({ date: b.date.slice(5), weight: b.weight }));

  const totalVolume = (w: Workout) =>
    w.exercises.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.weight * s.reps, 0), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fitness Tracker</h1>
          <p className="text-white/30 text-sm mt-0.5">Track workouts, body composition, and PRs</p>
        </div>
        <div className="flex gap-2">
          {tab === "workouts" && <Button onClick={() => setWorkoutModalOpen(true)}><Plus size={16} /> Log Workout</Button>}
          {tab === "body" && <Button onClick={() => setBodyModalOpen(true)}><Plus size={16} /> Log Weight</Button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 rounded-xl p-1">
        {(["workouts", "body", "prs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? "bg-indigo-600 text-white" : "text-white/40 hover:text-white"}`}
          >
            {t === "prs" ? "Personal Records" : t === "body" ? "Body Progress" : "Workouts"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/20">Loading...</div>
      ) : (
        <>
          {/* WORKOUTS TAB */}
          {tab === "workouts" && (
            <div className="space-y-3">
              {workouts.length === 0 ? (
                <Card className="text-center py-12">
                  <Dumbbell className="mx-auto mb-3 text-white/10" size={40} />
                  <p className="text-white/30">No workouts logged yet</p>
                  <Button className="mt-4" onClick={() => setWorkoutModalOpen(true)}><Plus size={14} /> Log First Workout</Button>
                </Card>
              ) : workouts.map((w) => {
                const expanded = expandedWorkout[w.id] ?? false;
                const vol = totalVolume(w);
                return (
                  <Card key={w.id} className="p-0 overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-4 hover:bg-white/2"
                      onClick={() => setExpandedWorkout({ ...expandedWorkout, [w.id]: !expanded })}
                    >
                      <div className="flex items-center gap-3">
                        {expanded ? <ChevronDown size={16} className="text-white/40" /> : <ChevronRight size={16} className="text-white/40" />}
                        <div className="text-left">
                          <p className="font-semibold text-white">{w.name}</p>
                          <p className="text-xs text-white/30">{w.date} · {w.type} · {w.exercises.length} exercises</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-xs text-white/40">
                          <p>Volume</p>
                          <p className="text-green-400 font-semibold">{vol.toLocaleString()} kg</p>
                        </div>
                        {w.durationMinutes ? (
                          <div className="text-right text-xs text-white/40">
                            <p>Duration</p>
                            <p className="text-white font-semibold">{formatMinutes(w.durationMinutes)}</p>
                          </div>
                        ) : null}
                        <button onClick={(e) => { e.stopPropagation(); deleteWorkout(w.id); }} className="text-white/15 hover:text-red-400 p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </button>
                    {expanded && (
                      <div className="border-t border-white/5 p-4 space-y-4">
                        {w.exercises.map((ex) => {
                          const maxWeight = Math.max(...ex.sets.map((s) => s.weight));
                          const maxWeightSet = ex.sets.find((s) => s.weight === maxWeight);
                          return (
                            <div key={ex.id}>
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium text-white text-sm">{ex.name}</p>
                                {maxWeightSet && (
                                  <span className="text-xs text-amber-400">PR: {maxWeightSet.weight}kg × {maxWeightSet.reps} · 1RM≈{calculate1RM(maxWeightSet.weight, maxWeightSet.reps)}kg</span>
                                )}
                              </div>
                              <div className="grid grid-cols-4 gap-1 text-xs text-white/30 mb-1 px-1">
                                <span>Set</span><span>Weight (kg)</span><span>Reps</span><span>Vol</span>
                              </div>
                              {ex.sets.map((set, i) => (
                                <div key={i} className="grid grid-cols-4 gap-1 text-sm px-1 py-1 rounded hover:bg-white/3">
                                  <span className="text-white/40">{set.setNumber}</span>
                                  <span className="font-medium text-white">{set.weight}</span>
                                  <span className="text-white/70">{set.reps}</span>
                                  <span className="text-white/30">{(set.weight * set.reps).toFixed(0)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                        {w.notes && <p className="text-xs text-white/25 italic">{w.notes}</p>}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* BODY TAB */}
          {tab === "body" && (
            <div className="space-y-4">
              {weightData.length > 0 && (
                <Card>
                  <CardTitle>Weight Trend</CardTitle>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightData}>
                        <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                        <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", fontSize: 12 }} />
                        <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
              <div className="space-y-2">
                {bodyData.length === 0 ? (
                  <Card className="text-center py-12">
                    <Scale className="mx-auto mb-3 text-white/10" size={40} />
                    <p className="text-white/30">No measurements logged yet</p>
                    <Button className="mt-4" onClick={() => setBodyModalOpen(true)}><Plus size={14} /> Log Measurement</Button>
                  </Card>
                ) : [...bodyData].reverse().map((b) => (
                  <Card key={b.id}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-white">{b.date}</span>
                      <button onClick={async () => { await fetch(`/api/body?id=${b.id}`, { method: "DELETE" }); fetchBody(); }} className="text-white/15 hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {b.weight && <span><span className="text-white/30">Weight: </span><strong className="text-white">{b.weight} kg</strong></span>}
                      {b.chest && <span><span className="text-white/30">Chest: </span><strong className="text-white">{b.chest} cm</strong></span>}
                      {b.waist && <span><span className="text-white/30">Waist: </span><strong className="text-white">{b.waist} cm</strong></span>}
                      {b.arms && <span><span className="text-white/30">Arms: </span><strong className="text-white">{b.arms} cm</strong></span>}
                      {b.shoulders && <span><span className="text-white/30">Shoulders: </span><strong className="text-white">{b.shoulders} cm</strong></span>}
                      {b.bodyFatPercentage && <span><span className="text-white/30">BF%: </span><strong className="text-white">{b.bodyFatPercentage}%</strong></span>}
                    </div>
                    {b.notes && <p className="text-xs text-white/25 mt-1">{b.notes}</p>}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* PRs TAB */}
          {tab === "prs" && (
            <div className="space-y-3">
              {prs.length === 0 ? (
                <Card className="text-center py-12">
                  <Trophy className="mx-auto mb-3 text-white/10" size={40} />
                  <p className="text-white/30">No PRs yet — log workouts to track them automatically</p>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {Array.from(new Set(prs.map((p) => p.exerciseName))).map((exerciseName) => {
                    const exercisePRs = prs.filter((p) => p.exerciseName === exerciseName).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    const best = exercisePRs[0];
                    return (
                      <Card key={exerciseName}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-white">{exerciseName}</p>
                            <p className="text-xs text-white/30">Current PR: <span className="text-amber-400 font-bold">{best.weight} kg × {best.reps}</span></p>
                            {best.estimated1rm && <p className="text-xs text-white/20">Estimated 1RM: {best.estimated1rm} kg</p>}
                          </div>
                          <Trophy size={16} className="text-amber-400" />
                        </div>
                        <div className="space-y-1">
                          {exercisePRs.slice(0, 5).map((pr) => (
                            <div key={pr.id} className="flex items-center justify-between text-xs text-white/40">
                              <span>{pr.date}</span>
                              <span>{pr.weight} kg × {pr.reps}</span>
                              {pr.estimated1rm && <span>1RM: {pr.estimated1rm} kg</span>}
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Workout Modal */}
      <Modal isOpen={workoutModalOpen} onClose={() => setWorkoutModalOpen(false)} title="Log Workout" size="xl">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={workoutForm.date} onChange={(e) => setWorkoutForm({ ...workoutForm, date: e.target.value })} />
            <Select label="Type" value={workoutForm.type} onChange={(e) => setWorkoutForm({ ...workoutForm, type: e.target.value, name: `${e.target.value} Day` })} options={WORKOUT_TYPES.map((t) => ({ value: t, label: t }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Workout Name" value={workoutForm.name} onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })} />
            <Input label="Duration (mins)" type="number" value={workoutForm.durationMinutes} onChange={(e) => setWorkoutForm({ ...workoutForm, durationMinutes: Number(e.target.value) })} />
          </div>

          {/* Exercises */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Exercises</h3>
              <Button variant="ghost" size="sm" onClick={addExercise}><Plus size={13} /> Add Exercise</Button>
            </div>
            {exercises.map((ex, exIdx) => (
              <div key={exIdx} className="bg-white/3 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Exercise name (e.g. Bench Press)"
                    value={ex.name}
                    onChange={(e) => { const u = [...exercises]; u[exIdx].name = e.target.value; setExercises(u); }}
                    className="flex-1"
                  />
                  <button onClick={() => setExercises(exercises.filter((_, i) => i !== exIdx))} className="text-white/20 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2 text-xs text-white/30 px-1">
                    <span>Set</span><span>Weight (kg)</span><span>Reps</span><span>RPE</span>
                  </div>
                  {ex.sets.map((s, setIdx) => (
                    <div key={setIdx} className="grid grid-cols-4 gap-2">
                      <div className="flex items-center justify-center text-xs text-white/40 bg-white/5 rounded-lg">{setIdx + 1}</div>
                      <input
                        type="number"
                        value={s.weight}
                        onChange={(e) => updateSet(exIdx, setIdx, "weight", Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white text-center outline-none focus:border-indigo-500/50"
                        step="0.5"
                      />
                      <input
                        type="number"
                        value={s.reps}
                        onChange={(e) => updateSet(exIdx, setIdx, "reps", Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white text-center outline-none focus:border-indigo-500/50"
                      />
                      <input
                        type="number"
                        value={s.rpe ?? ""}
                        onChange={(e) => updateSet(exIdx, setIdx, "rpe", Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white text-center outline-none focus:border-indigo-500/50"
                        step="0.5"
                        max="10"
                        placeholder="—"
                      />
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => addSet(exIdx)}><Plus size={12} /> Add Set</Button>
                </div>
              </div>
            ))}
          </div>

          <Textarea label="Workout Notes" value={workoutForm.notes} onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })} rows={2} />
          <div className="flex gap-3">
            <Button onClick={submitWorkout} className="flex-1">Save Workout</Button>
            <Button variant="secondary" onClick={() => setWorkoutModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Body Modal */}
      <Modal isOpen={bodyModalOpen} onClose={() => setBodyModalOpen(false)} title="Log Body Measurement">
        <div className="space-y-4">
          <Input label="Date" type="date" value={bodyForm.date} onChange={(e) => setBodyForm({ ...bodyForm, date: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Weight (kg)" type="number" step="0.1" value={bodyForm.weight} onChange={(e) => setBodyForm({ ...bodyForm, weight: e.target.value })} />
            <Input label="Body Fat %" type="number" step="0.1" value={bodyForm.bodyFatPercentage} onChange={(e) => setBodyForm({ ...bodyForm, bodyFatPercentage: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Chest (cm)" type="number" step="0.5" value={bodyForm.chest} onChange={(e) => setBodyForm({ ...bodyForm, chest: e.target.value })} />
            <Input label="Waist (cm)" type="number" step="0.5" value={bodyForm.waist} onChange={(e) => setBodyForm({ ...bodyForm, waist: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Arms (cm)" type="number" step="0.5" value={bodyForm.arms} onChange={(e) => setBodyForm({ ...bodyForm, arms: e.target.value })} />
            <Input label="Shoulders (cm)" type="number" step="0.5" value={bodyForm.shoulders} onChange={(e) => setBodyForm({ ...bodyForm, shoulders: e.target.value })} />
          </div>
          <Textarea label="Notes" value={bodyForm.notes} onChange={(e) => setBodyForm({ ...bodyForm, notes: e.target.value })} rows={2} />
          <div className="flex gap-3">
            <Button onClick={submitBody} className="flex-1">Save</Button>
            <Button variant="secondary" onClick={() => setBodyModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
