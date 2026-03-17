import { NextRequest, NextResponse } from "next/server";
import {
  getExamQuestions,
  getLearnQuestions,
  getWrongStackQuestions,
  getFlaggedQuestions,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode") ?? "exam";
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "40", 10);

  try {
    switch (mode) {
      case "exam":
        return NextResponse.json(getExamQuestions(limit));
      case "learn":
        return NextResponse.json(getLearnQuestions());
      case "wrong-stack":
        return NextResponse.json(getWrongStackQuestions());
      case "flagged":
        return NextResponse.json(getFlaggedQuestions());
      default:
        return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
    }
  } catch (err) {
    console.error("[/api/questions]", err);
    return NextResponse.json(
      { error: "Failed to load questions" },
      { status: 500 }
    );
  }
}
