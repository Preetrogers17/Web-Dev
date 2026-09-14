import {
  pgTable,
  serial,
  text,
  integer,
  real,
  boolean,
  timestamp,
  date,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";

// ─── Settings / Profile ───────────────────────────────────────────────────────
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  comebackStartDate: date("comeback_start_date").notNull(),
  dailyTargetScreenTime: integer("daily_target_screen_time").notNull().default(180), // minutes
  scoreWeights: jsonb("score_weights").notNull().default({
    study: 30,
    fitness: 20,
    deepWork: 15,
    habits: 15,
    screenTime: 10,
    weeklyGoals: 10,
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Study Sessions ───────────────────────────────────────────────────────────
export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  topic: varchar("topic", { length: 200 }).notNull(),
  startTime: varchar("start_time", { length: 10 }),
  endTime: varchar("end_time", { length: 10 }),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  studyMethod: varchar("study_method", { length: 50 }).notNull().default("Lecture Series"),
  videosPlanned: integer("videos_planned").default(0),
  videosCompleted: integer("videos_completed").default(0),
  questionsPlanned: integer("questions_planned").default(0),
  questionsSolved: integer("questions_solved").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── GATE Subjects / Chapters / Topics ───────────────────────────────────────
export const gateSubjects = pgTable("gate_subjects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const gateChapters = pgTable("gate_chapters", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => gateSubjects.id),
  name: varchar("name", { length: 200 }).notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const gateTopics = pgTable("gate_topics", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").notNull().references(() => gateChapters.id),
  subjectId: integer("subject_id").notNull().references(() => gateSubjects.id),
  name: varchar("name", { length: 200 }).notNull(),
  totalVideos: integer("total_videos").default(0),
  completedVideos: integer("completed_videos").default(0),
  estimatedHours: real("estimated_hours").default(0),
  pyqsSolved: integer("pyqs_solved").default(0),
  revisionCount: integer("revision_count").default(0),
  confidenceLevel: integer("confidence_level").default(0), // 1-5
  isCompleted: boolean("is_completed").notNull().default(false),
  notes: text("notes"),
  lastStudied: date("last_studied"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Workouts ────────────────────────────────────────────────────────────────
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // Push, Pull, Legs, etc.
  notes: text("notes"),
  durationMinutes: integer("duration_minutes").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull().references(() => workouts.id),
  name: varchar("name", { length: 100 }).notNull(),
  order: integer("order").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const exerciseSets = pgTable("exercise_sets", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
  workoutId: integer("workout_id").notNull().references(() => workouts.id),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps").notNull().default(0),
  weight: real("weight").notNull().default(0), // kg
  rpe: real("rpe"), // 1-10
  isWarmup: boolean("is_warmup").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const personalRecords = pgTable("personal_records", {
  id: serial("id").primaryKey(),
  exerciseName: varchar("exercise_name", { length: 100 }).notNull(),
  date: date("date").notNull(),
  weight: real("weight").notNull(),
  reps: integer("reps").notNull(),
  estimated1rm: real("estimated_1rm"),
  workoutId: integer("workout_id").references(() => workouts.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Body Measurements ────────────────────────────────────────────────────────
export const bodyMeasurements = pgTable("body_measurements", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  weight: real("weight"), // kg
  chest: real("chest"), // cm
  waist: real("waist"), // cm
  arms: real("arms"), // cm
  shoulders: real("shoulders"), // cm
  bodyFatPercentage: real("body_fat_percentage"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Screen Time ─────────────────────────────────────────────────────────────
export const screenTimeLogs = pgTable("screen_time_logs", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  totalMinutes: integer("total_minutes").notNull().default(0),
  youtubeMinutes: integer("youtube_minutes").default(0),
  instagramMinutes: integer("instagram_minutes").default(0),
  whatsappMinutes: integer("whatsapp_minutes").default(0),
  gamingMinutes: integer("gaming_minutes").default(0),
  otherMinutes: integer("other_minutes").default(0),
  targetMinutes: integer("target_minutes").notNull().default(180),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Habits ───────────────────────────────────────────────────────────────────
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 10 }),
  category: varchar("category", { length: 50 }),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const habitLogs = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habits.id),
  date: date("date").notNull(),
  completed: boolean("completed").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Weekly Goals ─────────────────────────────────────────────────────────────
export const weeklyGoals = pgTable("weekly_goals", {
  id: serial("id").primaryKey(),
  weekStart: date("week_start").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  targetValue: real("target_value"),
  currentValue: real("current_value").notNull().default(0),
  unit: varchar("unit", { length: 50 }),
  isCompleted: boolean("is_completed").notNull().default(false),
  deadline: date("deadline"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Deep Work Sessions ───────────────────────────────────────────────────────
export const deepWorkSessions = pgTable("deep_work_sessions", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  subject: varchar("subject", { length: 100 }),
  category: varchar("category", { length: 100 }),
  notes: text("notes"),
  startTime: varchar("start_time", { length: 10 }),
  endTime: varchar("end_time", { length: 10 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Daily Reviews ────────────────────────────────────────────────────────────
export const dailyReviews = pgTable("daily_reviews", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  accomplishments: text("accomplishments"),
  wentWrong: text("went_wrong"),
  improvements: text("improvements"),
  biggestWin: text("biggest_win"),
  biggestDistraction: text("biggest_distraction"),
  overallScore: integer("overall_score"), // 0-100
  studyScore: integer("study_score"),
  fitnessScore: integer("fitness_score"),
  deepWorkScore: integer("deep_work_score"),
  habitsScore: integer("habits_score"),
  screenTimeScore: integer("screen_time_score"),
  goalsScore: integer("goals_score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Comeback Timeline ────────────────────────────────────────────────────────
export const timelineEvents = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  isAutoGenerated: boolean("is_auto_generated").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
