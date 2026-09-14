"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatMinutes, todayISO, getLast7Days } from "@/lib/utils";
import { Zap, Plus, Trash2, Play, Pause, RotateCcw, Check } from "lucide-react";

interface DeepWorkSession {
  id: number;
  date: string;
  durationMinutes: number;
  subject?: string | null;
  category?: string | null;
  notes?: string | null;
  startTime?: string | null;
}

const PRESET_DURATIONS = [25, 50, 90];
const CATEGORIES = ["GATE Study", "Deep Work", "Project", "Reading", "Research", "Writing", "Coding", "Other"];

export default function DeepWorkPage() {
  const [sessions, setSessions] = useState<DeepWorkSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    date: todayISO(),
    durationMinutes: 50,
    subject: "",
    category: "GATE Study",
    notes: "",
    startTime: "",
    endTime: "",
  });

  // Timer
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(50 * 60);
  const [timerDuration, setTimerDuration] = useState(50);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const [timerSubject, setTimerSubject] = useState("");
  const [timerCategory, setTimerCategory] = useState("GATE Study");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const last7 = getLast7Days();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const from = last7[0];
      const to = last7[last7.length - 1];
      const data = await fetch(`/api/deepwork?from=${from}&to=${to}`).then((r) => r.json());
      setSessions(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((s) => {
          if (s <= 1) {
            setTimerActive(false);
            setTimerCompleted(true);
            clearInterval(intervalRef.current!);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerActive]);

  const startTimer = (mins: number) => {
    setTimerDuration(mins);
    setTimerSeconds(mins * 60);
    setTimerActive(true);
    setTimerCompleted(false);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(timerDuration * 60);
    setTimerCompleted(false);
  };

  const saveTimerSession = async () => {
    const elapsed = timerDuration - Math.floor(timerSeconds / 60);
    const actualMinutes = Math.max(1, elapsed);
    await fetch("/api/deepwork", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: todayISO(),
        durationMinutes: actualMinutes,
        subject: timerSubject || undefined,
        category: timerCategory,
        startTime: new Date(Date.now() - actualMinutes * 60000).toTimeString().slice(0, 5),
        endTime: new Date().toTimeString().slice(0, 5),
      }),
    });
    setTimerCompleted(false);
    resetTimer();
    fetchSessions();
  };

  const submitManual = async () => {
    await fetch("/api/deepwork", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, durationMinutes: Number(form.durationMinutes) }),
    });
    setModalOpen(false);
    fetchSessions();
  };

  const deleteSession = async (id: number) => {
    await fetch(`/api/deepwork?id=${id}`, { method: "DELETE" });
    fetchSessions();
  };

  const timerProgress = 1 - timerSeconds / (timerDuration * 60);
  const timerDisplay = `${Math.floor(timerSeconds / 60).toString().padStart(2, "0")}:${(timerSeconds % 60).toString().padStart(2, "0")}`;

  const todaySessions = sessions.filter((s) => s.date === todayISO());
  const todayMinutes = todaySessions.reduce((a, s) => a + s.durationMinutes, 0);
  const weekMinutes = sessions.reduce((a, s) => a + s.durationMinutes, 0);

  const dayTotals = last7.map((d) => ({
    date: d,
    label: new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" }),
    minutes: sessions.filter((s) => s.date === d).reduce((a, s) => a + s.durationMinutes, 0),
  }));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Deep Work</h1>
          <p className="text-white/30 text-sm mt-0.5">Track focused work sessions</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Log Session</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-4">
          <p className="text-xs text-white/30 mb-1">Today</p>
          <p className="text-2xl font-bold text-amber-400">{formatMinutes(todayMinutes)}</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-xs text-white/30 mb-1">This Week</p>
          <p className="text-2xl font-bold text-white">{formatMinutes(weekMinutes)}</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-xs text-white/30 mb-1">Sessions</p>
          <p className="text-2xl font-bold text-white">{sessions.length}</p>
        </Card>
      </div>

      {/* Timer */}
      <Card>
        <CardTitle>Focus Timer</CardTitle>
        <div className="flex flex-col items-center gap-4">
          {/* Circular Timer */}
          <div className="relative">
            <svg width="140" height="140" className="-rotate-90">
              <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle
                cx="70" cy="70" r="60" fill="none" stroke="#f59e0b" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - timerProgress)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-mono font-bold text-white">{timerDisplay}</span>
              <span className="text-xs text-white/30">{timerDuration}m session</span>
            </div>
          </div>

          {/* Subject input */}
          <div className="w-full max-w-sm space-y-2">
            <Input placeholder="Subject / Project" value={timerSubject} onChange={(e) => setTimerSubject(e.target.value)} />
            <Select value={timerCategory} onChange={(e) => setTimerCategory(e.target.value)} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </div>

          {/* Preset durations */}
          <div className="flex gap-2">
            {PRESET_DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => { if (!timerActive) { setTimerDuration(d); setTimerSeconds(d * 60); } }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${timerDuration === d ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"}`}
              >
                {d}m
              </button>
            ))}
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={timerActive ? timerDuration : timerDuration}
                onChange={(e) => { if (!timerActive) { const v = Number(e.target.value); setTimerDuration(v); setTimerSeconds(v * 60); } }}
                className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white text-center outline-none"
                min="1"
              />
              <span className="text-white/30 text-sm">m</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!timerCompleted ? (
              <>
                <Button
                  onClick={() => timerActive ? setTimerActive(false) : startTimer(timerDuration)}
                  className="px-8"
                >
                  {timerActive ? <><Pause size={16} /> Pause</> : <><Play size={16} /> {timerSeconds === timerDuration * 60 ? "Start" : "Resume"}</>}
                </Button>
                <Button variant="ghost" onClick={resetTimer}><RotateCcw size={16} /></Button>
              </>
            ) : (
              <div className="flex gap-3 items-center">
                <div className="text-green-400 text-sm font-medium flex items-center gap-2"><Check size={16} /> Session Complete!</div>
                <Button onClick={saveTimerSession}>Save Session</Button>
                <Button variant="ghost" onClick={resetTimer}><RotateCcw size={16} /></Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 7-day bar chart */}
      <Card>
        <CardTitle>7-Day Deep Work</CardTitle>
        <div className="flex items-end gap-2 h-24">
          {dayTotals.map((d) => {
            const maxMinutes = Math.max(...dayTotals.map((x) => x.minutes), 60);
            const height = d.minutes > 0 ? Math.max(8, (d.minutes / maxMinutes) * 80) : 4;
            const isToday = d.date === todayISO();
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-white/30">{d.minutes > 0 ? formatMinutes(d.minutes) : ""}</span>
                <div className="w-full flex items-end" style={{ height: 80 }}>
                  <div
                    className={`w-full rounded-t transition-all ${isToday ? "bg-amber-500" : "bg-white/10"}`}
                    style={{ height }}
                  />
                </div>
                <span className={`text-xs ${isToday ? "text-amber-400" : "text-white/30"}`}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Session History */}
      <div className="space-y-2">
        <h2 className="text-xs text-white/30 uppercase tracking-widest">Recent Sessions</h2>
        {loading ? (
          <div className="text-center py-8 text-white/20">Loading...</div>
        ) : sessions.length === 0 ? (
          <Card className="text-center py-8">
            <Zap className="mx-auto mb-3 text-white/10" size={32} />
            <p className="text-white/30">No sessions logged yet</p>
          </Card>
        ) : (
          sessions.slice().reverse().map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5">
              <div>
                <p className="text-sm font-medium text-white">{s.subject || "Deep Work"}</p>
                <p className="text-xs text-white/30">{s.date} · {s.category}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber-400 font-semibold">{formatMinutes(s.durationMinutes)}</span>
                <button onClick={() => deleteSession(s.id)} className="text-white/15 hover:text-red-400"><Trash2 size={13} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual log modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log Deep Work Session">
        <div className="space-y-4">
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Duration (minutes)" type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
          <div className="flex gap-2">
            {PRESET_DURATIONS.map((d) => (
              <button key={d} onClick={() => setForm({ ...form, durationMinutes: d })}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${form.durationMinutes === d ? "bg-amber-500/20 border-amber-500/30 text-amber-300" : "bg-white/5 border-white/10 text-white/40"}`}>
                {d}m
              </button>
            ))}
          </div>
          <Input label="Subject / Project" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. DBMS Transactions" />
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Time" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input label="End Time" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          <div className="flex gap-3">
            <Button onClick={submitManual} className="flex-1">Save Session</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
