import { QuizClient } from "@/app/_components/QuizClient";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;
  return <QuizClient mode={mode} />;
}
