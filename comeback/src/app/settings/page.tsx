"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button, Input } from "@/components/ui/Input";
import { Settings, Check, Flame } from "lucide-react";
import { todayISO } from "@/lib/utils";

interface AppSettings {
  id?: number;
  comebackStartDate: string;
  dailyTargetScreenTime: number;
  scoreWeights: {
    study: number;
    fitness: number;
    deepWork: number;
    habits: number;
    screenTime: number;
    weeklyGoals: number;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    comebackStartDate: todayISO(),
    dailyTargetScreenTime: 180,
    scoreWeights: { study: 30, fitness: 20, deepWork: 15, habits: 15, screenTime: 10, weeklyGoals: 10 },
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const data = await fetch("/api/settings").then((r) => r.json());
    if (data) {
      setSettings({
        ...data,
        scoreWeights: typeof data.scoreWeights === "string" ? JSON.parse(data.scoreWeights) : data.scoreWeights,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const totalWeight = Object.values(settings.scoreWeights).reduce((a, b) => a + b, 0);

  const weightFields: { key: keyof typeof settings.scoreWeights; label: string; color: string }[] = [
    { key: "study", label: "Study", color: "text-indigo-400" },
    { key: "fitness", label: "Fitness", color: "text-green-400" },
    { key: "deepWork", label: "Deep Work", color: "text-amber-400" },
    { key: "habits", label: "Habits", color: "text-purple-400" },
    { key: "screenTime", label: "Screen Time", color: "text-cyan-400" },
    { key: "weeklyGoals", label: "Weekly Goals", color: "text-orange-400" },
  ];

  if (loading) return <div className="flex items-center justify-center h-96 text-white/20">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Settings className="text-white/40" size={22} />
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      {/* Comeback Settings */}
      <Card>
        <CardTitle>Comeback Configuration</CardTitle>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
            <Flame className="text-indigo-400 shrink-0" size={24} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Comeback Start Date</p>
              <p className="text-xs text-white/30 mt-0.5">The day you decided to rebuild yourself</p>
            </div>
            <Input
              type="date"
              value={settings.comebackStartDate}
              onChange={(e) => setSettings({ ...settings, comebackStartDate: e.target.value })}
              className="w-auto"
            />
          </div>

          <div>
            <label className="text-xs text-white/50 font-medium">Daily Screen Time Target (minutes)</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="range"
                min="30"
                max="480"
                step="15"
                value={settings.dailyTargetScreenTime}
                onChange={(e) => setSettings({ ...settings, dailyTargetScreenTime: Number(e.target.value) })}
                className="flex-1 accent-cyan-500"
              />
              <span className="text-white font-semibold w-20 text-right">
                {Math.floor(settings.dailyTargetScreenTime / 60)}h {settings.dailyTargetScreenTime % 60}m
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Score Weights */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <CardTitle className="mb-0">Score Weights</CardTitle>
          <span className={`text-sm font-bold ${totalWeight === 100 ? "text-green-400" : "text-red-400"}`}>
            Total: {totalWeight}%
          </span>
        </div>
        <p className="text-xs text-white/30 mb-4">Adjust how each category contributes to your daily performance score (should total 100%)</p>
        <div className="space-y-4">
          {weightFields.map(({ key, label, color }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${color}`}>{label}</span>
                <span className="text-sm text-white font-bold">{settings.scoreWeights[key]}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={settings.scoreWeights[key]}
                onChange={(e) => setSettings({
                  ...settings,
                  scoreWeights: { ...settings.scoreWeights, [key]: Number(e.target.value) }
                })}
                className="w-full accent-indigo-500"
              />
            </div>
          ))}
        </div>
        {totalWeight !== 100 && (
          <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <p className="text-xs text-red-400">Weights should total 100%. Currently: {totalWeight}%</p>
          </div>
        )}
      </Card>

      {/* About */}
      <Card>
        <CardTitle>About COMEBACK</CardTitle>
        <div className="space-y-2 text-sm text-white/40">
          <p>Your personal command center for tracking academics, GATE preparation, fitness, strength, screen time, habits, deep work, weekly goals, and daily performance.</p>
          <p className="text-white/20 text-xs mt-2">Version 1.0 · Built with Next.js + PostgreSQL</p>
        </div>
        <div className="mt-4 p-3 bg-white/3 rounded-lg">
          <p className="text-xs text-white/30 italic">"Consistency &gt; Motivation"</p>
        </div>
      </Card>

      <Button onClick={handleSave} className="w-full" size="lg">
        {saved ? <><Check size={16} /> Saved!</> : "Save Settings"}
      </Button>
    </div>
  );
}
