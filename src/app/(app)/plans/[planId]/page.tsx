import { PlanDetailView } from "@/components/plans/PlanDetailView";

export default function PlanDetailPage({
  params,
}: {
  params: { planId: string };
}) {
  return <PlanDetailView planId={params.planId} />;
}
