import { NextResponse } from "next/server";
import { db } from "@/db";
import { weeklyGoals } from "@/db/schema";
import { eq, desc, gte, lte, and } from "drizzle-orm";
import { getWeekStart } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const week = searchParams.get("week") || getWeekStart();
    const all = searchParams.get("all");

    let rows;
    if (all) {
      rows = await db.select().from(weeklyGoals).orderBy(desc(weeklyGoals.weekStart));
    } else {
      rows = await db.select().from(weeklyGoals).where(eq(weeklyGoals.weekStart, week)).orderBy(desc(weeklyGoals.createdAt));
    }

    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inserted = await db.insert(weeklyGoals).values(body).returning();
    return NextResponse.json(inserted[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...rest } = body;
    const updated = await db
      .update(weeklyGoals)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(weeklyGoals.id, id))
      .returning();
    return NextResponse.json(updated[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    await db.delete(weeklyGoals).where(eq(weeklyGoals.id, id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
