import { NextRequest, NextResponse } from "next/server";
import {
  getExamQuestions,
  getLearnQuestions,
  getWrongStackQuestions,
  getFlaggedQuestions,
  getQuestionsByIds,
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
      case "quicktest":
        return NextResponse.json(getExamQuestions(limit));
      case "ids": {
        const raw = req.nextUrl.searchParams.get("ids") ?? "";
        const ids = raw.split(",").map(Number).filter((n) => Number.isFinite(n) && n > 0);
        return NextResponse.json(getQuestionsByIds(ids));
      }
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
