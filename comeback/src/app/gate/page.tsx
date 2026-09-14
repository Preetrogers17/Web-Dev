"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Brain, Plus, ChevronDown, ChevronRight, Trash2, Star } from "lucide-react";

interface GateTopic {
  id: number;
  chapterId: number;
  subjectId: number;
  name: string;
  totalVideos?: number | null;
  completedVideos?: number | null;
  estimatedHours?: number | null;
  pyqsSolved?: number | null;
  revisionCount?: number | null;
  confidenceLevel?: number | null;
  isCompleted: boolean;
  lastStudied?: string | null;
}

interface GateChapter {
  id: number;
  subjectId: number;
  name: string;
  topics: GateTopic[];
}

interface GateSubject {
  id: number;
  name: string;
  chapters: GateChapter[];
}

const DEFAULT_SUBJECTS = [
  "Engineering Mathematics", "Discrete Mathematics", "Data Structures", "Algorithms",
  "DBMS", "Operating Systems", "Computer Networks", "COA", "TOC", "Compiler Design",
  "Digital Logic", "General Aptitude"
];

function subjectProgress(subject: GateSubject): number {
  const all = subject.chapters.flatMap((c) => c.topics);
  if (all.length === 0) return 0;
  const done = all.filter((t) => t.isCompleted || ((t.totalVideos ?? 0) > 0 && (t.completedVideos ?? 0) >= (t.totalVideos ?? 1))).length;
  return Math.round((done / all.length) * 100);
}

