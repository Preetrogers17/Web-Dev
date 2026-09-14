import { NextResponse } from "next/server";
import { db } from "@/db";
import { dailyReviews } from "@/db/schema";
import { eq, desc, ilike, or } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const search = searchParams.get("search");

    if (date) {
      const rows = await db.select().from(dailyReviews).where(eq(dailyReviews.date, date));
      return NextResponse.json(rows[0] || null);
    }

    if (search) {
      const rows = await db
        .select()
        .from(dailyReviews)
        .where(
          or(
            ilike(dailyReviews.accomplishments, `%${search}%`),
            ilike(dailyReviews.biggestWin, `%${search}%`),
            ilike(dailyReviews.improvements, `%${search}%`)
          )
        )
        .orderBy(desc(dailyReviews.date));
      return NextResponse.json(rows);
    }

    const rows = await db.select().from(dailyReviews).orderBy(desc(dailyReviews.date)).limit(50);
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date } = body;
    const existing = await db.select().from(dailyReviews).where(eq(dailyReviews.date, date));
    if (existing.length > 0) {
      const updated = await db.update(dailyReviews).set({ ...body, updatedAt: new Date() }).where(eq(dailyReviews.id, existing[0].id)).returning();
      return NextResponse.json(updated[0]);
    }
    const inserted = await db.insert(dailyReviews).values(body).returning();
    return NextResponse.json(inserted[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
