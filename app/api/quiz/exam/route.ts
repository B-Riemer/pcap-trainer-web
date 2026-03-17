import { NextResponse } from "next/server";
import { getExamQuestions } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const questions = getExamQuestions(40);
    return NextResponse.json(questions);
  } catch (err) {
    console.error("[/api/quiz/exam]", err);
    return NextResponse.json(
      { error: "Failed to load questions" },
      { status: 500 }
    );
  }
}
