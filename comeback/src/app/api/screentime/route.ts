import { NextResponse } from "next/server";
import { db } from "@/db";
import { screenTimeLogs } from "@/db/schema";
import { eq, desc, gte, lte, and, asc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let rows;
    if (date) {
      rows = await db.select().from(screenTimeLogs).where(eq(screenTimeLogs.date, date));
    } else if (from && to) {
      rows = await db.select().from(screenTimeLogs).where(and(gte(screenTimeLogs.date, from), lte(screenTimeLogs.date, to))).orderBy(asc(screenTimeLogs.date));
    } else {
      rows = await db.select().from(screenTimeLogs).orderBy(desc(screenTimeLogs.date)).limit(30);
    }

    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const existing = await db.select().from(screenTimeLogs).where(eq(screenTimeLogs.date, body.date));
    if (existing.length > 0) {
      const updated = await db.update(screenTimeLogs).set({ ...body, updatedAt: new Date() }).where(eq(screenTimeLogs.id, existing[0].id)).returning();
      return NextResponse.json(updated[0]);
    }
    const inserted = await db.insert(screenTimeLogs).values(body).returning();
    return NextResponse.json(inserted[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    await db.delete(screenTimeLogs).where(eq(screenTimeLogs.id, id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
