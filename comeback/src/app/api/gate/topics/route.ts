import { NextResponse } from "next/server";
import { db } from "@/db";
import { gateTopics, gateChapters } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inserted = await db.insert(gateTopics).values(body).returning();
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
      .update(gateTopics)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(gateTopics.id, id))
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
    await db.delete(gateTopics).where(eq(gateTopics.id, id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  // Add chapter
  try {
    const body = await req.json();
    const inserted = await db.insert(gateChapters).values(body).returning();
    return NextResponse.json(inserted[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
