import { NextResponse } from "next/server";
import { db } from "@/db";
import { deepWorkSessions } from "@/db/schema";
import { eq, desc, gte, lte, and, asc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let rows;
    if (date) {
      rows = await db.select().from(deepWorkSessions).where(eq(deepWorkSessions.date, date)).orderBy(asc(deepWorkSessions.createdAt));
    } else if (from && to) {
      rows = await db.select().from(deepWorkSessions).where(and(gte(deepWorkSessions.date, from), lte(deepWorkSessions.date, to))).orderBy(asc(deepWorkSessions.date));
    } else {
      rows = await db.select().from(deepWorkSessions).orderBy(desc(deepWorkSessions.date)).limit(100);
    }

    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inserted = await db.insert(deepWorkSessions).values(body).returning();
    return NextResponse.json(inserted[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    await db.delete(deepWorkSessions).where(eq(deepWorkSessions.id, id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
