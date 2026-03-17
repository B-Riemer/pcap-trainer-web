import { NextRequest, NextResponse } from "next/server";
import { saveSession, type AnswerRecord } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      mode: string;
      score: number;
      total: number;
      passed: boolean;
      answers: AnswerRecord[];
    };
    saveSession(body.mode, body.score, body.total, body.passed, body.answers);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/session]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
