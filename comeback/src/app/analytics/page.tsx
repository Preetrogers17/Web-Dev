"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { formatMinutes } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("recharts").then((m) => ({ default: m.LineChart })), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => ({ default: m.BarChart })), { ssr: false });
const AreaChart = dynamic(() => import("recharts").then((m) => ({ default: m.AreaChart })), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => ({ default: m.Line })), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => ({ default: m.Bar })), { ssr: false });
const Area = dynamic(() => import("recharts").then((m) => ({ default: m.Area })), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => ({ default: m.XAxis })), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => ({ default: m.YAxis })), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => ({ default: m.Tooltip })), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => ({ default: m.ResponsiveContainer })), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => ({ default: m.CartesianGrid })), { ssr: false });

type RangeType = "7" | "30" | "90";

interface DashboardScore {
  date: string;
  label: string;
  score: number;
  study: number;
  fitness: number;
  deepWork: number;
  habits: number;
  screenTime: number;
  goals: number;
}

function getDaysArray(days: number): string[] {
  const arr = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push(d.toISOString().split("T")[0]);
  }
  return arr;
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeType>("7");
  const [scoreData, setScoreData] = useState<DashboardScore[]>([]);
  const [studyData, setStudyData] = useState<{ date: string; minutes: number }[]>([]);
  const [deepWorkData, setDeepWorkData] = useState<{ date: string; minutes: number }[]>([]);
  const [screenData, setScreenData] = useState<{ date: string; total: number; target: number }[]>([]);
  const [bodyData, setBodyData] = useState<{ date: string; weight: number | null }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const days = getDaysArray(Number(range));
      const from = days[0];
      const to = days[days.length - 1];

      const [studySessions, deepWorkSessions, screenLogs, bodyMeasurements] = await Promise.all([
        fetch(`/api/study?from=${from}&to=${to}`).then((r) => r.json()),
        fetch(`/api/deepwork?from=${from}&to=${to}`).then((r) => r.json()),
        fetch(`/api/screentime?from=${from}&to=${to}`).then((r) => r.json()),
        fetch("/api/body").then((r) => r.json()),
      ]);

      // Study by day
      const studyByDay = days.map((d) => ({
        date: d.slice(5),
        minutes: (Array.isArray(studySessions) ? studySessions : [])
          .filter((s: { date: string }) => s.date === d)
          .reduce((a: number, s: { durationMinutes: number }) => a + s.durationMinutes, 0),
      }));
      setStudyData(studyByDay);

      // Deep work by day
      const dwByDay = days.map((d) => ({
        date: d.slice(5),
        minutes: (Array.isArray(deepWorkSessions) ? deepWorkSessions : [])
          .filter((s: { date: string }) => s.date === d)
          .reduce((a: number, s: { durationMinutes: number }) => a + s.durationMinutes, 0),
      }));
      setDeepWorkData(dwByDay);

      // Screen time by day
      const screenByDay = days.map((d) => {
        const log = (Array.isArray(screenLogs) ? screenLogs : []).find((l: { date: string }) => l.date === d);
        return {
          date: d.slice(5),
          total: log?.totalMinutes ?? 0,
          target: log?.targetMinutes ?? 180,
        };
      }).filter((d) => d.total > 0);
      setScreenData(screenByDay);

      // Body weight
      const bodyArr = (Array.isArray(bodyMeasurements) ? bodyMeasurements : [])
        .filter((b: { date: string }) => b.date >= from)
        .map((b: { date: string; weight: number | null }) => ({ date: b.date.slice(5), weight: b.weight }));
      setBodyData(bodyArr);

      // Dashboard scores (use 7-day API for score data)
      const dashData = await fetch(`/api/dashboard`).then((r) => r.json());
      if (dashData.sevenDayScores) setScoreData(dashData.sevenDayScores);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const tooltipStyle = { background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", fontSize: 12 };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="text-indigo-400" size={22} />
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
          </div>
          <p className="text-white/30 text-sm">Visualize your progress over time</p>
        </div>
        <div className="flex gap-1 bg-white/3 rounded-lg p-1">
          {(["7", "30", "90"] as RangeType[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${range === r ? "bg-indigo-600 text-white" : "text-white/40 hover:text-white"}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-24 text-white/20">Loading analytics...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Performance Score */}
          <Card className="lg:col-span-2">
            <CardTitle>Performance Score (7 Days)</CardTitle>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreData}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#scoreGrad)" dot={{ fill: "#6366f1", r: 4 }} name="Score" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Study Hours */}
          <Card>
            <CardTitle>Study Minutes (per day)</CardTitle>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studyData}>
                  <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatMinutes(Number(v)), "Study"]} />
                  <Bar dataKey="minutes" fill="rgba(99,102,241,0.6)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Deep Work */}
          <Card>
            <CardTitle>Deep Work Minutes (per day)</CardTitle>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deepWorkData}>
                  <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatMinutes(Number(v)), "Deep Work"]} />
                  <Bar dataKey="minutes" fill="rgba(245,158,11,0.6)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Screen Time */}
          {screenData.length > 0 && (
            <Card>
              <CardTitle>Screen Time vs Target</CardTitle>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={screenData}>
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatMinutes(Number(v)), ""]} />
                    <Bar dataKey="total" fill="rgba(6,182,212,0.6)" radius={[3, 3, 0, 0]} name="Actual" />
                    <Bar dataKey="target" fill="rgba(255,255,255,0.05)" radius={[3, 3, 0, 0]} name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Body Weight */}
          {bodyData.filter((b) => b.weight).length > 0 && (
            <Card>
              <CardTitle>Body Weight (kg)</CardTitle>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bodyData.filter((b) => b.weight)}>
                    <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, "Weight"]} />
                    <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Score breakdown */}
          {scoreData.length > 0 && (
            <Card className="lg:col-span-2">
              <CardTitle>Score Breakdown (7 Days)</CardTitle>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreData}>
                    <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="study" fill="rgba(99,102,241,0.8)" name="Study" stackId="a" />
                    <Bar dataKey="fitness" fill="rgba(34,197,94,0.8)" name="Fitness" stackId="a" />
                    <Bar dataKey="deepWork" fill="rgba(245,158,11,0.8)" name="Deep Work" stackId="a" />
                    <Bar dataKey="habits" fill="rgba(167,139,250,0.8)" name="Habits" stackId="a" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
