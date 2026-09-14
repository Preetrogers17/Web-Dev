import { NextResponse } from "next/server";
import { db } from "@/db";
import { gateSubjects, gateChapters, gateTopics } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const subjects = await db.select().from(gateSubjects).orderBy(asc(gateSubjects.order));
    const chapters = await db.select().from(gateChapters).orderBy(asc(gateChapters.order));
    const topics = await db.select().from(gateTopics);

    const result = subjects.map((s) => {
      const subjectChapters = chapters
        .filter((c) => c.subjectId === s.id)
        .map((c) => {
          const chapterTopics = topics.filter((t) => t.chapterId === c.id);
          return { ...c, topics: chapterTopics };
        });
      return { ...s, chapters: subjectChapters };
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inserted = await db.insert(gateSubjects).values(body).returning();
    return NextResponse.json(inserted[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    await db.delete(gateTopics).where(eq(gateTopics.subjectId, id));
    await db.delete(gateChapters).where(eq(gateChapters.subjectId, id));
    await db.delete(gateSubjects).where(eq(gateSubjects.id, id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
