import { NextResponse } from "next/server";
import { db } from "@/db";
import { workouts, exercises, exerciseSets, personalRecords } from "@/db/schema";
import { eq, desc, gte, lte, and } from "drizzle-orm";
import { calculate1RM } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let workoutRows;
    if (date) {
      workoutRows = await db.select().from(workouts).where(eq(workouts.date, date)).orderBy(desc(workouts.createdAt));
    } else if (from && to) {
      workoutRows = await db.select().from(workouts).where(and(gte(workouts.date, from), lte(workouts.date, to))).orderBy(desc(workouts.date));
    } else {
      workoutRows = await db.select().from(workouts).orderBy(desc(workouts.date)).limit(50);
    }

    const result = await Promise.all(
      workoutRows.map(async (w) => {
        const exRows = await db.select().from(exercises).where(eq(exercises.workoutId, w.id)).orderBy(exercises.order);
        const exWithSets = await Promise.all(
          exRows.map(async (ex) => {
            const sets = await db.select().from(exerciseSets).where(eq(exerciseSets.exerciseId, ex.id)).orderBy(exerciseSets.setNumber);
            return { ...ex, sets };
          })
        );
        return { ...w, exercises: exWithSets };
      })
    );

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { exercises: exData, ...workoutData } = body;

    const [workout] = await db.insert(workouts).values(workoutData).returning();

    if (exData && exData.length > 0) {
      for (let i = 0; i < exData.length; i++) {
        const { sets, ...exFields } = exData[i];
        const [ex] = await db.insert(exercises).values({ ...exFields, workoutId: workout.id, order: i }).returning();

        if (sets && sets.length > 0) {
          let maxWeight = 0;
          let maxWeightReps = 0;

          for (let j = 0; j < sets.length; j++) {
            await db.insert(exerciseSets).values({
              ...sets[j],
              exerciseId: ex.id,
              workoutId: workout.id,
              setNumber: j + 1,
            });

            if (sets[j].weight > maxWeight || (sets[j].weight === maxWeight && sets[j].reps > maxWeightReps)) {
              maxWeight = sets[j].weight;
              maxWeightReps = sets[j].reps;
            }
          }

          // Check PR
          if (maxWeight > 0) {
            const existing = await db
              .select()
              .from(personalRecords)
              .where(eq(personalRecords.exerciseName, ex.name))
              .orderBy(desc(personalRecords.weight))
              .limit(1);

            if (existing.length === 0 || maxWeight > existing[0].weight) {
              await db.insert(personalRecords).values({
                exerciseName: ex.name,
                date: workoutData.date,
                weight: maxWeight,
                reps: maxWeightReps,
                estimated1rm: calculate1RM(maxWeight, maxWeightReps),
                workoutId: workout.id,
              });
            }
          }
        }
      }
    }

    return NextResponse.json(workout);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    const exRows = await db.select().from(exercises).where(eq(exercises.workoutId, id));
    for (const ex of exRows) {
      await db.delete(exerciseSets).where(eq(exerciseSets.exerciseId, ex.id));
    }
    await db.delete(exercises).where(eq(exercises.workoutId, id));
    await db.delete(workouts).where(eq(workouts.id, id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
