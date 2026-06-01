import React from 'react';

type InspectionStatus =
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'OBSERVATIONS_LOGGED'
    | 'APPLICANT_RESPONSE_PENDING'
    | 'FINALIZATION'
    | 'REPORT_PUBLISHED'
    | 'CLOSED';

interface Props {
    status: InspectionStatus | string;
}

const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    OBSERVATIONS_LOGGED: 'bg-orange-100 text-orange-800',
    APPLICANT_RESPONSE_PENDING: 'bg-purple-100 text-purple-800',
    FINALIZATION: 'bg-indigo-100 text-indigo-800',
    REPORT_PUBLISHED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
};

const labels: Record<string, string> = {
    SCHEDULED: 'Scheduled',
    IN_PROGRESS: 'In Progress',
    OBSERVATIONS_LOGGED: 'Findings Logged',
    APPLICANT_RESPONSE_PENDING: 'Response Needed',
    FINALIZATION: 'Under Review',
    REPORT_PUBLISHED: 'Report Published',
    CLOSED: 'Closed',
};

export const InspectionStatusBadge: React.FC<Props> = ({ status }) => {
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
    const label = labels[status] || status;

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
            {label}
        </span>
    );
};
