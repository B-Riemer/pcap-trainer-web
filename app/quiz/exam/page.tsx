import { getExamQuestions } from "@/lib/db";
import { ExamQuiz } from "@/app/_components/ExamQuiz";

export const dynamic = "force-dynamic";

export default function ExamPage() {
  const questions = getExamQuestions(40);
  return <ExamQuiz questions={questions} />;
}
