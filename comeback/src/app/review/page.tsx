"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button, Textarea, Input } from "@/components/ui/Input";
import { todayISO, formatDate } from "@/lib/utils";
import { BookOpen, Search, Check, Star } from "lucide-react";

interface DailyReview {
  id?: number;
  date: string;
  accomplishments?: string | null;
  wentWrong?: string | null;
  improvements?: string | null;
  biggestWin?: string | null;
  biggestDistraction?: string | null;
  overallScore?: number | null;
}

const questions = [
  { key: "accomplishments", label: "What did I accomplish today?", placeholder: "List your wins, big or small...", rows: 4 },
  { key: "wentWrong", label: "What went wrong?", placeholder: "Be honest with yourself...", rows: 3 },
  { key: "improvements", label: "What will I improve tomorrow?", placeholder: "Specific actions...", rows: 3 },
  { key: "biggestWin", label: "Today's biggest win", placeholder: "The one thing that made today count...", rows: 2 },
  { key: "biggestDistraction", label: "Today's biggest distraction", placeholder: "What pulled you away from your goals...", rows: 2 },
];

export default function ReviewPage() {
  const [tab, setTab] = useState<"write" | "history">("write");
  const [date, setDate] = useState(todayISO());
  const [form, setForm] = useState<Omit<DailyReview, "id" | "date">>({});
  const [saved, setSaved] = useState(false);
  const [reviews, setReviews] = useState<DailyReview[]>([]);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  const fetchReview = useCallback(async () => {
    const data = await fetch(`/api/reviews?date=${date}`).then((r) => r.json());
    if (data) {
      setForm({
        accomplishments: data.accomplishments,
        wentWrong: data.wentWrong,
        improvements: data.improvements,
        biggestWin: data.biggestWin,
        biggestDistraction: data.biggestDistraction,
        overallScore: data.overallScore,
      });
    } else {
      setForm({});
    }
  }, [date]);

  const fetchHistory = useCallback(async () => {
    const url = search ? `/api/reviews?search=${encodeURIComponent(search)}` : "/api/reviews";
    const data = await fetch(url).then((r) => r.json());
    setReviews(Array.isArray(data) ? data : []);
  }, [search]);

  useEffect(() => {
    if (tab === "write") fetchReview();
    else fetchHistory();
  }, [tab, fetchReview, fetchHistory]);

  const handleSave = async () => {
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, ...form }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Daily Review</h1>
        <p className="text-white/30 text-sm mt-0.5">Reflect, analyze, and improve</p>
      </div>

      <div className="flex gap-1 bg-white/3 rounded-xl p-1">
        <button onClick={() => setTab("write")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === "write" ? "bg-indigo-600 text-white" : "text-white/40 hover:text-white"}`}>Write Review</button>
        <button onClick={() => setTab("history")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === "history" ? "bg-indigo-600 text-white" : "text-white/40 hover:text-white"}`}>History</button>
      </div>

      {tab === "write" && (
        <>
          <div className="flex items-center gap-3">
            <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSaved(false); }} className="w-auto" />
            <p className="text-white/40 text-sm">{formatDate(date)}</p>
          </div>

          <div className="space-y-4">
            {questions.map((q) => (
              <Card key={q.key}>
                <label className="block text-sm font-semibold text-white mb-3">{q.label}</label>
                <textarea
                  value={(form[q.key as keyof typeof form] as string) ?? ""}
                  onChange={(e) => setForm({ ...form, [q.key]: e.target.value })}
                  placeholder={q.placeholder}
                  rows={q.rows}
                  className="w-full bg-white/3 border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/15 outline-none focus:border-indigo-500/40 focus:bg-white/5 transition-all resize-none"
                />
              </Card>
            ))}

            <Card>
              <label className="block text-sm font-semibold text-white mb-3">Today's Score (0–100)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.overallScore ?? 0}
                  onChange={(e) => setForm({ ...form, overallScore: Number(e.target.value) })}
                  className="flex-1 accent-indigo-500"
                />
                <div className="text-2xl font-bold text-white w-12 text-center">{form.overallScore ?? 0}</div>
              </div>
            </Card>
          </div>

          <Button onClick={handleSave} className="w-full" size="lg">
            {saved ? <><Check size={16} /> Saved!</> : "Save Review"}
          </Button>
        </>
      )}

      {tab === "history" && (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reviews..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/40"
              />
            </div>
            <Button variant="secondary" onClick={fetchHistory}>Search</Button>
          </div>

          {reviews.length === 0 ? (
            <Card className="text-center py-12">
              <BookOpen className="mx-auto mb-3 text-white/10" size={40} />
              <p className="text-white/30">No reviews found</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <Card
                  key={r.id}
                  className="cursor-pointer hover:border-white/10"
                  onClick={() => { setDate(r.date); setTab("write"); }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-semibold text-white">{formatDate(r.date)}</span>
                    {r.overallScore !== null && r.overallScore !== undefined && (
                      <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                        <Star size={12} /> {r.overallScore}
                      </div>
                    )}
                  </div>
                  {r.biggestWin && (
                    <p className="text-sm text-white/60 mb-1"><span className="text-white/30">Win: </span>{r.biggestWin}</p>
                  )}
                  {r.accomplishments && (
                    <p className="text-xs text-white/30 line-clamp-2">{r.accomplishments}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
