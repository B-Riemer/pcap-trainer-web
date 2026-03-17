import { NextRequest, NextResponse } from "next/server";
import { toggleFlagged } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { questionId } = await req.json() as { questionId: number };
    const flagged = toggleFlagged(questionId);
    return NextResponse.json({ flagged });
  } catch (err) {
    console.error("[/api/flagged]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
