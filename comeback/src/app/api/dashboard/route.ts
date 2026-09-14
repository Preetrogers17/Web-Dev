import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  studySessions,
  workouts,
  habitLogs,
  habits,
  screenTimeLogs,
  weeklyGoals,
  deepWorkSessions,
  dailyReviews,
  settings,
  bodyMeasurements,
  personalRecords,
  gateTopics,
} from "@/db/schema";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { getLast7Days, getWeekStart, todayISO } from "@/lib/utils";

function calcStudyScore(sessions: { durationMinutes: number; videosPlanned?: number | null; videosCompleted?: number | null; questionsPlanned?: number | null; questionsSolved?: number | null }[]): number {
  if (sessions.length === 0) return 0;
  const totalMinutes = sessions.reduce((a, s) => a + s.durationMinutes, 0);
  // Target: 4 hours = 240 minutes = 100 score
  const timeScore = Math.min(100, (totalMinutes / 240) * 100);
  return Math.round(timeScore);
}

function calcFitnessScore(workoutList: unknown[]): number {
  return workoutList.length > 0 ? 100 : 0;
}

function calcDeepWorkScore(sessions: { durationMinutes: number }[]): number {
  const total = sessions.reduce((a, s) => a + s.durationMinutes, 0);
  // Target: 3 hours = 180 min = 100
  return Math.min(100, Math.round((total / 180) * 100));
}

