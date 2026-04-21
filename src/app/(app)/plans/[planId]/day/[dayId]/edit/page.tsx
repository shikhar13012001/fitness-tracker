import { DayEditView } from "@/components/plans/DayEditView";

export default function DayEditPage({
  params,
}: {
  params: { planId: string; dayId: string };
}) {
  return <DayEditView planId={params.planId} dayId={parseInt(params.dayId, 10)} />;
}
