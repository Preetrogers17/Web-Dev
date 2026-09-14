"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatMinutes, todayISO } from "@/lib/utils";
import { BookOpen, Plus, Trash2, Clock, CheckCircle } from "lucide-react";

interface StudySession {
  id: number;
  date: string;
  subject: string;
  topic: string;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes: number;
  studyMethod: string;
  videosPlanned?: number | null;
  videosCompleted?: number | null;
  questionsPlanned?: number | null;
  questionsSolved?: number | null;
  notes?: string | null;
}

const SUBJECTS = [
  "Engineering Mathematics", "Discrete Mathematics", "Data Structures", "Algorithms",
  "DBMS", "Operating Systems", "Computer Networks", "COA", "TOC", "Compiler Design",
  "Digital Logic", "General Aptitude", "Other"
];

const METHODS = ["Lecture Series", "One Shot", "Revision", "Practice", "PYQs", "Mock Test", "Notes"];

const emptyForm = {
  date: todayISO(),
  subject: "DBMS",
  topic: "",
  startTime: "",
  endTime: "",
  durationMinutes: 60,
  studyMethod: "Lecture Series",
  videosPlanned: 0,
  videosCompleted: 0,
  questionsPlanned: 0,
  questionsSolved: 0,
  notes: "",
};

export default function StudyPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filterDate, setFilterDate] = useState(todayISO());

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetch(`/api/study?date=${filterDate}`).then((r) => r.json());
      setSessions(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleSubmit = async () => {
    const payload = {
      ...form,
      durationMinutes: Number(form.durationMinutes),
      videosPlanned: Number(form.videosPlanned),
      videosCompleted: Number(form.videosCompleted),
      questionsPlanned: Number(form.questionsPlanned),
      questionsSolved: Number(form.questionsSolved),
    };
    await fetch("/api/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setModalOpen(false);
    setForm(emptyForm);
    fetchSessions();
  };

  const deleteSession = async (id: number) => {
    if (!confirm("Delete this session?")) return;
    await fetch(`/api/study?id=${id}`, { method: "DELETE" });
    fetchSessions();
  };

  const totalMinutes = sessions.reduce((a, s) => a + s.durationMinutes, 0);
  const completionRate = (s: StudySession) => {
    const vRate = s.videosPlanned && s.videosPlanned > 0 ? (s.videosCompleted ?? 0) / s.videosPlanned : null;
    const qRate = s.questionsPlanned && s.questionsPlanned > 0 ? (s.questionsSolved ?? 0) / s.questionsPlanned : null;
    if (vRate !== null && qRate !== null) return Math.round(((vRate + qRate) / 2) * 100);
    if (vRate !== null) return Math.round(vRate * 100);
    if (qRate !== null) return Math.round(qRate * 100);
    return null;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Study Tracker</h1>
          <p className="text-white/30 text-sm mt-0.5">Log and track every study session</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyForm, date: filterDate }); setModalOpen(true); }}>
          <Plus size={16} /> Add Session
        </Button>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3">
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-auto"
        />
        <div className="flex gap-4 text-sm">
          <span className="text-white/30">Sessions: <strong className="text-white">{sessions.length}</strong></span>
          <span className="text-white/30">Total: <strong className="text-indigo-400">{formatMinutes(totalMinutes)}</strong></span>
        </div>
      </div>

      {/* Sessions */}
      {loading ? (
        <div className="text-center py-12 text-white/20">Loading...</div>
      ) : sessions.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="mx-auto mb-3 text-white/10" size={40} />
          <p className="text-white/30">No sessions on this date</p>
          <Button className="mt-4" onClick={() => { setForm({ ...emptyForm, date: filterDate }); setModalOpen(true); }}>
            <Plus size={14} /> Add Session
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const rate = completionRate(s);
            return (
              <Card key={s.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{s.subject}</span>
                      <span className="text-white/20">→</span>
                      <span className="text-sm font-semibold text-white">{s.topic}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-white/40 mt-2">
                      <span className="flex items-center gap-1"><Clock size={11} />{formatMinutes(s.durationMinutes)}</span>
                      <span className="px-2 py-0.5 bg-white/5 rounded">{s.studyMethod}</span>
                      {s.startTime && <span>{s.startTime} – {s.endTime}</span>}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                      {(s.videosPlanned ?? 0) > 0 && (
                        <div>
                          <span className="text-white/30">Videos: </span>
                          <span className={`font-medium ${(s.videosCompleted ?? 0) >= (s.videosPlanned ?? 0) ? "text-green-400" : "text-white"}`}>
                            {s.videosCompleted}/{s.videosPlanned}
                          </span>
                        </div>
                      )}
                      {(s.questionsPlanned ?? 0) > 0 && (
                        <div>
                          <span className="text-white/30">Questions: </span>
                          <span className={`font-medium ${(s.questionsSolved ?? 0) >= (s.questionsPlanned ?? 0) ? "text-green-400" : "text-white"}`}>
                            {s.questionsSolved}/{s.questionsPlanned}
                          </span>
                        </div>
                      )}
                      {rate !== null && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-white/5 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${rate}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${rate >= 80 ? "text-green-400" : rate >= 50 ? "text-amber-400" : "text-red-400"}`}>{rate}%</span>
                        </div>
                      )}
                    </div>
                    {s.notes && <p className="text-xs text-white/25 mt-2 italic">{s.notes}</p>}
                  </div>
                  <button onClick={() => deleteSession(s.id)} className="text-white/15 hover:text-red-400 transition-colors ml-2">
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Study Session" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Select
              label="Subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              options={SUBJECTS.map((s) => ({ value: s, label: s }))}
            />
          </div>
          <Input label="Topic" placeholder="e.g. Transactions, Normalization" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Start Time" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input label="End Time" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            <Input label="Duration (mins)" type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
          </div>
          <Select
            label="Study Method"
            value={form.studyMethod}
            onChange={(e) => setForm({ ...form, studyMethod: e.target.value })}
            options={METHODS.map((m) => ({ value: m, label: m }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Videos Planned" type="number" value={form.videosPlanned} onChange={(e) => setForm({ ...form, videosPlanned: Number(e.target.value) })} />
            <Input label="Videos Completed" type="number" value={form.videosCompleted} onChange={(e) => setForm({ ...form, videosCompleted: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Questions Planned" type="number" value={form.questionsPlanned} onChange={(e) => setForm({ ...form, questionsPlanned: Number(e.target.value) })} />
            <Input label="Questions Solved" type="number" value={form.questionsSolved} onChange={(e) => setForm({ ...form, questionsSolved: Number(e.target.value) })} />
          </div>
          <Textarea label="Notes" placeholder="Key takeaways, difficulties..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} className="flex-1">Save Session</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
