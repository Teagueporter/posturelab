import { ResultsView } from "@/components/results/ResultsView";

export default async function ResultsPage({ params }: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await params;
  return <ResultsView scanId={scanId} />;
}
