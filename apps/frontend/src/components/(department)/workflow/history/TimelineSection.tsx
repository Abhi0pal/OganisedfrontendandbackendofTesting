import { TimelineEntry } from "@/components/(department)/workflow/types";
import { getApplicationStatusLabel } from "@/components/(investor)/inprinciple/utils/inprincipleUtils";

const formatDuration = (totalSeconds?: number) => {
  if (!Number.isFinite(totalSeconds)) return "--";
  const seconds = Math.max(0, Number(totalSeconds));
  const days = Math.floor(seconds / (60 * 60 * 24));
  const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  return `${days} days ${hours} hours ${minutes} min`;
};

const buildActorLabel = (row: TimelineEntry) => {
  const actorName = row.actorName?.trim();
  const actorRole = row.actorRole?.trim();
  if (actorName && actorRole) {
    return actorName.includes(actorRole) ? actorName : `${actorName} (${actorRole})`;
  }
  if (actorName) return actorName;
  if (actorRole) return actorRole;
  return row.actionBy || "System";
};

const TimelineSection = ({
  timeline,
  loading,
}: {
  timeline: TimelineEntry[];
  loading: boolean;
}) => {
  if (loading) {
    return <div className="text-muted">Loading history…</div>;
  }

  if (!timeline.length) {
    return <div className="text-muted">No history records.</div>;
  }

  return (
    <div className="table-responsive">
      <table className="table table-bordered table-sm align-middle">
        <thead className="table-light">
          <tr>
            <th className="text-center">S.No.</th>
            <th className="text-center">Action Taken By</th>
            <th className="text-center">Action Taken On</th>
            <th className="text-center">Action Type</th>
            <th className="text-center">Comments</th>
            <th className="text-center">Forwarded To</th>
            <th className="text-center">Time Taken by Applicant</th>
            <th className="text-center">Time Taken by Nodal Agency</th>
            <th className="text-center">Time Taken by Line Department</th>
          </tr>
        </thead>
        <tbody>
          {timeline.map((row, index) => {
            const isTotal = String(row.comments || "").toLowerCase() === "total";
            if (isTotal) {
              return (
                <tr key={`total-${index}`} className="fw-semibold">
                  <td colSpan={6} className="text-end">
                    Total
                  </td>
                  <td className="text-center">{formatDuration(row.timeTakenByApplicantSeconds)}</td>
                  <td className="text-center">{formatDuration(row.timeTakenByDepartmentSeconds)}</td>
                  <td className="text-center">{formatDuration(row.timeTakenByLineDepartmentSeconds)}</td>
                </tr>
              );
            }

            return (
              <tr key={`row-${row.id || index}`}>
                <td className="text-center">{row.sequence || index + 1}</td>
                <td className="text-start">{buildActorLabel(row)}</td>
                <td className="text-center">
                  {row.actionOn ? new Date(row.actionOn).toLocaleString("en-IN") : "—"}
                </td>
                <td className="text-start">{getApplicationStatusLabel(row.status)}</td>
                <td className="text-start">{row.comments || "—"}</td>
                <td className="text-start">
                  {row.param1
                    ? row.param1
                    : row.nextRoleId
                    ? `Role ${row.nextRoleId}`
                    : "—"}
                </td>
                <td className="text-center">{formatDuration(row.timeTakenByApplicantSeconds)}</td>
                <td className="text-center">{formatDuration(row.timeTakenByDepartmentSeconds)}</td>
                <td className="text-center">{formatDuration(row.timeTakenByLineDepartmentSeconds)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TimelineSection;
