import { NextResponse } from "next/server";
import { db } from "@/db";
import { habits, habitLogs } from "@/db/schema";
import { eq, desc, gte, lte, and, asc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const allHabits = await db.select().from(habits).where(eq(habits.isActive, true)).orderBy(asc(habits.order));

    let logs;
    if (date) {
      logs = await db.select().from(habitLogs).where(eq(habitLogs.date, date));
    } else if (from && to) {
      logs = await db.select().from(habitLogs).where(and(gte(habitLogs.date, from), lte(habitLogs.date, to)));
    } else {
      logs = await db.select().from(habitLogs).orderBy(desc(habitLogs.date)).limit(200);
    }

    return NextResponse.json({ habits: allHabits, logs });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.type === "habit") {
      const inserted = await db.insert(habits).values(body.data).returning();
      return NextResponse.json(inserted[0]);
    }
    if (body.type === "log") {
      const { habitId, date, completed } = body.data;
      const existing = await db.select().from(habitLogs).where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)));
      if (existing.length > 0) {
        const updated = await db.update(habitLogs).set({ completed }).where(eq(habitLogs.id, existing[0].id)).returning();
        return NextResponse.json(updated[0]);
      }
      const inserted = await db.insert(habitLogs).values({ habitId, date, completed }).returning();
      return NextResponse.json(inserted[0]);
    }
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    await db.delete(habitLogs).where(eq(habitLogs.habitId, id));
    await db.delete(habits).where(eq(habits.id, id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