export default function GatePage() {
  const [subjects, setSubjects] = useState<GateSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});

  // Modals
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [addChapterOpen, setAddChapterOpen] = useState(false);
  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const [editTopicOpen, setEditTopicOpen] = useState(false);

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [editingTopic, setEditingTopic] = useState<GateTopic | null>(null);

  const [newSubjectName, setNewSubjectName] = useState("");
  const [newChapterName, setNewChapterName] = useState("");
  const [topicForm, setTopicForm] = useState({
    name: "", totalVideos: 0, completedVideos: 0, estimatedHours: 0,
    pyqsSolved: 0, revisionCount: 0, confidenceLevel: 0, isCompleted: false, lastStudied: ""
  });

  const fetch_subjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetch("/api/gate/subjects").then((r) => r.json());
      setSubjects(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_subjects(); }, [fetch_subjects]);

  const addSubject = async () => {
    if (!newSubjectName) return;
    await fetch("/api/gate/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSubjectName, order: subjects.length }),
    });
    setNewSubjectName("");
    setAddSubjectOpen(false);
    fetch_subjects();
  };

  const addChapter = async () => {
    if (!newChapterName || !selectedSubjectId) return;
    await fetch("/api/gate/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newChapterName, subjectId: selectedSubjectId, order: 0 }),
    });
    setNewChapterName("");
    setAddChapterOpen(false);
    fetch_subjects();
  };

  const addTopic = async () => {
    if (!topicForm.name || !selectedChapterId || !selectedSubjectId) return;
    await fetch("/api/gate/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...topicForm, chapterId: selectedChapterId, subjectId: selectedSubjectId }),
    });
    setTopicForm({ name: "", totalVideos: 0, completedVideos: 0, estimatedHours: 0, pyqsSolved: 0, revisionCount: 0, confidenceLevel: 0, isCompleted: false, lastStudied: "" });
    setAddTopicOpen(false);
    fetch_subjects();
  };

  const updateTopic = async () => {
    if (!editingTopic) return;
    await fetch("/api/gate/topics", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...topicForm, id: editingTopic.id }),
    });
    setEditTopicOpen(false);
    setEditingTopic(null);
    fetch_subjects();
  };

  const deleteTopic = async (id: number) => {
    if (!confirm("Delete topic?")) return;
    await fetch(`/api/gate/topics?id=${id}`, { method: "DELETE" });
    fetch_subjects();
  };

  const deleteChapter = async (id: number) => {
    if (!confirm("Delete chapter and all its topics?")) return;
    await fetch(`/api/gate/chapters?id=${id}`, { method: "DELETE" });
    fetch_subjects();
  };

  const deleteSubject = async (id: number) => {
    if (!confirm("Delete subject and all its content?")) return;
    await fetch(`/api/gate/subjects?id=${id}`, { method: "DELETE" });
    fetch_subjects();
  };

  const openEditTopic = (topic: GateTopic) => {
    setEditingTopic(topic);
    setTopicForm({
      name: topic.name,
      totalVideos: topic.totalVideos ?? 0,
      completedVideos: topic.completedVideos ?? 0,
      estimatedHours: topic.estimatedHours ?? 0,
      pyqsSolved: topic.pyqsSolved ?? 0,
      revisionCount: topic.revisionCount ?? 0,
      confidenceLevel: topic.confidenceLevel ?? 0,
      isCompleted: topic.isCompleted,
      lastStudied: topic.lastStudied ?? "",
    });
    setEditTopicOpen(true);
  };

  const seedSubjects = async () => {
    for (let i = 0; i < DEFAULT_SUBJECTS.length; i++) {
      await fetch("/api/gate/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: DEFAULT_SUBJECTS[i], order: i }),
      });
    }
    fetch_subjects();
  };

  const allTopics = subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics));
  const completedTopics = allTopics.filter((t) => t.isCompleted || ((t.totalVideos ?? 0) > 0 && (t.completedVideos ?? 0) >= (t.totalVideos ?? 1))).length;
  const overallProgress = allTopics.length > 0 ? Math.round((completedTopics / allTopics.length) * 100) : 0;

  const TopicForm = () => (
    <div className="space-y-4">
      <Input label="Topic Name" value={topicForm.name} onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })} placeholder="e.g. Transactions" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Total Videos" type="number" value={topicForm.totalVideos} onChange={(e) => setTopicForm({ ...topicForm, totalVideos: Number(e.target.value) })} />
        <Input label="Completed Videos" type="number" value={topicForm.completedVideos} onChange={(e) => setTopicForm({ ...topicForm, completedVideos: Number(e.target.value) })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Estimated Hours" type="number" step="0.5" value={topicForm.estimatedHours} onChange={(e) => setTopicForm({ ...topicForm, estimatedHours: Number(e.target.value) })} />
        <Input label="PYQs Solved" type="number" value={topicForm.pyqsSolved} onChange={(e) => setTopicForm({ ...topicForm, pyqsSolved: Number(e.target.value) })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Revision Count" type="number" value={topicForm.revisionCount} onChange={(e) => setTopicForm({ ...topicForm, revisionCount: Number(e.target.value) })} />
        <Select
          label="Confidence (1-5)"
          value={String(topicForm.confidenceLevel)}
          onChange={(e) => setTopicForm({ ...topicForm, confidenceLevel: Number(e.target.value) })}
          options={[0,1,2,3,4,5].map((n) => ({ value: String(n), label: n === 0 ? "Not rated" : `${n}/5` }))}
        />
      </div>
      <Input label="Last Studied" type="date" value={topicForm.lastStudied} onChange={(e) => setTopicForm({ ...topicForm, lastStudied: e.target.value })} />
      <div className="flex items-center gap-2">
        <input type="checkbox" id="completed" checked={topicForm.isCompleted} onChange={(e) => setTopicForm({ ...topicForm, isCompleted: e.target.checked })} className="w-4 h-4 accent-indigo-500" />
        <label htmlFor="completed" className="text-sm text-white/70">Mark as Completed</label>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="text-indigo-400" size={22} />
            <h1 className="text-2xl font-bold text-white">GATE 2027</h1>
          </div>
          <p className="text-white/30 text-sm">Track your GATE preparation systematically</p>
        </div>
        <Button onClick={() => setAddSubjectOpen(true)}><Plus size={16} /> Add Subject</Button>
      </div>

      {/* Overall Progress */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white">GATE Overall Progress</span>
          <span className="text-2xl font-black text-indigo-400">{overallProgress}%</span>
        </div>
        <div className="bg-white/5 rounded-full h-3">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-500 h-3 rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
        </div>
        <p className="text-xs text-white/30 mt-2">{completedTopics} / {allTopics.length} topics completed</p>
      </Card>

      {/* Subject Breakdown */}
      {subjects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {subjects.map((s) => {
            const prog = subjectProgress(s);
            return (
              <div key={s.id} className="p-3 bg-white/3 rounded-lg border border-white/5">
                <p className="text-xs text-white/50 mb-1 truncate">{s.name}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/5 rounded-full h-1.5">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${prog}%` }} />
                  </div>
                  <span className="text-xs font-bold text-indigo-400">{prog}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && subjects.length === 0 && (
        <Card className="text-center py-12">
          <Brain className="mx-auto mb-3 text-white/10" size={40} />
          <p className="text-white/30 mb-4">No subjects added yet</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={seedSubjects}>Load GATE Syllabus</Button>
            <Button variant="secondary" onClick={() => setAddSubjectOpen(true)}>Add Custom</Button>
          </div>
        </Card>
      )}

      {/* Subjects */}
      {subjects.map((subject) => {
        const prog = subjectProgress(subject);
        const isExpanded = expanded[subject.id] ?? false;
        return (
          <Card key={subject.id} className="p-0 overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-white/2 transition-colors"
              onClick={() => setExpanded({ ...expanded, [subject.id]: !isExpanded })}
            >
              <div className="flex items-center gap-3 flex-1">
                {isExpanded ? <ChevronDown size={16} className="text-white/40" /> : <ChevronRight size={16} className="text-white/40" />}
                <div className="text-left flex-1">
                  <p className="font-semibold text-white">{subject.name}</p>
                  <p className="text-xs text-white/30">{subject.chapters.length} chapters · {subject.chapters.flatMap(c => c.topics).length} topics</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-white/5 rounded-full h-1.5">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${prog}%` }} />
                  </div>
                  <span className="text-sm font-bold text-indigo-400 w-10 text-right">{prog}%</span>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedSubjectId(subject.id); setAddChapterOpen(true); }}
                  className="p-1.5 text-white/30 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSubject(subject.id); }}
                  className="p-1.5 text-white/20 hover:text-red-400 rounded-lg hover:bg-white/5"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-white/5">
                {subject.chapters.map((chapter) => {
                  const chExpanded = expandedChapters[chapter.id] ?? false;
                  const chTopics = chapter.topics;
                  const chDone = chTopics.filter((t) => t.isCompleted || ((t.totalVideos ?? 0) > 0 && (t.completedVideos ?? 0) >= (t.totalVideos ?? 1))).length;
                  const chProg = chTopics.length > 0 ? Math.round((chDone / chTopics.length) * 100) : 0;

                  return (
                    <div key={chapter.id} className="border-b border-white/3 last:border-0">
                      <button
                        className="w-full flex items-center gap-3 px-6 py-3 hover:bg-white/2 text-left"
                        onClick={() => setExpandedChapters({ ...expandedChapters, [chapter.id]: !chExpanded })}
                      >
                        {chExpanded ? <ChevronDown size={13} className="text-white/30" /> : <ChevronRight size={13} className="text-white/30" />}
                        <span className="text-sm text-white/70 flex-1">{chapter.name}</span>
                        <span className="text-xs text-white/30">{chDone}/{chTopics.length}</span>
                        <div className="w-16 bg-white/5 rounded-full h-1 ml-2">
                          <div className="bg-indigo-400 h-1 rounded-full" style={{ width: `${chProg}%` }} />
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedSubjectId(subject.id); setSelectedChapterId(chapter.id); setTopicForm({ name: "", totalVideos: 0, completedVideos: 0, estimatedHours: 0, pyqsSolved: 0, revisionCount: 0, confidenceLevel: 0, isCompleted: false, lastStudied: "" }); setAddTopicOpen(true); }}
                          className="p-1 text-white/20 hover:text-white ml-2 rounded"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteChapter(chapter.id); }}
                          className="p-1 text-white/15 hover:text-red-400 ml-1 rounded"
                        >
                          <Trash2 size={12} />
                        </button>
                      </button>

                      {chExpanded && chapter.topics.map((topic) => {
                        const videoProgress = (topic.totalVideos ?? 0) > 0 ? Math.round(((topic.completedVideos ?? 0) / (topic.totalVideos ?? 1)) * 100) : null;
                        const isDone = topic.isCompleted || ((topic.totalVideos ?? 0) > 0 && (topic.completedVideos ?? 0) >= (topic.totalVideos ?? 1));
                        return (
                          <div
                            key={topic.id}
                            className={`px-10 py-3 border-b border-white/2 last:border-0 ${isDone ? "bg-green-500/5" : "hover:bg-white/1"} cursor-pointer transition-colors`}
                            onClick={() => openEditTopic(topic)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${isDone ? "bg-green-500" : "bg-white/10"}`} />
                                  <span className={`text-sm ${isDone ? "text-green-300" : "text-white/70"}`}>{topic.name}</span>
                                  {topic.confidenceLevel && topic.confidenceLevel > 0 && (
                                    <div className="flex gap-0.5">
                                      {[1,2,3,4,5].map((n) => (
                                        <Star key={n} size={10} className={n <= (topic.confidenceLevel ?? 0) ? "text-amber-400" : "text-white/10"} fill={n <= (topic.confidenceLevel ?? 0) ? "currentColor" : "none"} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-3 mt-1 ml-4 text-xs text-white/30">
                                  {(topic.totalVideos ?? 0) > 0 && <span>Videos: {topic.completedVideos}/{topic.totalVideos}</span>}
                                  {(topic.pyqsSolved ?? 0) > 0 && <span>PYQs: {topic.pyqsSolved}</span>}
                                  {(topic.revisionCount ?? 0) > 0 && <span>Revisions: {topic.revisionCount}</span>}
                                  {topic.lastStudied && <span>Last: {topic.lastStudied}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {videoProgress !== null && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-12 bg-white/5 rounded-full h-1">
                                      <div className={`h-1 rounded-full ${videoProgress >= 100 ? "bg-green-500" : "bg-indigo-500"}`} style={{ width: `${Math.min(100, videoProgress)}%` }} />
                                    </div>
                                    <span className="text-xs text-white/30">{videoProgress}%</span>
                                  </div>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); deleteTopic(topic.id); }} className="p-1 text-white/15 hover:text-red-400">
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}

      {/* Modals */}
      <Modal isOpen={addSubjectOpen} onClose={() => setAddSubjectOpen(false)} title="Add Subject">
        <div className="space-y-4">
          <Select
            label="Subject Name"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            options={[{ value: "", label: "Select or type below" }, ...DEFAULT_SUBJECTS.map((s) => ({ value: s, label: s })), { value: "Other", label: "Other" }]}
          />
          <Input label="Or type custom name" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="Custom subject name" />
          <div className="flex gap-3">
            <Button onClick={addSubject} className="flex-1">Add Subject</Button>
            <Button variant="secondary" onClick={() => setAddSubjectOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={addChapterOpen} onClose={() => setAddChapterOpen(false)} title="Add Chapter">
        <div className="space-y-4">
          <Input label="Chapter Name" value={newChapterName} onChange={(e) => setNewChapterName(e.target.value)} placeholder="e.g. Relational Algebra" />
          <div className="flex gap-3">
            <Button onClick={addChapter} className="flex-1">Add Chapter</Button>
            <Button variant="secondary" onClick={() => setAddChapterOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={addTopicOpen} onClose={() => setAddTopicOpen(false)} title="Add Topic" size="lg">
        <div className="space-y-4">
          <TopicForm />
          <div className="flex gap-3 pt-2">
            <Button onClick={addTopic} className="flex-1">Add Topic</Button>
            <Button variant="secondary" onClick={() => setAddTopicOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editTopicOpen} onClose={() => setEditTopicOpen(false)} title="Edit Topic" size="lg">
        <div className="space-y-4">
          <TopicForm />
          <div className="flex gap-3 pt-2">
            <Button onClick={updateTopic} className="flex-1">Save Changes</Button>
            <Button variant="secondary" onClick={() => setEditTopicOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
