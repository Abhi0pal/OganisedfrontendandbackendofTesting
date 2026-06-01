 "use client";
import { useParams } from "next/navigation";

import {
  useOfficerActivityDetail,
  useOfficerTimeline,
} from "@/hooks/department/useOfficerWorkflow";
import TimelineSection from "@/components/(department)/workflow/history/TimelineSection";
import WorkflowSectionHeader from "@/components/(department)/workflow/WorkflowSectionHeader";

export default function DepartmentWorkflowHistoryPage() {
  const params = useParams();
  const submissionId = Number(params?.submissionId);
  const { data: detail } = useOfficerActivityDetail(
    Number.isFinite(submissionId) && submissionId > 0 ? submissionId : undefined
  );
  const { data: timeline = [], isLoading } = useOfficerTimeline(
    Number.isFinite(submissionId) && submissionId > 0 ? submissionId : undefined
  );
  return (
    <main className="container-fluid px-4 pb-4">
      <WorkflowSectionHeader
        title="Transaction History"
        submissionId={submissionId}
        unitName={detail?.submission?.unitName ?? undefined}
        status={detail?.submission?.status}
        serviceId={detail?.submission?.serviceId}
        description="Timeline of every workflow action."
      />
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <TimelineSection timeline={timeline} loading={isLoading} />
        </div>
      </div>
    </main>
  );
}
