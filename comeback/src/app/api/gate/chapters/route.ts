import { NextResponse } from "next/server";
import { db } from "@/db";
import { gateChapters, gateTopics } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inserted = await db.insert(gateChapters).values(body).returning();
    return NextResponse.json(inserted[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    await db.delete(gateTopics).where(eq(gateTopics.chapterId, id));
    await db.delete(gateChapters).where(eq(gateChapters.id, id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