function calcHabitsScore(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

function calcScreenTimeScore(log: { totalMinutes: number; targetMinutes: number } | null): number {
  if (!log) return 50; // neutral if not logged
  const ratio = log.totalMinutes / log.targetMinutes;
  if (ratio <= 1) return 100;
  if (ratio <= 1.5) return 60;
  if (ratio <= 2) return 30;
  return 0;
}

function calcGoalsScore(goals: { isCompleted: boolean; currentValue: number; targetValue: number | null }[]): number {
  if (goals.length === 0) return 0;
  const totalProgress = goals.reduce((a, g) => {
    if (g.isCompleted) return a + 1;
    if (g.targetValue && g.targetValue > 0) return a + Math.min(1, g.currentValue / g.targetValue);
    return a;
  }, 0);
  return Math.round((totalProgress / goals.length) * 100);
}

function calcOverallScore(
  weights: { study: number; fitness: number; deepWork: number; habits: number; screenTime: number; weeklyGoals: number },
  scores: { study: number; fitness: number; deepWork: number; habits: number; screenTime: number; weeklyGoals: number }
): number {
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 100;
  return Math.round(
    (scores.study * weights.study +
      scores.fitness * weights.fitness +
      scores.deepWork * weights.deepWork +
      scores.habits * weights.habits +
      scores.screenTime * weights.screenTime +
      scores.weeklyGoals * weights.weeklyGoals) /
      total
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || todayISO();
    const last7 = getLast7Days();
    const weekStart = getWeekStart(date);

    // Get settings
    const settingsRows = await db.select().from(settings).limit(1);
    const appSettings = settingsRows[0] || { scoreWeights: { study: 30, fitness: 20, deepWork: 15, habits: 15, screenTime: 10, weeklyGoals: 10 }, dailyTargetScreenTime: 180 };
    const weights = appSettings.scoreWeights as { study: number; fitness: number; deepWork: number; habits: number; screenTime: number; weeklyGoals: number };

    // Today's data
    const todayStudy = await db.select().from(studySessions).where(eq(studySessions.date, date));
    const todayWorkouts = await db.select().from(workouts).where(eq(workouts.date, date));
    const todayHabitLogs = await db.select().from(habitLogs).where(eq(habitLogs.date, date));
    const allHabits = await db.select().from(habits).where(eq(habits.isActive, true));
    const todayScreenTime = await db.select().from(screenTimeLogs).where(eq(screenTimeLogs.date, date));
    const weekGoals = await db.select().from(weeklyGoals).where(eq(weeklyGoals.weekStart, weekStart));
    const todayDeepWork = await db.select().from(deepWorkSessions).where(eq(deepWorkSessions.date, date));

    // Scores
    const studyScore = calcStudyScore(todayStudy);
    const fitnessScore = calcFitnessScore(todayWorkouts);
    const deepWorkScore = calcDeepWorkScore(todayDeepWork);
    const habitsCompleted = todayHabitLogs.filter((l) => l.completed).length;
    const habitsScore = calcHabitsScore(habitsCompleted, allHabits.length);
    const screenTimeLog = todayScreenTime[0] || null;
    const screenTimeScore = calcScreenTimeScore(screenTimeLog);
    const goalsScore = calcGoalsScore(weekGoals);

    const overallScore = calcOverallScore(weights, {
      study: studyScore,
      fitness: fitnessScore,
      deepWork: deepWorkScore,
      habits: habitsScore,
      screenTime: screenTimeScore,
      weeklyGoals: goalsScore,
    });

    // Last 7 days scores
    const sevenDayScores = await Promise.all(
      last7.map(async (d) => {
        const s = await db.select().from(studySessions).where(eq(studySessions.date, d));
        const w = await db.select().from(workouts).where(eq(workouts.date, d));
        const dw = await db.select().from(deepWorkSessions).where(eq(deepWorkSessions.date, d));
        const hl = await db.select().from(habitLogs).where(eq(habitLogs.date, d));
        const st = await db.select().from(screenTimeLogs).where(eq(screenTimeLogs.date, d));
        const wStart = getWeekStart(d);
        const wg = await db.select().from(weeklyGoals).where(eq(weeklyGoals.weekStart, wStart));

        const sc = calcStudyScore(s);
        const fc = calcFitnessScore(w);
        const dc = calcDeepWorkScore(dw);
        const hc = calcHabitsScore(hl.filter((l) => l.completed).length, allHabits.length);
        const stc = calcScreenTimeScore(st[0] || null);
        const gc = calcGoalsScore(wg);
        const overall = calcOverallScore(weights, { study: sc, fitness: fc, deepWork: dc, habits: hc, screenTime: stc, weeklyGoals: gc });
        const label = new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" });
        return { date: d, label, score: overall, study: sc, fitness: fc, deepWork: dc, habits: hc, screenTime: stc, goals: gc };
      })
    );

    const avg7 = Math.round(sevenDayScores.reduce((a, d) => a + d.score, 0) / sevenDayScores.length);
    const best = Math.max(...sevenDayScores.map((d) => d.score));

    // Study stats
    const totalStudyMinutes = todayStudy.reduce((a, s) => a + s.durationMinutes, 0);
    const weekStudySessions = await db.select().from(studySessions).where(and(gte(studySessions.date, weekStart), lte(studySessions.date, date)));
    const weekStudyMinutes = weekStudySessions.reduce((a, s) => a + s.durationMinutes, 0);

    // Deep work
    const todayDeepWorkMinutes = todayDeepWork.reduce((a, s) => a + s.durationMinutes, 0);
    const weekDeepWork = await db.select().from(deepWorkSessions).where(and(gte(deepWorkSessions.date, weekStart), lte(deepWorkSessions.date, date)));
    const weekDeepWorkMinutes = weekDeepWork.reduce((a, s) => a + s.durationMinutes, 0);

    // GATE progress
    const allTopics = await db.select().from(gateTopics);
    const completedTopics = allTopics.filter((t) => t.isCompleted || (t.totalVideos && t.completedVideos && t.completedVideos >= t.totalVideos)).length;
    const gateProgress = allTopics.length > 0 ? Math.round((completedTopics / allTopics.length) * 100) : 0;

    // Body weight
    const latestBody = await db.select().from(bodyMeasurements).orderBy(desc(bodyMeasurements.date)).limit(1);

    // PRs
    const recentPRs = await db.select().from(personalRecords).orderBy(desc(personalRecords.date)).limit(5);

    // Yesterday
    const yesterday = new Date(date + "T00:00:00");
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const yesterdayData = sevenDayScores.find((d) => d.date === yesterdayStr);

    // Streak (consecutive days with score > 0 logged)
    const reviews = await db.select().from(dailyReviews).orderBy(desc(dailyReviews.date)).limit(30);

    // Insights
    const insights: string[] = [];
    const prevWeekStart = new Date(weekStart + "T00:00:00");
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekStartStr = prevWeekStart.toISOString().split("T")[0];
    const prevWeekEnd = new Date(weekStart + "T00:00:00");
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
    const prevWeekEndStr = prevWeekEnd.toISOString().split("T")[0];

    const prevWeekStudy = await db.select().from(studySessions).where(and(gte(studySessions.date, prevWeekStartStr), lte(studySessions.date, prevWeekEndStr)));
    const prevWeekStudyMinutes = prevWeekStudy.reduce((a, s) => a + s.durationMinutes, 0);
    if (prevWeekStudyMinutes > 0 && weekStudyMinutes > prevWeekStudyMinutes) {
      const pct = Math.round(((weekStudyMinutes - prevWeekStudyMinutes) / prevWeekStudyMinutes) * 100);
      insights.push(`You studied ${pct}% more this week than last week. Keep it up!`);
    }

    if (todayWorkouts.length > 0) {
      insights.push(`Workout logged for today.`);
    }

    if (screenTimeLog && screenTimeLog.totalMinutes > screenTimeLog.targetMinutes) {
      insights.push(`Screen time exceeded target by ${screenTimeLog.totalMinutes - screenTimeLog.targetMinutes} minutes today.`);
    } else if (screenTimeLog && screenTimeLog.totalMinutes <= screenTimeLog.targetMinutes) {
      insights.push(`Great job staying under screen time target today!`);
    }

    if (allHabits.length > 0 && habitsCompleted === allHabits.length) {
      insights.push(`Perfect habit day! All ${allHabits.length} habits completed.`);
    }

    if (gateProgress > 0) {
      insights.push(`GATE overall progress: ${gateProgress}% of syllabus covered.`);
    }

    return NextResponse.json({
      date,
      overallScore,
      yesterdayScore: yesterdayData?.score ?? null,
      avg7,
      best,
      sevenDayScores,
      scores: { study: studyScore, fitness: fitnessScore, deepWork: deepWorkScore, habits: habitsScore, screenTime: screenTimeScore, weeklyGoals: goalsScore },
      study: { totalMinutes: totalStudyMinutes, weekMinutes: weekStudyMinutes, sessions: todayStudy.length },
      fitness: { workoutsToday: todayWorkouts.length, weekWorkouts: 0 },
      deepWork: { todayMinutes: todayDeepWorkMinutes, weekMinutes: weekDeepWorkMinutes },
      habits: { completed: habitsCompleted, total: allHabits.length },
      screenTime: screenTimeLog,
      goals: { completed: weekGoals.filter((g) => g.isCompleted).length, total: weekGoals.length },
      gateProgress,
      latestBody: latestBody[0] || null,
      recentPRs,
      weights,
      insights,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
