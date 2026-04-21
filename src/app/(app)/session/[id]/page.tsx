import { WorkoutSessionView } from "@/components/session/WorkoutSessionView";

export default function SessionPage({ params }: { params: { id: string } }) {
  return <WorkoutSessionView sessionId={params.id} />;
}
