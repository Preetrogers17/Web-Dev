import { NextResponse } from "next/server";
import { db } from "@/db";
import { studySessions } from "@/db/schema";
import { eq, desc, gte, lte, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let query = db.select().from(studySessions).$dynamic();

    if (date) {
      query = query.where(eq(studySessions.date, date));
    } else if (from && to) {
      query = query.where(and(gte(studySessions.date, from), lte(studySessions.date, to)));
    }

    const rows = await query.orderBy(desc(studySessions.createdAt));
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inserted = await db.insert(studySessions).values(body).returning();
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
      .update(studySessions)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(studySessions.id, id))
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
    await db.delete(studySessions).where(eq(studySessions.id, id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
