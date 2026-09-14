import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { todayISO } from "@/lib/utils";

export async function GET() {
  try {
    const rows = await db.select().from(settings).limit(1);
    if (rows.length === 0) {
      const newSettings = await db
        .insert(settings)
        .values({ comebackStartDate: todayISO() })
        .returning();
      return NextResponse.json(newSettings[0]);
    }
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const rows = await db.select().from(settings).limit(1);
    if (rows.length === 0) {
      const inserted = await db
        .insert(settings)
        .values({ ...body, comebackStartDate: body.comebackStartDate || todayISO() })
        .returning();
      return NextResponse.json(inserted[0]);
    }
    const updated = await db
      .update(settings)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(settings.id, rows[0].id))
      .returning();
    return NextResponse.json(updated[0]);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
