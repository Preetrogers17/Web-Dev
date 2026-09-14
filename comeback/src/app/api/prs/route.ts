import { NextResponse } from "next/server";
import { db } from "@/db";
import { personalRecords } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const exercise = searchParams.get("exercise");
    let rows;
    if (exercise) {
      rows = await db.select().from(personalRecords).where(eq(personalRecords.exerciseName, exercise)).orderBy(desc(personalRecords.date));
    } else {
      rows = await db.select().from(personalRecords).orderBy(desc(personalRecords.date)).limit(100);
    }
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
