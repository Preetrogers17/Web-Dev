"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button, Input } from "@/components/ui/Input";
import { formatMinutes, todayISO, getLast30Days } from "@/lib/utils";
import { Clock, Plus, Trash2, TrendingDown } from "lucide-react";
import dynamic from "next/dynamic";

const BarChart = dynamic(() => import("recharts").then((m) => ({ default: m.BarChart })), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => ({ default: m.Bar })), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => ({ default: m.XAxis })), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => ({ default: m.YAxis })), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => ({ default: m.Tooltip })), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => ({ default: m.ResponsiveContainer })), { ssr: false });

interface ScreenTimeLog {
  id: number;
  date: string;
  totalMinutes: number;
  youtubeMinutes?: number | null;
  instagramMinutes?: number | null;
  whatsappMinutes?: number | null;
  gamingMinutes?: number | null;
  otherMinutes?: number | null;
  targetMinutes: number;
}

const emptyForm = {
  date: todayISO(),
  totalMinutes: 0,
  youtubeMinutes: 0,
  instagramMinutes: 0,
  whatsappMinutes: 0,
  gamingMinutes: 0,
  otherMinutes: 0,
  targetMinutes: 180,
};

export default function ScreenTimePage() {
  const [logs, setLogs] = useState<ScreenTimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const last30 = getLast30Days();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const from = last30[0];
      const to = last30[last30.length - 1];
      const data = await fetch(`/api/screentime?from=${from}&to=${to}`).then((r) => r.json());
      setLogs(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSubmit = async () => {
    const computed = Number(form.youtubeMinutes) + Number(form.instagramMinutes) + Number(form.whatsappMinutes) + Number(form.gamingMinutes) + Number(form.otherMinutes);
    const total = Number(form.totalMinutes) || computed;
    await fetch("/api/screentime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, totalMinutes: total }),
    });
    setShowForm(false);
    fetchLogs();
  };

  const deleteLog = async (id: number) => {
    await fetch(`/api/screentime?id=${id}`, { method: "DELETE" });
    fetchLogs();
  };

  const todayLog = logs.find((l) => l.date === todayISO());
  const avgMinutes = logs.length > 0 ? Math.round(logs.reduce((a, l) => a + l.totalMinutes, 0) / logs.length) : 0;
  const bestDay = logs.length > 0 ? logs.reduce((a, b) => a.totalMinutes < b.totalMinutes ? a : b) : null;
  const streakUnder = (() => {
    let streak = 0;
    for (let i = last30.length - 1; i >= 0; i--) {
      const log = logs.find((l) => l.date === last30[i]);
      if (log && log.totalMinutes <= log.targetMinutes) streak++;
      else if (i < last30.length - 1) break;
    }
    return streak;
  })();

  const chartData = last30.slice(-14).map((d) => {
    const log = logs.find((l) => l.date === d);
    return {
      date: d.slice(5),
      total: log?.totalMinutes ?? 0,
      target: log?.targetMinutes ?? 180,
    };
  });

  const appBreakdown = todayLog ? [
    { name: "YouTube", minutes: todayLog.youtubeMinutes ?? 0, color: "#ef4444" },
    { name: "Instagram", minutes: todayLog.instagramMinutes ?? 0, color: "#ec4899" },
    { name: "WhatsApp", minutes: todayLog.whatsappMinutes ?? 0, color: "#22c55e" },
    { name: "Gaming", minutes: todayLog.gamingMinutes ?? 0, color: "#f59e0b" },
    { name: "Other", minutes: todayLog.otherMinutes ?? 0, color: "#6366f1" },
  ].filter((a) => a.minutes > 0) : [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Screen Time</h1>
          <p className="text-white/30 text-sm mt-0.5">Monitor and control your digital consumption</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyForm, date: todayISO() }); setShowForm(!showForm); }}>
          <Plus size={16} /> Log Today
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="text-center py-4">
          <p className="text-xs text-white/30 mb-1">Today</p>
          <p className={`text-2xl font-bold ${todayLog && todayLog.totalMinutes > todayLog.targetMinutes ? "text-red-400" : "text-cyan-400"}`}>
            {todayLog ? formatMinutes(todayLog.totalMinutes) : "—"}
          </p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-xs text-white/30 mb-1">30-day Avg</p>
          <p className="text-2xl font-bold text-white">{avgMinutes ? formatMinutes(avgMinutes) : "—"}</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-xs text-white/30 mb-1">Best Day</p>
          <p className="text-2xl font-bold text-green-400">{bestDay ? formatMinutes(bestDay.totalMinutes) : "—"}</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-xs text-white/30 mb-1">Under Target Streak</p>
          <div className="flex items-center justify-center gap-1">
            <TrendingDown size={16} className="text-green-400" />
            <p className="text-2xl font-bold text-green-400">{streakUnder}</p>
          </div>
        </Card>
      </div>

      {/* Today's detail */}
      {todayLog && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="mb-0">Today's Breakdown</CardTitle>
            <div className={`text-sm font-bold ${todayLog.totalMinutes > todayLog.targetMinutes ? "text-red-400" : "text-green-400"}`}>
              {formatMinutes(todayLog.totalMinutes)} / {formatMinutes(todayLog.targetMinutes)}
            </div>
          </div>
          <div className="bg-white/5 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all ${todayLog.totalMinutes > todayLog.targetMinutes ? "bg-red-500" : "bg-cyan-500"}`}
              style={{ width: `${Math.min(100, (todayLog.totalMinutes / todayLog.targetMinutes) * 100)}%` }}
            />
          </div>
          {appBreakdown.length > 0 && (
            <div className="space-y-2">
              {appBreakdown.map((app) => (
                <div key={app.name} className="flex items-center gap-3">
                  <span className="text-xs text-white/40 w-20">{app.name}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${(app.minutes / todayLog.totalMinutes) * 100}%`, backgroundColor: app.color }} />
                  </div>
                  <span className="text-xs text-white/50 w-12 text-right">{formatMinutes(app.minutes)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Log Form */}
      {showForm && (
        <Card>
          <CardTitle>Log Screen Time</CardTitle>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              <Input label="Target (mins)" type="number" value={form.targetMinutes} onChange={(e) => setForm({ ...form, targetMinutes: Number(e.target.value) })} />
            </div>
            <p className="text-xs text-white/30">Enter time per app (in minutes) — total will be auto-calculated:</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="YouTube (mins)" type="number" value={form.youtubeMinutes} onChange={(e) => setForm({ ...form, youtubeMinutes: Number(e.target.value) })} />
              <Input label="Instagram (mins)" type="number" value={form.instagramMinutes} onChange={(e) => setForm({ ...form, instagramMinutes: Number(e.target.value) })} />
              <Input label="WhatsApp (mins)" type="number" value={form.whatsappMinutes} onChange={(e) => setForm({ ...form, whatsappMinutes: Number(e.target.value) })} />
              <Input label="Gaming (mins)" type="number" value={form.gamingMinutes} onChange={(e) => setForm({ ...form, gamingMinutes: Number(e.target.value) })} />
              <Input label="Other (mins)" type="number" value={form.otherMinutes} onChange={(e) => setForm({ ...form, otherMinutes: Number(e.target.value) })} />
              <Input label="Or enter Total directly" type="number" value={form.totalMinutes} onChange={(e) => setForm({ ...form, totalMinutes: Number(e.target.value) })} />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSubmit} className="flex-1">Save</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Chart */}
      <Card>
        <CardTitle>14-Day Trend</CardTitle>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", fontSize: 11 }}
                formatter={(v) => [`${formatMinutes(Number(v))}`, ""]}
              />
              <Bar dataKey="total" fill="rgba(6, 182, 212, 0.6)" radius={[4, 4, 0, 0]} name="Actual" />
              <Bar dataKey="target" fill="rgba(255,255,255,0.05)" radius={[4, 4, 0, 0]} name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* History */}
      <div className="space-y-2">
        <h2 className="text-xs text-white/30 uppercase tracking-widest">History</h2>
        {loading ? (
          <div className="text-center py-8 text-white/20">Loading...</div>
        ) : logs.length === 0 ? (
          <Card className="text-center py-8">
            <Clock className="mx-auto mb-3 text-white/10" size={32} />
            <p className="text-white/30">No screen time logs yet</p>
          </Card>
        ) : (
          [...logs].reverse().map((l) => (
            <div key={l.id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5">
              <div>
                <p className="text-sm text-white">{l.date}</p>
                <p className="text-xs text-white/30">Target: {formatMinutes(l.targetMinutes)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${l.totalMinutes > l.targetMinutes ? "text-red-400" : "text-green-400"}`}>
                  {formatMinutes(l.totalMinutes)}
                </span>
                <button onClick={() => deleteLog(l.id)} className="text-white/15 hover:text-red-400"><Trash2 size={13} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
